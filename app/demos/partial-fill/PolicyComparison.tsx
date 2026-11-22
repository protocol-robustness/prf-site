'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './PolicyComparison.module.css'

const outcomes = {
  protected: {
    label: 'Respect the protected 10',
    status: 'Policy-aware outcome',
    rows: [
      { name: 'Alice', amount: 35, share: 43.75 },
      { name: 'Bob', amount: 21, share: 26.25 },
      { name: 'Carol', amount: 14, share: 17.5 },
    ],
    restricted: 10,
    unmet: 30,
  },
  naive: {
    label: 'Spend all 80 as allocatable',
    status: 'Illustrative policy violation',
    rows: [
      { name: 'Alice', amount: 40, share: 50 },
      { name: 'Bob', amount: 24, share: 30 },
      { name: 'Carol', amount: 16, share: 20 },
    ],
    restricted: 0,
    unmet: 20,
  },
} as const

const lifecycle = [
  ['Funding received', '80 local test-token units transferred to the reserve; fixture policy separates 70 available from 10 restricted.', 'funding-observation.json'],
  ['Shortfall established', '100 requested = 70 allocated + 30 unmet. The unmet 30 is not a realized loss or a funded debt.', 'reconciliation.json'],
  ['Proof admitted', 'Clojure and Rust replay agree; the real SP1 proof is verified and admitted under the local configuration.', 'stage2-qualification.log'],
  ['Entitlements funded and activated', 'The protected route funds 70; activation records a 70-unit claimant liability.', 'accounting-states.json'],
  ['Claims paid', 'Observed local transfers pay Alice 35, Bob 21 and Carol 14; remaining claimant liability reaches zero.', 'transfers.json'],
  ['Restricted capital returned', 'After terminal closure, the bound local controller refunds exactly 10 to Carol’s recorded fixture beneficiary address.', 'terminal-observation.json'],
  ['Final reconciliation', 'Eight call-boundary observations and five transfer logs reconstruct the custody path; the journal marks external ownership and obligation completeness as outside scope.', 'accounting-journal.json'],
] as const

export default function PolicyComparison() {
  const [choice, setChoice] = useState<keyof typeof outcomes>('protected')
  const outcome = outcomes[choice]
  const isProtected = choice === 'protected'

  return <section className={styles.panel} aria-labelledby="protected-capital-heading">
    <span className={styles.kicker}>The policy decision · illustrative comparison</span>
    <h2 id="protected-capital-heading">Can every token reconcile and still be spent incorrectly?</h2>
    <p className={styles.intro}>The local V3 fixture deposits 80 test-token units: 70 are available to allocate and 10 are restricted refundable sponsor capital. Compare respecting that restriction with treating all 80 as allocation capital.</p>

    <div className={styles.controls} role="group" aria-label="Choose a funding policy">
      {Object.entries(outcomes).map(([key, item]) => <button key={key} type="button" aria-pressed={choice === key} onClick={() => setChoice(key as keyof typeof outcomes)}>{item.label}</button>)}
    </div>

    <div className={`${styles.result} ${isProtected ? styles.valid : styles.invalid}`} aria-live="polite">
      <header className={styles.resultHeader}>
        <div><span className={styles.status}>{isProtected ? '✓' : '⚠'} {outcome.status}</span><h3>{isProtected ? '70 allocated · 10 kept for its restricted purpose' : '80 allocated · the restricted 10 is consumed'}</h3></div>
        <div className={styles.total}><strong>{isProtected ? 70 : 80}</strong><span>allocation units</span></div>
      </header>

      <div className={styles.rows}>
        {outcome.rows.map(row => <div className={styles.row} key={row.name}>
          <span className={styles.person}>{row.name}</span><strong>{row.amount}</strong>
          <div className={styles.track} role="img" aria-label={`${row.name}: illustrative allocation of ${row.amount} units`}><span style={{ width: `${row.share}%` }} /></div>
        </div>)}
        <div className={`${styles.row} ${isProtected ? styles.restricted : styles.consumed}`}>
          <span className={styles.person}>Carol · restricted refund</span><strong>{outcome.restricted}</strong>
          <div className={styles.track} role="img" aria-label={`Restricted capital remaining: ${outcome.restricted} units`}><span style={{ width: `${outcome.restricted * 10}%` }} /></div>
        </div>
      </div>

      <div className={styles.summary}>
        <div><span>Unmet requests</span><strong>{outcome.unmet}</strong></div>
        <div><span>Of 80 deposited, accounted for</span><strong>80</strong></div>
      </div>
      {isProtected
        ? <p className={styles.explanation}>The retained V3 path calculates 35 / 21 / 14, funds and pays those entitlements, then returns the separate 10-unit restricted balance to Carol’s fixture beneficiary address after terminal closure. The remaining 30 are unmet requests, not a debt or a loss.</p>
        : <p className={styles.explanation}>This counterfactual still balances arithmetically: 80 would go to claimants and 20 requests would remain unmet. But it spends the 10-unit restriction. The retained local reserve test rejects an 80-unit funding attempt against 70 committed available units; this 40 / 24 / 16 branch itself was not executed.</p>}
    </div>

    <div className={styles.evidence}>
      <p><span aria-hidden="true">{isProtected ? '✓' : '✕'}</span><strong>{isProtected ? 'Observed locally' : 'Rejected by the local reserve guard'}</strong></p>
      <p>{isProtected ? 'Real proof admission, 70-unit protected funding, three recipient withdrawals, zero claimant liability, and an exact 10-unit terminal refund passed in a Foundry V3 run.' : 'The V3 reserve enforces the 70-unit available cap. A request to fund 80 is rejected without changing protected capital or operation state.'}</p>
      <nav aria-label="Protected capital evidence">
        <a href="/evidence/partial-fill/v3-live-context/reconciliation.json" download>V3 reconciliation ↓</a>
        <a href="/evidence/partial-fill/v3-live-context/terminal-observation.json" download>Terminal observation ↓</a>
        <a href="/evidence/partial-fill/v3-live-context/reserve-v3-tests.log" download>Reserve guard tests ↓</a>
        <a href="/evidence/partial-fill/v3-live-context/README.md" download>V3 evidence notes ↓</a>
      </nav>
    </div>
    <div className={styles.lifecycle}>
      <h3>Follow the retained local lifecycle</h3>
      <ol>{lifecycle.map(([title, detail, file]) => <li key={title}>
        <span className={styles.marker} aria-hidden="true">✓</span>
        <div><strong>{title}</strong><p>{detail}</p><a href={`/evidence/partial-fill/v3-live-context/${file}`} download>Inspect {file} →</a></div>
      </li>)}</ol>
      <p className={styles.equation}>80 deposited = 35 paid to Alice + 21 to Bob + 14 to Carol as claimant + 10 refunded to Carol under fixture policy.</p>
      <p className={styles.equation}>100 requested = 70 allocated under policy + 30 unmet requests.</p>
      <p className={styles.equation}>70 funded claimant liability = 70 paid + 0 remaining.</p>
    </div>
    <Link href="/demos/partial-fill-accounting#accounting-review">Verify, review and ratify the accounting separately →</Link>
    <p className={styles.caveat}>Illustrative comparison, not two executed branches. Bars show how the same 80 deposited units could be classified; the retained V3 execution and rejection evidence are linked above. The local fixture policy names Carol as refund beneficiary; it does not independently establish real-world beneficial ownership.</p>
  </section>
}
