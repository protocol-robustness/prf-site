import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { deriveProtectedTransferTimeline, readProtectedTransferEvidence } from '../lib/protected-transfer-timeline.mjs'

const { evidence, hashes } = readProtectedTransferEvidence(fileURLToPath(new URL('../public/evidence/protected-transfer-v1', import.meta.url)))

describe('protected-transfer timeline reconstruction', () => {
  it('reconstructs the one operation and observed 35/21/14 payouts', () => {
    const timeline = deriveProtectedTransferTimeline(evidence, hashes)
    assert.equal(timeline.schema, 'eae.site.protected-transfer-timeline.v1')
    assert.equal(timeline.steps.length, 11)
    assert.deepEqual(timeline.economics.allocations.map(({ amount }) => amount), [35, 21, 14])
    assert.deepEqual(timeline.economics.terminal, { reserve: 10, allocator: 0, paid: 70, liability: 0 })
    assert.equal(timeline.subject.environment, 'local Anvil · localOnly')
    assert.equal(timeline.subject.source.witnessSha256, evidence['gate-e-proof-fixture.json'].gate_e.witness_sha256)
    assert.equal(timeline.subject.source.bundleSha256, evidence['gate-e-proof-fixture.json'].gate_e.source_bundle_sha256)
    const byId = new Map(timeline.steps.map((step) => [step.id, step]))
    for (const step of timeline.steps) {
      assert.equal(step.operationId, timeline.subject.operationId)
      assert.equal(step.chainInstance.chainId, timeline.subject.chainId)
      assert.equal(step.chainInstance.manifestDigest, timeline.subject.manifestDigest)
      assert.deepEqual(step.sourceCommitment, {
        witnessSha256: timeline.subject.source.witnessSha256,
        sourceBundleSha256: timeline.subject.source.bundleSha256,
      })
      assert.ok(step.action && step.actor.role && step.requiredChecks.length > 0 && step.verificationResults.length > 0)
      assert.equal(step.trustStatus.includes('local'), true)
      for (const dependency of step.dependencies) assert.ok(byId.get(dependency)?.sequence < step.sequence, `${step.id} depends only on prior events`)
      assert.equal(step.assetDeltas.token.reduce((sum, entry) => sum + entry.amount, 0), 0, `${step.id} token deltas conserve custody`)
    }
    const funding = byId.get('prepare-ratify-fund')
    assert.deepEqual(funding.assetDeltas.token.map(({ account, amount }) => [account.toLowerCase(), amount]), [
      [timeline.subject.contracts.find((contract) => contract.role === 'reserve').address.toLowerCase(), -70],
      [timeline.subject.contracts.find((contract) => contract.role === 'allocator').address.toLowerCase(), 70],
    ])
    assert.equal(byId.get('activate').assetDeltas.liability, 70)
    assert.equal(byId.get('claim-claim-b').assetDeltas.liability, -21)
  })

  for (const [label, change] of [
    ['manifest operation substitution', (copy) => { copy['manifest.json'].operationId = `0x${'aa'.repeat(32)}` }],
    ['wrong proof operation', (copy) => { copy['gate-e-proof-fixture.json'].gate_e.operation_id = `0x${'bb'.repeat(32)}` }],
    ['wrong chain context', (copy) => { copy['funding-broadcast.json'].chain = 84532 }],
    ['payout substitution', (copy) => { copy['withdrawal-forensic.json'].beneficiary_payouts[0].delta = 34 }],
    ['deployed contract substitution', (copy) => { copy['manifest.json'].contracts.allocator = `0x${'cc'.repeat(20)}` }],
    ['missing receipt', (copy) => { copy['withdrawal-broadcast.json'].receipts.pop() }],
    ['forged fresh replay identity', (copy) => { copy['fresh-anvil-replay.json'].identity.elf_sha256 = `0x${'dd'.repeat(32)}` }],
    ['relabelled allocator unit-test result', (copy) => { copy['negative-tests/allocator-substitution-foundry.json'].result = 'PASS for primary operation' }],
    ['substituted unit-test source revision', (copy) => { copy['negative-tests/allocator-substitution-foundry.json'].sourceRevision = 'candidate' }],
  ]) {
    it(`rejects ${label}`, () => {
      const altered = structuredClone(evidence)
      change(altered)
      assert.throws(() => deriveProtectedTransferTimeline(altered, hashes))
    })
  }
})
