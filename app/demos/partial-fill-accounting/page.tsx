import type { Metadata } from 'next'
import Link from 'next/link'
import q from '../../../generated/verification/partial-fill.v1.json'
import styles from './page.module.css'
import IntermediateStates from './IntermediateStates'
import AccountingReview from './AccountingReview'

export const metadata: Metadata = {
  title: 'From Partial Fill to Accounting — Where Do the 30 Units Go?',
  description: 'Trace a local partial fill, then distinguish deterministic accounting verification, authorized acceptance and purpose-bound ratification using retained V3 evidence.',
}

const rows = q.participants
const requestTotal = rows.reduce((sum, row) => sum + row.requested, 0)
const allocationTotal = rows.reduce((sum, row) => sum + row.allocated, 0)
const unmetTotal = rows.reduce((sum, row) => sum + row.unfilled, 0)
const paidTotal = rows.reduce((sum, row) => sum + row.withdrawn, 0)
const remaining = q.final?.remainingFundedLiability ?? null
const protectedReserve = q.final?.protectedReserveBalance ?? null
const initialDeposit = allocationTotal + (protectedReserve ?? 0)
const qualified = q.qualified && q.final?.operation === 'Closed' && paidTotal === allocationTotal

function Check({ children }: { children: React.ReactNode }) { return <span className={styles.check} aria-label="Verified against retained local qualification">✓</span> }

export default function PartialFillAccountingPage() {
  return <main className={styles.page}>
    <Link className={styles.back} href="/demos/partial-fill">← Partial Fill</Link>
    <header className={styles.hero}>
      <span className={styles.kicker}>Partial Fill → accounting · retained local EVM run</span>
      <h1>From Partial Fill to Accounting: Where Do the 30 Units Go?</h1>
      <p className={styles.lede}>100 units requested. 70 funded and paid. 30 units of demand remain unmet.</p>
      <p>The 30 units are requests that were not filled. They are not tokens that moved, funded entitlements, a recognized loss, or a promise of future payment in this controlled example.</p>
      <p><a href="#accounting-review">Explore V3 accounting verification, acceptance and ratification ↓</a></p>
      <p className={styles.caption}>The original seven V2 observations below end at allocator closure. The new V3 review uses a separate locally finalized run and its own signed accounting history.</p>
      <p className={qualified ? styles.status : styles.warning}>{qualified ? '✓ Linked to retained proof-bound local qualification and beneficiary transfer observations.' : '⚠ Settlement qualification is not complete; only source and calculation results are available.'}</p>
    </header>

    <AccountingReview />

    <section className={styles.panel} aria-labelledby="request-heading">
      <span className={styles.kicker}>Original V2 run · 1 · Request outcome</span><h2 id="request-heading">Requests are not all funded liabilities</h2>
      <div className={styles.metrics}><div><strong>{requestTotal}</strong><span>Requested</span></div><div><strong className={styles.teal}>{allocationTotal}</strong><span>Allocated under policy</span></div><div><strong className={styles.amber}>{unmetTotal}</strong><span>Unmet request</span></div></div>
      <div className={styles.bar} role="img" aria-label={`${allocationTotal} of ${requestTotal} requested units allocated; ${unmetTotal} unmet`}><span style={{width:`${allocationTotal/requestTotal*100}%`}}>{allocationTotal} allocated</span><span style={{width:`${unmetTotal/requestTotal*100}%`}}>{unmetTotal} unmet</span></div>
      <div className={styles.tableWrap}><table><caption>Controlled requests and retained outcomes · integer fixture-token units</caption><thead><tr><th scope="col">Recipient</th><th scope="col">Requested</th><th scope="col">Calculated allocation</th><th scope="col">Unfilled</th></tr></thead><tbody>{rows.map(row=><tr key={row.name}><th scope="row">{row.name}</th><td>{row.requested}</td><td>{row.allocated}</td><td className={styles.amber}>{row.unfilled}</td></tr>)}</tbody><tfoot><tr><th scope="row">Total</th><td>{requestTotal}</td><td>{allocationTotal}</td><td>{unmetTotal}</td></tr></tfoot></table></div>
      <p className={styles.equation}><Check>✓</Check> Requests: {requestTotal} = {allocationTotal} allocated + {unmetTotal} unmet</p>
      <p className={styles.caption}>The initiator-specified requests are authoritative within this controlled test. They do not prove external claimants or liabilities are complete.</p>
    </section>

    <IntermediateStates />

    <section className={styles.flow} aria-label="Capital flow from reserve to beneficiaries">
      <article><span className={styles.step}>2 · Reserve</span><h2>80 deposited</h2><p>70 is committed as available capital; 10 remains protected in the reserve.</p><div className={styles.reserveBar} role="img" aria-label="80 deposited: 70 available and 10 protected"><span style={{width:'87.5%'}}>70 available</span><span style={{width:'12.5%'}}>10 protected</span></div></article>
      <span className={styles.arrow} aria-hidden="true">→</span>
      <article><span className={styles.step}>3 · Funding and activation</span><h2>70 funded entitlements</h2><p>The protected route transfers 70 to allocator custody. Activation records the 70-unit withdrawal liability; activation itself moves no tokens.</p><div className={styles.neutralBar}><span style={{width:'100%'}}>70 funded entitlement</span></div></article>
      <span className={styles.arrow} aria-hidden="true">→</span>
      <article><span className={styles.step}>4 · Withdrawals</span><h2>70 observed paid</h2><p>Alice 35, Bob 21 and Carol 14 withdraw their activated entitlements.</p><div className={styles.payoutBar} role="img" aria-label="Observed local withdrawals: Alice 35, Bob 21, Carol 14"><span style={{width:'50%'}}>Alice 35</span><span style={{width:'30%'}}>Bob 21</span><span style={{width:'20%'}}>Carol 14</span></div></article>
    </section>

    <section className={styles.reconcile} aria-labelledby="reconcile-heading"><span className={styles.kicker}>5 · Reconcile final state</span><h2 id="reconcile-heading">Custody reconciles at allocator closure; reserve settlement remains pending</h2>
      <div className={styles.checks}>
        <article><Check>✓</Check><div><h3>Custody</h3><code>{initialDeposit} deposited = {protectedReserve} protected + {paidTotal} paid + {q.final?.allocatorBalance ?? 0} allocator</code><p>Final observed custody: reserve {protectedReserve}, allocator {q.final?.allocatorBalance ?? 'pending'}, recipients {paidTotal}.</p></div></article>
        <article><Check>✓</Check><div><h3>Funded liability</h3><code>{allocationTotal} activated = {paidTotal} paid + {remaining} remaining</code><p>The funded entitlement liability closes to zero after the three recorded withdrawals.</p></div></article>
      </div>
      <p className={styles.warning}>⚠ Under the fixture assumption that 80 is the complete deposit against these requests: {unmetTotal} unmet = {q.unmetRequestDecomposition.notDepositedAgainstRequests} not deposited against requests + {q.unmetRequestDecomposition.depositedButProtected} deposited but held behind the protected-capital floor. This is not a 30-unit loss. The protected 10 remains unresolved restricted custody. Carol is the proposed beneficiary by fixture policy only; that attribution is not independently proven as a beneficial right or enforced by reserve V2, and no release is observed.</p>
      <p className={styles.caption}>This is the allocator-closed state, not final reserve settlement. The custody equation is reconstructed from local test-token deposit and withdrawal events and final balances; these are Foundry observations, not public-chain receipts or cryptographic state proofs.</p>
    </section>

    <section className={styles.scope}><h2>Restricted sponsor capital: fixture policy, release unqualified</h2><p>The adopted v1 fixture policy designates Carol as beneficial owner and refund beneficiary of the restricted 10 units. The local test governor funded the reserve; an observed test-token transfer and reserve deposit event attribute the 80-unit deposit to that sponsor. Carol's ownership is declared by the fixture policy, not inferred from those events or a historical onchain fact.</p><p>Permitted purpose: refundable sponsor capital held outside claimant entitlements, fees, protocol income and available allocation capital. The ratification controller is named as release authority, but the frozen reserve V2 has no policy-binding or terminal-release function. The 10 remains in custody; no transfer to Carol is shown.</p><p className={styles.caption}>Fixture policy root (record identity; not committed or enforced by reserve V2): <code>{q.protectedCapitalPolicy.policyRoot}</code></p><h2>What this accounting establishes</h2><ul><li>Policy calculation: 35/21/14 is independently reconstructed from the committed 50/30/20 requests and 70 available units.</li><li>Funded obligation: the activated withdrawal liability is 70, not 100.</li><li>Observed movement: retained local token transfer events show funding of 70 and withdrawals of 35/21/14.</li><li>Unmet demand: 30 remains unfilled under the explicit unmet-request disposition.</li></ul><p>Accounting conservation, policy compliance, fairness, external liability completeness and solvency are distinct claims. This test establishes only its declared inputs, policy, protected local execution and observed fixture-token movement. A deterministic seven-record event journal is derived from these observations and transfer evidence; the snapshots remain primary. It records 10 as unresolved restricted custody and does not claim complete economic accounting or final reserve settlement.</p><div className={styles.links}><Link href="/demos/partial-fill">Explore the Partial Fill assurance path →</Link><Link href="/demos/where-did-every-token-go">Compare the retained settlement accounting demo →</Link><a href="/evidence/manifests/partial-fill-accounting.v1.json" download>Accounting demo manifest ↓</a><a href="/evidence/partial-fill/accounting-reconciliation.json" download>Derived reconciliation record ↓</a><a href="/evidence/partial-fill/manifest.json" download>Partial Fill evidence manifest ↓</a><a href="/evidence/partial-fill/qualification.json" download>Qualification verdict ↓</a><a href="/evidence/partial-fill/token-transfers.json" download>Recorded token transfers ↓</a><a href="/evidence/partial-fill/accounting-states.json" download>Intermediate accounting snapshots ↓</a><a href="/evidence/partial-fill/accounting-journal.json" download>Scoped accounting event journal ↓</a><a href="/evidence/partial-fill/protected-capital-policy.json" download>Protected-capital fixture policy ↓</a><a href="/evidence/partial-fill/funding-attribution.json" download>Local funding attribution ↓</a><a href="/evidence/partial-fill/README.md" download>Reproduction instructions ↓</a><a href="/evidence/partial-fill/protected-capital-release.md" download>Bounded successor V3 proposal ↓</a></div></section>
  </main>
}
