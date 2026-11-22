import type { Metadata } from 'next'
import Link from 'next/link'
import { CLEANROOM_BASE, publishedNotebookHref } from '../../lib/site-links'
import styles from './notebooks.module.css'

export const metadata: Metadata = {
  title: 'Research & notebooks',
  description:
    'Published static notebook exports for the PRF demonstrations, with the executable Clerk notebooks linked from each demo.',
}

const notebooks = [
  {
    slug: 'composed-pro-rata-v2-settlement',
    tag: 'Flagship · settlement',
    title: 'From Shortfall to Verified Settlement',
    description:
      'The composed shortfall operation the home page follows: pro-rata allocation, Pro-Rata V2 composition and protected local withdrawals.',
  },
  {
    slug: 'pro-rata-allocation-result',
    tag: 'Allocation · evidence',
    title: 'Pro-Rata Allocation Result',
    description:
      'Canonical allocation artifact for the shortfall fixture, including the derived per-claim entitlements and conservation checks.',
  },
  {
    slug: 'ef-demo-pro-rata-allocation',
    tag: 'Evidence DAG',
    title: 'Evidence DAG Walkthrough',
    description:
      'How admitted evidence is ordered and threaded into one reproducible allocation result.',
  },
  {
    slug: 'yield-shortfall-partial-withdrawal-fills',
    tag: 'Yield module · separate model',
    title: 'Yield-Module Partial-Withdrawal Fills',
    description:
      'A separate, illustrative partial-withdrawal model. It does not reproduce the controlled 100/70 contract fixture.',
  },
] as const

export default function NotebooksPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Research &amp; notebooks</h1>
      <p className={styles.lede}>
        Published, deterministic notebook exports for the PRF demonstrations. Each
        demo also links its live executable Clerk notebook, which is composed into
        the distribution from the PRF repository.
      </p>

      <div className={styles.grid}>
        {notebooks.map((notebook) => (
          <Link
            key={notebook.slug}
            href={publishedNotebookHref(notebook.slug)}
            className={styles.card}
          >
            <span className={styles.cardTag}>{notebook.tag}</span>
            <h2>{notebook.title}</h2>
            <p>{notebook.description}</p>
            <span className={styles.cardCta}>Open the notebook →</span>
          </Link>
        ))}
      </div>

      <p className={styles.scope}>
        <strong>Cleanroom notebook:</strong> inspect the not-admitted corpus at its published route: <a href={`${CLEANROOM_BASE}/not_admitted/index.html`}>Open the cleanroom notebook →</a>
      </p>
      <p className={styles.scope}>
        These are published static exports, not the executable notebooks. To run
        the underlying results, follow a demo’s “Inspect … notebook” link and its
        reproduction command.
      </p>
    </div>
  )
}
