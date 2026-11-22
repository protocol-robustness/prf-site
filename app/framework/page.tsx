import Link from 'next/link'
import styles from '../content.module.css'

const scenario = `:events [{:seq 0, :time 1000000,
          :agent "0xAlice", :action "yield_deposit",
          :params {:amount 1000, :token "USDC", :owner-id "0xAlice"}}
         {:seq 1, :time 1000000,
          :agent "0xBob", :action "yield_deposit",
          :params {:amount 2000, :token "USDC", :owner-id "0xBob"}}
         {:seq 2, :time 1100000,
          :agent "governance", :action "set-yield-risk",
          :params {:token "USDC",
                   :shortfall {:available-ratio 0.6,
                               :reason "liquidity-crunch"}}}]`

const operations = [
  {
    title: 'Allocation',
    text: 'Compare requested claims with available resources under a declared pro-rata policy.',
    href: '/demos/liquidity-shortfall',
    link: 'Inspect a shortfall allocation',
  },
  {
    title: 'Distribution',
    text: 'Follow how an accepted entitlement is funded and recorded as a settlement obligation.',
    href: '/demos/composed-pro-rata-settlement',
    link: 'Inspect the retained settlement',
  },
  {
    title: 'Withdrawal',
    text: 'Trace payments, remaining obligations and the evidence available for reconciliation.',
    href: '/demos/where-did-every-token-go',
    link: 'Inspect withdrawal accounting',
  },
]

export default function FrameworkPage() {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.kicker}>Protocol Robustness Framework</span>
      <h1 className={styles.title}>Examine economic outcomes from allocation through payment.</h1>
      <p className={styles.lede}>PRF focuses on economic assurance for Ethereum systems. Its leading area of work is pro-rata allocation, distribution and withdrawal, including what happens when available resources fall short of claims.</p>
      <p className={styles.boundary}>Each result is limited to its stated inputs, assumptions, policy, implementation and evidence. A checked calculation does not by itself establish that funds moved, inputs are authentic, or an outcome is fair under every definition.</p>
    </header>

    <section className={styles.section}>
      <h2>A shortfall begins with declared economic conditions</h2>
      <p className={styles.sectionLead}>This published scenario describes deposits followed by a liquidity shortfall. It makes the assumed amounts, timing and policy explicit so the resulting claim can be interpreted within its fixture.</p>
      <div className={styles.codePanel}><div className={styles.codeHeader}><b>Shortfall scenario</b><span>Y06 multi-party pro-rata shortfall · EDN</span></div><pre className={styles.code}><code>{scenario}</code></pre></div>
      <p className={styles.textEquivalent}>Text equivalent: Alice and Bob deposit 1,000 and 2,000 USDC at time 1,000,000; governance sets the available ratio to 0.6 at time 1,100,000, citing a liquidity crunch. These are model inputs, not observed public-chain events or authenticated liquidity records.</p>
    </section>

    <section className={styles.section}>
      <h2>Follow the economic operation</h2>
      <p className={styles.sectionLead}>The same question changes as it moves through allocation, distribution and withdrawal. The evidence must keep those stages distinct.</p>
      <ol className={styles.stepList}><li><b>Claims and policy</b><span>Identify included requests, available resources and the declared allocation rule.</span></li><li><b>Entitlements</b><span>Check the calculated amounts and their conservation against the chosen policy.</span></li><li><b>Funding and settlement</b><span>Distinguish an accepted calculation from recorded liabilities and capital movement.</span></li><li><b>Withdrawals</b><span>Reconcile observed payments with what remains owed or unresolved.</span></li></ol>
      <p className={styles.textEquivalent}>Text equivalent: the four ordered stages run from claims and policy to entitlements, funding and settlement, then withdrawals. Evidence at one stage does not establish the next stage.</p>
      <p className={styles.sectionLead}>A content hash can bind bytes and detect substitution within its trust model. It does not independently establish source honesty, legal authority, complete history, or public-chain consensus.</p>
    </section>

    <section className={styles.section}>
      <h2>Explore pro-rata operations</h2>
      <div className={styles.grid2}>{operations.map((operation) => <article className={styles.card} key={operation.title}><h3>{operation.title}</h3><p>{operation.text}</p><Link href={operation.href}>{operation.link} →</Link></article>)}</div>
    </section>

    <section className={styles.section}>
      <h2>Related economic applications</h2>
      <p className={styles.sectionLead}>Shortfall resolution is a leading application of pro-rata allocation. The Sew Protocol is a separate implementation; its integration and evidence have their own scope.</p>
      <div className={styles.linkRow}><Link href="/use-cases/partial-fill">Explore shortfall resolution</Link><Link href="/demos/protected-transfer">Inspect the retained Sew integration operation</Link><Link href="/notebooks">Browse published notebooks</Link></div>
    </section>

    <p className={styles.sourceNote}>Framework source baseline: protocol-robustness-framework <code>origin/main</code> at <code>aed2a7852809f0fd81e98fddd2e6f86a6dd27ea0</code>. The displayed Y06 scenario bytes match the published site copy; it is a scenario fixture, not an authenticated execution record.</p>
  </main>
}
