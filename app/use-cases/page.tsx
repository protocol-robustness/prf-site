import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './use-cases.module.css'

export const metadata: Metadata = { title: 'Use Cases · PRF', description: 'Explore applications of PRF for partial settlement, stablecoin systems and auditability.' }

const cases = [
  { title: 'Partial Fill & Parallel Settlement', href: '/use-cases/partial-fill', summary: 'Constrained claims, six local call orders, funded liabilities, payment failure and forensic reconstruction.', label: 'Flagship · settlement and accounting' },
  { title: 'Stablecoin systems', href: '/use-cases/stablecoins', summary: 'Investigate liquidity shortfalls, allocation rules, withdrawals, authority and reconciliation.', label: 'Liquidity and capital workflows' },
  { title: 'Auditability & verification', href: '/use-cases/auditability', summary: 'Reproduce bounded claims, inspect provenance, identify missing evidence and challenge conclusions.', label: 'Evidence and review' },
]

export default function UseCasesPage() {
  return <main className={styles.page}><header className={styles.hero}><span className={styles.eyebrow}>Use cases</span><h1>One framework, different questions to investigate.</h1><p className={styles.lede}>These pages apply the same PRF demonstrations to distinct audiences. They do not fork the underlying computations or evidence.</p></header><section className={styles.section} aria-label="Application pages"><div className={styles.demoGrid}>{cases.map((item)=><article className={styles.demoCard} key={item.href}><span className={styles.evidenceLevel}>{item.label}</span><h2><Link href={item.href}>{item.title}</Link></h2><p>{item.summary}</p><Link className={styles.demoLink} href={item.href}>Explore this application →</Link></article>)}</div></section><p className={styles.framework}>PRF is an open framework for modelling, analysing and verifying protocol behaviour. Use cases illustrate possible applications; they are not ready-to-operate financial services or certifications. Implementers and operators are responsible for their own legal, regulatory, security and operational obligations.</p></main>
}
