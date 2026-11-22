'use client'
import { useState } from 'react'
import data from '../../../generated/verification/partial-fill.v1.json'
import styles from './page.module.css'
const stages = ['Calculated', 'Funded & activated', 'Withdrawn']
const attempts = [
  { label: 'Change a request', test: 'changed-request', detail: 'Alice’s request changes from 50 to 51. The reconstructed source no longer matches the initiator’s commitment.', source: true },
  { label: 'Withdraw 40 for Alice', test: 'test_RejectOverWithdrawalAndDuplicateConsumption()', detail: 'The supplied amount fails the committed entitlement opening. The allocator pays nothing and preserves its liability.', source: false },
  { label: 'Change allocation, keep total', test: 'test_RejectChangedAllocationRepresentation()', detail: '40/16/14 still totals 70, but the entitlement table no longer matches the proof-bound 35/21/14 distribution. Activation rejects without changing capital or critical state.', source: false },
  { label: 'Fund 80 instead of 70', test: 'test_RejectFundingMoreThanCommittedCapital()', detail: 'Even under the configured reserve authority, a funding request of 80 exceeds the live, committed 70. The reserve’s amount guard rejects it atomically.', source: false },
  { label: 'Reuse stale assurance', test: 'test_RejectStaleReserveThenRecoverWithFreshRealProof()', detail: 'A changed reserve revision invalidates the original assurance. Available capital stays 70: 81 gross − 1 separately reserved − 10 protected. A fresh proof enables guarded replacement and the same single settlement; the 30 unmet requests remain unfunded.', source: false },
  { label: 'Replay funding', test: 'test_RejectRatificationAndFundingReplay()', detail: 'A second funding attempt rejects. The capital and critical operation state remain unchanged.', source: false },
  { label: 'Bypass protected route', test: 'test_RejectUnauthorizedAndRouteBypass()', detail: 'Direct controller/allocator funding and an unauthorized operator reject without moving capital.', source: false },
]
export default function PartialFillExplorer({ section }: { section: 'allocation' | 'attempts' }) {
  const [stage, setStage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const current = attempts[attempt]
  const tests = data.tests as Record<string, { status: string }>
  const passed = current.source ? data.sourceRejections.some(x => x.case === current.test && x.result === 'rejected') : Object.entries(tests).some(([name, value]) => name === current.test && value.status === 'Success')
  return <>
    {section==='allocation' && <section className={styles.panel} aria-labelledby="allocation-heading">
      <span className={styles.kicker}>2 · Follow the capital</span><h2 id="allocation-heading">70% of each request</h2>
      <div className={styles.buttons} role="group" aria-label="Retained execution stage">{stages.map((name,i) => <button key={name} disabled={!data.qualified && i>0} aria-pressed={stage===i} onClick={()=>setStage(i)}>{name}</button>)}</div>
      <div className={styles.tableWrap}><table><caption>Integer token units · retained local contract qualification</caption><thead><tr><th scope="col">Recipient</th><th scope="col">Requested</th><th scope="col">Calculated</th><th scope="col">Unfilled</th><th scope="col">{stage===2?'Withdrawn':'Funded entitlement'}</th></tr></thead><tbody>{data.participants.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.requested}</td><td>{row.allocated}</td><td className={styles.warning}>{row.unfilled}</td><td className={stage===2?styles.pass:undefined}>{stage===2 ? row.withdrawn : stage===1 ? row.allocated : 0}</td></tr>)}</tbody></table></div>
      <div className={styles.metrics} aria-live="polite"><div><strong>{stage===0?80:10}</strong><span>Reserve custody</span></div><div><strong>{stage===1?70:0}</strong><span>Remaining funded liability</span></div><div><strong>{stage===2?70:0}</strong><span>Beneficiary balances</span></div></div>
      <p className={styles.caption}>The selector displays retained stages of the test. It does not initiate a transaction. “Funded entitlement” means an activated, unpaid liability; calculated amounts are not payments.</p>
      <p className={styles.pass}><span className={styles.inlineCheck} aria-hidden="true">✓</span> Requests: 100 = 70 allocated + 30 unmet</p>
      <p className={data.qualified?styles.pass:styles.warning}>{data.qualified ? '✓ Final custody: 80 deposited = 70 withdrawn + 10 protected reserve + 0 allocator' : '⚠ Withdrawal stages and final custody reconciliation await real-proof contract qualification.'}</p>
    </section>}
    {section==='attempts' && <section className={styles.panel} aria-labelledby="attempt-heading"><span className={styles.kicker}>4 · Try a prohibited change</span><h2 id="attempt-heading">Different result? The checks reject it.</h2><div className={styles.buttons} role="group" aria-label="Retained negative checks">{attempts.map((item,i)=><button key={item.label} aria-pressed={attempt===i} onClick={()=>setAttempt(i)}>{item.label}</button>)}</div><div className={styles.outcome} aria-live="polite"><strong className={passed?styles.error:styles.warning}>{passed?'⊗ Rejected in retained qualification':'⚠ Not qualified'}</strong><p>{!passed && !current.source?'Expected check (not yet qualified for this fixture): ':''}{current.detail}</p><small>{current.source?'Native controlled-source validation; no contract transaction attempted.':'Actual EVM contract path; failed attempts preserve the checked capital and operation state.'}</small><code>{current.test}</code></div><p className={styles.caption}>These controls select recorded checks. The browser does not run the prover or submit transactions. Download retained negative inputs and available qualification results below.</p></section>}
  </>
}
