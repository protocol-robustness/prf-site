#!/usr/bin/env node
/** Independent integer-arithmetic reconstruction for the retained shortfall fixture.
 * This deliberately does not import or call the PRF allocator. It supports this
 * fixture's un-capped largest-remainder policy and fails closed on other policies.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = scriptDir.includes(`${join('public', 'evidence', 'shortfall')}`)
  ? resolve(scriptDir, '../../..')
  : resolve(scriptDir, '..')
const policyPath = join(root, 'public/evidence/shortfall/policy-inputs.v1.json')
const artifactPath = join(root, 'generated/demos/liquidity-shortfall.json')
const outputPath = join(root, 'generated/verification/liquidity-shortfall-policy-verification.json')
const publicReportPath = join(root, 'public/evidence/shortfall/independent-verification.v1.json')
const manifestPath = join(root, 'public/evidence/manifests/liquidity-shortfall.v1.json')
const policy = JSON.parse(readFileSync(policyPath, 'utf8'))
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
const fail = (message) => { throw new Error(`shortfall policy verification: ${message}`) }

const bytes = (...parts) => Buffer.concat(parts.map((part) => Buffer.from(part)))
const varuint = (value) => {
  let n = BigInt(value)
  const out = []
  do {
    const low = Number(n & 127n)
    n >>= 7n
    out.push(n === 0n ? low : low | 128)
  } while (n !== 0n)
  return Buffer.from(out)
}
const keyword = (value) => ({ keyword: value })
const canonicalBytes = (value) => {
  if (value === null) return Buffer.from([0x00])
  if (value === false) return Buffer.from([0x01])
  if (value === true) return Buffer.from([0x02])
  if (typeof value === 'bigint' || Number.isSafeInteger(value)) {
    const integer = BigInt(value)
    const zigzag = integer < 0n ? (-2n * integer) - 1n : 2n * integer
    return bytes([0x10], varuint(zigzag))
  }
  if (typeof value === 'string' || value?.keyword) {
    const tag = value?.keyword ? 0x22 : 0x20
    const encoded = Buffer.from(value?.keyword ?? value, 'utf8')
    return bytes([tag], varuint(encoded.length), encoded)
  }
  if (Array.isArray(value)) return bytes([0x30], varuint(value.length), ...value.map(canonicalBytes))
  if (value instanceof Map) {
    const entries = [...value.entries()].map(([key, item]) => [canonicalBytes(key), canonicalBytes(item)])
    entries.sort(([a], [b]) => Buffer.compare(a, b))
    return bytes([0x31], varuint(entries.length), ...entries.flat())
  }
  fail(`unsupported canonical value: ${String(value)}`)
}
const domainHash = (domain, value) => createHash('sha256').update(bytes(Buffer.from(domain, 'utf8'), canonicalBytes(value))).digest('hex')

function independentlyDerivedRequestHash(input, request) {
  const rows = [...input.rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  const canonicalRequest = new Map([
    [keyword('schema-version'), request.schema_version],
    [keyword('mechanism/version'), request.mechanism_version],
    [keyword('allocation/id'), keyword(request.allocation_id)],
    [keyword('available'), input.available],
    [keyword('rows'), rows.map((row) => new Map([
      [keyword('row/id'), keyword(row.id)],
      [keyword('obligation/id'), null],
      [keyword('requested'), row.requested],
      [keyword('weight'), row.weight],
      [keyword('cap'), row.cap]
    ]))],
    [keyword('rounding-policy'), keyword(request.rounding_policy)],
    [keyword('tie-break-policy'), keyword(request.tie_break_policy)],
    [keyword('redistribution-policy'), keyword(request.redistribution_policy)]
  ])
  const wrapper = new Map([
    [keyword('intent'), keyword('projection-artifact')],
    [keyword('artifact'), canonicalRequest]
  ])
  return domainHash('PROJECTION_ARTIFACT_V1', wrapper)
}

if (policy.schema !== 'prf-shortfall-policy-inputs.v1') fail('unsupported policy input schema')
if (policy.policy.rounding !== 'largest-remainder' || policy.policy.tie_break !== 'canonical-row-id ascending' || policy.policy.residual !== 'unallocated' || policy.policy.caps !== 'none declared') fail('policy is outside this verifier’s supported scope')
const computedRequestHash = independentlyDerivedRequestHash(policy.input, policy.canonical_request)
if (computedRequestHash !== policy.binding.request_hash) fail(`independently derived canonical request hash mismatch (computed ${computedRequestHash})`)
if (policy.canonical_request.rounding_policy !== policy.policy.rounding || policy.canonical_request.tie_break_policy !== 'canonical-row-id' || policy.canonical_request.redistribution_policy !== policy.policy.residual) fail('policy summary differs from canonical request')
if (policy.binding.request_hash !== artifact.evidence['request-hash'] || policy.binding.allocation_hash !== artifact.evidence['committed-hash']) fail('policy input roots do not match the retained allocation artifact')
if (policy.input.rows.length !== artifact.scenario.requests.length) fail('request row count mismatch')
if (policy.input.available !== artifact.scenario.pool.available) fail('available liquidity mismatch')
if (policy.input.requested_total !== artifact.scenario.pool.requested) fail('total request mismatch')

const rows = policy.input.rows
const ids = new Set()
for (const row of rows) {
  if (ids.has(row.id)) fail(`duplicate row id: ${row.id}`)
  if (!/^[a-z0-9-]+$/.test(row.id)) fail(`row id is outside the verifier's canonical ASCII identity scope: ${row.id}`)
  ids.add(row.id)
  if (!Number.isSafeInteger(row.requested) || !Number.isSafeInteger(row.weight) || row.requested < 0 || row.weight < 0) fail(`invalid integer request/weight for ${row.id}`)
  if (row.cap !== null) fail(`caps are not supported by this fixture verifier (${row.id})`)
  if (row.weight !== row.requested) fail(`fixture weights do not equal requested amounts for ${row.id}`)
}
const totalWeight = rows.reduce((sum, row) => sum + BigInt(row.weight), 0n)
const available = BigInt(policy.input.available)
if (totalWeight === 0n || available > totalWeight) fail('fixture outside supported scarcity domain')

const quotas = rows.map((row) => {
  const numerator = available * BigInt(row.weight)
  return { id: row.id, floor: numerator / totalWeight, remainder: numerator % totalWeight }
})
const artifactRows = new Map(artifact.scenario.requests.map((row) => [row.id, row]))
for (const row of rows) {
  const artifactRow = artifactRows.get(row.id)
  if (!artifactRow || artifactRow.requested !== row.requested) fail(`input request mismatch for ${row.id}`)
}
let unitsLeft = available - quotas.reduce((sum, row) => sum + row.floor, 0n)
const ranked = [...quotas].sort((a, b) => a.remainder === b.remainder ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : (a.remainder > b.remainder ? -1 : 1))
const bonus = new Set()
for (const row of ranked) {
  if (unitsLeft === 0n) break
  bonus.add(row.id)
  unitsLeft -= 1n
}
if (unitsLeft !== 0n) fail('largest-remainder units could not be assigned')
const expected = new Map(quotas.map((row) => [row.id, row.floor + (bonus.has(row.id) ? 1n : 0n)]))
const outputRows = artifact.scenario.requests.map((row) => {
  const expectedAmount = expected.get(row.id)
  if (expectedAmount === undefined) fail(`missing canonical request for ${row.id}`)
  const result = Number(expectedAmount)
  return { claimant: row.id, expected_allocation: result, artifact_allocation: row.allocated, cap_check: 'pass · no cap declared', verdict: result === row.allocated ? 'pass' : 'fail' }
})
if (outputRows.some((row) => row.verdict !== 'pass')) fail('recipient-level policy mismatch')
if (rows.reduce((sum, row) => sum + BigInt(row.requested), 0n) !== BigInt(policy.input.requested_total)) fail('requested total mismatch')
const totalAllocated = outputRows.reduce((sum, row) => sum + row.expected_allocation, 0)
const residual = policy.input.available - totalAllocated
if (totalAllocated !== artifact.allocation['total-allocated'] || residual !== artifact.allocation['unallocated-residual']) fail('allocation total or unallocated residual mismatch')
const hasRoundingDust = quotas.some((row) => row.remainder !== 0n)

const report = {
  schema: 'prf-shortfall-independent-verification.v1',
  method: 'Separate JavaScript BigInt Hare-quota / largest-remainder reconstruction; no PRF allocator import or invocation.',
  input_sha256: createHash('sha256').update(readFileSync(policyPath)).digest('hex'),
  source_file_sha256: policy.source.sha256,
  request_hash: policy.binding.request_hash,
  allocation_hash: policy.binding.allocation_hash,
  policy: policy.policy,
  rows: outputRows,
  checks: [
    { id: 'canonical-request-hash', status: 'pass' },
    { id: 'recipient-policy-reconstruction', status: 'pass' },
    { id: 'largest-remainder-arithmetic', status: 'pass', dust_units: Number(available - quotas.reduce((sum, row) => sum + row.floor, 0n)) },
    { id: 'canonical-tie-break', status: hasRoundingDust ? 'pass' : 'not-exercised' },
    { id: 'caps-none-declared', status: 'pass' },
    { id: 'residual-unallocated', status: residual === 0 ? 'pass' : 'fail', residual },
    { id: 'aggregate-conservation', status: totalAllocated === policy.input.available ? 'pass' : 'fail', allocated: totalAllocated, available: policy.input.available }
  ],
  verdict: 'pass',
  limitations: [
    'This independent verifier covers the published no-cap, largest-remainder fixture only.',
    'The source revision is not retained; the cited PRF scenario file is identified by SHA-256.',
    'Policy compliance does not establish that the policy is fair, complete or appropriate.',
    'Calculated allocations do not establish observed recipient payments.'
  ]
}
if (report.checks.some((check) => check.status === 'fail')) fail('one or more verification checks failed')
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(report)}\n`)
writeFileSync(publicReportPath, `${JSON.stringify(report)}\n`)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
for (const entry of [...manifest.inputs, ...manifest.retained_evidence]) {
  const relative = entry.path.startsWith('evidence/') ? join('public', entry.path) : entry.path
  const actual = createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
  if (actual !== entry.sha256) fail(`manifest hash mismatch for ${entry.path}`)
}
const declaredRows = manifest.expected_outputs
for (const row of outputRows) {
  if (declaredRows[row.claimant] !== row.expected_allocation) fail(`manifest expected output mismatch for ${row.claimant}`)
}
if (declaredRows.total_allocated !== totalAllocated || declaredRows.unallocated_residual !== residual || declaredRows.request_hash !== report.request_hash || declaredRows.allocation_hash !== report.allocation_hash) fail('manifest aggregate outputs or roots mismatch')
const declaredVerifier = manifest.retained_evidence.find((entry) => entry.role === 'separate integer-arithmetic verifier source')
const runningVerifierHash = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex')
if (!declaredVerifier || declaredVerifier.sha256 !== runningVerifierHash) fail('manifest does not bind the verifier source that was executed')
console.log(`shortfall policy verification PASS: ${outputRows.length} recipients; request ${report.request_hash}; allocation ${report.allocation_hash}`)
