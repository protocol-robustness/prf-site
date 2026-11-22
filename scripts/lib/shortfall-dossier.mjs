import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const bundleName = 'composed-pro-rata-v2-settlement'
const proofRelative = 'evidence/partial-fill/v3-live-context/proof.json'
const sourceByRole = {
  token: 'test/PartialFillV3Controlled.t.sol',
  reserve: 'src/applications/shortfall/OnchainShortfallReserveV3.sol',
  allocator: 'src/applications/pro-rata/ProductionProRataAllocatorV2.sol',
  preparedController: 'src/applications/shortfall/SourceBoundProRataControllerV2.sol',
  assurance: 'src/applications/shortfall/SourceBoundProRataEntitlementAssuranceV1.sol',
  ratification: 'src/applications/shortfall/SourceBoundProRataEntitlementRatificationControllerV1.sol',
  admission: 'src/core/PrfStatementAdmission.sol',
  registry: 'src/core/PrfVerifierRegistry.sol',
  adapter: 'src/verification/adapters/PrfSourceBoundEntitlementVerifierAdapterV1.sol',
}
const participantKeys = ['aliceBalance', 'bobBalance', 'carolBalance']
const balanceKeys = ['reserveBalance', 'allocatorBalance', ...participantKeys]
const zeroBalances = Object.fromEntries(balanceKeys.map((key) => [key, 0]))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const stable = (value) => JSON.stringify(value, null, 2) + '\n'
const readBytes = (path) => readFileSync(path)
const readJson = (path) => JSON.parse(readBytes(path).toString('utf8'))
const normalize = (address) => address.toLowerCase()

function bundlePath(publicRoot, file) {
  return join(publicRoot, 'evidence', bundleName, file)
}

function reportEvidence(publicRoot, file, value) {
  return { label: value, path: file, href: `/evidence/${bundleName}/${file}` }
}

function transferNet(transfers, indices, roleAddresses) {
  const net = new Map()
  for (const index of indices) {
    const item = transfers[index]
    assert(item, `missing transfer record ${index}`)
    const from = normalize(item.from)
    const to = normalize(item.to)
    net.set(from, (net.get(from) ?? 0) - Number(item.amount))
    net.set(to, (net.get(to) ?? 0) + Number(item.amount))
  }
  const deltas = Object.fromEntries(balanceKeys.map((key) => [key, 0]))
  for (const [address, amount] of net) {
    const key = roleAddresses.get(address)
    assert(key, `transfer references an untracked custody address: ${address}`)
    deltas[key] += amount
  }
  return deltas
}

function findTransferGroup(transfers, start, expected, roleAddresses) {
  if (balanceKeys.every((key) => expected[key] === 0)) return []
  const actual = Object.fromEntries(balanceKeys.map((key) => [key, 0]))
  for (let end = start; end < transfers.length; end += 1) {
    const net = transferNet(transfers, [end], roleAddresses)
    for (const key of balanceKeys) actual[key] += net[key]
    if (balanceKeys.every((key) => actual[key] === expected[key])) {
      return Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
    }
    if (balanceKeys.some((key) => actual[key] !== 0 && Math.sign(actual[key]) !== Math.sign(expected[key]))) break
  }
  assert.fail(`no retained transfer sequence reconciles the observed delta after transfer ${start}`)
}

function makeEconomicLedger({
  states,
  transfers,
  projection,
  manifest,
  witness,
  funding,
  statesSha256,
  transfersSha256,
  projectionSha256,
  fundingSha256,
}) {
  assert.equal(states.states.length, projection.stateProjections.length, 'state observation count differs from validated projection')
  assert.equal(states.states.length, 8, 'expected the retained eight call-boundary observations')
  assert.equal(transfers.length, 5, 'expected funding, three claims and one separate restricted refund')

  const identity = projection.deployedContractIdentities
  const beneficiaryByClaim = new Map(witness['beneficiary-mapping'].map(({ 'claim-id': claimId, beneficiary }) => [claimId, beneficiary]))
  const addressByParticipant = new Map(manifest.economicInputs.requests.map(({ participant, claimId }) => [participant, beneficiaryByClaim.get(claimId)]))
  assert(addressByParticipant.get('Alice') && addressByParticipant.get('Bob') && addressByParticipant.get('Carol'), 'missing beneficiary mapping')
  const roleAddresses = new Map([
    [normalize(identity.reserve.address), 'reserveBalance'],
    [normalize(identity.allocator.address), 'allocatorBalance'],
    ...[...addressByParticipant].map(([name, address]) => [normalize(address), `${name.toLowerCase()}Balance`]),
  ])

  const origin = {
    amount: Number(funding.observedTransferAmount),
    from: funding.sponsor,
    to: funding.reserve,
    observation: 'v3-live-context/funding-observation.json',
    evidenceKind: 'retained-local-test observation; no mined receipt or transaction hash',
  }
  assert.equal(funding.sponsorTransferObserved, true, 'sponsor funding transfer is not marked as observed')
  assert.equal(Number(funding.reserveBalanceAfterDeposit), origin.amount, 'funding transfer and post-deposit reserve observation differ')
  assert.equal(origin.amount, Number(states.states[0].observation.reserveBalance), 'opening reserve balance differs from retained funding attribution')
  assert.equal(normalize(origin.to), normalize(identity.reserve.address), 'funding observation names another reserve')
  assert.equal(normalize(funding.token), normalize(identity.token.address), 'funding observation names another token')

  const records = []
  let cursor = 0
  let previous = zeroBalances
  let previousClaimPaid = 0
  let activated = false
  const funded = Number(manifest.economicInputs.availableCapital)
  for (let index = 0; index < states.states.length; index += 1) {
    const stateRecord = states.states[index]
    const projectionRecord = projection.stateProjections[index]
    assert.equal(stateRecord.sequence, index, 'state observations are out of order')
    assert.equal(projectionRecord.sequence, index, 'validated state projections are out of order')
    assert.equal(stateRecord.stage, projectionRecord.stage, 'observation and projection stages differ')
    assert.deepEqual(stateRecord.observation, projectionRecord.observation, `observation differs from validated projection at ${stateRecord.stage}`)
    const observed = Object.fromEntries(balanceKeys.map((key) => [key, Number(stateRecord.observation[key])]))
    const expectedDelta = Object.fromEntries(balanceKeys.map((key) => [key, observed[key] - previous[key]]))
    const transferIndices = index === 0 ? [] : findTransferGroup(transfers, cursor, expectedDelta, roleAddresses)
    if (transferIndices.length) cursor = transferIndices.at(-1) + 1
    const reconstructedDelta = index === 0
      ? { ...zeroBalances, reserveBalance: origin.amount }
      : transferNet(transfers, transferIndices, roleAddresses)
    assert.deepEqual(reconstructedDelta, expectedDelta, `transfer delta differs from observations at ${stateRecord.stage}`)
    const totalCustody = Object.values(observed).reduce((sum, amount) => sum + amount, 0)
    assert.equal(totalCustody, Number(stateRecord.computed_total_custody), `custody projection mismatch at ${stateRecord.stage}`)
    assert.equal(stateRecord.custody_equation_holds, true, `custody equation failed at ${stateRecord.stage}`)
    assert.equal(projectionRecord.custody_equation_holds, true, `validated custody equation failed at ${stateRecord.stage}`)

    if (stateRecord.stage === 'activated') activated = true
    const claimPaid = transfers.slice(0, cursor).filter(({ from, to }) =>
      normalize(from) === normalize(identity.allocator.address)
      && [...addressByParticipant.values()].some((address) => normalize(to) === normalize(address)))
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const expectedLiability = activated ? funded - claimPaid : 0
    assert.equal(Number(stateRecord.observation.outstandingLiability), expectedLiability,
      `liability does not reconcile to funded entitlements and claims at ${stateRecord.stage}`)
    assert(claimPaid >= previousClaimPaid, 'claim payments move backwards')
    previousClaimPaid = claimPaid

    const record = {
      sequence: index,
      stage: stateRecord.stage,
      identity: manifest.operation.id,
      observationOrder: 'Foundry call boundary; not a mined transaction index',
      sourceRef: stateRecord.source_ref,
      evidenceRefs: [
        {
          kind: 'state-observation',
          path: `evidence/${bundleName}/accounting-states.json`,
          sha256: statesSha256,
          jsonPointer: `/states/${index}`,
        },
        {
          kind: 'validated-state-projection',
          path: `evidence/${bundleName}/validation-result.json`,
          sha256: projectionSha256,
          jsonPointer: `/stateProjections/${index}`,
        },
      ],
      before: previous,
      transferRefs: index === 0
        ? [{ path: 'evidence/partial-fill/v3-live-context/funding-observation.json', sha256: fundingSha256, jsonPointer: '/observedTransferAmount' }]
        : transferIndices.map((transferIndex) => ({
          path: `evidence/${bundleName}/transfers.json`,
          sha256: transfersSha256,
          jsonPointer: `/${transferIndex}`,
        })),
      balanceDelta: expectedDelta,
      after: observed,
      custodyTotal: totalCustody,
      outstandingLiability: Number(stateRecord.observation.outstandingLiability),
      custodyConserved: true,
      liabilityReconciled: true,
    }
    record.evidenceRefs.push(...record.transferRefs.map((reference) => ({ ...reference, kind: 'asset-transfer-observation' })))
    record.projectionRecordSha256 = hash(Buffer.from(
      `eae.site-shortfall-economic-transition.v1\n${JSON.stringify(record)}`,
    ))
    records.push(record)
    previous = observed
  }
  assert.equal(cursor, transfers.length, 'unmatched transfer observations remain')
  assert.equal(previousClaimPaid, funded, 'claim transfer total differs from funded amount')
  assert.equal(previous.allocatorBalance, 0, 'terminal allocator custody is not zero')
  assert.equal(Number(states.states.at(-1).observation.outstandingLiability), 0, 'terminal liability is not zero')

  return {
    currency: 'local fixture-token units',
    observationBoundary: 'Local Foundry getter and ERC-20 Transfer records; no transaction hashes, block hashes or mined receipt identities are present.',
    openingCapitalOrigin: origin,
    transitions: records,
    assetConservation: {
      equation: 'reserve + allocator + participant balances = opening funded custody',
      opening: origin.amount,
      terminal: Object.values(previous).reduce((sum, amount) => sum + amount, 0),
      holdsAtAllEightObservations: true,
      transfersReconciled: transfers.length,
    },
    obligations: {
      requested: Number(manifest.economicInputs.totalRequested),
      fundedEntitlements: funded,
      paidClaims: previousClaimPaid,
      remainingClaimLiability: Number(states.states.at(-1).observation.outstandingLiability),
      unmetRequest: Number(manifest.economicInputs.unmetRequest),
      restrictedRefund: Number(manifest.economicInputs.protectedRestrictedCapital),
      equation: 'funded entitlement total = paid claims + remaining claim liability',
      holds: funded === previousClaimPaid + Number(states.states.at(-1).observation.outstandingLiability),
      restrictedCapitalIsSeparate: true,
    },
  }
}

function readSourceFileDigests(manifest) {
  return Object.fromEntries(manifest.files
    .filter(({ path }) => path.endsWith('.sol'))
    .map(({ path, sha256 }) => [path, sha256]))
}

function verifyAvailableManifestFiles(publicRoot, manifest) {
  const checked = []
  const notPublished = []
  for (const entry of manifest.files) {
    const path = join(publicRoot, entry.path)
    if (!existsSync(path)) {
      notPublished.push(entry.path)
      continue
    }
    const actual = hash(readBytes(path))
    assert.equal(actual, entry.sha256, `published artifact differs from manifest: ${entry.path}`)
    checked.push({ path: entry.path, sha256: actual })
  }
  return { checked, notPublished }
}

export function buildShortfallDossier(publicRoot, trustedPublicationPin = null) {
  const bundle = join(publicRoot, 'evidence', bundleName)
  const pin = trustedPublicationPin ?? readJson(join(publicRoot, 'evidence/manifests/composed-pro-rata-v2-settlement.publication.json'))
  const manifestBytes = readBytes(join(bundle, 'manifest.json'))
  const projectionBytes = readBytes(join(bundle, 'validation-result.json'))
  const manifest = JSON.parse(manifestBytes.toString('utf8'))
  const projection = JSON.parse(projectionBytes.toString('utf8'))
  const proofPath = join(publicRoot, proofRelative)
  const proofBytes = readBytes(proofPath)
  const proof = JSON.parse(proofBytes.toString('utf8'))
  const statesBytes = readBytes(join(bundle, 'accounting-states.json'))
  const states = JSON.parse(statesBytes.toString('utf8'))
  const transfersBytes = readBytes(join(bundle, 'transfers.json'))
  const transfers = JSON.parse(transfersBytes.toString('utf8'))
  const witness = readJson(join(bundle, 'source-witness.json'))
  const replayA = readJson(join(bundle, 'clojure-replay.json'))
  const replayB = readJson(join(bundle, 'rust-replay.json'))
  const v3Manifest = readJson(join(bundle, 'prf-v3-live-context-manifest.json'))
  const v3Context = join(publicRoot, 'evidence/partial-fill/v3-live-context')
  const fundingObservationPath = join(publicRoot, 'evidence/partial-fill/v3-live-context/funding-observation.json')
  const fundingObservationBytes = readBytes(fundingObservationPath)
  const funding = JSON.parse(fundingObservationBytes.toString('utf8'))
  const genesisContextBytes = readBytes(join(v3Context, 'genesis-context.json'))
  const genesisContext = JSON.parse(genesisContextBytes.toString('utf8'))
  const manifestDigestSidecar = readBytes(join(bundle, 'manifest.sha256')).toString('utf8').trim().split(/\s+/)[0]

  assert.equal(hash(manifestBytes), pin.manifestSha256, 'manifest is not the published pinned manifest')
  assert.equal(manifestDigestSidecar, pin.manifestSha256, 'manifest sidecar differs from the publication pin')
  assert.equal(hash(projectionBytes), pin.validatedProjectionSha256, 'projection is not the published pinned projection')
  assert.equal(hash(proofBytes), manifest.proofIdentity.proofFixtureSha256, 'proof fixture digest differs from operation manifest')
  assert.equal(hash(fundingObservationBytes), v3Manifest.files['funding-observation.json']?.sha256,
    'opening funding observation differs from retained V3 evidence manifest')
  assert.equal(hash(genesisContextBytes), v3Manifest.files['genesis-context.json']?.sha256,
    'genesis context differs from retained V3 evidence manifest')
  assert.equal(projection.status, 'PASS', 'retained validator projection is not PASS')
  assert.equal(projection.operationId, manifest.operation.id, 'operation identity differs from projection')
  assert.equal(proof.proof_system, 'groth16', 'retained on-chain proof fixture is not Groth16')
  assert.equal(proof.program_id, manifest.proofIdentity.programId, 'proof program differs from manifest')
  assert.equal(proof.vkey, manifest.proofIdentity.vkey, 'proof VKey differs from manifest')
  assert.equal(proof.elf_sha256, manifest.proofIdentity.elfSha256, 'proof ELF differs from manifest')
  assert.equal(proof.public_values_length, 288, 'proof public-values length differs from V1 profile')
  assert.match(proof.public_values, /^0x[0-9a-fA-F]{576}$/, 'proof public values are not exactly 288 bytes')
  assert.equal(proof.public_values.slice(2, 66), '876f2aea9124d79f41dbdd389d498430987fa33bbb34408989849c478a7c2bde', 'proof schema word mismatch')
  assert.equal(proof.public_values.toLowerCase(), `0x${replayB['public-values'].replace(/^0x/, '').toLowerCase()}`,
    'proof public values differ byte-for-byte from the Rust replay')
  assert.equal(replayA['public-values'], replayB['public-values'], 'Clojure and Rust public values differ')
  assert.deepEqual(replayA['ordered-entitlements'], replayB['ordered-entitlements'], 'Clojure and Rust entitlement projections differ')
  assert.equal(v3Manifest.independentReplayEqual, true, 'retained V3 evidence does not report replay equality')
  assert.equal(v3Manifest.sp1SdkProofVerification.startsWith('passed'), true, 'retained V3 evidence does not report SP1 proof verification')
  assert.equal(v3Manifest.evmGroth16VerifierTest.startsWith('passed'), true, 'retained V3 evidence does not report EVM verifier execution')
  assert.equal(v3Manifest.registryAdmission.startsWith('passed'), true, 'retained V3 evidence does not report admission')
  assert.equal(manifest.operation.id, witness['prepared-operation']['operation-id'], 'witness operation identity mismatch')
  assert.equal(manifest.operation.preparedOperationRoot, `0x${proof.public_values.slice(66, 130)}`,
    'proof public values bind another prepared operation')
  assert.equal(manifest.operation.reserveStateCommitment, `0x${proof.public_values.slice(130, 194)}`,
    'proof public values bind another reserve state')
  assert.equal(manifest.source.repository, pin.sourceRepository, 'publication source repository differs from operation manifest')

  const economicLedger = makeEconomicLedger({
    states,
    transfers,
    projection,
    manifest,
    witness,
    funding,
    statesSha256: hash(statesBytes),
    transfersSha256: hash(transfersBytes),
    projectionSha256: hash(projectionBytes),
    fundingSha256: hash(fundingObservationBytes),
  })
  const availableManifestFiles = verifyAvailableManifestFiles(publicRoot, manifest)
  const testGasMatch = readBytes(bundlePath(publicRoot, 'full-stage2-qualification.log')).toString('utf8')
    .match(/\[PASS\] test_QualificationWithdrawsAndClosesExactly\(\) \(gas: ([0-9]+)\)/)
  const identity = projection.deployedContractIdentities
  const identityRecord = readBytes(bundlePath(publicRoot, 'execution.log')).toString('utf8')
    .match(/^.*PARTIAL_FILL_V3_IDENTITY_JSON\s+(\{.*\})\s*$/m)
  assert(identityRecord, 'missing local runtime identity record')
  const deployed = JSON.parse(identityRecord[1])
  assert.equal(deployed.chainId, '31337', 'deployed identity record is from another chain')
  assert.equal(witness['prepared-operation']['chain-id'], deployed.chainId, 'prepared operation and deployment chain differ')
  for (const role of ['reserve', 'allocator', 'token']) {
    assert.equal(normalize(witness['prepared-operation'][role]), normalize(identity[role].address),
      `prepared operation binds another ${role}`)
  }
  assert.equal(deployed.operationId, manifest.operation.id, 'deployment log names another operation')
  assert.equal(deployed.preparedOperationRoot, manifest.operation.preparedOperationRoot, 'deployment log names another prepared operation')
  assert.equal(deployed.reserveStateCommitment, manifest.operation.reserveStateCommitment, 'deployment log names another reserve commitment')
  assert.equal(deployed.configurationRoot, manifest.operation.configurationRoot, 'deployment log names another configuration')
  assert.equal(deployed.verifierRegistryRoot, manifest.operation.verifierRegistryRoot, 'deployment log names another verifier registry')
  assert.equal(deployed.programId, proof.program_id, 'deployment log names another proof program')
  assert.equal(deployed.vkey, proof.vkey, 'deployment log names another VKey')
  assert.equal(deployed.elfSha256, proof.elf_sha256, 'deployment log names another ELF')
  for (const [role, value] of Object.entries(identity)) {
    assert.equal(normalize(deployed[role]), normalize(value.address), `deployed address mismatch: ${role}`)
    assert.equal(normalize(deployed[`${role}CodeHash`]), normalize(value.codeHash), `deployed runtime identity mismatch: ${role}`)
  }
  const sourceDigests = readSourceFileDigests(manifest)
  const contractBindings = Object.entries(identity).map(([role, value]) => ({
    role,
    address: value.address,
    runtimeCodeHash: value.codeHash,
    sourceFile: sourceByRole[role] ?? null,
    manifestRecordedSourceSha256: sourceDigests[sourceByRole[role]] ?? null,
    sourceBinding: role === 'verifier'
      ? `SP1 verifier implementation imported from sp1Contracts revision ${manifest.dependencies.sp1Contracts}; source file digest is not listed as an application source.`
      : `Role-to-source mapping follows the pinned PartialFillV3Controlled.t.sol imports; the source digest is recorded in manifest.json.`,
    runtimeEvidence: 'PARTIAL_FILL_V3_IDENTITY_JSON in the manifest-pinned local execution.log',
  }))

  const claimTests = projection.negativeTestsPassed
  const gaps = [
    { type: 'missing-observation', status: 'open', claim: 'Public execution', detail: 'No mined receipts, transaction hashes, block hashes, public RPC observations or canonical-chain proofs are retained.' },
    { type: 'missing-observation', status: 'open', claim: 'Source/build/runtime closure', detail: 'The manifest base commit differs from the publication pin revision. Source file digests, compiler/dependency versions and local runtime hashes are recorded, but the checkout must be independently matched; creation inputs and an immutable-aware source-to-runtime rebuild comparison are absent.' },
    { type: 'missing-observation', status: 'open', claim: 'Complete deployment dependency inventory', detail: 'Ten operation roles have address/runtime pairs; genesis and local authority have supplemental address/code-hash context. Configuration executor and packed representation lack complete pairs here, and the local execution operator has no paired runtime hash in the identity record.' },
    { type: 'unverified-claim', status: 'open', claim: 'Request legitimacy and completeness', detail: 'The allocation is correct conditional on the controlled source fixture; the external truth and completeness of obligations are not established.' },
    { type: 'unverified-claim', status: 'open', claim: 'Beneficial ownership', detail: 'Beneficiary addresses and Carol’s refund destination are fixture-policy-bound; legal or external ownership is not established.' },
    { type: 'conflicting-evidence', status: 'not-tested', claim: 'Conflicting observations', detail: 'The retained bundle does not report a conflict, but it does not include an adversarial reconciliation test that injects contradictory receipt, storage and event evidence.' },
    { type: 'policy-required-attestation', status: 'open', claim: 'External authority approval', detail: 'The authority and operator are local test fixtures; no externally authenticated governance approval is present.' },
    { type: 'missing-observation', status: 'open', claim: 'Crash recovery', detail: 'A fresh-proof stale-assurance recovery branch is tested. Process interruption and restart at each lifecycle boundary are not demonstrated.' },
    { type: 'missing-observation', status: 'open', claim: 'Scale envelope', detail: 'The fixture covers three entitlements. Its aggregate test gas is not a per-stage measurement or a supported maximum.' },
    { type: 'missing-observation', status: 'open', claim: 'Packed representation equivalence', detail: 'The activated representation is bound to the admitted table and altered representations reject; an independent decoder comparison and cross-representation equivalence run are not retained.' },
    { type: 'optional-out-of-scope', status: 'not-required', claim: 'Research acceptance and incentives', detail: 'No acceptance, reward eligibility, obligation or payment is inferred from this operation.' },
  ]

  return {
    schema: 'eae.site-shortfall-forensic-dossier.v1',
    reportKind: 'derived-presentation-projection',
    canonicalAuthority: 'This report does not define PRF canonical evidence identities or replace the retained PRF/prf-evm validators.',
    subject: {
      operationId: manifest.operation.id,
      preparedOperationRoot: manifest.operation.preparedOperationRoot,
      chainId: 31337,
      environment: 'local Foundry fixture only',
      sourceRepository: manifest.source.repository,
      sourceRevision: pin.sourceRevision,
      manifestBaseGitCommit: manifest.source.baseGitCommit,
      manifestBaseAndPublicationRevisionMatch: manifest.source.baseGitCommit === pin.sourceRevision,
      manifestSha256: hash(manifestBytes),
      validatedProjectionSha256: hash(projectionBytes),
      proofFixtureSha256: hash(proofBytes),
      programId: proof.program_id,
      vkey: proof.vkey,
      elfSha256: proof.elf_sha256,
      proofSystem: proof.proof_system,
      publicValuesSchema: proof.public_values_schema,
      publicValuesLength: proof.public_values_length,
    },
    verificationDimensions: [
      { dimension: 'Origin', result: 'controlled source and test fixtures; observations emitted by a local Foundry test' },
      { dimension: 'Integrity', result: 'manifest, projection, proof, funding observation and ten deployed identity pairs cross-check against retained pins and logs' },
      { dimension: 'Semantic validation', result: 'Clojure/Rust projections agree; the retained prf-evm validator reconstructs allocation, state and accounting' },
      { dimension: 'Cryptographic verification', result: 'SP1 Groth16 and local EVM verifier/admission passed in the retained test; opening this report does not rerun them' },
      { dimension: 'Authentication', result: 'internal publication pins only; no public chain or externally authenticated authority' },
      { dimension: 'Coverage', result: 'one bounded 3-entitlement controlled operation; external obligation completeness and ownership are outside scope' },
    ],
    claimBindings: [
      { claim: 'Pro-rata allocation 50/30/20 → 35/21/14', state: 'supported-within-fixture', evidence: ['source-witness.json', 'clojure-replay.json', 'rust-replay.json', 'validation-result.json'], method: 'cross-language projection comparison and retained source-bound validator', limit: 'not evidence of external request truth/completeness; no rounding tie or cap redistribution' },
      { claim: 'Proof → admission → prepared operation → funding', state: 'supported-locally', evidence: ['proof fixture', 'prf-v3-live-context-manifest.json', 'execution.log', 'validation-result.json'], method: 'retained SP1/Groth16 verification, registry admission, operation/root cross-links, and local protected funding test', limit: 'local fixture authority and local test execution; no mined receipts or external chain authentication' },
      { claim: 'Funded custody equals payouts plus remaining liability', state: 'reconstructed', evidence: ['accounting-states.json', 'transfers.json', 'accounting-journal.json'], method: 'independently recomputed balance deltas and liability equation across eight call-boundary states', limit: 'transfer/state observations are local Foundry records, not block-authenticated state' },
      { claim: 'Observed deployed runtime identities match the retained operation log', state: 'cross-checked', evidence: ['manifest.json', 'validation-result.json', 'execution.log'], method: 'ten address/runtime pairs compared with the single pinned local identity record', limit: 'does not prove current code, deployment transaction provenance or source-to-runtime bytecode equivalence' },
    ],
    evidenceRelationships: [
      { from: 'source-witness.json', to: 'clojure-replay.json + rust-replay.json', relationship: 'validated-by-independent-replays', result: 'equal' },
      { from: 'proof fixture', to: 'admissionReceipt', relationship: 'executed-by-local-verifier-and-admission', result: 'passed-in-retained-local-test' },
      { from: 'preparedOperationRoot + reserveStateCommitment', to: 'protected funding transfer', relationship: 'bound-and-checked-in-retained-test', result: 'passed-locally' },
      { from: 'execution.log identity record', to: 'ten deployedContractIdentities', relationship: 'cross-checked-by-publication-validator', result: 'equal' },
      { from: 'transfer records', to: 'balance snapshots and liabilities', relationship: 'independently-reconstructed-from-retained-observations', result: 'equal-at-eight-call-boundaries' },
      { from: 'deployment source files', to: 'local deployed runtime', relationship: 'declared-source-and-observed-runtime; bytecode derivation unavailable', result: 'partial' },
    ],
    authorityAndProofBinding: {
      verifier: { address: identity.verifier.address, codeHash: identity.verifier.codeHash, vkey: proof.vkey, adapter: identity.adapter.address, registry: identity.registry.address, admission: identity.admission.address },
      operation: { id: manifest.operation.id, preparedOperationRoot: manifest.operation.preparedOperationRoot, reserveStateCommitment: manifest.operation.reserveStateCommitment, configurationRoot: manifest.operation.configurationRoot, verifierRegistryRoot: manifest.operation.verifierRegistryRoot },
      preparedAssets: { token: identity.token.address, reserve: identity.reserve.address, allocator: identity.allocator.address },
      localPrincipals: {
        configurationAuthorityAdapter: { address: genesisContext.authority, codeHash: genesisContext.authorityCodeHash },
        chainGenesis: { address: genesisContext.genesis, codeHash: genesisContext.genesisCodeHash },
        localTestContractPrincipalAndSponsor: funding.sponsor,
        executionOperator: deployed.operator,
        roleInterpretation: 'The test contract is the local registry/configuration authority principal, operation initiator, sponsor and operator principal. This is fixture behavior, not an approved external authority policy.',
      },
      principalClassification: 'Locally exercised test authority/operator; externally authenticated signer policy is absent.',
      fundingRelation: 'The retained local test consumes the admitted assurance through ratification and records a 70-unit reserve-to-allocator transfer; the state projection records the same balances.',
    },
    sourceBuildRuntime: {
      sourceRevision: pin.sourceRevision,
      manifestBaseGitCommit: manifest.source.baseGitCommit,
      sourceFileDigests: sourceDigests,
      contractBindings,
      publishedManifestFilesVerified: availableManifestFiles.checked,
      manifestFilesNotPublishedWithSiteBundle: availableManifestFiles.notPublished,
      foundry: manifest.dependencies.foundry,
      solidityCompiler: manifest.dependencies.solc,
      pinnedDependencies: manifest.dependencies,
      deploymentRuntimePairs: identity,
      creationInputAndTransactionEvidence: 'not-retained-in-this-operation-inventory',
      independentImmutableAwareSourceToRuntimeMatch: 'not-established',
    },
    economicLedger,
    adversarialCoverage: {
      retainedNegativeTestCount: claimTests.length,
      retainedNegativeTests: claimTests,
      freshProofStaleAssuranceRecoveryPassed: projection.freshProofRecoveryTestPassed,
      conflictingObservationInjection: 'not-covered',
      wholeSelfConsistentBundleSubstitution: 'a self-consistent replacement can be re-pinned if the pin is replaced with the bundle; an independently retained original pin rejects the substituted manifest',
    },
    recovery: {
      staleAssuranceReplacement: 'demonstrated as a separate fresh-proof branch; finalization rejects with a remaining unrelated reserve hold',
      processInterruptionAndResume: 'not-demonstrated',
      retryBoundaryEvidence: 'no persisted crash/restart checkpoints are retained for admission, preparation, funding, activation or partial claims',
    },
    scale: {
      entitlementCount: Number(proof.public_values.slice(386, 450), 16),
      aggregateQualificationTestGas: testGasMatch ? Number(testGasMatch[1]) : null,
      gasInterpretation: 'aggregate Foundry test gas for this one test; not per-stage gas or a scale benchmark',
      supportedMaximum: null,
      status: 'no qualified scale envelope',
    },
    gaps,
    reproduction: {
      publishedBundle: `/evidence/${bundleName}/`,
      reportAndArtifactCheck: 'pnpm verify:shortfall-evidence',
      independentPinCheck: 'pnpm verify:shortfall-pin --trusted-pin <independently acquired publication pin>',
      sourceExecution: `git checkout ${pin.sourceRevision}; run the pinned Foundry positive and full-stage2 commands in the evidence README; then run python3 scripts/verify-composed-pro-rata-v2.py`,
      proofGenerationRequired: false,
      localOnly: true,
    },
    inputs: [
      { path: `evidence/${bundleName}/manifest.json`, sha256: hash(manifestBytes), relationship: 'source and operation inventory' },
      { path: `evidence/${bundleName}/validation-result.json`, sha256: hash(projectionBytes), relationship: 'retained validator output and state projection' },
      { path: proofRelative, sha256: hash(proofBytes), relationship: 'exact Groth16 proof fixture' },
      { ...reportEvidence(publicRoot, 'accounting-states.json', 'eight local getter snapshots'), sha256: hash(readBytes(bundlePath(publicRoot, 'accounting-states.json'))) },
      { ...reportEvidence(publicRoot, 'transfers.json', 'five local ERC-20 transfer observations'), sha256: hash(readBytes(bundlePath(publicRoot, 'transfers.json'))) },
      { path: 'evidence/partial-fill/v3-live-context/funding-observation.json', sha256: hash(fundingObservationBytes), relationship: 'opening reserve transfer attribution' },
      { path: 'evidence/partial-fill/v3-live-context/genesis-context.json', sha256: hash(genesisContextBytes), relationship: 'supplemental local genesis and authority identity' },
    ],
  }
}

export function verifyShortfallDossier(publicRoot, trustedPublicationPin = null) {
  const expected = stable(buildShortfallDossier(publicRoot, trustedPublicationPin))
  const dossierPath = join(publicRoot, 'evidence/reports/composed-pro-rata-v2-forensic-dossier.v1.json')
  assert(existsSync(dossierPath), 'missing generated shortfall forensic dossier')
  const actual = readBytes(dossierPath).toString('utf8')
  assert.equal(actual, expected, 'published shortfall dossier differs from independent reconstruction')
  return { dossierPath, sha256: hash(Buffer.from(actual)), dossier: JSON.parse(actual) }
}

export { stable as serializeShortfallDossier }
