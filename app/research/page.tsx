import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Research',
  description: 'Research notes on protocol robustness, economic assurance, evidence, and verifiable settlement.',
}
export default function Research() {
  return (
    <main style={{maxWidth: '810px', margin: '0 auto', padding: '3rem 1.5rem 5rem'}}>
      <h1>Research</h1>
      <p style={{color: 'var(--fg-secondary)'}}>Research notes and open questions about independently verifiable protocol behavior.</p>
      <article style={{paddingTop: '2rem', borderTop: '1px solid var(--border)', marginTop: '2rem'}}>
        <p style={{color: 'var(--fg-muted)', fontSize: '.9rem'}}>21 November 2026 · Economic assurance</p>
        <h2><Link href="/research/withdrawal-races-and-fair-shortfall-resolution">Withdrawal Races and Fair Shortfall Resolution in Ethereum</Link></h2>
        <p>Four cases from Moonwell, Aave, Lido and Morpho illustrate how withdrawal ordering, loss recognition and recovery funding shape who bears shortfalls.</p>
      </article>
    </main>
  )
}
