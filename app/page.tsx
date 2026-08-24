import Link from 'next/link'
import styles from './home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <img className={styles.logo} src="/prf-logo.png" alt="PRF logo" />
          <span className={styles.eyebrow}>Executable assurance for protocol decisions</span>
          <h1 className={styles.title}>Make protocol decisions independently verifiable.</h1>
          <p className={styles.tagline}>
            PRF binds protocol actions to the state, policy, authority and evidence
            that produced them — so allocations, settlements and other consequential
            decisions can be independently reconstructed and checked.
          </p>
          <div className={styles.ctas}>
            <Link href="/demos/liquidity-shortfall" className={styles.primaryCta}>
              See Provably Fair Pro-Rata
            </Link>
            <a href="#assurance-model" className={styles.secondaryCta}>
              How PRF works
            </a>
          </div>
        </div>
      </section>

      <section className={styles.flagship}>
        <span className={styles.eyebrow}>Flagship demonstration</span>
        <h2>Provably Fair Pro-Rata</h2>
        <p className={styles.sectionLead}>
          $100 requested. $70 available. Who gets what — and can anyone independently
          prove the allocation was correct?
        </p>
        <div className={styles.allocation}>
          <div><span>Requests</span><strong>Alice 50 · Bob 30 · Carol 20</strong></div>
          <b>↓</b><div><span>Policy · Available</span><strong>Pro-rata allocation · 70 USDC</strong></div>
          <b>↓</b><div><span>Realized distribution</span><strong>Alice 35 · Bob 21 · Carol 14</strong></div>
        </div>
        <ul className={styles.checks}>
          <li>✓ allocation conserved</li><li>✓ policy applied</li><li>✓ exact inputs bound</li><li>✓ realized result verified</li>
        </ul>
      </section>

      <section className={styles.assurance} id="assurance-model">
        <span className={styles.eyebrow}>What makes a claim verifiable?</span>
        <h2>Six dimensions. One reproducible assurance context.</h2>
        <div className={styles.tokens}>{['Claim', 'Target', 'State', 'Policy', 'Authority', 'Time'].map((token) => <span key={token}>{token}</span>)}</div>
        <p>PRF binds these dimensions into a reproducible context. A verifier can reconstruct what should have happened from authoritative inputs, then compare it with the realized result.</p>
      </section>

      <section className={styles.promise}>
        <div><h2>Computed, not scripted.</h2><p>Every public result is produced by executable PRF semantics, verification and evidence machinery. The explanation is simplified; the result is not.</p></div>
        <div><h2>Reconstructed, not asserted.</h2><p>Independent verification derives the expected result from the authoritative inputs and checks what actually happened.</p></div>
      </section>
    </div>
  )
}
