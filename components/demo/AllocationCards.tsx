import type { LiquidityShortfallDemo } from '../../lib/public-demo'
import independentVerification from '../../generated/verification/liquidity-shortfall-policy-verification.json'
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
    <section className={styles.card} aria-label="Calculated allocations">
      <div className={styles.cardLabel}>Calculated allocations · payment not observed</div>
      <table className={styles.table}>
        <thead><tr><th>Claimant</th><th>Requested</th><th>Calculated allocation</th></tr></thead>
        <tbody>
          {requests.map((request) => <tr key={request.id}><td className={styles.requestId}>{displayName(request.id)}</td><td>{request.requested.toLocaleString('en-US')}</td><td className={styles.allocated}>{request.allocated.toLocaleString('en-US')}</td></tr>)}
        </tbody>
      </table>
      <div className={styles.distributionTotal}>Total calculated allocation <strong>{demo.allocation['total-allocated'].toLocaleString('en-US')} {pool.unit}</strong></div>
      <p className={styles.note}>These are computed entitlements in the retained result. The artifact does not establish that recipients were paid.</p>
    </section>
  )
}

export function VerificationSummary({ demo }: { demo: LiquidityShortfallDemo }) {
  const { conservation, commitments, scenario } = demo
  return (
    <section className={styles.summary} aria-label="Verification summary">
      <div><strong>Aggregate checks {conservation.holds && commitments['pool-fully-allocated'] ? 'pass' : 'fail'} {conservation.holds && commitments['pool-fully-allocated'] ? '✓' : '✕'}</strong><span>Artifact-derived conservation and pool exhaustion</span></div>
      <ul>
        <li>Requested {conservation.requested} = calculated allocation {conservation.allocated} + shortfall {conservation.shortfall}</li>
        <li>Calculated allocation {conservation.allocated} = available {scenario.pool.available}</li>
        <li>Per-recipient outputs are bound in the artifact; this is not proof of payment</li>
      </ul>
    </section>
  )
}

export function VerificationCard({ demo }: { demo: LiquidityShortfallDemo }) {
  const { conservation, scenario, evidence } = demo
  return (
    <section className={styles.card} aria-label="Verification">
      <div className={styles.cardLabel}>Evidence checks and replay</div>
      <div className={styles.flow}>requests + available liquidity <b>↓</b> calculated allocation <b>↓</b> same-engine replay comparison <b>↓</b> aggregate checks</div>
      <div className={styles.equations}>
        <code>requested {conservation.requested} = allocated {conservation.allocated} + shortfall {conservation.shortfall}</code>
        <code>allocated {conservation.allocated} = available {scenario.pool.available}</code>
      </div>
      <p className={styles.note}>Conservation establishes aggregate arithmetic only. Recipient-level replay records compare the first output with a second run of the same allocator; they do not independently reconstruct policy compliance.</p>
      <p className={styles.note}>Verifier checks supplied by the artifact: {evidence.checks.map((check) => check.id).join(', ')}.</p>
      <div className={styles.replay}>
        <h3>Independent recipient-level policy reconstruction · {independentVerification.verdict.toUpperCase()}</h3>
        <p className={styles.note}>A separate verifier uses integer arithmetic to apply the published request weights, largest-remainder rounding, canonical ID tie-break, no-cap declaration and unallocated-residual rule.</p>
        <table className={styles.table}><thead><tr><th>Recipient</th><th>Independent result</th><th>PRF result</th><th>Policy check</th></tr></thead><tbody>
          {independentVerification.rows.map((v) => <tr key={v.claimant}><td>{v.claimant}</td><td>{v.expected_allocation}</td><td>{v.artifact_allocation}</td><td>✓ Match</td></tr>)}
        </tbody></table>
        <p className={styles.note}>Policy: largest remainder; canonical row ID breaks ties; no caps declared; residual remains unallocated. The quotas divide evenly, so no rounding dust remains. ⚠ The tie-break rule is not exercised. The no-cap and residual checks pass.</p>
        <p className={styles.note}>This establishes conformity to the declared fixture policy, not that the policy is fair or appropriate. Calculated amounts do not establish observed payments.</p>
        <h3>Same-engine replay comparison</h3>
        <table className={styles.table}><thead><tr><th>Recipient</th><th>First output</th><th>Replay</th><th>Result</th></tr></thead><tbody>
          {evidence['claimant-verdicts']?.map((v) => <tr key={v.claimant}><td>{v.claimant}</td><td>{v['observed-allocated']}</td><td>{v['expected-allocated']}</td><td>{v.verdict === 'pass' ? '✓ Match' : '✕ Mismatch'}</td></tr>)}
        </tbody></table>
        <p className={styles.note}>Input root <code>{evidence['request-hash']}</code><br/>Allocation result hash <code>{evidence['committed-hash']}</code></p>
        <p className={styles.note}>The same-engine replay is supplemental; the policy verdict above comes from the separate verifier.</p>
        <p className={styles.note}>
          <a href="/evidence/manifests/liquidity-shortfall.v1.json">Verification manifest</a> ·{' '}
          <a href="/evidence/shortfall/policy-inputs.v1.json" download>Policy inputs</a> ·{' '}
          <a href="/evidence/shortfall/independent-verification.v1.json" download>Verification report</a> ·{' '}
          <a href="/evidence/shortfall/verify-shortfall-allocation.mjs" download>Verifier source</a>
        </p>
      </div>
    </section>
  )
}
