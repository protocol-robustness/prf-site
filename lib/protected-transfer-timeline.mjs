import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SITE_TIMELINE_SCHEMA = 'eae.site.protected-transfer-timeline.v1'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const EVIDENCE_FILES = [
  'manifest.json', 'witness.json', 'gate-e-proof-fixture.json', 'source-bound-entitlement-v1.json',
  'funding-forensic.json', 'activation-forensic.json', 'withdrawal-forensic.json',
  'deployment-broadcast.json', 'funding-broadcast.json', 'activation-broadcast.json',
  'withdrawal-broadcast.json', 'fresh-anvil-replay.json', 'negative-tests/allocator-substitution-foundry.json',
]

export function readProtectedTransferEvidence(root) {
  const bytesByName = Object.fromEntries(EVIDENCE_FILES.map((name) => [name, readFileSync(join(root, name))]))
  const evidence = Object.fromEntries(Object.entries(bytesByName).map(([name, bytes]) => [
    name, name.endsWith('.json') ? JSON.parse(bytes.toString('utf8')) : bytes.toString('utf8'),
  ]))
  return { evidence, hashes: Object.fromEntries(Object.entries(bytesByName).map(([name, bytes]) => [name, sha256(bytes)])) }
}

export function deriveProtectedTransferTimeline(evidence, hashes) {
  const manifest = evidence['manifest.json']
  const witness = evidence['witness.json']
  const fixture = evidence['gate-e-proof-fixture.json']
  const funding = evidence['funding-forensic.json']
  const activation = evidence['activation-forensic.json']
  const withdrawal = evidence['withdrawal-forensic.json']
  const deploymentRun = evidence['deployment-broadcast.json']
  const fundingRun = evidence['funding-broadcast.json']
  const activationRun = evidence['activation-broadcast.json']
  const withdrawalRun = evidence['withdrawal-broadcast.json']
  const freshReplay = evidence['fresh-anvil-replay.json']
  const allocatorAttack = evidence['negative-tests/allocator-substitution-foundry.json']

  assert.equal(manifest.schema, 'prf-evm.gate-e-entitlement-deployment.v1')
  assert.equal(manifest.chainId, 31337)
  assert.equal(manifest.localOnly?.executionVerifierId?.length, 66)
  assert.equal(witness['prepared-operation']['operation-id'], manifest.operationId)
  assert.equal(witness['prepared-operation']['chain-id'], String(manifest.chainId))
  assert.equal(witness['prepared-operation']['configuration-root'], manifest.configurationRoot)
  assert.equal(witness['prepared-operation']['configuration-epoch'], String(manifest.configurationEpoch))
  assert.equal(witness['prepared-operation'].allocator.toLowerCase(), manifest.contracts.allocator.toLowerCase())
  assert.equal(witness['prepared-operation'].reserve.toLowerCase(), manifest.contracts.reserve.toLowerCase())
  assert.equal(witness['prepared-operation'].token.toLowerCase(), manifest.contracts.token.toLowerCase())
  const grossReserve = Number(witness['economic-reserve-state']['gross-balance'])
  const protectedReserve = Number(witness['economic-reserve-state']['protected-capital'])
  const available = Number(witness['economic-reserve-state']['available-amount'])
  assert.equal(grossReserve - protectedReserve, available)
  assert.equal(manifest.economicReserveState.availableAmount, String(available))
  assert.equal(manifest.localOnly && manifest.chainId, 31337)

  assert.equal(fixture.proof_system, 'groth16')
  assert.equal(fixture.program_id, manifest.programId)
  assert.equal(fixture.public_values_schema, 'prf/source-bound-entitlement-public-values.v1')
  assert.equal(fixture.public_values_length, 288)
  assert.equal(fixture.gate_e.operation_id, manifest.operationId)
  assert.equal(fixture.gate_e.manifest_digest, manifest.manifestDigest)
  assert.equal(fixture.gate_e.prepared_operation_root, manifest.preparedOperationRoot)
  assert.equal(fixture.gate_e.reserve_state_commitment, manifest.reserveStateCommitment)
  assert.equal(fixture.vkey, manifest.programVKey)
  assert.equal(fixture.elf_sha256, manifest.programElfSha256)
  assert.equal(fixture.gate_e.proof_sha256.toLowerCase(), sha256(Buffer.from(fixture.proof.slice(2), 'hex')))
  assert.equal(funding.operation_id, manifest.operationId)
  assert.equal(activation.operation_id, manifest.operationId)
  assert.equal(withdrawal.operation_id, manifest.operationId)
  assert.equal(funding.chain_id, manifest.chainId)
  assert.equal(funding.gate_e.manifest_digest, manifest.manifestDigest)
  assert.equal(funding.gate_e.proof_sha256, fixture.gate_e.proof_sha256)
  assert.equal(activation.funding_evidence_sha256, hashes['funding-forensic.json'])
  assert.equal(withdrawal.activation_evidence_sha256, hashes['activation-forensic.json'])
  assert.equal(freshReplay.chain_id, manifest.chainId)
  assert.equal(freshReplay.identity.operation_id, manifest.operationId)
  assert.equal(freshReplay.foundry_fork_tests.failed, 0)
  assert.equal(freshReplay.foundry_fork_tests.passed, 4)
  assert.equal(freshReplay.identity.vkey, manifest.programVKey)
  assert.equal(freshReplay.identity.elf_sha256, manifest.programElfSha256)
  assert.equal(freshReplay.identity.public_values_length, 288)
  assert.equal(allocatorAttack.schema, 'eae.site.protected-transfer-negative-test.v1')
  assert.equal(allocatorAttack.result, 'PASS')
  assert.equal(allocatorAttack.repository, 'prf-evm')
  assert.equal(allocatorAttack.sourceRevision, '4cfa2f96a4938d23abda609dfff9052b177ef8af')
  assert.equal(allocatorAttack.testName, 'test_SuccessorRejectsPreparedAllocatorDifferentFromFundedAllocator')
  assert.equal(allocatorAttack.expectedRejection, 'SourceBoundProRataRatificationControllerV2.PreparedContextMismatch')
  assert.ok(allocatorAttack.testOutput.includes('[PASS] test_SuccessorRejectsPreparedAllocatorDifferentFromFundedAllocator()'))
  assert.ok(allocatorAttack.testOutput.includes('1 tests passed, 0 failed, 0 skipped'))
  assert.equal(allocatorAttack.case.kind, 'prepared-allocator-versus-reserve-bound-allocator-mismatch')

  const publicBytes = Buffer.from(fixture.public_values.slice(2), 'hex')
  assert.equal(publicBytes.length, 288)
  const words = Array.from({ length: 9 }, (_, i) => `0x${publicBytes.subarray(i * 32, (i + 1) * 32).toString('hex')}`)
  assert.equal(words[0], '0x876f2aea9124d79f41dbdd389d498430987fa33bbb34408989849c478a7c2bde')
  assert.equal(words[1], manifest.preparedOperationRoot)
  assert.equal(words[2], manifest.reserveStateCommitment)
  assert.equal(BigInt(words[6]), 3n)
  assert.equal(BigInt(words[7]), BigInt(available))

  const requests = witness['realized-statement-input'].requested
  const requestedTotal = Object.values(requests).reduce((sum, value) => sum + Number(value), 0)
  assert.equal(requestedTotal, 100)
  const participants = [
    ['Alice', 'claim-a'], ['Bob', 'claim-b'], ['Carol', 'claim-c'],
  ].map(([name, claimId]) => {
    const mapping = witness['beneficiary-mapping'].find((item) => item['claim-id'] === claimId)
    assert.ok(mapping, `${name} beneficiary mapping`)
    const request = Number(requests[claimId])
    const amount = request * available / requestedTotal
    assert.equal(Number.isInteger(amount), true, `${name} exact allocation`)
    return { name, claimId, requested: request, amount, beneficiary: mapping.beneficiary.toLowerCase() }
  })
  assert.deepEqual(participants.map((p) => p.amount), [35, 21, 14])
  assert.equal(participants.reduce((sum, p) => sum + p.amount, 0), available)

  for (const [label, run, count] of [
    ['deployment', deploymentRun, 24], ['funding', fundingRun, 6],
    ['activation', activationRun, 2], ['withdrawal', withdrawalRun, 9],
  ]) verifyBroadcast(label, run, count, manifest.deployer)
  const deployedAddresses = new Set(deploymentRun.transactions.map((tx) => tx.contractAddress?.toLowerCase()).filter(Boolean))
  for (const [role, address] of Object.entries(manifest.contracts)) assert.ok(deployedAddresses.has(address.toLowerCase()), `deployment for ${role}`)
  for (const run of [fundingRun, activationRun, withdrawalRun]) {
    for (const tx of run.transactions) assert.equal(tx.transaction.chainId, '0x7a69')
  }

  const admissionRecord = funding.transactions.find((entry) => entry.function === 'admitStatement(bytes32,bytes32,bytes,bytes)')
  const fundingRecord = funding.transactions.find((entry) => entry.function === 'fund(bytes32,address)')
  const preparationRecords = funding.transactions.filter((entry) => ['prepareSourceAssurance(bytes32,bytes32,bytes)', 'registerPrepared(bytes32)'].includes(entry.function))
  assert.ok(admissionRecord && fundingRecord && preparationRecords.length === 2, 'forensic admission, preparation and funding transaction records')
  const { tx: admissionTx, receipt: admissionReceipt } = matchForensicTransaction(fundingRun, admissionRecord)
  const { tx: fundTx, receipt: fundReceipt } = matchForensicTransaction(fundingRun, fundingRecord)
  const preparationTransactions = preparationRecords.map((record) => matchForensicTransaction(fundingRun, record))
  assert.ok(admissionReceipt.logs.some((log) => log.address.toLowerCase() === manifest.contracts.admission.toLowerCase() && log.topics[0] === '0x147e58719f77d2b605deeb83e74e36da89c3ad26b0cde2a807a444175a2be911'), 'admission event in bound receipt')
  const reserve = manifest.contracts.reserve.toLowerCase()
  const allocator = manifest.contracts.allocator.toLowerCase()
  const token = manifest.contracts.token.toLowerCase()
  const fundingTransfer = findTransfer(fundReceipt, token, reserve, allocator, BigInt(available))
  assert.equal(funding.before_funding.reserve_balance, grossReserve)
  assert.equal(funding.before_funding.allocator_balance, 0)
  assert.equal(funding.after_funding.reserve_balance, protectedReserve)
  assert.equal(funding.after_funding.allocator_balance, available)
  assert.equal(activation.liability_before, 0)
  assert.equal(activation.liability_after, available)
  assert.equal(withdrawal.liability_before_after[0], available)
  assert.equal(withdrawal.liability_before_after[1], 0)

  const payouts = withdrawal.beneficiary_payouts
  const observations = withdrawal.withdrawal_observations
  assert.equal(payouts.length, 3)
  const claimSteps = participants.map((participant, index) => {
    const payout = payouts[index]
    const observation = observations[index]
    assert.equal(payout.beneficiary.toLowerCase(), participant.beneficiary)
    assert.equal(payout.delta, participant.amount)
    assert.equal(observation.beneficiary.toLowerCase(), participant.beneficiary)
    assert.equal(observation.amount, participant.amount)
    const tx = withdrawalRun.transactions.find((entry) => entry.hash.toLowerCase() === observation.transaction_hash.toLowerCase())
    assert.ok(tx, `claim transaction for ${participant.name}`)
    const receipt = receiptFor(withdrawalRun, tx.hash)
    const transfer = findTransfer(receipt, token, allocator, participant.beneficiary, BigInt(participant.amount))
    const paidBefore = participants.slice(0, index).reduce((sum, prior) => sum + prior.amount, 0)
    return {
      id: `claim-${participant.claimId}`, title: `${participant.name} withdraws ${participant.amount}`,
      kind: 'observed-asset-transfer', actor: participant.name, narration: `${participant.name} received ${participant.amount} local fixture-token units in a successful local receipt.`,
      amount: participant.amount, beneficiary: participant.beneficiary,
      before: { reserve: protectedReserve, allocator: available - paidBefore, paid: paidBefore, liability: available - paidBefore },
      after: { reserve: protectedReserve, allocator: available - paidBefore - participant.amount, paid: paidBefore + participant.amount, liability: available - paidBefore - participant.amount },
      withdrawalMode: observation.required_mode === 1 ? 'Required' : 'Requested',
      transaction: txReference(tx, receipt), transfer: transferReference(transfer, receipt),
      evidenceRefs: refs(hashes, ['withdrawal-broadcast.json', 'withdrawal-forensic.json']),
    }
  })
  assert.deepEqual(claimSteps.map((step) => step.amount), [35, 21, 14])
  const duplicateReplays = withdrawal.replay_attempts.map((attempt, index) => ({
    id: `duplicate-claim-replay-${index + 1}`, kind: 'read-only-eth-call',
    originalTransaction: attempt.original_transaction,
    outcome: attempt.rpc_result?.error ? 'reverted-in-read-only-call' : 'unverified',
    transactionMined: false,
  }))
  assert.equal(duplicateReplays.length, 3)
  assert.ok(duplicateReplays.every((attempt) => attempt.outcome === 'reverted-in-read-only-call'))

  const allRefs = (names) => refs(hashes, names)
  const staticState = { reserve: Number(funding.before_funding.reserve_balance), allocator: Number(funding.before_funding.allocator_balance), paid: 0, liability: Number(funding.before_funding.outstanding_liability) }
  const paidTotal = participants.reduce((sum, participant) => sum + participant.amount, 0)
  const terminal = {
    reserve: withdrawal.custody_before_after.reserve[1], allocator: withdrawal.custody_before_after.allocator[1],
    paid: payouts.reduce((sum, payout) => sum + payout.delta, 0), liability: withdrawal.liability_before_after[1],
  }
  assert.deepEqual(terminal, { reserve: protectedReserve, allocator: 0, paid: available, liability: 0 })
  const rawSteps = [
    { id: 'source', title: 'Shortfall source and reserve', kind: 'source-observation', narration: `The controlled request totals ${requestedTotal} units. The local reserve holds ${grossReserve}, including ${protectedReserve} protected; ${available} are available.`, before: staticState, after: staticState, evidenceRefs: allRefs(['manifest.json', 'witness.json', 'source-bound-entitlement-v1.json']) },
    { id: 'allocation', title: 'Pro-rata / Pro-Rata V2 allocation', kind: 'derived-calculation', narration: `The committed requests project to ${participants.map((p) => `${p.name} ${p.amount}`).join(', ')} from ${available} available units. A calculation alone does not move capital.`, allocations: participants, before: staticState, after: staticState, evidenceRefs: allRefs(['witness.json', 'gate-e-proof-fixture.json', 'source-bound-entitlement-v1.json']) },
    { id: 'deployment', title: 'Deploy the protected dependencies', kind: 'local-deployment', narration: `${deploymentRun.transactions.length} successful receipts deployed the contracts named in this operation manifest on local Anvil.`, before: staticState, after: staticState, transactions: deploymentRun.transactions.map((tx) => txReference(tx, receiptFor(deploymentRun, tx.hash))), evidenceRefs: allRefs(['manifest.json', 'deployment-broadcast.json']) },
    { id: 'admission', title: 'Verify and admit the proof', kind: 'proof-admission', narration: 'The retained Foundry run reports the real successor Groth16 proof passing the deployed verifier/admission path. This website does not execute SP1 or verify the proof itself.', before: staticState, after: staticState, transaction: txReference(admissionTx, admissionReceipt), evidenceRefs: allRefs(['gate-e-proof-fixture.json', 'funding-broadcast.json', 'funding-forensic.json']) },
    { id: 'prepare', title: 'Prepare and register the operation', kind: 'prepared-operation', narration: 'The retained assurance and ratification records bind the operation to its prepared identity before funding.', before: staticState, after: staticState, transactions: preparationTransactions.map(({ tx, receipt }) => txReference(tx, receipt)), evidenceRefs: allRefs(['manifest.json', 'witness.json', 'funding-broadcast.json', 'funding-forensic.json']) },
    { id: 'prepare-ratify-fund', title: 'Ratify and fund the allocator', kind: 'protected-funding', narration: `The protected operation moved exactly ${available} fixture-token units from reserve to allocator. ${protectedReserve} protected units remained in reserve.`, before: { reserve: funding.before_funding.reserve_balance, allocator: funding.before_funding.allocator_balance, paid: 0, liability: funding.before_funding.outstanding_liability }, after: { reserve: funding.after_funding.reserve_balance, allocator: funding.after_funding.allocator_balance, paid: 0, liability: funding.after_funding.outstanding_liability }, transaction: txReference(fundTx, fundReceipt), transfer: transferReference(fundingTransfer, fundReceipt), evidenceRefs: allRefs(['funding-broadcast.json', 'funding-forensic.json']) },
    { id: 'activate', title: 'Activate entitlements', kind: 'activation', narration: `Activation bound the logical table. Liability changed from zero to ${activation.liability_after}; token custody did not move.`, before: { reserve: activation.custody_before_after.reserve[0], allocator: activation.custody_before_after.allocator[0], paid: 0, liability: activation.liability_before }, after: { reserve: activation.custody_before_after.reserve[1], allocator: activation.custody_before_after.allocator[1], paid: 0, liability: activation.liability_after }, transactions: activationRun.transactions.map((tx) => txReference(tx, receiptFor(activationRun, tx.hash))), evidenceRefs: allRefs(['activation-broadcast.json', 'activation-forensic.json']) },
    ...claimSteps,
    { id: 'reconcile', title: 'Reconcile custody and obligations', kind: 'reconciliation', narration: `All ${paidTotal} funded units were paid to the three fixture beneficiaries. ${protectedReserve} protected units remain in reserve. ${requestedTotal - available} of the original ${requestedTotal} requested units were unmet and never became funded liabilities.`, before: terminal, after: terminal, evidenceRefs: allRefs(['funding-forensic.json', 'activation-forensic.json', 'withdrawal-forensic.json', 'fresh-anvil-replay.json']) },
  ]

  const stageRequirements = {
    source: ['operation-chain-binding', 'prepared-configuration-binding', 'reserve-availability-consistency'],
    allocation: ['requested-total-reconstruction', 'pro-rata-share-reconstruction', 'public-count-total-match'],
    deployment: ['manifest-addresses-have-deployment-receipts', 'all-receipts-successful-local-chain-and-deployer'],
    admission: ['proof-program-vkey-elf-schema-binding', 'admission-event-from-bound-contract', 'proof-pass-recorded-in-foundry-fixture'],
    prepare: ['prepared-operation-root-bound', 'preparation-and-registration-receipts-matched'],
    'prepare-ratify-fund': ['exact-reserve-to-allocator-transfer-log', 'funding-state-delta-reconciles'],
    activate: ['activated-representation-evidence-linked', 'liability-increase-matches-entitlement-total', 'no-token-custody-change'],
    'claim-claim-a': ['beneficiary-and-claim-amount-match', 'transfer-log-and-liability-delta-match'],
    'claim-claim-b': ['beneficiary-and-claim-amount-match', 'transfer-log-and-liability-delta-match'],
    'claim-claim-c': ['beneficiary-and-claim-amount-match', 'transfer-log-and-liability-delta-match'],
    reconcile: ['funded-amount-equals-total-payouts', 'terminal-custody-and-liability-reconcile', 'unmet-request-not-counted-as-liability'],
  }
  const stageVerification = {
    source: [{ validator: 'site evidence projection', status: 'passed', scope: 'witness, manifest, operation, configuration and reserve facts agree' }],
    allocation: [{ validator: 'site arithmetic reconstruction', status: 'passed', scope: 'pro-rata shares reconstruct exactly to the admitted total' }],
    deployment: [{ validator: 'site receipt validator', status: 'passed', scope: 'deployment addresses, transaction hashes, signers, chain IDs and receipts cross-link' }],
    admission: [
      { validator: 'retained Foundry proof/admission test', status: 'recorded-passed', scope: 'fixture reports real Groth16 admission; not re-executed by this site' },
      { validator: 'site receipt validator', status: 'passed', scope: 'admission event is in the receipt bound to the operation evidence' },
    ],
    prepare: [{ validator: 'site receipt validator', status: 'passed', scope: 'prepared-operation and registration receipt records bind to the same operation' }],
    'prepare-ratify-fund': [{ validator: 'site economic reconciler', status: 'passed', scope: 'ERC-20 transfer log and before/after custody agree' }],
    activate: [{ validator: 'portable bundle verifier', status: 'passed', scope: 'activation evidence cross-links the funding evidence and liability state' }],
    'claim-claim-a': [{ validator: 'site transfer validator', status: 'passed', scope: 'beneficiary, amount, receipt context and token Transfer log agree' }],
    'claim-claim-b': [{ validator: 'site transfer validator', status: 'passed', scope: 'beneficiary, amount, receipt context and token Transfer log agree' }],
    'claim-claim-c': [{ validator: 'site transfer validator', status: 'passed', scope: 'beneficiary, amount, receipt context and token Transfer log agree' }],
    reconcile: [{ validator: 'portable bundle verifier and site reconciler', status: 'passed-for-retained-local-observations', scope: 'payouts, custody and liability close to the funded amount' }],
  }
  const stageActors = {
    source: { role: 'authenticated-input-fixture', address: null },
    allocation: { role: 'reviewed-pro-rata-derivation', address: null },
    deployment: { role: 'deployer', address: manifest.deployer },
    admission: { role: 'statement-admission', address: manifest.contracts.admission },
    prepare: { role: 'prepared-controller', address: manifest.contracts.preparedController },
    'prepare-ratify-fund': { role: 'ratification-controller-and-reserve', address: manifest.contracts.ratificationController },
    activate: { role: 'successor-entitlement-allocator', address: manifest.contracts.allocator },
    reconcile: { role: 'forensic-reconstruction', address: null },
  }
  const actionByKind = {
    'source-observation': 'bind-source-and-reserve-facts',
    'derived-calculation': 'reconstruct-pro-rata-allocation',
    'local-deployment': 'deploy-selected-contracts',
    'proof-admission': 'verify-and-admit-proof',
    'prepared-operation': 'prepare-and-register-operation',
    'protected-funding': 'ratify-and-fund',
    activation: 'activate-entitlement-table',
    'observed-asset-transfer': 'withdraw-claim',
    reconciliation: 'reconcile-custody-and-liability',
  }
  const previousId = new Map(rawSteps.map((step, index) => [step.id, index > 0 ? rawSteps[index - 1].id : null]))
  const steps = rawSteps.map((step, index) => {
    const { before, after, ...record } = step
    const preState = before
    const postState = after
    const tokenDeltas = step.transfer ? [
      { asset: manifest.contracts.token, account: step.transfer.from, amount: -step.transfer.amount },
      { asset: manifest.contracts.token, account: step.transfer.to, amount: step.transfer.amount },
    ] : []
    const dependencies = step.id === 'source' ? [] : step.id.startsWith('claim-')
      ? ['activate', ...(index > 7 ? [rawSteps[index - 1].id] : [])]
      : [previousId.get(step.id)].filter(Boolean)
    const actor = stageActors[step.id] ?? { role: 'entitlement-beneficiary', address: step.beneficiary ?? null }
    return {
      sequence: index + 1, ...record,
      operationId: manifest.operationId,
      chainInstance: { chainId: manifest.chainId, environment: 'localOnly', manifestDigest: manifest.manifestDigest },
      sourceCommitment: { witnessSha256: fixture.gate_e.witness_sha256, sourceBundleSha256: fixture.gate_e.source_bundle_sha256 },
      actor,
      action: actionByKind[step.kind],
      dependencies,
      preState,
      postState,
      assetDeltas: { token: tokenDeltas, liability: postState.liability - preState.liability },
      requiredChecks: stageRequirements[step.id],
      verificationResults: stageVerification[step.id],
      provenance: { classification: 'localOnly', sourceRevision: '4cfa2f96a4938d23abda609dfff9052b177ef8af', evidenceRefs: step.evidenceRefs },
      trustStatus: step.kind === 'derived-calculation' || step.kind === 'source-observation' || step.kind === 'reconciliation'
        ? 'reconstructed-from-retained-local-evidence' : 'retained-local-observation',
    }
  })

  const callAttribution = [admissionRecord, ...preparationRecords, fundingRecord].map((record) => {
    const { tx } = matchForensicTransaction(fundingRun, record)
    return { transactionHash: record.receipt.transactionHash, forensicFunction: record.function, broadcastFunction: tx.function, labelsAgree: record.function === tx.function }
  })
  const body = {
    schema: SITE_TIMELINE_SCHEMA,
    projection: { owner: 'prf-site', canonicalIdentity: false, purpose: 'evidence-checked presentation projection; not a PRF canonical root' },
    subject: {
      chainId: manifest.chainId, environment: 'local Anvil · localOnly', operationId: manifest.operationId,
      manifestDigest: manifest.manifestDigest, preparedOperationRoot: manifest.preparedOperationRoot,
      configurationRoot: manifest.configurationRoot, configurationEpoch: manifest.configurationEpoch,
      programId: fixture.program_id, proofSystem: fixture.proof_system, vkey: fixture.vkey,
      elfSha256: fixture.elf_sha256, publicValuesSchema: fixture.public_values_schema,
      publicValuesLength: publicBytes.length, publicValuesSha256: sha256(publicBytes),
      source: { witnessSha256: fixture.gate_e.witness_sha256, bundleSha256: fixture.gate_e.source_bundle_sha256 },
      contracts: Object.entries(manifest.contracts).map(([role, address]) => ({ role, address })),
      sourceRevision: '4cfa2f96a493',
    },
    economics: {
      unit: 'local controlled fixture-token units; not USDC or a currency valuation',
      requested: requestedTotal, grossReserve, protectedReserve, available, unmet: requestedTotal - available,
      allocations: participants, terminal,
    },
    verification: {
      portableBundle: { status: 'passed', scope: 'offline indexed artifact integrity and cross-link checks' },
      localExecution: { status: 'observed', receipts: 41, freshReplayTests: '4 passed / 0 failed' },
      proof: { status: 'recorded-passed', scope: 'retained local Foundry proof/admission run; not re-executed by the site' },
      economicReconciliation: { status: 'passed-for-retained-local-observations', transfers: 4, funded: available, withdrawn: terminal.paid, liability: terminal.liability },
      transactionCallLabels: { status: callAttribution.every((entry) => entry.labelsAgree) ? 'consistent' : 'conflict', note: 'Where script broadcast labels differ from forensic call labels, exact receipt hashes and emitted events/logs anchor the displayed observation.' },
      publicChainAuthentication: { status: 'not-established' },
      claimsSourceAuthority: { status: 'not-established' },
    },
    steps,
    attacks: {
      retained: duplicateReplays,
      isolatedTests: [{
        id: 'wrong-allocator-binding-unit-test', kind: allocatorAttack.classification,
        outcome: allocatorAttack.result, operation: allocatorAttack.case.testOperation,
        expectedRejection: allocatorAttack.expectedRejection,
        testName: allocatorAttack.testName, sourceRevision: allocatorAttack.sourceRevision,
        sourcePath: allocatorAttack.testSource.path, sourceSha256: allocatorAttack.testSource.sha256,
        sourceUrl: allocatorAttack.sourceUrl, command: allocatorAttack.command,
        preparedAllocator: allocatorAttack.case.preparedOperationAllocator,
        reserveBoundAllocator: allocatorAttack.case.reserveBoundAllocator,
        postcondition: allocatorAttack.postcondition,
        output: allocatorAttack.testOutput,
        evidencePath: '/evidence/protected-transfer-v1/negative-tests/allocator-substitution-foundry.json',
        evidenceSha256: hashes['negative-tests/allocator-substitution-foundry.json'],
        limitations: allocatorAttack.limitations,
      }],
      notCovered: [{ id: 'caller-selected-funding-destination', status: 'not-tested-in-primary-operation', note: 'The primary operation has no caller-selected destination-substitution test. A separate Foundry case covers a prepared-versus-reserve allocator mismatch.' }],
    },
    transactionAttribution: callAttribution,
    evidenceHashes: hashes,
    limitations: [
      'Local Anvil receipts are not independently authenticated public-chain state.',
      'The request source, beneficiary identities, token and authority are controlled local fixtures.',
      'A changed funding destination was not tested by this evidence bundle.',
      'Duplicate-claim attempts are read-only eth_call replays, not mined reverted transactions.',
      ...(callAttribution.some((entry) => !entry.labelsAgree) ? ['Some funding broadcast function labels differ from the forensic call labels; this projection binds by transaction hash, receipt context and emitted evidence, and retains the discrepancy for inspection.'] : []),
    ],
  }
  return { ...body, presentationDigest: sha256(Buffer.from(JSON.stringify(body))) }
}

function verifyBroadcast(label, run, expectedCount, signer) {
  assert.equal(run.chain, 31337, `${label}: chain ID`)
  assert.equal(run.transactions.length, expectedCount, `${label}: transaction count`)
  assert.equal(run.receipts.length, expectedCount, `${label}: receipt count`)
  const receipts = new Map(run.receipts.map((receipt) => [receipt.transactionHash.toLowerCase(), receipt]))
  for (const tx of run.transactions) {
    assert.equal(tx.transaction.from.toLowerCase(), signer.toLowerCase(), `${label}: signer`)
    assert.equal(Number(tx.transaction.chainId), 31337, `${label}: transaction chain`)
    const receipt = receipts.get(tx.hash.toLowerCase())
    assert.ok(receipt, `${label}: receipt for ${tx.hash}`)
    assert.equal(receipt.status, '0x1', `${label}: successful receipt`)
    assert.equal(receipt.transactionHash.toLowerCase(), tx.hash.toLowerCase(), `${label}: receipt hash`)
    assert.ok(receipt.blockNumber && receipt.blockHash, `${label}: block context`)
  }
}

function findFunction(run, name) {
  const tx = run.transactions.find((entry) => entry.function === name)
  assert.ok(tx, `missing transaction ${name}`)
  return tx
}

function receiptFor(run, hash) {
  const receipt = run.receipts.find((entry) => entry.transactionHash.toLowerCase() === hash.toLowerCase())
  assert.ok(receipt, `missing receipt ${hash}`)
  assert.equal(receipt.status, '0x1')
  return receipt
}

function matchForensicTransaction(run, forensicRecord) {
  const hash = forensicRecord.receipt.transactionHash.toLowerCase()
  const tx = run.transactions.find((entry) => entry.hash.toLowerCase() === hash)
  const receipt = receiptFor(run, hash)
  assert.ok(tx, `broadcast transaction for forensic hash ${hash}`)
  assert.equal(receipt.blockHash, forensicRecord.receipt.blockHash, 'forensic/broadcast block hash')
  assert.equal(receipt.blockNumber, forensicRecord.receipt.blockNumber, 'forensic/broadcast block number')
  assert.equal(receipt.status, '0x1')
  return { tx, receipt }
}

function findTransfer(receipt, token, from, to, amount) {
  const found = receipt.logs.map((log) => {
    if (log.address.toLowerCase() !== token.toLowerCase() || log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) return null
    return { tokenAddress: log.address.toLowerCase(), from: `0x${log.topics[1].slice(-40)}`.toLowerCase(), to: `0x${log.topics[2].slice(-40)}`.toLowerCase(), amount: BigInt(log.data), logIndex: log.logIndex }
  }).find((log) => log && log.from === from.toLowerCase() && log.to === to.toLowerCase() && log.amount === amount)
  assert.ok(found, `missing ERC-20 transfer ${from} → ${to} (${amount})`)
  return found
}

function txReference(tx, receipt) {
  return { hash: tx.hash, blockNumber: Number.parseInt(receipt.blockNumber, 16), blockHash: receipt.blockHash, transactionIndex: Number.parseInt(receipt.transactionIndex, 16), status: 'successful-local-receipt' }
}

function transferReference(transfer, receipt) {
  return { tokenAddress: transfer.tokenAddress, from: transfer.from, to: transfer.to, amount: Number(transfer.amount), transactionHash: receipt.transactionHash, blockNumber: Number.parseInt(receipt.blockNumber, 16), blockHash: receipt.blockHash, logIndex: Number.parseInt(transfer.logIndex, 16), status: 'observed-local-transfer-log' }
}

function refs(hashes, names) {
  return names.map((name) => ({ path: `/evidence/protected-transfer-v1/${name}`, sha256: hashes[name] }))
}

function sha256(bytes) { return `0x${createHash('sha256').update(bytes).digest('hex')}` }
