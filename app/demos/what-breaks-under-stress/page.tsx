import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import StressScenarioExplorer from './StressScenarioExplorer'

export const metadata: Metadata = {
  title: 'What Breaks Under Stress?',
  description:
    'Compare retained PRF yield shortfall scenarios, including an adversarial withdrawal ordering attempt, and inspect their replay evidence.',
}

const cases = [
  {
    number: '01',
    label: 'Covered control',
    title: 'Available liquidity covers the request',
    description:
      'Two providers hold 3,000 USDC in principal. Even with the modeled pool at a 50% availability ratio, the single 1,000 USDC withdrawal fits within shared liquidity.',
    result: 'Pass · 3/3 expectations · 3 invariants',
    scenario: 'Y01_vault-shared-liquidity',
    hash: 'aa2ee57486b55bafa89ee34cf1fd8411a48727234592ded4e418fec47de7f7f1',
    trace: '/evidence/stress/yield-001-shared-liquidity.trace.json',
    fixture: '/evidence/stress/Y01_vault-shared-liquidity.edn',
  },
  {
    number: '02',
    label: 'Economic stress',
    title: 'Shared liquidity falls to 60%',
    description:
      'Two providers hold 3,000 USDC in total. The scenario applies a 60% available-liquidity ratio and requests a shared pro-rata withdrawal.',
    result: 'Pass · 4/4 expectations · 3 invariants',
    scenario: 'Y06_multi-party-pro-rata-shortfall',
    hash: '20abed266322a08def13b43db49d298e114170aeb3503891bbfbc871073debbe',
    trace: '/evidence/stress/yield-006-multi-party-shortfall.trace.json',
    fixture: '/evidence/stress/Y06_multi-party-pro-rata-shortfall.edn',
  },
  {
    number: '03',
    label: 'Adversarial variation',
    title: 'Attacker submits first',
    description:
      'Three providers hold 3,500 USDC. Mallory submits the shared withdrawal with her own address first while available liquidity is set to 50%.',
    result: 'Pass · 4/4 expectations · 3 invariants',
    scenario: 'Y07_adversarial-shortfall-exploit',
    hash: 'fa2405cde2403f5d83817f2936c8ceaa5069a87b4297836d69cf757fc3e39519',
    trace: '/evidence/stress/yield-007-adversarial-shortfall.trace.json',
    fixture: '/evidence/stress/Y07_adversarial-shortfall-exploit.edn',
  },
]

export default function WhatBreaksUnderStressPage() {
  return (
    <main className={styles.page}>
      <Link href="/demos" className={styles.back}>← All demos</Link>
      <header className={styles.hero}>
        <span className={styles.kicker}>PRF · simulation · adversarial robustness</span>
        <h1>What Breaks Under Stress?</h1>
        <p className={styles.lede}>
          A liquidity shock can change who gets paid, when, and how much remains owed.
          Compare a shared-pool shortfall with an adversarial attempt to gain priority
          by submitting first, then inspect the retained scenario traces.
        </p>
        <p className={styles.notice}>
          These are simulator-backed reference scenarios for a modeled yield mechanism.
          They are not findings about a named live protocol. Both retained cases pass
          their recorded expectations and invariants; this walkthrough shows a tested
          stress condition and a contained ordering attempt, not a discovered exploit.
        </p>
      </header>

      <StressScenarioExplorer />

      <section className={styles.comparison} aria-labelledby="measured-comparison-heading">
        <div className={styles.comparisonIntro}>
          <span className={styles.label}>Retained simulator measurements</span>
          <h2 id="measured-comparison-heading">What changes across the actual fixtures?</h2>
          <p>The controls above use illustrative values. This comparison reports the retained yield-v1 inputs and suite outcomes below.</p>
        </div>
        <div className={styles.comparisonTableWrap}>
          <table className={styles.comparisonTable}>
            <thead><tr><th>Case</th><th>Recorded variation</th><th>Expectations</th><th>Invariants</th><th>What the result supports</th></tr></thead>
            <tbody>
              <tr><th scope="row">Covered control</th><td>50% liquidity setting; one 1,000 USDC withdrawal; 3,000 USDC principal</td><td>✓ 3 / 3 pass</td><td>✓ 3 pass</td><td>Modeled withdrawal is covered under this fixture.</td></tr>
              <tr><th scope="row">Shared-pool shortfall</th><td>60% available-liquidity ratio; Alice and Bob; 3,000 USDC principal</td><td>✓ 4 / 4 pass</td><td>✓ 3 pass</td><td>Recorded pro-rata shortfall expectations hold for this model.</td></tr>
              <tr><th scope="row">Adversarial ordering</th><td>50% available-liquidity ratio; Mallory submits first; 3,500 USDC principal</td><td>✓ 4 / 4 pass</td><td>✓ 3 pass</td><td>Tested ordering attempt does not falsify the stated expectations.</td></tr>
            </tbody>
          </table>
        </div>
        <p className={styles.comparisonCaveat}>All three cases have zero recorded invariant failures. Passing these fixtures is not evidence that every timing, market condition or implementation has been explored.</p>
      </section>

      <section className={styles.retainedEvidence} aria-labelledby="retained-heading">
        <div><span className={styles.label}>Retained PRF evidence</span><h2 id="retained-heading">Tested scenarios from the yield reference suite</h2><p>The interactive comparison above is illustrative. These versioned simulator fixtures below are the measured cases; their suite checks pass for the stated model revision.</p></div>
      </section>
      <section className={styles.cases} aria-label="Retained PRF stress scenarios">
        {cases.map((item) => (
          <article className={styles.case} key={item.scenario}>
            <div className={styles.caseHeading}>
              <span className={styles.number}>{item.number}</span>
              <div><span className={styles.label}>{item.label}</span><h2>{item.title}</h2></div>
            </div>
            <p>{item.description}</p>
            <div className={styles.outcome}>
              <span>Recorded suite outcome</span><strong>{item.result}</strong>
            </div>
            <dl className={styles.facts}>
              <div><dt>Scenario</dt><dd><code>{item.scenario}</code></dd></div>
              <div><dt>Trace SHA-256</dt><dd><code>{item.hash}</code></dd></div>
            </dl>
            <details className={styles.forensics}>
              <summary>Additional forensics</summary>
              <p>Download the retained source fixture and event trace for independent inspection.</p>
              <div className={styles.links}>
                <a href="/evidence/manifests/what-breaks-under-stress.v1.json" download>Versioned rerun manifest (JSON)</a>
                <a href="/evidence/manifests/prf-demo-manifest.v1.schema.json" download>Shared manifest schema (JSON)</a>
                
                <a href={item.fixture} download>Scenario input (EDN)</a>
                <a href={item.trace} download>Recorded event trace (JSON)</a>
                <a href="/evidence/stress/yield-reference-v1-scenario-results.json" download>Yield reference suite results (JSON)</a>
              </div>
            </details>
          </article>
        ))}
      </section>

      <section className={styles.readout}>
        <h2>What the comparison tells us</h2>
        <p>
          Scarcity is explicit in both fixtures. The adversarial case puts a proposed
          ordering advantage under test; the retained suite records the scenario as
          passing with no invariant failures. That result is bounded to this model,
          these inputs, and this simulator revision. It does not establish that every
          implementation or market condition behaves the same way.
        </p>
        <Link href="/demos/liquidity-shortfall">Explore the pro-rata allocation proof →</Link>
      </section>
    </main>
  )
}
