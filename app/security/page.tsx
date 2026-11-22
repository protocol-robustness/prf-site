import type { Metadata } from 'next'
import Link from 'next/link'
import { demosForCapability } from '../../lib/demo-presentation'
import styles from './security.module.css'

export const metadata: Metadata = {
  title: 'How PRF Contributes to Ethereum Security',
  description:
    'How the Protocol Robustness Framework helps Ethereum teams find economic failure paths, verify evidence, and constrain supported capital operations.',
}

const securityContributions = [
  {
    number: '01',
    title: 'Find economic failure paths',
    body: 'Model liquidity shortfalls, adversarial claim ordering, incentive rules and boundary conditions. This helps teams see how economic assumptions behave under stated scenarios before relying on them.',
  },
  {
    number: '02',
    title: 'Make security claims checkable',
    body: 'Bind results to declared inputs, policies, state and time. Retain artifacts so another implementation or reviewer can reconstruct what a result does and does not establish.',
  },
  {
    number: '03',
    title: 'Reject stale or substituted evidence',
    body: 'Test whether reordered evidence, outdated state or mismatched operation context can be used to justify a decision. Preserve rejected cases alongside successful ones.',
  },
  {
    number: '04',
    title: 'Gate sensitive operations where integrated',
    body: 'Protected-operation designs can require admitted proofs, authorized approval and current state commitments before supported capital or state transitions proceed.',
  },
]

export default function SecurityPage() {
  const demos = demosForCapability('security')

  return <main className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>Ethereum security · economic assurance</span>
      <h1>Find economic failure paths before they become protocol incidents.</h1>
      <p className={styles.lede}>
        Ethereum security depends on more than correct contract execution. Protocols also
        rely on economic rules, available liquidity, current state, evidence and authority.
        The Protocol Robustness Framework (PRF) helps teams test those conditions and make
        bounded claims independently checkable.
      </p>
      <div className={styles.ctas}>
        <Link href="#security-demos" className={styles.primaryCta}>Explore security evidence</Link>
        <Link href="/assurance" className={styles.secondaryCta}>How economic assurance works</Link>
      </div>
    </header>

    <section className={styles.contributions} aria-labelledby="contributions-title">
      <span className={styles.eyebrow}>How PRF can strengthen security</span>
      <h2 id="contributions-title">Turn security questions into testable conditions.</h2>
      <div className={styles.contributionGrid}>
        {securityContributions.map((item) => <article className={styles.contribution} key={item.number}>
          <span>{item.number}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>)}
      </div>
    </section>

    <section className={styles.securitySection} id="security-demos" aria-labelledby="security-demos-title">
      <span className={styles.eyebrow}>Existing demonstrations</span>
      <h2 id="security-demos-title">Inspect the security evidence.</h2>
      <p className={styles.sectionLead}>
        These canonical demos show specific checks and their qualifications. Each links to
        the same evidence used elsewhere on the site.
      </p>
      <div className={styles.demoGrid}>
        {demos.map((demo) => <article className={styles.demoCard} key={demo.id}>
          <span className={styles.evidenceClass}>{demo.evidenceClass}</span>
          <h3><Link href={demo.route}>{demo.title}</Link></h3>
          <p>{demo.question}</p>
          <p className={styles.evidenceLevel}><b>Evidence:</b> {demo.evidenceLevel}</p>
          <details>
            <summary>Claim and qualification</summary>
            <ul>
              {demo.verifiedClaims.map((claim) => <li key={claim}><b>Supports:</b> {claim}</li>)}
              {demo.limitations.map((limitation) => <li key={limitation}><b>Limit:</b> {limitation}</li>)}
            </ul>
          </details>
          <Link className={styles.demoLink} href={demo.route}>Open canonical demo →</Link>
        </article>)}
      </div>
    </section>

    <aside className={styles.scope} aria-labelledby="scope-title">
      <span className={styles.eyebrow}>Scope matters</span>
      <h2 id="scope-title">PRF supports security work; it does not secure Ethereum by itself.</h2>
      <p>
        Security improvements depend on teams acting on findings, validating fixes and
        deploying appropriate controls. Simulations cover their stated models; local EVM
        runs do not establish public-chain behavior; proofs establish only their encoded
        claims and inputs. PRF does not replace smart-contract audits, formal verification,
        monitoring, or Ethereum consensus security, and no demonstration proves a protocol
        free from vulnerabilities.
      </p>
      <Link href="/demos">Browse all capabilities and demonstrations →</Link>
    </aside>
  </main>
}
