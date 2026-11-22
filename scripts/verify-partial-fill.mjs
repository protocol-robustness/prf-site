#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
const root=dirname(dirname(fileURLToPath(import.meta.url)))
const dir=join(root,'public/evidence/partial-fill')
const read=n=>JSON.parse(readFileSync(join(dir,n),'utf8'))
const hash=b=>createHash('sha256').update(b).digest('hex')
const manifest=read('manifest.json')
for(const f of [...manifest.inputs,...manifest.retained_evidence]){
  assert(f.path.startsWith('evidence/partial-fill/') && !f.path.includes('..'))
  assert.equal(hash(readFileSync(join(root,'public',f.path))),f.sha256,f.path)
}
const q=read('qualification.json'),r=read('replay.json'),w=read('witness.json')
assert.deepEqual(q,JSON.parse(readFileSync(join(root,'generated/verification/partial-fill.v1.json'),'utf8')))
assert.deepEqual(r,read('clojure-replay.json'))
assert.deepEqual(r,q.roots)
assert.equal(r['realized-statement-root'],q.sourceRoot)
assert.equal(w['prepared-operation']['policy-root'],'0x'+q.sourceRoot)
assert.equal(w['economic-reserve-state']['available-amount'],'70')
assert.equal(w['realized-statement-input']['fail-action-policy'].mode,'unmet-request')
assert.deepEqual(w['realized-statement-input'],read('source.json'))
assert.deepEqual(w['realized-statement-input'].requested,{'claim-a':'50','claim-b':'30','claim-c':'20'})
assert.equal(w['realized-statement-input'].available,'70')
assert.deepEqual(w['realized-statement-input'].policy,{mode:'pro-rata','rounding-policy':'largest-remainder'})
assert.equal(q.policy.unfilled,'unmet request only; no deferred claim, haircut or future obligation')
for(const [i,row] of q.participants.entries()){
  assert.equal(row.name,['Alice','Bob','Carol'][i]); assert.equal(row.requested,[50,30,20][i])
  assert.equal(row.allocated,row.requested*70/100);assert.equal(row.allocated,Number(r['ordered-entitlements'][i].amount))
  assert.equal(row.unfilled,row.requested-row.allocated);if(q.qualified){assert.equal(row.withdrawn,q.final.withdrawn[i]);assert.equal(row.withdrawn,row.allocated)}else assert.equal(row.withdrawn,null)
}
assert.equal(q.participants.reduce((n,x)=>n+x.allocated,0),70)
assert.equal(q.participants.reduce((n,x)=>n+x.unfilled,0),30)
assert.equal('0x'+hash(readFileSync(join(dir,'controlled-program.elf'))),q.identity.elf_sha256)
if(q.qualified){
for(const prefix of ['', 'recovery-']){
  const proof=read(prefix+'proof.json'), replay=read(prefix+'replay.json')
  assert.equal(proof.proof_system,'groth16');assert.equal(proof.public_values_length,288)
  for(const k of ['program_id','vkey','elf_sha256'])assert.equal(proof[k],q.identity[k])
  assert.equal(proof.public_values,'0x'+replay['public-values'])
  assert.equal(proof.source.witness_sha256,'0x'+hash(readFileSync(join(dir,prefix+'witness.json'))))
  assert.equal(proof.source.wrapper_witness_sha256,'0x'+hash(readFileSync(join(dir,prefix+'wrapper-witness.json'))))
  assert.deepEqual(replay,read(prefix+'clojure-replay.json'))
}
const required=['QualificationWithdrawsAndClosesExactly','RejectProofPublicValueSubstitution','RejectUnauthorizedAndRouteBypass','RejectRatificationAndFundingReplay','RejectProofForAnotherOperationAndPolicyMutation','RejectOverWithdrawalAndDuplicateConsumption','RejectStaleReserveThenRecoverWithFreshRealProof','RejectChangedAllocationRepresentation','RejectFundingMoreThanCommittedCapital','RejectCarolClaimIncludingProtectedSponsorCapital','FrozenV2HasNoTerminalProtectedRefundEntryPoint']
const actual={};for(const suite of Object.values(read('evm-tests.json')))Object.assign(actual,suite.test_results??{})
for(const name of required){const key='test_'+name+'()';assert.equal(actual[key]?.status,'Success',key);assert.equal(q.tests[key]?.status,'Success',key)}
const transfers=read('token-transfers.json').transfers;assert.deepEqual(transfers,q.tokenTransfers);assert.deepEqual(transfers.map(t=>t.amount),[70,35,21,14])
const p=w['prepared-operation'],reserve=p.reserve.toLowerCase(),allocator=p.allocator.toLowerCase();const positions=new Map([[reserve,80],[allocator,0],...q.participants.map(x=>[x.beneficiary.toLowerCase(),0])]);
for(const t of transfers){assert.equal(t.token.toLowerCase(),p.token.toLowerCase());const from=t.from.toLowerCase(),to=t.to.toLowerCase();assert(positions.has(from)&&positions.has(to));positions.set(from,positions.get(from)-t.amount);positions.set(to,positions.get(to)+t.amount);assert(positions.get(from)>=0)}
assert.equal(positions.get(reserve),10);assert.equal(positions.get(allocator),0);for(const x of q.participants)assert.equal(positions.get(x.beneficiary.toLowerCase()),x.withdrawn)
assert.equal(q.final.remainingFundedLiability,0);assert.equal(q.final.allocatorBalance,0);assert.equal(q.final.protectedReserveBalance,10);assert.equal(q.final.operation,'Closed');assert.equal(q.final.deferred,0)
}else{assert.equal(q.final,null);assert.equal(Object.keys(q.tests).length,0);assert.equal(manifest.expected_outputs.local_contract_qualification,'pending')}
for(const c of q.sourceRejections){assert.equal(c.result,'rejected');read('negative-source/'+c.input)}

// V3 is a separate local run from the V2 fixture above. Verify every published
// V3 artifact against its own manifest, then reconstruct the bounded terminal
// reconciliations from the observed states and transfer records.
const v3dir=join(dir,'v3-live-context')
const v3read=n=>JSON.parse(readFileSync(join(v3dir,n),'utf8'))
const v3manifest=v3read('manifest.json')
assert.equal(v3manifest.schema,'eae.partial-fill.v3-live-context-evidence.v1')
assert.equal(v3manifest.network,'local Foundry chain 31337; no public-chain execution')
assert.equal(v3manifest.stage2QualificationTests,'11 passed, 0 failed; PARTIAL_FILL_STAGE=2, including stale-proof rejection and fresh-proof recovery')
assert.match(v3manifest.reserveV3Tests,/^8 passed, 0 failed/)
for(const [name,entry] of Object.entries(v3manifest.files)){
  const bytes=readFileSync(join(v3dir,name))
  assert.equal(bytes.length,entry.bytes,`V3 size ${name}`)
  assert.equal(hash(bytes),entry.sha256,`V3 hash ${name}`)
}
const v3reconciliation=v3read('reconciliation.json')
assert.equal(v3reconciliation.requests.holds,true)
assert.equal(v3reconciliation.requests.total,v3reconciliation.requests.allocated+v3reconciliation.requests.unmet)
assert.equal(v3reconciliation.sourceCapital.holds,true)
assert.equal(v3reconciliation.sourceCapital.sponsorTransferObserved,80)
assert.equal(v3read('funding-observation.json').observedTransferAmount,80)
assert.equal(v3read('funding-observation.json').sponsorTransferObserved,true)
assert.equal(v3reconciliation.sourceCapital.protectedRestricted+v3reconciliation.sourceCapital.availableForAllocation,80)
assert.equal(v3reconciliation.claimSettlement.holds,true)
assert.equal(v3reconciliation.claimSettlement.totalWithdrawn,70)
assert.deepEqual(v3reconciliation.claimSettlement.withdrawals,{Alice:35,Bob:21,Carol:14})
assert.equal(v3reconciliation.claimSettlement.remainingLiability,0)
assert.equal(v3reconciliation.restrictedCapitalSettlement.holds,true)
assert.equal(v3reconciliation.restrictedCapitalSettlement.refund,10)
const v3terminal=v3read('terminal-observation.json')
assert.equal(v3terminal.chainId,31337)
assert.equal(v3terminal.operationState,'Closed')
assert.equal(v3terminal.ratificationState,'Finalized')
assert.equal(v3terminal.outstandingLiability,0)
assert.equal(v3terminal.protectedCapitalRefunded,10)
assert.equal(v3terminal.beneficiaryBalance,24)
assert.equal(v3terminal.reserveFinalized,true)
assert.equal(v3terminal.refundBeneficiary,v3reconciliation.restrictedCapitalSettlement.beneficiary)
const v3states=v3read('accounting-states.json').states
assert.equal(v3states.length,8)
assert(v3states.every(s=>s.custody_equation_holds===true))
assert.equal(v3states.at(-1).stage,'reserve_finalized')
const v3transfers=v3read('transfers.json')
assert.deepEqual(v3transfers.map(t=>t.amount),[70,35,21,14,10])
assert.equal(v3transfers.slice(1).reduce((n,t)=>n+t.amount,0),80)
const v3journal=v3read('accounting-journal.json')
assert.equal(v3journal.journal_kind,'derived_event_projection_not_double_entry')
assert.equal(v3journal.records.length,8)
assert.equal(v3journal.transfers.length,5)
assert.equal(v3journal.reconciliation.initial_sponsor_deposit.holds,true)
assert.equal(v3journal.reconciliation.custody_at_every_observation,true)
assert.equal(v3journal.reconciliation.terminal_claim_settlement.holds,true)
assert.equal(v3journal.reconciliation.restricted_capital_release.holds,true)
assert.equal(v3journal.restricted_capital.external_beneficial_ownership_proven,false)
assert.match(readFileSync(join(v3dir,'README.md'),'utf8'),/No Base Sepolia deployment or public-chain transaction is claimed/)
assert.equal(manifest.demo.page,'/demos/partial-fill')
const page=readFileSync(join(root,'app/demos/partial-fill/page.tsx'),'utf8')
for(const match of page.matchAll(/href="(\/demos\/[^"#]+)"/g))assert(readFileSync(join(root,'app',match[1],'page.tsx')))
assert(readFileSync(join(root,'app/demos/page.tsx'),'utf8').includes('href="/demos/partial-fill"'))
console.log(q.qualified?'verify-partial-fill QUALIFIED: hashed evidence, exact recipient reconstruction, actual proof identities/public values, eleven contract checks, source mutations, route and downloads. Does not rerun SP1 or EVM proof verification.':'verify-partial-fill PENDING: source and calculation evidence pass; contract qualification and withdrawals remain explicitly unavailable.')
