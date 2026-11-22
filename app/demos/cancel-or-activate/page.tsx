import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Cancel or Activate · Protected Operations',
  description: 'Two local runs show the lifecycle boundary between a pre-activation refund and activated entitlement settlement.',
}

const artifacts = [
  ['Refund result', 'refund-result.json'],
  ['Refund funding record', 'refund-funding.json'],
  ['Refund preparation', 'refund-preparation.json'],
  ['Refund execution DAG', 'refund-execution-dag.json'],
  ['Refund manifest', 'refund-manifest.json'],
  ['Refund witness', 'refund-witness.json'],
  ['Refund proof fixture', 'refund-proof-fixture.json'],
  ['Refund raw proof', 'refund-proof-raw.json'],
  ['Refund funding broadcast', 'refund-funding-broadcast.json'],
  ['Refund broadcast', 'refund-broadcast.json'],
  ['Settlement activation', 'settlement-activation.json'],
  ['Settlement withdrawals', 'settlement-withdrawals.json'],
  ['Settlement funding', 'settlement-funding.json'],
  ['Settlement execution DAG', 'settlement-execution-dag.json'],
  ['Activation execution DAG', 'settlement-activation-execution-dag.json'],
  ['Withdrawal execution DAG', 'settlement-withdrawal-execution-dag.json'],
  ['Settlement manifest', 'settlement-manifest.json'],
  ['Settlement witness', 'settlement-witness.json'],
  ['Settlement proof fixture', 'settlement-proof-fixture.json'],
  ['Settlement raw proof', 'settlement-proof-raw.json'],
]

export default function CancelOrActivatePage() {
  return (
    <main className={styles.page}>
      <Link href="/demos#protected-operations" className={styles.back}>← Protected operations</Link>
      <header className={styles.hero}>
        <span className={styles.kicker}>Protected operations · lifecycle boundary</span>
        <h1>Cancel before activation. Settle after.</h1>
        <p className={styles.lede}>
          What happens to protected capital when an operation stops before its
          entitlements become active? Two local runs show distinct outcomes:
          refund a funded operation before activation, or activate an allocation
          and pay its beneficiaries.
        </p>
        <div className={styles.facts}>
          <span><b>70</b> funded units per run</span>
          <span><b>2</b> separate operation identities</span>
          <span><b>31337</b> local chain</span>
        </div>
      </header>

      <section className={styles.boundary} aria-label="Activation boundary">
        <article className={styles.pre}>
          <span className={styles.label}>Before activation</span>
          <h2>Funded capital can return</h2>
          <p>Cancellation refunds 70 units to the reserve. No entitlement liability has opened.</p>
          <div className={styles.balances}><span>Reserve <b>10 → 80</b></span><span>Allocator <b>70 → 0</b></span></div>
          <strong>Cancelled · refunded</strong>
        </article>
        <div className={styles.cutpoint}>
          <span>Activation</span><b aria-hidden="true">→</b><small>entitlements become authoritative</small>
        </div>
        <article className={styles.post}>
          <span className={styles.label}>After activation</span>
          <h2>Liabilities settle to claims</h2>
          <p>The committed 70 units become beneficiary liabilities. Ordinary cancellation and funder refund are no longer available.</p>
          <div className={styles.balances}><span>Liability <b>0 → 70 → 0</b></span><span>Allocator <b>70 → 0</b></span></div>
          <strong>Closed · 35 + 21 + 14 paid</strong>
        </article>
      </section>

      <section className={styles.section}>
        <h2>Two recorded operation paths</h2>
        <div className={styles.columns}>
          <article>
            <span className={styles.run}>gate-e-20261010-refund-00d90</span>
            <h3>Refund branch</h3>
            <p>A funded operation was cancelled before activation. The refund completed; duplicate refund and activation after refund were rejected by read-only RPC calls.</p>
            <code>0x0bd445ed4e0e28efcbf2bb0fee5fa69d8dd40712d99408fa910abecbe43cab35</code>
          </article>
          <article>
            <span className={styles.run}>gate-e-20261010-current-00d90</span>
            <h3>Activation and settlement</h3>
            <p>A different funded operation activated three committed claims. All withdrawals completed, leaving zero allocator custody and zero outstanding liability.</p>
            <code>0x809b4fbdb632eba4671e5d5f35a37ff12aa4ae28e1ec84aece40972b1138755d</code>
          </article>
        </div>
      </section>

      <aside className={styles.scope}>
        <h2>Evidence boundary</h2>
        <p>These are two recorded local runs, not a same-operation race experiment. They illustrate the lifecycle cutpoint; they do not establish production deployment or cryptographic proofs of chain state.</p>
        <ul>
          <li>Both runs used local Anvil, chain ID 31337, and a fixture token.</li>
          <li>State observations come from retained RPC records and receipts.</li>
          <li>Rejection checks were read-only calls, not mined failed transactions.</li>
        </ul>
        <details className={styles.forensics}>
          <summary>Additional forensics</summary>
          <p>Download the public records for both operation paths.</p>
          <div className={styles.links}>
            {artifacts.map(([label, file]) => (
              <a key={file} href={'/evidence/pro-rata-settlement/' + file} download>{label}</a>
            ))}
          </div>
        </details>
      </aside>
    </main>
  )
}
