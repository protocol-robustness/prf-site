#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const evidence = join(root, 'public/evidence/canonical-comparison')
const failures = []
const read = (name) => JSON.parse(readFileSync(join(evidence, name), 'utf8'))
const canonical = read('canonical-v1.json')
const proRata = read('pro-rata-v1.json')
const manifest = read('canonical-comparison.v1.json')
const fail = (message) => failures.push(message)
const cases = new Map(canonical.cases.map((entry) => [entry.id, entry]))
const primary = proRata.chains.find((entry) => entry.id === manifest.fixtures.proRata.case)

if (!primary) fail('missing primary pro-rata fixture')
const mapAb = cases.get('map-ab')
const mapBa = cases.get('map-ba')
if (!mapAb || !mapBa) fail('missing map-ab/map-ba frozen vectors')
else if (mapAb.canonicalByteHex !== mapBa.canonicalByteHex) fail('map order vectors do not have identical canonical bytes')
if (!primary) {
  // Keep the remaining checks safe while reporting the missing fixture.
} else {
  if (primary.context.available !== manifest.fixtures.proRata.available) fail('available amount differs from manifest')
  const claims = Object.fromEntries(primary.claims.map((claim) => [claim.id, claim.requested]))
  if (JSON.stringify(claims) !== JSON.stringify(manifest.fixtures.proRata.requests)) fail('claim requests differ from manifest')
  const result = primary.artifacts.result
  const rowsEntry = result.projection.value.find((entry) => entry.key.value === 'allocation-result/rows')
  const rows = rowsEntry.value.value.map((row) => Object.fromEntries(row.value.map((entry) => [entry.key.value, entry.value.value])))
  const allocations = Object.fromEntries(rows.map((row) => [row['claim/id'], String(row.allocated)]))
  const expectedAllocations = manifest.fixtures.proRata.calculatedAllocations
  if (Object.keys(expectedAllocations).some((id) => allocations[id] !== expectedAllocations[id]) || Object.keys(allocations).length !== Object.keys(expectedAllocations).length) fail('calculated allocation values differ from manifest')
  if (result.domain !== manifest.fixtures.proRata.result.domain || result.root !== manifest.fixtures.proRata.result.root) fail('result domain/root differs from manifest')
  if (!/^[0-9a-f]+$/.test(result.canonicalByteHex)) fail('result canonical bytes are missing or malformed')
  if (result.root === primary.artifacts.claims[0].root) fail('claim and result roots unexpectedly match')
}
if (manifest.verification.clojure.status !== 'pass' || manifest.verification.rust.status !== 'pass') fail('both implementation verification records must remain explicit')
for (const name of ['canonical-v1.json', 'pro-rata-v1.json', 'conformance-manifest-v1.json', 'CANONICAL_ABI_V1.md', 'clojure-reproduce.clj']) {
  try { readFileSync(join(evidence, name)) } catch { fail(`missing downloadable evidence: ${name}`) }
}
if (failures.length) {
  console.error('verify-canonical-comparison FAILED:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log('verify-canonical-comparison OK: map-order bytes, pro-rata outputs, roots and downloadable evidence match the retained fixtures')
