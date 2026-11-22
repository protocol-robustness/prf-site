import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import NotebookReproductionCTA from '../../../components/demo/NotebookReproductionCTA'

export const metadata: Metadata = {
  title: 'Proof-Bound Pro-Rata Settlement',
  description:
    'A local-chain walkthrough of proof admission, protected funding, entitlement activation, beneficiary withdrawals and refund.',
}

const payouts = [
  { claim: 'Claim A', beneficiary: '0x1111…1111', amount: 35 },
  { claim: 'Claim B', beneficiary: '0x2222…2222', amount: 21 },
  { claim: 'Claim C', beneficiary: '0x3333…3333', amount: 14 },
]

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  )
}

export default function ProRataSettlementPage() {
  return (
    <main className={styles.page}>
      <Link href="/demos" className={styles.back}>← All demos</Link>
      <header className={styles.hero}>
        <span className={styles.kicker}>Local EVM · proof-bound settlement</span>
        <h1>From admitted proof to paid entitlements</h1>
        <p className={styles.lede}>
          Can a deployment-derived proof bind a protected reserve to an allocation,
          then settle each beneficiary exactly once? This walkthrough follows the
          recorded local run from proof admission through the final payouts.
        </p>
        <div className={styles.heroFacts}>
          <span><b>70</b> available units</span>
          <span><b>10</b> protected units</span>
          <span><b>3</b> beneficiaries</span>
          <span><b>31337</b> local chain</span>
        </div>
      </header>

      <section className={styles.flow} aria-label="Settlement sequence">
        <div><span>01</span><b>Admit proof</b><small>Groth16 · source-bound</small></div>
        <i aria-hidden="true">→</i>
        <div><span>02</span><b>Fund</b><small>Reserve → allocator</small></div>
        <i aria-hidden="true">→</i>
        <div><span>03</span><b>Activate</b><small>3 committed claims</small></div>
        <i aria-hidden="true">→</i>
        <div><span>04</span><b>Withdraw</b><small>35 + 21 + 14</small></div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.step}>01</span>
          <div><h2>The proof matches the prepared operation</h2>
            <p>The local verifier admits a Groth16 proof for the deployment-derived witness. The receipt and public values then feed source assurance and ratification.</p></div>
        </div>
        <div className={styles.metrics}>
          <Metric label="Proof system" value="Groth16" note="SP1 source-bound entitlement program" />
          <Metric label="Entitlement total" value="70" note="3 claims · vector A" />
          <Metric label="Protected floor" value="10" note="remains in the reserve" />
        </div>

      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.step}>02</span>
          <div><h2>Funding preserves the protected floor</h2>
            <p>After ratification, the reserve has exactly 10 units left while 70 move into allocator custody. No temporary reservation remains.</p></div>
        </div>
        <div className={styles.balance}>
          <div className={styles.balanceRow}><span>Reserve before</span><b>80</b><span className={styles.bar}><i style={{ width: '100%' }} /></span></div>
          <div className={styles.balanceRow}><span>Allocator before</span><b>0</b><span className={styles.bar}><i style={{ width: '0%' }} /></span></div>
          <div className={styles.balanceDivider}>Proof admitted · ratification funded</div>
          <div className={styles.balanceRow}><span>Reserve after</span><b>10</b><span className={styles.bar}><i style={{ width: '12.5%' }} /></span></div>
          <div className={styles.balanceRow}><span>Allocator after</span><b>70</b><span className={styles.bar}><i style={{ width: '87.5%' }} /></span></div>
        </div>
        <p className={styles.annotation}>The reserve holds 80 units before funding. The 10-unit protected floor is retained; the remaining 70 become the funded entitlement amount.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.step}>03</span>
          <div><h2>Activation creates liabilities without moving tokens</h2>
            <p>The allocator checks an immutable committed entitlement representation against the proved root, count and total. Activation raises outstanding liability to 70 while allocator custody stays at 70.</p></div>
        </div>
        <div className={styles.activation}>
          <div><span>Custody at allocator</span><b>70 <em>→</em> 70</b></div>
          <div><span>Outstanding liability</span><b>0 <em>→</em> 70</b></div>
          <div><span>Committed claims</span><b>3</b></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.step}>04</span>
          <div><h2>Each beneficiary receives the committed amount</h2>
            <p>All three withdrawals succeeded. The final balances reconcile: 70 paid, zero liability and zero remaining allocator custody.</p></div>
        </div>
        <div className={styles.payouts}>
          <div className={styles.tableHead}><span>Claim</span><span>Fixture beneficiary</span><span>Paid</span></div>
          {payouts.map((payout) => (
            <div className={styles.payoutRow} key={payout.claim}>
              <b>{payout.claim}</b><code>{payout.beneficiary}</code><strong>{payout.amount}</strong>
            </div>
          ))}
          <div className={styles.total}><span>Settled total</span><strong>70</strong></div>
        </div>
        <div className={styles.terminal}>
          <div><span>Allocator balance</span><b>70 → 0</b></div>
          <div><span>Outstanding liability</span><b>70 → 0</b></div>
          <div><span>Reserve balance</span><b>10 → 10</b></div>
          <div><span>Replay after closure</span><b className={styles.rejected}>Rejected</b></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.refund}`}>
        <div className={styles.sectionHead}>
          <span className={styles.step}>↳</span>
          <div><h2>Before activation, the operator can refund</h2>
            <p>A separate local run exercises the pre-activation escape path. It starts from a funded operation and returns all 70 units to the reserve.</p></div>
        </div>
        <div className={styles.refundFlow}>
          <span>Funded · allocator 70</span><b aria-hidden="true">→</b><span>Cancelled · allocator 0 · reserve 80</span>
        </div>
        <p className={styles.annotation}>Duplicate refund and activation after refund both reverted in read-only RPC calls. The refund run is a separate operation from the successful withdrawal run.</p>
      </section>

      <section className={styles.scope}>
        <h2>What this demonstration establishes</h2>
        <p>It records a real proof admitted by the local EVM deployment, the resulting funding and activation, and the beneficiary settlements. It does not establish production deployment or canonical economic identity.</p>
        <ul>
          <li>Execution used local Anvil, chain ID 31337, and a local fixture token.</li>
          <li>State details come from unsigned RPC observations and retained receipts, not cryptographic state proofs.</li>
          <li>Replay and terminal-path rejection are recorded as read-only calls, not mined failed transactions.</li>
        </ul>
        <NotebookReproductionCTA
          label="Compare with the composed 100/70 settlement notebook"
          detail="This is a separate local execution. The notebook demonstrates a different pinned run and does not reproduce the transaction records shown on this page."
        />
        <p className={styles.annotation}>Related PRF model notebooks, using separate slashing fixtures: <Link href="/notebooks/pro-rata-allocation-result/">Canonical allocation artifact →</Link> · <Link href="/notebooks/ef-demo-pro-rata-allocation/">Evidence DAG walkthrough →</Link></p>
        <details className={styles.evidence}>
          <summary>Additional forensics</summary>
          <p className={styles.forensicIntro}>Download the source records behind both local runs. The refund branch is a separate operation from the completed settlement.</p>
          <dl>
            <dt>Settlement run</dt><dd><code>gate-e-20261010-current-00d90</code></dd>
            <dt>Settlement operation</dt><dd><code>0x809b4fbdb632eba4671e5d5f35a37ff12aa4ae28e1ec84aece40972b1138755d</code></dd>
            <dt>Prepared root</dt><dd><code>0xe0c2dc5821ca3b6ec330d8af7bcb407400b19bff4d8ee08f727970494dd85eb2</code></dd>
            <dt>Reserve commitment</dt><dd><code>0xe04f4989c32dfde256d9c2ba9f4187e64910999506bb0528b3fda7c33a8f3aee</code></dd>
            <dt>Refund run</dt><dd><code>gate-e-20261010-refund-00d90</code></dd>
            <dt>Refund operation</dt><dd><code>0x0bd445ed4e0e28efcbf2bb0fee5fa69d8dd40712d99408fa910abecbe43cab35</code></dd>
            <dt>Refund prepared root</dt><dd><code>0x2d30488815e29015b1a3bcc29eaefee8136417b3695ac08771509a05096600ce</code></dd>
            <dt>Refund reserve commitment</dt><dd><code>0xbe55a5233e4e1498624fcceefa04627433c4e6e71ee015f8f2ad03f239ff9f7c</code></dd>
            <dt>Shared source bundle SHA-256</dt><dd><code>a8a9310fbc439a7d9d21d60078cfce78f714cdaafeebd8d27c2b0a80e2310848</code></dd>
          </dl>
          <div className={styles.forensicGroup}>
            <h3>Settlement run</h3>
            <p>Proof identity: <code>source-bound-entitlement-sp1-program.v1</code>, Groth16, VKey <code>0x00d90efa52d17e54670a4248f001e4da443a938f12c55d0d414c125ba68087b9</code>, ELF SHA-256 <code>0x636330de8e7af3485aba50bd3ca4b5e024cc4f977a2bf0f2c005f711e5ffacf8</code>.</p>
            <div className={styles.forensicLinks}>
              <a href="/evidence/pro-rata-settlement/settlement-funding.json" download>Funding record (RPC transactions and receipts)</a>
              <a href="/evidence/pro-rata-settlement/settlement-activation.json" download>Entitlement activation record</a>
              <a href="/evidence/pro-rata-settlement/settlement-withdrawals.json" download>Beneficiary withdrawal records</a>
              <a href="/evidence/pro-rata-settlement/settlement-execution-dag.json" download>Funding execution DAG</a>
              <a href="/evidence/pro-rata-settlement/settlement-activation-execution-dag.json" download>Activation execution DAG</a>
              <a href="/evidence/pro-rata-settlement/settlement-withdrawal-execution-dag.json" download>Withdrawal execution DAG</a>
              <a href="/evidence/pro-rata-settlement/settlement-manifest.json" download>Run manifest</a>
              <a href="/evidence/pro-rata-settlement/settlement-witness.json" download>Proof witness</a>
              <a href="/evidence/pro-rata-settlement/settlement-input-provenance.json" download>Input provenance</a>
              <a href="/evidence/pro-rata-settlement/settlement-proof-fixture.json" download>Proof fixture</a>
              <a href="/evidence/pro-rata-settlement/settlement-proof-raw.json" download>Raw proof payload</a>
            </div>
            <p className={styles.forensicNote}>The funding record contains the captured transaction and receipt data. The original Forge broadcast blob referenced by its digest was not retained, so no substitute broadcast file is presented as that artifact.</p>
          </div>
          <div className={styles.forensicGroup}>
            <h3>Separate refund branch</h3>
            <div className={styles.forensicLinks}>
              <a href="/evidence/pro-rata-settlement/refund-funding.json" download>Refund funding record</a>
              <a href="/evidence/pro-rata-settlement/refund-result.json" download>Refund result and terminal checks</a>
              <a href="/evidence/pro-rata-settlement/refund-preparation.json" download>Refund preparation record</a>
              <a href="/evidence/pro-rata-settlement/refund-execution-dag.json" download>Refund execution DAG</a>
              <a href="/evidence/pro-rata-settlement/refund-manifest.json" download>Run manifest</a>
              <a href="/evidence/pro-rata-settlement/refund-witness.json" download>Proof witness</a>
              <a href="/evidence/pro-rata-settlement/refund-input-provenance.json" download>Input provenance</a>
              <a href="/evidence/pro-rata-settlement/refund-proof-fixture.json" download>Proof fixture</a>
              <a href="/evidence/pro-rata-settlement/refund-proof-raw.json" download>Raw proof payload</a>
              <a href="/evidence/pro-rata-settlement/refund-funding-broadcast.json" download>Funding broadcast capture</a>
              <a href="/evidence/pro-rata-settlement/refund-broadcast.json" download>Refund broadcast capture</a>
            </div>
          </div>
        </details>
      </section>
    </main>
  )
}
