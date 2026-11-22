#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { createHash, createPublicKey, verify } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'public/evidence/partial-fill/accounting-review')
const bytes = name => readFileSync(join(dir, name))
const read = name => JSON.parse(bytes(name).toString('utf8'))
const sha = value => createHash('sha256').update(value).digest('hex')
const binding = JSON.parse(readFileSync(join(root, 'generated/verification/accounting-review.v1.json'), 'utf8'))
assert.equal(sha(bytes('manifest.json')), binding.bundleManifestSha256, 'published bundle must match the checked-in site pin')
const manifest = read('manifest.json')
assert.equal(manifest.schema, 'eae.accounting-review-manifest.v1')
for (const [name, entry] of Object.entries(manifest.files)) {
  assert.match(name, /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/)
  assert(!name.includes('..'))
  const content = bytes(name)
  assert.equal(content.length, entry.bytes, name)
  assert.equal(`sha256:${sha(content)}`, entry.sha256, name)
}
const summary = read('summary.json')
assert.deepEqual(summary, binding.summary)
assert.equal(summary.localOnly, true)
assert.equal(summary.publicChain, false)
assert.equal(summary.capitalAuthority, false)
assert.equal(summary.simulationCreatesRecords, false)
assert.equal(summary.sourceManifest, manifest.sourceManifest)
assert(summary.limitations.includes('external-beneficial-ownership-unverified'))
assert(summary.limitations.includes('outside-obligation-completeness-unverified'))

const preimages = new Map()
for (const item of read('canonical-preimages.json')) {
  assert(!preimages.has(item.root))
  assert.match(item.hex, /^(?:[a-f0-9]{2})+$/)
  const input = Buffer.from(item.hex, 'hex')
  assert(input.subarray(0, Buffer.byteLength(item.schema)).equals(Buffer.from(item.schema)))
  assert.equal(`sha256:${sha(input)}`, item.root)
  preimages.set(item.root, item)
}
for (const [key, values] of [['A', [35, 21, 14]], ['B', [40, 24, 16]], ['realized', [35, 21, 14]]]) {
  const candidate = summary.candidates[key]
  assert.deepEqual(candidate.allocations, values)
  assert.equal(preimages.get(candidate.root)?.schema, 'partial-fill-accounting-statement.v1')
  assert.equal(candidate.evidenceRoot, summary.sourceEvidenceRoot)
  assert.equal(candidate.verification.conservation, true)
}
assert.equal(summary.candidates.A.verification.passed, true)
assert.equal(summary.candidates.A.restricted, 10)
assert.equal(summary.candidates.A.unmet, 30)
assert.equal(summary.candidates.B.synthetic, true)
assert.equal(summary.candidates.B.verification.restriction, false)
assert.equal(summary.candidates.B.verification.recipientPolicy, false)
assert.equal(summary.candidates.B.verification.eligible, false)
assert.equal(summary.candidates.realized.phase, 'realized')
const qualification = read('qualification.json')
assert.equal(qualification.publicChain, false)
assert.equal(qualification.capitalBoundary.recordsTested, 2)
assert.equal(qualification.capitalBoundary.attemptsRejected, 7)
assert.equal(qualification.capitalBoundary.checkedStateUnchanged, true)
assert.equal(qualification.clojure.failures + qualification.clojure.errors, 0)
const evm = read('evm-input.json')
assert.equal(evm.accountingRatificationRoot, `0x${summary.allocation.events.at(-1).root.slice(7)}`)
assert.equal(evm.recordFileSha256, `0x${sha(bytes('accounting-ratification.edn'))}`)
assert.equal(evm.realizedAccountingRatificationRoot, `0x${summary.realized.events.at(-1).root.slice(7)}`)
assert.equal(evm.realizedRecordFileSha256, `0x${sha(bytes('accounting-ratification-realized.edn'))}`)
const capitalLog = bytes('capital-boundary-test.log').toString('utf8')
assert(capitalLog.includes('[PASS] test_AccountingRatificationCannotAuthorizeCapital()'))
assert(capitalLog.includes(evm.accountingRatificationRoot))
assert(capitalLog.includes(evm.recordFileSha256))
assert(capitalLog.includes(evm.realizedAccountingRatificationRoot))
assert(capitalLog.includes(evm.realizedRecordFileSha256))

for (const phase of ['allocation', 'realized']) {
  const history = summary[phase]
  const policy = history.policy
  assert.equal(preimages.get(policy.root)?.schema, 'subject-decision-policy.v1')
  assert.equal(preimages.get(policy.validationRoot)?.schema, 'partial-fill-accounting-verification-method.v1')
  assert.notEqual(policy.reviewer.id, policy.ratifier.id)
  assert.notEqual(policy.reviewer['public-key'], policy.ratifier['public-key'])
  assert.deepEqual(history.events.map(e => e.action), phase === 'allocation' ? ['accept', 'reject', 'ratify'] : ['accept', 'ratify'])
  const decisions = new Map()
  const subjects = new Map(Object.values(summary.candidates).map(s => [s.root, s]))
  for (const [sequence, event] of history.events.entries()) {
    assert.equal(event.sequence, sequence)
    if (sequence === 0) assert.equal(event.previousRoot, policy.initialHistoryRoot)
    assert.equal(preimages.get(event.root)?.schema, 'subject-decision.v2')
    assert.equal(event.policyRoot, policy.root)
    assert.equal(event.domain, policy.domain)
    assert.equal(event.purpose, policy.purpose)
    const role = event.action === 'ratify' ? policy.ratifier : policy.reviewer
    assert.equal(event.authorityId, role.id)
    assert.equal(event.payloadType, 'application/vnd.prf.subject-decision.v1')
    assert.match(event.signatureHex, /^[a-f0-9]{128}$/)
    assert(verify(null, Buffer.from(`${event.payloadType}\n${event.root}`), createPublicKey(role['public-key']), Buffer.from(event.signatureHex, 'hex')), 'Ed25519 decision signature')
    const candidate = subjects.get(event.subjectRoot)
    assert(candidate)
    assert.equal(event.verificationRoot, candidate.verification.root)
    if (event.action === 'accept') {
      assert(candidate.verification.passed && candidate.verification.eligible)
      assert(!decisions.has(event.subjectRoot))
      decisions.set(event.subjectRoot, event)
    } else if (event.action === 'reject') {
      assert(!decisions.has(event.subjectRoot))
      decisions.set(event.subjectRoot, event)
    } else {
      assert.equal(decisions.get(event.subjectRoot)?.action, 'accept')
      assert.equal(event.acceptanceRoot, decisions.get(event.subjectRoot).root)
      assert.equal(event.supersedesRoot, null)
      assert.equal(history.authoritativeSubject, event.subjectRoot)
    }
  }
  assert.equal(history.checkpoint.sequence, history.events.length)
}
const page = readFileSync(join(root, 'app/demos/partial-fill-accounting/page.tsx'), 'utf8')
assert(page.includes('<AccountingReview />'))
assert(readFileSync(join(root, 'app/demos/partial-fill-accounting/AccountingReview.tsx'), 'utf8').includes('create no real signature, authority record or transaction'))
console.log(`verify-accounting-review PASS: ${Object.keys(manifest.files).length} hashed files, canonical preimage hashes, five Ed25519 decisions with distinct roles and scoped acceptance/adoption. Full EDN binding, source checks and history-root replay use the documented Clojure verifier.`)
