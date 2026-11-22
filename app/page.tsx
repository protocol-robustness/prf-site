import Link from 'next/link'
import styles from './home.module.css'

const operations = [
  {
    number: '01',
    label: 'Allocation',
    title: 'How should limited resources be shared?',
    description:
      'Examine pro-rata entitlements when valid requests exceed available resources, including the declared policy and its limits.',
    href: '/demos/liquidity-shortfall',
    link: 'Examine a shortfall',
  },
  {
    number: '02',
    label: 'Distribution',
    title: 'What turns an entitlement into settlement?',
    description:
      'Follow a retained local operation from proof-bound funding and activated entitlements through settlement evidence.',
    href: '/demos/composed-pro-rata-settlement',
    link: 'Inspect a settlement',
  },
  {
    number: '03',
    label: 'Withdrawal',
    title: 'What was paid, and what remains?',
    description:
      'Trace beneficiary payments, remaining funded liabilities and the evidence needed to reconcile an operation.',
    href: '/demos/where-did-every-token-go',
    link: 'Follow the accounting',
  },
]

const destinations = [
  {
    title: 'Shortfall resolution',
    description: 'Explore pro-rata allocation when requests exceed available liquidity.',
    href: '/use-cases/partial-fill',
  },
  {
    title: 'Sew Protocol integration',
    description:
      'Inspect a local protected-transfer operation that includes Sew governance and configuration contracts, with its evidence limits.',
    href: '/demos/protected-transfer',
  },
  {
    title: 'Economic assurance',
    description: 'See how claims, policy, authority and evidence relate to economic outcomes.',
    href: '/assurance',
  },
  {
    title: 'Research and evidence',
    description: 'Review the scope and limits attached to published claims and demonstrations.',
    href: '/research',
  },
]

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Protocol Robustness Framework · Economic assurance for Ethereum</span>
          <h1 className={styles.title} id="home-title">
            Make economic outcomes independently verifiable.
          </h1>
          <p className={styles.tagline}>
            PRF examines how Ethereum systems allocate, distribute and release value. Start with
            pro-rata entitlements, shortfalls and the evidence connecting an economic rule to an
            observed outcome.
          </p>
          <p className={styles.boundary}>
            Verification applies to stated inputs, assumptions, policies, implementation
            boundaries and available evidence. It is not a general guarantee that a protocol is
            safe or economically fair.
          </p>
          <div className={styles.ctas}>
            <Link href="/demos/liquidity-shortfall" className={styles.primaryCta}>Examine a shortfall</Link>
            <Link href="/demos/composed-pro-rata-settlement" className={styles.secondaryCta}>Inspect pro-rata settlement</Link>
          </div>
        </div>
      </section>

      <section className={styles.examples} aria-labelledby="examples-title">
        <div className={styles.sectionIntro}>
          <span className={styles.eyebrow}>Pro-rata allocation, distribution and withdrawal</span>
          <h2 id="examples-title">Follow economic entitlements through the operation.</h2>
        </div>
        <div className={styles.exampleGrid}>
          {operations.map((operation) => (
            <article className={styles.exampleCard} key={operation.number}>
              <div className={styles.cardMeta}><span>{operation.number}</span>{operation.label}</div>
              <h3>{operation.title}</h3>
              <p>{operation.description}</p>
              <Link href={operation.href}>{operation.link} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
        <p className={styles.frameworkNote}>
          Allocation policy, recorded entitlement, funding and payment are distinct facts. A
          correct calculation alone does not establish that funds moved or that an outcome was
          fair under every definition.
        </p>
      </section>

      <section className={styles.destinations} aria-labelledby="destinations-title">
        <div className={styles.sectionIntro}>
          <span className={styles.eyebrow}>Economic applications</span>
          <h2 id="destinations-title">Explore the questions and implementations.</h2>
        </div>
        <div className={styles.destinationGrid}>
          {destinations.map((destination) => (
            <Link className={styles.destinationCard} href={destination.href} key={destination.title}>
              <h3>{destination.title}</h3>
              <p>{destination.description}</p>
              <span aria-hidden="true">Explore →</span>
            </Link>
          ))}
        </div>
        <p className={styles.frameworkNote}>
          Demonstrations describe only the operation and evidence identified on each page. They do
          not establish production readiness, security, legal status or universal protocol safety.
        </p>
      </section>
    </div>
  )
}
