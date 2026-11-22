import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './demos.module.css'
import EconomicIcon from '../../components/demo/EconomicIcon'
import { demosForCapability } from '../../lib/demo-presentation'

const capabilityGroups = [
  { id: 'security', key: 'security', label: 'Security', description: 'Test economic failures, state integrity and evidence boundaries.' },
  { id: 'operations', key: 'operations', label: 'Operations', description: 'Check what must line up before an operation can move capital.' },
  { id: 'withdrawals-accounting', key: 'withdrawals', label: 'Withdrawals & accounting', description: 'Trace who was paid, what remains in custody and which liabilities remain.' },
  { id: 'incentives', key: 'incentives', label: 'Incentives', description: 'Review how contributions are checked, challenged and made eligible.' },
] as const

export const metadata: Metadata = {
  title: 'Demos',
  description:
    'Explore PRF simulations, protected operations, and independent research through their evidence and recorded outcomes.',
}

export default function DemosPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Demos</h1>
      <p className={styles.lede}>
        Explore the work by area. Each demo presents a concrete question and the
        evidence behind its result.
      </p>

      <p className={styles.lede}>Start with <Link href="/demos/composed-pro-rata-settlement">From Shortfall to Verified Settlement</Link>: one controlled operation, from 100 requested and 70 available through protected withdrawals, liability closure and verifiable forensic evidence.</p>

      <section className={styles.assuranceStory} aria-labelledby="story-heading">
        <div className={styles.storyIntro}><span>Economic assurance</span><h2 id="story-heading">From investigation to protected execution</h2><p>A connected view of how EAE examines outcomes, accounts for value, reviews findings and constrains capital movement.</p></div>
        <div className={styles.storyFlow}>
          <Link href="/demos/what-breaks-under-stress" className={styles.storyNode}><EconomicIcon name="flask" className={styles.storyIcon} /><b>Research</b><span>What happens under stress?</span></Link><span className={styles.storyArrow} aria-hidden="true">↓</span>
          <Link href="/demos/where-did-every-token-go" className={styles.storyNode}><EconomicIcon name="ledger" className={styles.storyIcon} /><b>Accounting</b><span>Where did every token go?</span></Link><span className={styles.storyArrow} aria-hidden="true">↓</span>
          <Link href="/demos/can-anyone-verify-the-research" className={styles.storyNode}><EconomicIcon name="network" className={styles.storyIcon} /><b>Independent research</b><span>Can anyone verify the result?</span></Link><span className={styles.storyArrow} aria-hidden="true">↓</span>
          <Link href="/demos/composed-pro-rata-settlement" className={styles.storyNode}><EconomicIcon name="shield" className={styles.storyIcon} /><b>Protected operations</b><span>Can assurance gate capital movement?</span></Link>
        </div>
        <p className={styles.storyCaption}>Conceptual progression across the demos; each capability can also be explored independently.</p>
      </section>

      <section className={styles.section} aria-labelledby="capability-index-title">
        <header className={styles.sectionHeader}>
          <h2 id="capability-index-title">Browse by capability</h2>
          <p>Each route below points to the same canonical demo used by the audience pages.</p>
        </header>
        <div className={styles.capabilityBrowseGrid}>
          {capabilityGroups.map((group) => (
            <article className={styles.capabilityBrowse} key={group.key}>
              <h3><a href={`#${group.id}`}>{group.label} →</a></h3>
              <p>{group.description}</p>
              <ul>{demosForCapability(group.key).slice(0, 2).map((demo) => (
                <li key={demo.id}><Link href={demo.route}>{demo.title}</Link><small className={styles.evidenceTag}>{demo.evidenceClass}</small></li>
              ))}</ul>
            </article>
          ))}
        </div>
      </section>

      <nav className={styles.anchorNav} aria-label="Demo sections">
        <a href="#security">Security</a>
        <a href="#operations">Operations</a>
        <a href="#withdrawals-accounting">Withdrawals &amp; accounting</a>
        <a href="#incentives">Incentives</a>
      </nav>

      <section id="protocol-robustness" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="security">Security · Protocol Robustness Framework (PRF)</h2>
          <p>Simulation, invariants, evidence, proofs and canonical records. <Link href="/security">How PRF contributes to Ethereum security →</Link></p>
        </header>
        <div className={styles.grid}>
          <Link href="/demos/what-breaks-under-stress" className={styles.card}>
            <span className={styles.cardTag}>Research · simulation · adversarial</span>
            <h3>What Breaks Under Stress?</h3>
            <p>
              Compare retained liquidity shortfall scenarios and test whether an
              adversarial withdrawal order changes the outcome.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/liquidity-shortfall" className={styles.card}>
            <span className={styles.cardTag}>Featured · economic stress</span>
            <h3>Pro-Rata Allocation Under Shortfall</h3>
            <p>
              Independently reconstruct this fixture’s recipient allocations from its declared policy, then inspect the evidence limits.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/canonical-comparison" className={styles.card}>
            <span className={styles.cardTag}>Verification · canonical records · cross-language</span>
            <h3>Can Two Programs Verify the Same Record?</h3>
            <p>
              See independent Clojure and Rust verifiers reconstruct one retained
              economic result, then inspect what field order and record scope mean.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/current-head" className={styles.card}>
            <span className={styles.cardTag}>Assurance · authoritative state</span>
            <h3>Authoritative State</h3>
            <p>
              Can a stale result become the basis of a new protocol action? The
              verified head remains unchanged.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/network-latestness" className={styles.card}>
            <span className={styles.cardTag}>Network · checkpoints · latestness</span>
            <h3>What Does “Latest” Mean on a Network?</h3>
            <p>
              Compare independent checkpoint observations, detect lag and forks,
              and see why agreement among sources is not proof of global latestness.
            </p>
            <span className={styles.cardCta}>Explore network observations →</span>
          </Link>

          <Link href="/demos/network-scenarios" className={styles.card}>
            <span className={styles.cardTag}>Network · forks · witnesses · source coverage</span>
            <h3>Three Ways Network Views Can Disagree</h3>
            <p>
              Explore competing checkpoints, membership-bound witness thresholds,
              and a newer checkpoint hidden from queried sources.
            </p>
            <span className={styles.cardCta}>Explore network scenarios →</span>
          </Link>

          <Link href="/demos/reordered-evidence" className={styles.card}>
            <span className={styles.cardTag}>Provenance · evidence integrity</span>
            <h3>Tamper-Evident Evidence</h3>
            <p>
              Does the same evidence in a different order mean the same thing? The
              chain verifier rejects the reordered evidence.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>
        </div>
      </section>

      <section id="withdrawals-accounting" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Withdrawals &amp; accounting</h2>
          <p>Follow who is owed what, which funds moved, and which liabilities remain.</p>
        </header>
        <div className={styles.grid}>
          <Link href="/demos/where-did-every-token-go" className={styles.card}>
            <span className={styles.cardTag}>Accounting · custody · reconciliation</span>
            <h3>Where Did Every Token Go?</h3>
            <p>Reconcile reserve assets, funded entitlements, beneficiary payments and remaining liabilities across a retained local settlement run.</p>
            <span className={styles.cardCta}>Reconcile the operation →</span>
          </Link>
          <Link href="/demos/partial-fill-accounting" className={styles.card}>
            <span className={styles.cardTag}>Accounting · Partial Fill · reconciliation</span>
            <h3>From Partial Fill to Accounting</h3>
            <p>Trace 100 requested units through 70 funded and paid, keeping unmet requests distinct from liabilities and losses.</p>
            <span className={styles.cardCta}>Reconcile the outcome →</span>
          </Link>
          <Link href="/demos/composed-pro-rata-settlement" className={styles.card}>
            <span className={styles.cardTag}>Flagship · local proof-backed settlement</span>
            <h3>From Shortfall to Settlement</h3>
            <p>Follow allocation, protected funding, beneficiary withdrawals and final liability reconciliation in one controlled operation.</p>
            <span className={styles.cardCta}>Follow the complete operation →</span>
          </Link>
        </div>
      </section>

      <section id="protected-operations" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="operations">Protected operations</h2>
          <p>Assurance-gated state changes and capital execution.</p>
        </header>
        <div className={styles.grid}>
          <Link href="/demos/protected-transfer" className={styles.card}>
            <span className={styles.cardTag}>Local proof-backed replay · Pro-Rata V2 · forensics</span>
            <h3>The Protected Transfer</h3>
            <p>
              Follow a retained operation from proof admission and protected funding through
              35 / 21 / 14 withdrawals, with linked deployment and forensic evidence.
            </p>
            <span className={styles.cardCta}>Replay the evidence →</span>
          </Link>

          <Link href="/demos/partial-fill" className={styles.card}>
            <span className={styles.cardTag}>Partial Fill · controlled shortfall · protected execution</span>
            <h3>What happens when there isn’t enough?</h3>
            <p>100 requested, 70 available. Follow source-bound allocation through real-proof admission and protected local withdrawals.</p>
            <span className={styles.cardCta}>Follow the capital →</span>
          </Link>

          <Link href="/demos/composed-pro-rata-settlement" className={styles.card}>
            <span className={styles.cardTag}>Flagship · proof-bound settlement · local Foundry</span>
            <h3>From Shortfall to Settlement</h3>
            <p>
              Follow a 100-unit request through an independently reproduced 70-unit
              allocation, admitted proof, protected funding, observed withdrawals
              and final reconciliation.
            </p>
            <span className={styles.cardCta}>Inspect the composed execution →</span>
          </Link>

          <Link href="/demos/where-did-every-token-go" className={styles.card}>
            <span className={styles.cardTag}>Accounting · custody · reconciliation</span>
            <h3>Where Did Every Token Go?</h3>
            <p>
              Reconcile reserve assets, funded entitlements, beneficiary payments
              and remaining liabilities across a retained local settlement run.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/partial-fill-accounting" className={styles.card}>
            <span className={styles.cardTag}>Accounting · Partial Fill · reconciliation</span>
            <h3>From Partial Fill to Accounting</h3>
            <p>Trace 100 requested units through 70 funded and paid, while keeping the 30 unmet units distinct from liabilities and losses.</p>
            <span className={styles.cardCta}>Reconcile the outcome →</span>
          </Link>

          <Link href="/demos/pro-rata-settlement" className={styles.card}>
            <span className={styles.cardTag}>Onchain · entitlement settlement</span>
            <h3>Proof-Bound Pro-Rata Settlement</h3>
            <p>
              Can an admitted proof carry a protected allocation through funding,
              beneficiary withdrawals and a safe refund path?
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/cancel-or-activate" className={styles.card}>
            <span className={styles.cardTag}>Lifecycle · capital boundary</span>
            <h3>Cancel or Activate?</h3>
            <p>
              See the two terminal paths for protected capital: refund before
              activation, or settle committed entitlements after it.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/ratification" className={styles.card}>
            <span className={styles.cardTag}>Assurance · proof-bound funding</span>
            <h3>What Must Line Up Before Capital Moves?</h3>
            <p>
              Trace how a proof, prepared operation and live reserve commitment
              gate ratification and protected funding.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/entitlement-size" className={styles.card}>
            <span className={styles.cardTag}>Deployment · capacity boundary</span>
            <h3>How Large Can an Entitlement Table Be?</h3>
            <p>
              See the local deployment results at 1,000, 1,456 and 1,457
              entitlements against the initcode size limit.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>
        </div>
      </section>

      <section id="independent-research" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Independent research</h2>
          <p>Independent research, backed by verifiable evidence. Protocol teams can commission reproducible economic research; researchers can reproduce findings and challenge claims; reviewers apply explicit rules; the community can inspect assumptions and results.</p>
        </header>
        <div className={styles.grid}>
          <Link href="/demos/can-anyone-verify-the-research" className={styles.card}>
            <span className={styles.cardTag}>Reproduction · independent verification</span>
            <h3>Can Anyone Verify the Research?</h3>
            <p>
              Follow a separate implementation and verify that its result matches
              the original computation from rooted inputs.
            </p>
            <span className={styles.cardCta}>See the demo →</span>
          </Link>

          <Link href="/demos/can-you-challenge-a-research-finding" className={styles.card}>
            <span className={styles.cardTag}>Adversarial research · falsification</span>
            <h3>Can You Challenge a Research Finding?</h3>
            <p>
              See how a reproducible allocator counterexample challenges a claim,
              what the current evidence verifies, and what still needs review.
            </p>
            <span className={styles.cardCta}>Inspect the challenge →</span>
          </Link>

          <Link id="incentives" href="/demos/when-does-research-earn-a-reward" className={styles.card}>
            <span className={styles.cardTag}>Research network · contribution incentives</span>
            <h3>How Research Rewards Work</h3>
            <p>
              Trace evidence verification, reviewer authority and policy eligibility;
              see why submitting evidence alone is not enough.
            </p>
            <span className={styles.cardCta}>Explore the workflow →</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
