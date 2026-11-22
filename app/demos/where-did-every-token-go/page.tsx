import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import IllustrativeReconciliation from './IllustrativeReconciliation'

export const metadata: Metadata = {
  title: 'Where Did Every Token Go?',
  description:
    'Reconcile reserve custody, allocator custody, beneficiary payments and outstanding liabilities across a retained local EVM settlement run.',
}

const payouts = [
  { name: 'Claim A', amount: 35 },
  { name: 'Claim B', amount: 21 },
  { name: 'Claim C', amount: 14 },
]

export default function WhereDidEveryTokenGoPage() {
  return (
    <main className={styles.page}>
      <Link href="/demos" className={styles.back}>← All demos</Link>
      <header className={styles.hero}>
        <span className={styles.kicker}>Protected operations · accounting · reconciliation</span>
        <h1>Where Did Every Token Go?</h1>
        <p className={styles.lede}>
          Follow 80 fixture-token units from the reserve, through proof-bound funding
          and activation, to the three beneficiary payments. Check both sides of the
          ledger: assets in custody and entitlements owed.
        </p>
        <div className={styles.scopeNote}>
          <strong>Scope of this retained run</strong>
          <span>It demonstrates a fully funded settlement and its conservation checks.
          It contains no recognized shortfall or realized loss.</span>
        </div>
      </header>

      <IllustrativeReconciliation />

      <section className={styles.ledger} aria-label="Retained local EVM settlement observations">
        <article className={styles.stage}>
          <span className={styles.stageLabel}>Opening custody</span>
          <h2>Reserve before funding</h2>
          <div className={styles.account}><span>Reserve assets</span><strong>80</strong></div>
          <div className={styles.account}><span>Allocator assets</span><strong>0</strong></div>
          <div className={styles.account}><span>Outstanding entitlements</span><strong>0</strong></div>
          <p>The prepared operation protects 10 units and allocates 70 to the proved entitlement table.</p>
        </article>

        <div className={styles.arrow} aria-hidden="true">→</div>

        <article className={`${styles.stage} ${styles.funded}`}>
          <span className={styles.stageLabel}>After funding and activation</span>
          <h2>Custody matches the obligation</h2>
          <div className={styles.account}><span>Reserve assets</span><strong>10</strong></div>
          <div className={styles.account}><span>Allocator assets</span><strong>70</strong></div>
          <div className={styles.account}><span>Outstanding entitlements</span><strong>70</strong></div>
          <p>Funding moves 70 units into allocator custody. Activation records 70 units owed; it moves no tokens.</p>
        </article>

        <div className={styles.arrow} aria-hidden="true">→</div>

        <article className={`${styles.stage} ${styles.closed}`}>
          <span className={styles.stageLabel}>After settlement</span>
          <h2>Claims paid, liability cleared</h2>
          <div className={styles.account}><span>Reserve assets</span><strong>10</strong></div>
          <div className={styles.account}><span>Allocator assets</span><strong>0</strong></div>
          <div className={styles.account}><span>Paid to beneficiaries</span><strong>70</strong></div>
          <div className={styles.account}><span>Outstanding entitlements</span><strong>0</strong></div>
        </article>
      </section>

      <section className={styles.checks}>
        <div>
          <span className={styles.checkLabel}>Asset conservation</span>
          <strong>80 = 10 + 35 + 21 + 14</strong>
          <p>Opening reserve assets equal the protected reserve balance plus the observed beneficiary payments.</p>
        </div>
        <div>
          <span className={styles.checkLabel}>Entitlement reconciliation</span>
          <strong>70 owed = 70 paid + 0 remaining</strong>
          <p>The activated liability matches the committed total and is zero after all three withdrawals.</p>
        </div>
      </section>

      <section className={styles.payouts}>
        <h2>Observed beneficiary payments</h2>
        <div className={styles.table}>
          {payouts.map((payout) => (
            <div className={styles.row} key={payout.name}>
              <span>{payout.name}</span><span>Fixture beneficiary</span><strong>{payout.amount}</strong>
            </div>
          ))}
          <div className={`${styles.row} ${styles.total}`}><b>Total paid</b><span>3 withdrawals</span><strong>70</strong></div>
        </div>
      </section>

      <section className={styles.scope}>
        <h2>What this reconciliation establishes</h2>
        <p>
          The retained local EVM observations agree on custody, entitlement liability,
          and paid amounts across this settlement. The balance snapshots are unsigned
          RPC observations, not cryptographic state proofs, and this run does not test
          how a loss should be allocated during a real economic shortfall.
        </p>
        <p>
          For the separate allocation-policy walkthrough, see{' '}
          <Link href="/demos/liquidity-shortfall">Pro-Rata Allocation Under Shortfall</Link>. For the retained controlled-shortfall accounting walkthrough, see <Link href="/demos/partial-fill-accounting">From Partial Fill to Accounting</Link>.
        </p>
        <details className={styles.forensics}>
          <summary>Additional forensics</summary>
          <p>These public records are from the same local settlement operation.</p>
          <dl>
            <dt>Run</dt><dd><code>gate-e-20261010-current-00d90</code></dd>
            <dt>Operation</dt><dd><code>0x809b4fbdb632eba4671e5d5f35a37ff12aa4ae28e1ec84aece40972b1138755d</code></dd>
            <dt>Source bundle SHA-256</dt><dd><code>a8a9310fbc439a7d9d21d60078cfce78f714cdaafeebd8d27c2b0a80e2310848</code></dd>
          </dl>
          <div className={styles.links}>
                <a href="/evidence/manifests/where-did-every-token-go.v1.json" download>Versioned evidence manifest (JSON)</a>
                <a href="/evidence/manifests/prf-demo-manifest.v1.schema.json" download>Shared manifest schema (JSON)</a>
            
            <a href="/evidence/pro-rata-settlement/settlement-funding.json" download>Funding observations</a>
            <a href="/evidence/pro-rata-settlement/settlement-activation.json" download>Activation and liability record</a>
            <a href="/evidence/pro-rata-settlement/settlement-withdrawals.json" download>Withdrawal and payout observations</a>
            <a href="/evidence/pro-rata-settlement/settlement-manifest.json" download>Run manifest</a>
            <a href="/evidence/pro-rata-settlement/settlement-input-provenance.json" download>Input provenance</a>
            <a href="/evidence/pro-rata-settlement/settlement-execution-dag.json" download>Execution DAG</a>
          </div>
        </details>
      </section>
    </main>
  )
}
