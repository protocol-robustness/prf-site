import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './demos.module.css'

export const metadata: Metadata = {
  title: 'Demos',
  description:
    'See how protocols behave under failures, disputes, economic stress and adversarial conditions — with the evidence behind every result.',
}

export default function DemosPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Demos</h1>
      <p className={styles.lede}>
        One question, one scenario, one consequence — each backed by the real
        framework and inspectable down to the evidence.
      </p>

      <section className={styles.grid}>
        <Link href="/demos/current-head" className={styles.card}>
          <span className={styles.cardTag}>Featured · economic stress</span>
          <h2>Provably Fair Pro-Rata</h2>
          <p>
            Can an allocation be proven fair from the actual requests, liquidity
            and allocation policy?
          </p>
          <span className={styles.cardCta}>See the demo →</span>
        </Link>


        <Link href="/demos/liquidity-shortfall" className={styles.card}>
          <span className={styles.cardTag}>Assurance · authoritative state</span>
          <h2>Authoritative State</h2>
          <p>
            Can a stale result become the basis of a new protocol action? The
            verified head remains unchanged.
          </p>
          <span className={styles.cardCta}>See the demo →</span>
        </Link>

        <Link href="/demos/reordered-evidence" className={styles.card}>
          <span className={styles.cardTag}>Provenance · evidence integrity</span>
          <h2>Tamper-Evident Evidence</h2>
          <p>
            Does the same evidence in a different order mean the same thing? The
            same chain verifier now rejects it.
          </p>
          <span className={styles.cardCta}>See the demo →</span>
        </Link>
      </section>
    </div>
  )
}
