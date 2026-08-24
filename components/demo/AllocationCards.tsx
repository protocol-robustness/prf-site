import type { LiquidityShortfallDemo } from '../../lib/public-demo'
import styles from './allocation.module.css'

function displayName(id: string) {
  return id === 'cara' ? 'Carol' : id.charAt(0).toUpperCase() + id.slice(1)
}

export function RequestsCard({ demo }: { demo: LiquidityShortfallDemo }) {
  const { pool, requests } = demo.scenario
  const shortfall = pool.requested - pool.available

  return (
    <section className={styles.card} aria-label="Requests">
      <div className={styles.cardLabel}>Exact inputs</div>
      <table className={styles.table}>
        <thead><tr><th>Request</th><th>Amount</th></tr></thead>
        <tbody>
          {requests.map((request) => <tr key={request.id}><td className={styles.requestId}>{displayName(request.id)}</td><td>{request.requested.toLocaleString('en-US')} {pool.unit}</td></tr>)}
        </tbody>
      </table>
      <div className={styles.facts}>
        <span>Total requested <strong>{pool.requested.toLocaleString('en-US')} {pool.unit}</strong></span>
        <span>Available <strong>{pool.available.toLocaleString('en-US')} {pool.unit}</strong></span>
      </div>
      <p className={styles.note}>Valid requests exceed available liquidity by <strong>{shortfall.toLocaleString('en-US')} {pool.unit}</strong>.</p>
    </section>
  )
}

export function PolicyCard({ demo }: { demo: LiquidityShortfallDemo }) {
  const { available, requested, unit } = demo.scenario.pool
  const factor = (available / requested) * 100

  return (
    <section className={styles.card} aria-label="Allocation policy">
      <div className={styles.cardLabel}>Governing rule</div>
      <h2 className={styles.policyTitle}>Pro-rata allocation</h2>
      <p className={styles.note}>Every valid request receives the same proportion of its requested amount.</p>
      <div className={styles.formula}>
        <span>available / requested</span><strong>{available} / {requested} = {factor}%</strong>
      </div>
      <p className={styles.note}>The {factor}% factor is the rule used to derive each expected share.</p>
      <span className={styles.unit}>{unit}</span>
    </section>
  )
}

export function DistributionCard({ demo }: { demo: LiquidityShortfallDemo }) {
  const { pool, requests } = demo.scenario
  return (
    <section className={styles.card} aria-label="Realized distribution">
      <div className={styles.cardLabel}>Realized distribution</div>
      <table className={styles.table}>
        <thead><tr><th>Claimant</th><th>Requested</th><th>Received</th></tr></thead>
        <tbody>
          {requests.map((request) => <tr key={request.id}><td className={styles.requestId}>{displayName(request.id)}</td><td>{request.requested.toLocaleString('en-US')}</td><td className={styles.allocated}>{request.allocated.toLocaleString('en-US')}</td></tr>)}
        </tbody>
      </table>
      <div className={styles.distributionTotal}>Total distributed <strong>{demo.allocation['total-allocated'].toLocaleString('en-US')} {pool.unit}</strong></div>
    </section>
  )
}

export function VerificationSummary({ demo }: { demo: LiquidityShortfallDemo }) {
  const { conservation, commitments, scenario } = demo
  return (
    <section className={styles.summary} aria-label="Verification summary">
      <div><strong>Evidence checks {conservation.holds && commitments['pool-fully-allocated'] ? 'passed' : 'did not pass'} {conservation.holds && commitments['pool-fully-allocated'] ? '✓' : '✕'}</strong><span>Artifact-derived verification summary</span></div>
      <ul>
        <li>Requested {conservation.requested} = distributed {conservation.allocated} + shortfall {conservation.shortfall}</li>
        <li>Distributed {conservation.allocated} = available {scenario.pool.available}</li>
        <li>Realized claimant allocations are bound in the artifact</li>
      </ul>
    </section>
  )
}

export function VerificationCard({ demo }: { demo: LiquidityShortfallDemo }) {
  const { conservation, scenario, evidence } = demo
  return (
    <section className={styles.card} aria-label="Verification">
      <div className={styles.cardLabel}>Independent reconstruction</div>
      <div className={styles.flow}>requests + available liquidity + allocation policy <b>↓</b> expected distribution <b>↓</b> compare with realized distribution <b>↓</b> evidence checks</div>
      <div className={styles.equations}>
        <code>requested {conservation.requested} = allocated {conservation.allocated} + shortfall {conservation.shortfall}</code>
        <code>allocated {conservation.allocated} = available {scenario.pool.available}</code>
      </div>
      <p className={styles.note}>Conservation establishes that aggregate value closes exactly. The committed artifact also records each realized claimant allocation. This public artifact exposes aggregate conservation and pool-exhaustion checks; it does not expose a separate per-claimant policy-reconstruction verdict.</p>
      <p className={styles.note}>Verifier checks supplied by the artifact: {evidence.checks.map((check) => check.id).join(', ')}.</p>
    </section>
  )
}
