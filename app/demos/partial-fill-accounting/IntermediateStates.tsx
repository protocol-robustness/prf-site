'use client'

import q from '../../../generated/verification/partial-fill.v1.json'
import DemoShell from '../../../components/demo/DemoShell'
import styles from './IntermediateStates.module.css'

const states = q.intermediateStates
const names: Record<string,string> = {prepared:'Source prepared',proofAdmitted:'Proof admitted',funded:'Capital funded',activated:'Entitlements activated',afterAlice:'Alice claimed',afterBob:'Bob claimed',closed:'Allocator closed · reserve pending'}
const explanations: Record<string,string> = {
  prepared: 'The 100-unit request and reserve inputs are prepared. The reserve has 80 fixture units, with 10 protected and 70 available; no claimant liability is activated.',
  proofAdmitted: 'The proof is admitted for the prepared operation. Admission alone moves no capital and creates no claimant liability.',
  funded: 'The protected operation moves 70 units to allocator custody while the 10-unit protected reserve floor remains.',
  activated: 'The funded entitlement table becomes a 70-unit claimant liability. Activation records the obligation but moves no tokens.',
  afterAlice: 'Alice has received 35 units. The remaining funded liability is 35 units for Bob and Carol.',
  afterBob: 'Bob has received 21 more units. Fourteen units remain in allocator custody and as claimant liability for Carol.',
  closed: 'Carol has received 14 units. The allocator is closed with zero claimant liability; the separate 10 restricted units remain in reserve.',
}

export default function IntermediateStates() {
  return <section className={styles.section} aria-labelledby="states-heading">
    <span className={styles.kicker}>Observed local execution · intermediate accounting</span>
    <h2 id="states-heading">Follow the balances as the operation progresses</h2>
    <p className={styles.intro}>Each point is an actual getter snapshot after a contract call in the retained Foundry run. These are call boundaries within a local test, not separate mined transactions.</p>
    <DemoShell steps={states.map((state) => ({
      id: state.stage,
      label: names[state.stage] ?? state.stage,
      narration: explanations[state.stage] ?? 'Inspect the retained balances at this contract-call boundary.',
      evidence: {
        status: 'locally-observed' as const,
        sourceLabel: 'Partial Fill retained accounting snapshots',
        sourceHref: '/evidence/partial-fill/accounting-states.json',
        identity: state.operationId,
        scope: 'Local Foundry getter observation at a contract-call boundary; not a public-chain state proof or separately mined transaction.',
      },
      node: <SnapshotCard state={state} />,
    }))} />
  </section>
}

function SnapshotCard({ state }: { state: typeof states[number] }) {
  const reserveAvailable = state.reserveBalance - state.protectedCapital - state.reservedCapital
  const custody = state.totalCustody
  const activated = state.activatedLiability > 0
  return <div className={styles.card} aria-live="polite">
    <div className={styles.head}><div><span className={styles.kicker}>{state.stage}</span><h3>{names[state.stage] ?? state.stage}</h3></div><span className={styles.badge}>Local EVM observation</span></div>
    <p className={styles.op}>Operation <code>{state.operationId}</code> · ratification: {state.ratificationState} · allocator: {state.allocatorState}</p>
    <div className={styles.metrics}>
      <div><strong>{state.reserveBalance}</strong><span>Reserve balance</span></div>
      <div><strong>{state.allocatorBalance}</strong><span>Allocator balance</span></div>
      <div><strong>{state.paid}</strong><span>Observed paid</span></div>
      <div><strong>{state.remainingLiability}</strong><span>Remaining activated liability</span></div>
    </div>
    <div className={styles.bar} role="img" aria-label={`Custody of ${custody}: ${state.protectedCapital} protected in reserve, ${reserveAvailable} available in reserve, ${state.allocatorBalance} allocator balance, ${state.paid} paid to recipients`}>
      {state.protectedCapital > 0 && <span className={styles.protected} style={{ width: `${state.protectedCapital / custody * 100}%` }}>{state.protectedCapital} protected</span>}
      {reserveAvailable > 0 && <span className={styles.reserve} style={{ width: `${reserveAvailable / custody * 100}%` }}>{reserveAvailable} reserve available</span>}
      {state.allocatorBalance > 0 && <span className={styles.allocator} style={{ width: `${state.allocatorBalance / custody * 100}%` }}>{state.allocatorBalance} allocator</span>}
      {state.paid > 0 && <span className={styles.paid} style={{ width: `${state.paid / custody * 100}%` }}>{state.paid} paid</span>}
    </div>
    <div className={styles.legend}><span><i className={styles.protectedDot}/>Protected reserve floor</span><span><i className={styles.reserveDot}/>Available reserve</span><span><i className={styles.allocatorDot}/>Allocator custody</span><span><i className={styles.paidDot}/>Recipient balances</span></div>
    <p className={styles.equation}>Custody: {state.reserveBalance} reserve + {state.allocatorBalance} allocator + {state.paid} paid = {state.totalCustody} units <b aria-label="verified">✓</b></p>
    <p className={styles.equation}>Funded entitlement table: {state.fundedEntitlement} · activated liability: {state.activatedLiability} · remaining after claims: {state.remainingLiability}</p>
    {activated ? <p className={styles.check}>✓ Liability: {state.activatedLiability} activated = {state.paid} paid + {state.remainingLiability} remaining</p> : <p className={styles.pending}>ⓘ Withdrawal liability is not activated at this state. Funding the table alone does not create the recorded 70-unit liability.</p>}
    {state.stage === 'closed' && <p className={styles.pending}>⚠ Allocator closure is not final reserve settlement. The 10 restricted units remain in reserve custody; no refund to Carol is observed, and frozen reserve V2 has no terminal release route.</p>}
    <p className={styles.caption}>Beneficiary balances: Alice {state.aliceBalance}, Bob {state.bobBalance}, Carol {state.carolBalance}. Claimed count: {state.claimedCount}. Snapshot boundary: {state.boundary}.</p>
  </div>
}
