#!/usr/bin/env node
// Publication integrity only. Contract/proof validation remains owned by the
// pinned PRF/prf-evm validators; this checker does not derive economic roots.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyShortfallDossier } from './lib/shortfall-dossier.mjs'

const args = process.argv.slice(2)
assert(args.length === 0 || (args.length === 1 && args[0] === '--export'),
  'usage: node scripts/verify-shortfall-flagship.mjs [--export]')
const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicRoot = join(root, 'public')
const bundle = join(publicRoot, 'evidence/composed-pro-rata-v2-settlement')
const bytes = (path) => readFileSync(path)
const json = (path) => JSON.parse(bytes(path).toString('utf8'))
const digest = (value) => createHash('sha256').update(value).digest('hex')
const pin = json(join(publicRoot, 'evidence/manifests/composed-pro-rata-v2-settlement.publication.json'))
const manifestPath = join(bundle, 'manifest.json')
const projectionPath = join(bundle, 'validation-result.json')
const manifest = json(manifestPath)
const projection = json(projectionPath)
const proofPath = join(publicRoot, 'evidence/partial-fill/v3-live-context/proof.json')
const proof = json(proofPath)
const forensicDossier = verifyShortfallDossier(publicRoot).dossier

assert.equal(digest(bytes(manifestPath)), pin.manifestSha256, 'flagship manifest differs from publication pin')
assert.equal(digest(bytes(projectionPath)), pin.validatedProjectionSha256, 'flagship projection differs from publication pin')
assert.equal(digest(bytes(proofPath)), manifest.proofIdentity.proofFixtureSha256, 'linked proof is not the exact flagship proof')
assert.equal(digest(bytes(join(bundle, 'source-witness.json'))), manifest.proofIdentity.sourceWitnessSha256.replace(/^0x/, ''), 'witness digest mismatch')
assert.equal(projection.status, 'PASS', 'published fixture validator did not pass')
assert.equal(projection.operationId, manifest.operation.id, 'operation substitution')
assert.equal(projection.preparedOperationRoot, manifest.operation.preparedOperationRoot, 'prepared-operation substitution')
assert.equal(projection.reserveStateCommitment, manifest.operation.reserveStateCommitment, 'reserve substitution')
assert.equal(proof.program_id, manifest.proofIdentity.programId, 'program substitution')
assert.equal(proof.proof_system, 'groth16', 'on-chain fixture must be Groth16')
assert.equal(proof.vkey, manifest.proofIdentity.vkey, 'VKey substitution')
assert.equal(proof.elf_sha256, manifest.proofIdentity.elfSha256, 'ELF substitution')
assert.equal(proof.public_values_schema, manifest.proofIdentity.publicValuesSchema, 'schema substitution')
assert.equal(proof.public_values_length, 288, 'wrong declared public-values length')
assert.match(proof.public_values, /^0x[0-9a-fA-F]{576}$/, 'public values must be exactly 288 bytes')
assert.equal(proof.public_values.slice(2, 66), '876f2aea9124d79f41dbdd389d498430987fa33bbb34408989849c478a7c2bde', 'schema word mismatch')
assert.equal(`0x${proof.public_values.slice(66, 130)}`, manifest.operation.preparedOperationRoot, 'public prepared root mismatch')
assert.equal(`0x${proof.public_values.slice(130, 194)}`, manifest.operation.reserveStateCommitment, 'public reserve root mismatch')
assert.equal(pin.qualification.publicChainExecution, false, 'local fixture cannot establish public execution')
assert.equal(pin.qualification.minedPublicReceipts, false, 'local fixture cannot establish mined receipts')
assert.equal(pin.qualification.externalRequestAuthentication, false, 'external request authority remains unqualified')
assert.equal(pin.qualification.externalAuthorityAuthentication, false, 'fixture authority remains local')

// Match the published runtime inventory to the retained, hash-pinned identity
// observation. This authenticates the publication cross-link, not live code.
const identityKeys = ['token', 'reserve', 'allocator', 'preparedController', 'assurance',
  'ratification', 'admission', 'registry', 'adapter', 'verifier']
assert.deepEqual(Object.keys(projection.deployedContractIdentities).sort(), [...identityKeys].sort(),
  'unexpected runtime inventory; evidence coverage must be reviewed explicitly')
const executionPath = join(bundle, 'execution.log')
const executionEntry = manifest.files.find(({ path }) => path === 'evidence/composed-pro-rata-v2-settlement/execution.log')
assert(executionEntry, 'missing pinned execution-log identity')
assert.equal(digest(bytes(executionPath)), executionEntry.sha256, 'execution log differs from pinned manifest')
const identityRecords = [...bytes(executionPath).toString('utf8').matchAll(/^.*PARTIAL_FILL_V3_IDENTITY_JSON\s+(\{.*\})\s*$/gm)]
assert.equal(identityRecords.length, 1, 'missing or ambiguous deployed-identity observation')
const observed = JSON.parse(identityRecords[0][1])
assert.equal(observed.chainId, '31337', 'recorded local chain mismatch')
const witness = json(join(bundle, 'source-witness.json'))
assert.equal(witness['prepared-operation']['chain-id'], observed.chainId, 'prepared chain mismatch')
for (const key of identityKeys) {
  const identity = projection.deployedContractIdentities[key]
  assert.match(identity.address, /^0x[0-9a-fA-F]{40}$/, `malformed deployed address: ${key}`)
  assert.notEqual(identity.address.toLowerCase(), `0x${'0'.repeat(40)}`, `zero deployed address: ${key}`)
  assert.match(identity.codeHash, /^0x[0-9a-fA-F]{64}$/, `malformed runtime hash: ${key}`)
  assert.notEqual(identity.codeHash.toLowerCase(), `0x${'0'.repeat(64)}`, `zero runtime hash: ${key}`)
  assert.equal(identity.address.toLowerCase(), observed[key]?.toLowerCase(), `substituted deployed address: ${key}`)
  assert.equal(identity.codeHash.toLowerCase(), observed[`${key}CodeHash`]?.toLowerCase(), `substituted runtime hash: ${key}`)
}
for (const key of ['reserve', 'allocator', 'token']) {
  assert.equal(witness['prepared-operation'][key].toLowerCase(), projection.deployedContractIdentities[key].address.toLowerCase(),
    `prepared operation uses another ${key}`)
}
for (const key of ['operationId', 'preparedOperationRoot', 'configurationRoot', 'verifierRegistryRoot']) {
  const expected = key === 'operationId' ? manifest.operation.id : manifest.operation[key]
  assert.equal(observed[key], expected, `deployment operation/configuration context mismatch: ${key}`)
}
assert.equal(observed.programId, proof.program_id, 'deployed program mismatch')
assert.equal(observed.vkey, proof.vkey, 'deployed VKey mismatch')
assert.equal(observed.elfSha256, proof.elf_sha256, 'deployed ELF mismatch')

// A new link must not silently point at a different operation or absent artifact.
const page = readFileSync(join(root, 'app/demos/composed-pro-rata-settlement/page.tsx'), 'utf8')
assert(page.includes("const proofHref = '/evidence/partial-fill/v3-live-context/proof.json'"), 'flagship must link the checked proof')
for (const filename of ['manifest.json', 'manifest.sha256', 'validation-result.json', 'README.md', 'source-witness.json',
  'clojure-replay.json', 'rust-replay.json', 'execution.log', 'adversarial-tests.log', 'full-stage2-qualification.log',
  'accounting-states.json', 'accounting-journal.json', 'reconciliation.json', 'transfers.json', 'prf-v3-live-context-manifest.json']) {
  assert(existsSync(join(bundle, filename)), `missing linked evidence: ${filename}`)
}
for (const slug of ['composed-pro-rata-v2-settlement', 'pro-rata-allocation-result',
  'ef-demo-pro-rata-allocation', 'yield-shortfall-partial-withdrawal-fills']) {
  assert(existsSync(join(publicRoot, 'notebooks', slug, 'index.html')), `missing notebook: ${slug}`)
}
assert.equal(digest(bytes(join(publicRoot, 'notebooks/composed-pro-rata-v2-settlement/index.html'))),
  pin.publishedNotebookHtmlSha256, 'settlement notebook differs from publication pin')

let checkedLinks = 0
if (args[0] === '--export') {
  const exportRoot = join(root, 'out')
  for (const route of ['', 'demos', 'demos/composed-pro-rata-settlement']) {
    const path = join(exportRoot, route, 'index.html')
    const html = readFileSync(path, 'utf8')
    if (route === 'demos/composed-pro-rata-settlement') {
      const deployedRows = [...html.matchAll(/<tr\b[^>]*data-deployed-dependency="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)]
      assert.deepEqual(deployedRows.map(([, key]) => key).sort(), [...identityKeys].sort(),
        'deployed dependency explorer must retain all recorded identity pairs')
      for (const [, key, body] of deployedRows) {
        const identity = projection.deployedContractIdentities[key]
        assert(body.includes(identity.address) && body.includes(identity.codeHash),
          `rendered deployment identity differs from retained inventory: ${key}`)
      }
      const stages = [...html.matchAll(/<li\b[^>]*data-evidence-stage="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)]
      assert.deepEqual(stages.map(([, id]) => id),
        ['source', 'allocation', 'admission', 'ratification', 'funding', 'activation', 'withdrawal', 'closure'],
        'the execution must retain its complete ordered forensic evidence trail')
      for (const [, id, body] of stages) {
        assert(body.includes('Forensic check:'), `missing forensic check at stage ${id}`)
        assert(/href="\/evidence\//.test(body), `missing direct evidence link at stage ${id}`)
      }
      const ledgerStages = [...html.matchAll(/<tr\b[^>]*data-dossier-stage="([^"]+)"[^>]*>/g)].map(([, id]) => id)
      assert.deepEqual(ledgerStages, forensicDossier.economicLedger.transitions.map(({ stage }) => stage),
        'rendered forensic ledger differs from independently reconstructed report')
      const ledgerRecords = [...html.matchAll(/<tr\b[^>]*data-dossier-record="([0-9a-f]{64})"[^>]*>/g)].map(([, id]) => id)
      assert.deepEqual(ledgerRecords, forensicDossier.economicLedger.transitions.map(({ projectionRecordSha256 }) => projectionRecordSha256),
        'rendered transition record identities differ from independently reconstructed report')
      assert(forensicDossier.economicLedger.transitions.every(({ evidenceRefs, transferRefs }) =>
        evidenceRefs.some(({ kind }) => kind === 'state-observation')
        && evidenceRefs.some(({ kind }) => kind === 'validated-state-projection')
        && (transferRefs.length === 0 || evidenceRefs.some(({ kind }) => kind === 'asset-transfer-observation'))),
      'each economic transition must bind state, validated projection and any observed asset transfer')
      const typedGapRows = [...html.matchAll(/<li\b[^>]*data-dossier-gap="([^"]+)"[^>]*>/g)].map(([, type]) => type)
      assert.deepEqual(typedGapRows, forensicDossier.gaps.map(({ type }) => type),
        'rendered typed gaps differ from the machine-readable dossier')
      assert(html.includes('href="/evidence/reports/composed-pro-rata-v2-forensic-dossier.v1.json"'),
        'machine-readable forensic dossier link is missing from the export')
      assert(html.includes('Source/build/runtime closure'), 'source/build/runtime gap must be visible')
      assert(html.includes('Crash recovery') && html.includes('Scale envelope'), 'recovery and scale gaps must be visible')
      assert((html.match(/aria-label="Evidence and forensic checks"/g) ?? []).length >= 5,
        'evidence checkpoints must accompany the source, calculation, selected custody stage, closure and components')
    }
    for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
      if (!href.startsWith('/') && !href.startsWith('#')) continue
      // These pre-existing global links are served by the notebook distribution,
      // outside the Next static export. They are not new flagship evidence links.
      if (/^\/(?:lab|shots)\//.test(href)) continue
      const url = new URL(href, `https://static.invalid/${route ? `${route}/` : ''}`)
      const localPath = join(exportRoot, decodeURIComponent(url.pathname))
      assert(existsSync(localPath), `missing exported link from /${route}: ${href}`)
      const target = statSync(localPath).isDirectory() ? join(localPath, 'index.html') : localPath
      assert(existsSync(target), `missing exported route: ${href}`)
      if (url.hash) {
        const targetHtml = readFileSync(target, 'utf8')
        const ids = new Set([...targetHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]))
        assert(ids.has(decodeURIComponent(url.hash.slice(1))), `missing anchor: ${href}`)
      }
      checkedLinks += 1
    }
  }
}
console.log(`shortfall flagship publication integrity PASS: ${proof.program_id}; 288 bytes; 10 deployed identities matched to pinned log; exact proof ${manifest.proofIdentity.proofFixtureSha256}${checkedLinks ? `; ${checkedLinks} exported links checked` : ''}`)
console.log('Scope: retained local evidence integrity; no new cryptographic or chain verification.')
