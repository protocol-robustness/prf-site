import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildShortfallDossier } from './lib/shortfall-dossier.mjs'

const siteRoot = new URL('..', import.meta.url).pathname
const publicRoot = join(siteRoot, 'public')
const fixturePaths = [
  'evidence/manifests/composed-pro-rata-v2-settlement.publication.json',
  'evidence/composed-pro-rata-v2-settlement/manifest.json',
  'evidence/composed-pro-rata-v2-settlement/manifest.sha256',
  'evidence/composed-pro-rata-v2-settlement/validation-result.json',
  'evidence/composed-pro-rata-v2-settlement/accounting-states.json',
  'evidence/composed-pro-rata-v2-settlement/transfers.json',
  'evidence/composed-pro-rata-v2-settlement/source-witness.json',
  'evidence/composed-pro-rata-v2-settlement/clojure-replay.json',
  'evidence/composed-pro-rata-v2-settlement/rust-replay.json',
  'evidence/composed-pro-rata-v2-settlement/prf-v3-live-context-manifest.json',
  'evidence/composed-pro-rata-v2-settlement/full-stage2-qualification.log',
  'evidence/composed-pro-rata-v2-settlement/execution.log',
  'evidence/partial-fill/v3-live-context/proof.json',
  'evidence/partial-fill/v3-live-context/funding-observation.json',
  'evidence/partial-fill/v3-live-context/genesis-context.json',
]

function makePublicCopy() {
  const directory = mkdtempSync(join(tmpdir(), 'shortfall-dossier-'))
  const copy = join(directory, 'public')
  for (const path of fixturePaths) {
    const source = join(publicRoot, path)
    const target = join(copy, path)
    mkdirSync(join(target, '..'), { recursive: true })
    cpSync(source, target)
  }
  return { directory, publicRoot: copy }
}

function mutateJson(publicRoot, path, change) {
  const target = join(publicRoot, path)
  const value = JSON.parse(readFileSync(target, 'utf8'))
  change(value)
  writeFileSync(target, JSON.stringify(value))
}

function mutateIdentityLog(publicRoot, change) {
  const target = join(publicRoot, 'evidence/composed-pro-rata-v2-settlement/execution.log')
  const text = readFileSync(target, 'utf8')
  const record = text.match(/^(.*PARTIAL_FILL_V3_IDENTITY_JSON\s+)(\{.*\})$/m)
  assert(record, 'fixture identity record missing')
  const identity = JSON.parse(record[2])
  change(identity)
  writeFileSync(target, text.replace(record[0], `${record[1]}${JSON.stringify(identity)}`))
}

function resealManifestAndPublicationPin(publicRoot, path) {
  const manifestPath = join(publicRoot, 'evidence/composed-pro-rata-v2-settlement/manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entry = manifest.files.find((file) => file.path === path)
  assert(entry, `manifest file entry missing: ${path}`)
  const fileBytes = readFileSync(join(publicRoot, path))
  entry.sha256 = createHash('sha256').update(fileBytes).digest('hex')
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`
  writeFileSync(manifestPath, manifestBytes)
  const manifestHash = createHash('sha256').update(manifestBytes).digest('hex')
  writeFileSync(join(publicRoot, 'evidence/composed-pro-rata-v2-settlement/manifest.sha256'), `${manifestHash}  manifest.json\n`)
  const pinPath = join(publicRoot, 'evidence/manifests/composed-pro-rata-v2-settlement.publication.json')
  const pin = JSON.parse(readFileSync(pinPath, 'utf8'))
  pin.manifestSha256 = manifestHash
  writeFileSync(pinPath, `${JSON.stringify(pin, null, 2)}\n`)
}

function resealWholeBundle(publicRoot) {
  const manifestPath = join(publicRoot, 'evidence/composed-pro-rata-v2-settlement/manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  for (const path of ['evidence/composed-pro-rata-v2-settlement/execution.log',
    'evidence/composed-pro-rata-v2-settlement/validation-result.json']) {
    const entry = manifest.files.find((file) => file.path === path)
    assert(entry, `manifest file entry missing: ${path}`)
    entry.sha256 = createHash('sha256').update(readFileSync(join(publicRoot, path))).digest('hex')
  }
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`
  writeFileSync(manifestPath, manifestBytes)
  const manifestHash = createHash('sha256').update(manifestBytes).digest('hex')
  writeFileSync(join(publicRoot, 'evidence/composed-pro-rata-v2-settlement/manifest.sha256'), `${manifestHash}  manifest.json\n`)
  const pinPath = join(publicRoot, 'evidence/manifests/composed-pro-rata-v2-settlement.publication.json')
  const pin = JSON.parse(readFileSync(pinPath, 'utf8'))
  pin.manifestSha256 = manifestHash
  pin.validatedProjectionSha256 = createHash('sha256')
    .update(readFileSync(join(publicRoot, 'evidence/composed-pro-rata-v2-settlement/validation-result.json')))
    .digest('hex')
  writeFileSync(pinPath, `${JSON.stringify(pin, null, 2)}\n`)
}

test('reconstructs pinned operation, all eight custody observations and liability closure', () => {
  const dossier = buildShortfallDossier(publicRoot)
  assert.equal(dossier.economicLedger.transitions.length, 8)
  assert.deepEqual(dossier.economicLedger.transitions.map(({ transferRefs }) => transferRefs.length), [1, 0, 1, 0, 1, 1, 1, 1])
  assert.equal(dossier.economicLedger.assetConservation.terminal, 80)
  assert.equal(dossier.economicLedger.obligations.paidClaims, 70)
  assert.equal(dossier.economicLedger.obligations.remainingClaimLiability, 0)
    assert.equal(new Set(dossier.economicLedger.transitions.map(({ projectionRecordSha256 }) => projectionRecordSha256)).size, 8)
    assert(dossier.economicLedger.transitions.every(({ evidenceRefs }) =>
      evidenceRefs.some(({ kind, sha256 }) => kind === 'state-observation' && /^[0-9a-f]{64}$/.test(sha256))
      && evidenceRefs.some(({ kind, sha256 }) => kind === 'validated-state-projection' && /^[0-9a-f]{64}$/.test(sha256))))
  assert.equal(dossier.sourceBuildRuntime.contractBindings.length, 10)
  assert.equal(dossier.sourceBuildRuntime.contractBindings.filter(({ sourceFile }) => sourceFile).length, 9)
  assert.equal(dossier.recovery.processInterruptionAndResume, 'not-demonstrated')
  assert.equal(dossier.scale.supportedMaximum, null)
  assert.equal(dossier.subject.manifestBaseAndPublicationRevisionMatch, false)
})

test('rejects a substituted publication manifest even if its contents parse', () => {
  const fixture = makePublicCopy()
  try {
    mutateJson(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/manifest.json', (manifest) => {
      manifest.operation.id = `0x${'a'.repeat(64)}`
    })
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /manifest is not the published pinned manifest/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects a proof prepared-operation substitution', () => {
  const fixture = makePublicCopy()
  try {
    mutateJson(fixture.publicRoot, 'evidence/partial-fill/v3-live-context/proof.json', (proof) => {
      proof.public_values = `0x${'ab'.repeat(288)}`
    })
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /proof fixture digest differs/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects a changed state snapshot that no longer reconciles to transfers', () => {
  const fixture = makePublicCopy()
  try {
    mutateJson(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/accounting-states.json', (states) => {
      states.states[4].observation.aliceBalance += 1
    })
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /observation differs from validated projection/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects a changed transfer amount against state projections', () => {
  const fixture = makePublicCopy()
  try {
    mutateJson(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/transfers.json', (transfers) => {
      transfers[1].amount = 34
    })
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /no retained transfer sequence reconciles|transfer delta differs from observations/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects missing opening-funding evidence', () => {
  const fixture = makePublicCopy()
  try {
    rmSync(join(fixture.publicRoot, 'evidence/partial-fill/v3-live-context/funding-observation.json'))
    assert.throws(() => buildShortfallDossier(fixture.publicRoot))
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects an operation id inconsistent with the prepared witness', () => {
  const fixture = makePublicCopy()
  try {
    mutateJson(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/source-witness.json', (witness) => {
      witness['prepared-operation']['operation-id'] = `0x${'c'.repeat(64)}`
    })
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /witness operation identity mismatch/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects an observation from the wrong chain', () => {
  const fixture = makePublicCopy()
  try {
    mutateIdentityLog(fixture.publicRoot, (identity) => { identity.chainId = '84532' })
    resealManifestAndPublicationPin(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/execution.log')
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /another chain/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('rejects a substituted deployed runtime identity', () => {
  const fixture = makePublicCopy()
  try {
    mutateIdentityLog(fixture.publicRoot, (identity) => { identity.reserveCodeHash = `0x${'d'.repeat(64)}` })
    resealManifestAndPublicationPin(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/execution.log')
    assert.throws(() => buildShortfallDossier(fixture.publicRoot), /deployed runtime identity mismatch/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})

test('requires an independently retained publication pin to reject a fully re-pinned bundle substitution', () => {
  const fixture = makePublicCopy()
  try {
    const trustedPin = JSON.parse(readFileSync(join(fixture.publicRoot,
      'evidence/manifests/composed-pro-rata-v2-settlement.publication.json'), 'utf8'))
    mutateIdentityLog(fixture.publicRoot, (identity) => { identity.reserveCodeHash = `0x${'e'.repeat(64)}` })
    mutateJson(fixture.publicRoot, 'evidence/composed-pro-rata-v2-settlement/validation-result.json', (projection) => {
      projection.deployedContractIdentities.reserve.codeHash = `0x${'e'.repeat(64)}`
    })
    resealWholeBundle(fixture.publicRoot)

    const internallyPinned = buildShortfallDossier(fixture.publicRoot)
    assert.equal(internallyPinned.sourceBuildRuntime.deploymentRuntimePairs.reserve.codeHash, `0x${'e'.repeat(64)}`)
    assert.throws(() => buildShortfallDossier(fixture.publicRoot, trustedPin), /manifest is not the published pinned manifest/)
  } finally { rmSync(fixture.directory, { recursive: true, force: true }) }
})
