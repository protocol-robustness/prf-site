import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('public/evidence/partial-fill-v3-parallel-claims')
const bytes = (path) => readFileSync(resolve(root, path))
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const manifest = JSON.parse(bytes('manifest.json'))
const resultBytes = bytes('qualification-result.json')
const result = JSON.parse(resultBytes)

const manifestPin = bytes('manifest.json.sha256').toString('utf8').trim().split(/\s+/)[0]
assert.equal(sha256(bytes('manifest.json')), manifestPin, 'manifest hash')
for (const file of manifest.files) {
  assert.equal(sha256(bytes(file.path)), file.sha256, `manifest file ${file.path}`)
}
assert.equal(sha256(bytes('source/PartialFillV3Controlled.t.sol')), manifest.sourceTest.sha256, 'qualified test source hash')
assert.equal(sha256(resultBytes), manifest.files.find(({ path }) => path === 'qualification-result.json').sha256)
assert.equal(result.status, 'PASS')
assert.equal(result.sourceRevision, manifest.sourceRevision)
assert.equal(result.sourceTestSha256, manifest.sourceTest.sha256)
assert.deepEqual(result.permutationMatrix.map(({ order }) => order), ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'])
assert.equal(new Set(result.permutationMatrix.map(({ executionIdentity }) => executionIdentity)).size, 6)
assert.equal(result.normalizedTerminalProjectionRoot, '0x60936be9340c9232ed4503c54bc9d35ca92444bd60ccedf3c7e7aa9d325b996d')
assert.ok(result.permutationMatrix.every(({ terminalProjectionRoot }) => terminalProjectionRoot === result.normalizedTerminalProjectionRoot))
assert.ok(result.permutationMatrix.every(({ claimTransfers, restrictedRefund }) =>
  JSON.stringify(claimTransfers.map(([, amount]) => amount).sort((a, b) => a - b)) === JSON.stringify([14, 21, 35]) &&
  restrictedRefund.amount === 10 && restrictedRefund.recipient === '0x3333333333333333333333333333333333333333'))
assert.equal(result.accountingReconciliation.adversarialFailedTransferProducedNoTransferAndPreservedState, true)
assert.ok(result.negativeOutcomes.some(({ case: name, stateUnchanged }) => name === 'recipient-substitution' && stateUnchanged))

const anvilRoot = resolve('public/evidence/partial-fill-v3-anvil-same-block')
const anvilBytes = (path) => readFileSync(resolve(anvilRoot, path))
const anvilManifestBytes = anvilBytes('manifest.json')
const anvilManifest = JSON.parse(anvilManifestBytes)
const anvilManifestPin = anvilBytes('manifest.json.sha256').toString('utf8').trim().split(/\s+/)[0]
assert.equal(sha256(anvilManifestBytes), anvilManifestPin, 'Anvil manifest hash')
for (const path of ['result.json', 'receipts.json', 'accounting-journal.json']) {
  const pin = anvilManifest.files.find(({ path: entryPath }) => entryPath === path)
  assert.ok(pin, `Anvil manifest includes ${path}`)
  assert.equal(sha256(anvilBytes(path)), pin.sha256, `Anvil manifest file ${path}`)
}
const anvilResult = JSON.parse(anvilBytes('result.json'))
assert.equal(anvilResult.schema, 'prf.partial-fill-v3-anvil-same-block-result.v1')
assert.equal(anvilResult.qualification, 'local Anvil transaction inclusion; not public-chain or proof-system qualification')
assert.equal(anvilResult.execution.chainId, 31337)
assert.equal(anvilResult.execution.blockNumber, anvilManifest.sameBlock.number)
assert.equal(anvilResult.execution.blockHash, anvilManifest.sameBlock.hash)
assert.deepEqual(anvilResult.execution.transitions.map(({ transactionIndex }) => transactionIndex), [0, 1, 2, 3])
assert.deepEqual(anvilResult.execution.transitions.map(({ success }) => success), [true, false, true, true])
assert.equal(anvilResult.execution.transitions[1].failure.error, 'EntitlementAlreadyConsumed(uint256)')
assert.equal(anvilResult.execution.transitions[1].observedTransfer, null)
assert.deepEqual(anvilResult.execution.finalState.balances, { alice: 35, bob: 21, carol: 14, allocator: 0, reserve: 10 })
assert.equal(anvilResult.execution.finalState.outstandingLiability, 0)
assert.notEqual(anvilResult.normalizedTerminalProjectionRoot, result.normalizedTerminalProjectionRoot,
  'Anvil and Foundry results remain separately identified evidence scopes')

console.log('Parallel Partial Fill and separate Anvil qualification hashes and invariants verified.')
