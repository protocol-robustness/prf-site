import type { Metadata } from 'next'
import Link from 'next/link'
import EconomicIcon from '../../components/demo/EconomicIcon'
import styles from './assurance.module.css'

export const metadata: Metadata = {
  title: 'What Is Economic Assurance?',
  description: 'How economic claims about Ethereum protocols become testable, reproducible and, where supported, enforceable.',
}

const dimensions = [
  { name: 'Claim', icon: 'document', text: 'What outcome or property is being asserted?' },
  { name: 'Target', icon: 'shield', text: 'Which protocol, contract or operation does it concern?' },
  { name: 'State', icon: 'ledger', text: 'Which inputs, balances and conditions were observed?' },
  { name: 'Policy', icon: 'scales', text: 'Which allocation rules or invariants must hold?' },
  { name: 'Authority', icon: 'network', text: 'Who may verify, approve or authorize the action?' },
  { name: 'Time', icon: 'clock', text: 'When was the claim valid, and is the state still current?' },
] as const

const capabilities = [
  { name: 'Research', icon: 'flask', href: '/demos/what-breaks-under-stress', text: 'Explore economic behaviour under stress, reproduce scenarios and challenge guarantees.' },
  { name: 'Economic accounting', icon: 'ledger', href: '/demos/where-did-every-token-go', text: 'Reconcile capital, obligations, losses, entitlements and payouts.' },
  { name: 'Protected operations', icon: 'shield', href: '/demos/pro-rata-settlement', text: 'Gate supported state changes and capital movements on admitted proofs and current commitments.' },
  { name: 'Independent research', icon: 'network', href: '/demos/can-anyone-verify-the-research', text: 'Reproduce findings and review contributions under explicit evidence and authority rules.' },
] as const

export default function AssurancePage() {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>Economic Assurance for Ethereum</span>
      <h1>What is economic assurance?</h1>
      <p className={styles.lede}><strong>Correct smart-contract execution does not always produce a desirable economic outcome.</strong> Economic assurance makes precisely scoped claims about those outcomes testable and independently verifiable by connecting rules, system state, simulation, evidence and realized execution.</p>
      <p className={styles.heroLimit}>It can help establish what happened under defined conditions. It cannot guarantee that a protocol will never fail.</p>
      <div className={styles.flow} role="group" aria-label="Economic assurance process">
        <article className={styles.flowCard}><span className={styles.flowIcon}><EconomicIcon name="document"/></span><span className={styles.step}>01</span><h2>Define the claim</h2><p>Specify the expected outcome, applicable rules, assumptions and relevant state.</p></article>
        <span className={styles.arrow} aria-hidden="true">→</span>
        <article className={styles.flowCard}><span className={styles.flowIcon}><EconomicIcon name="flask"/></span><span className={styles.step}>02</span><h2>Test and verify</h2><p>Reproduce calculations, check invariants, explore stress scenarios and retain evidence.</p></article>
        <span className={styles.arrow} aria-hidden="true">→</span>
        <article className={styles.flowCard}><span className={styles.flowIcon}><EconomicIcon name="shield"/></span><span className={styles.step}>03</span><h2>Compare or enforce</h2><p>Compare realized outcomes with expectations; where supported, gate operations on admitted proofs and current state commitments.</p></article>
      </div>
      <p className={styles.flowNote}><b>Related, distinct capabilities:</b> research verification tests and reconstructs a claim. Onchain enforcement applies supported conditions at an operation boundary.</p>
    </header>

    <section className={styles.example} aria-labelledby="shortfall-title">
      <div className={styles.sectionHeading}><span className={styles.eyebrow}>A simple shortfall</span><h2 id="shortfall-title">100 units requested. 70 available.</h2><p>Suppose the stated policy is deterministic pro-rata allocation. The numbers below illustrate the arithmetic; they are not a measured PRF result.</p></div>
      <div className={styles.exampleGrid}>
        <div className={styles.visual}>
          <div className={styles.metrics}>
            <div><span>Valid withdrawal requests</span><strong>100</strong><small>units</small></div>
            <div className={styles.available}><span>Available assets</span><strong>70</strong><small>units</small></div>
            <div className={styles.shortfall}><span>Shortfall</span><strong>30</strong><small>units</small></div>
          </div>
          <div className={styles.barLabel}><span>Available capital</span><span>Unfunded request</span></div>
          <div className={styles.bar} role="img" aria-label="Illustrative proportion: 70 percent available assets and 30 percent shortfall">
            <span className={styles.barAvailable}>70</span><span className={styles.barShortfall}>30</span>
          </div>
          <p className={styles.barCaption}>Shares are proportional to the 100-unit request total. The bar shows 70 available and 30 not covered.</p>
        </div>
        <div className={styles.interpretation}>
          <p className={styles.illustrative}><span aria-hidden="true">⚠</span> Illustrative arithmetic · no PRF verification performed</p>
          <ul>
            <li><span className={styles.warn} aria-hidden="true">⚠</span><span><b>Policy compliance</b><small>Must be checked by comparing an allocation against the declared pro-rata rule; no allocation is computed here.</small></span></li>
            <li><span className={styles.check} aria-hidden="true">✓</span><span><b>Illustrative arithmetic</b><small>70 available units plus 30 uncovered units equals 100 requested units.</small></span></li>
            <li><span className={styles.warn} aria-hidden="true">⚠</span><span><b>Realized settlement</b><small>A correct calculation does not establish that transfers occurred or were observed onchain.</small></span></li>
            <li><span className={styles.warn} aria-hidden="true">⚠</span><span><b>Participant losses</b><small>Those with unpaid requests may still suffer an economic loss, even when the policy is followed.</small></span></li>
          </ul>
          <Link className={styles.evidenceLink} href="/demos/liquidity-shortfall">Inspect the retained pro-rata evidence <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>

    <section className={styles.dimensions} aria-labelledby="dimensions-title">
      <div className={styles.sectionHeading}><span className={styles.eyebrow}>The technical foundation</span><h2 id="dimensions-title">Six dimensions bind an assurance context</h2><p>A result is only useful when the claim, subject, inputs, rules, authority and time refer to the same operation.</p></div>
      <div className={styles.dimensionGrid}>{dimensions.map((item) => <article className={styles.dimension} key={item.name}><EconomicIcon name={item.icon} className={styles.dimensionIcon}/><div><h3>{item.name}</h3><p>{item.text}</p></div></article>)}</div>
      <p className={styles.binding}><span aria-hidden="true">⚠</span> A proof may be valid yet unusable if it refers to an outdated reserve commitment, a different target or an operation the signer was not authorized to approve.</p>
    </section>

    <section className={styles.capabilities} aria-labelledby="capabilities-title">
      <div className={styles.sectionHeading}><span className={styles.eyebrow}>What it enables</span><h2 id="capabilities-title">From investigation to protected execution</h2></div>
      <div className={styles.capabilityGrid}>{capabilities.map((item) => <Link className={styles.capability} href={item.href} key={item.name}><EconomicIcon name={item.icon} className={styles.capabilityIcon}/><h3>{item.name}</h3><p>{item.text}</p><span>Explore demo <b aria-hidden="true">→</b></span></Link>)}</div>
    </section>

    <section className={styles.limits} aria-labelledby="limits-title">
      <span className={styles.eyebrow}>Scope and limitations</span><h2 id="limits-title">What assurance does not guarantee</h2>
      <p>Every assurance result is relative to a defined claim, evidence set, assumptions and verification method. It does not automatically establish:</p>
      <ul><li>That economic assumptions are complete or correct.</li><li>That external observations are truthful.</li><li>That every possible failure scenario has been explored.</li><li>That a financially stressed protocol is solvent.</li><li>That a verified calculation was executed onchain.</li></ul>
    </section>

    <nav className={styles.finalLinks} aria-label="Explore economic assurance demos">
      <Link href="/demos/what-breaks-under-stress">Explore economic stress <span aria-hidden="true">→</span></Link>
      <Link href="/demos/pro-rata-settlement">See proof-bound settlement <span aria-hidden="true">→</span></Link>
      <Link href="/demos/can-anyone-verify-the-research">Explore independent research <span aria-hidden="true">→</span></Link>
    </nav>
  </main>
}
