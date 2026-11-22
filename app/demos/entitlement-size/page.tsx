import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Entitlement Table Size · Protected Operations',
  description:
    'Local Anvil measurements show where one-shot entitlement-table deployment reaches the EIP-3860 initcode limit.',
}

const observations = [
  { count: '1,000', bytes: '34,559', gas: '8,261,563', result: 'Deployed', note: 'Conservative local profile', kind: 'qualified' },
  { count: '1,456', bytes: '49,151', gas: '11,999,265', result: 'Deployed', note: 'One byte below the limit', kind: 'edge' },
  { count: '1,457', bytes: '49,183', gas: '—', result: 'Rejected before execution', note: '31 bytes above the limit', kind: 'rejected' },
]

export default function EntitlementSizePage() {
  return (
    <main className={styles.page}>
      <Link href="/demos#protected-operations" className={styles.back}>← Protected operations</Link>
      <header className={styles.hero}>
        <span className={styles.kicker}>Protected operations · deployment boundary</span>
        <h1>How large can one entitlement table be?</h1>
        <p className={styles.lede}>
          A local Anvil probe deployed the current immutable entitlement
          representation at two sizes, then submitted a table just beyond the
          EIP-3860 initcode ceiling. The boundary is concrete: creation input
          grows by 32 bytes per entitlement.
        </p>
        <div className={styles.facts}>
          <span><b>30M</b> block gas limit</span>
          <span><b>49,152</b> max initcode bytes</span>
          <span><b>2,431</b> creation bytecode bytes</span>
          <span><b>31337</b> local chain</span>
        </div>
      </header>

      <section className={styles.section}>
        <h2>Measured constructor boundary</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th scope="col">Entitlements</th><th scope="col">Creation input</th><th scope="col">Local gas</th><th scope="col">Outcome</th></tr></thead>
            <tbody>
              {observations.map((item) => (
                <tr key={item.count} className={styles[item.kind]}>
                  <th scope="row">{item.count}<small>{item.note}</small></th>
                  <td><code>{item.bytes} bytes</code></td>
                  <td><code>{item.gas}</code></td>
                  <td><b>{item.result}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.formula}>
          Creation input = 2,431 byte creation code + 128 fixed ABI bytes + 32 bytes × entitlement count
        </p>
      </section>

      <section className={styles.readout}>
        <article>
          <span className={styles.tag}>Operational profile</span>
          <h2>Use up to 1,000 for this local profile</h2>
          <p>The 1,000-entry constructor deployed successfully using 8,261,563 gas under the 30,000,000 local block gas limit. This is a conservative local operational qualification, not a recommended production limit.</p>
        </article>
        <article>
          <span className={styles.tag}>Protocol edge</span>
          <h2>1,456 fits; 1,457 does not</h2>
          <p>The 1,456-entry creation input was 49,151 bytes, one byte below EIP-3860’s 49,152-byte maximum. At 1,457 entries, the input grew to 49,183 bytes and the RPC rejected it before contract execution.</p>
        </article>
      </section>

      <section className={styles.scope}>
        <h2>What this measurement does and does not establish</h2>
        <ul>
          <li>These are actual constructor submissions on Anvil 1.7.1 for this exact bytecode and ABI encoding.</li>
          <li>The contract has no enforced entitlement-count cap; the 1,000-entry profile is operational guidance.</li>
          <li>The 1,456-entry value is a technical one-shot initcode ceiling, not a recommended supported size.</li>
          <li>This does not qualify Base or another L2’s execution or data-availability cost.</li>
          <li>Larger sets need a staged physical deployment strategy; the logical entitlement root can remain independent of shard size.</li>
        </ul>
        <details className={styles.forensics}>
          <summary>Additional forensics</summary>
          <p>Download the recorded transaction observations and boundary derivation.</p>
          <a href="/evidence/entitlement-size/entitlement-table-deployment-bound-local.json" download>
            Local entitlement-table deployment qualification (JSON)
          </a>
        </details>
      </section>
    </main>
  )
}
