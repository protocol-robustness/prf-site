import type { Metadata } from 'next'
import Link from 'next/link'
import { demosForAudience } from '../../../lib/demo-presentation'
import settlement from '../../../public/evidence/composed-pro-rata-v2-settlement/validation-result.json'
import manifest from '../../../public/evidence/composed-pro-rata-v2-settlement/manifest.json'
import styles from '../use-cases.module.css'

export const metadata: Metadata = {
  title: 'Stablecoin Systems',
  description: 'Explore liquidity shortfalls, allocation rules, withdrawals and reconciliation through existing PRF demonstrations.',
}

const questions = [
  ['What happens when available liquidity cannot fulfil every request?', 'Inspect retained shortfall models and controlled partial settlement examples.', 'what-breaks-under-stress'],
  ['Which allocations follow the declared policy?', 'Reconstruct recipient-level allocations and inspect the policy evidence.', 'liquidity-shortfall'],
  ['Who has withdrawn funds, and which liabilities remain?', 'Trace observed beneficiary withdrawals, custody and funded liabilities.', 'where-did-every-token-go'],
  ['Can stale or mismatched instructions move capital?', 'Review proof admission, authority and reserve-state checks in a local operation.', 'ratification'],
] as const

const demos = demosForAudience('stablecoins')
const featured = demos.find((demo) => demo.id === 'composed-pro-rata-settlement')!
const supporting = demos.filter((demo) => demo.id !== featured.id)
const finalLiability = settlement.stateProjections[settlement.stateProjections.length - 1].observation.outstandingLiability
const paidTotal = settlement.localObservedWithdrawals.reduce((sum, amount) => sum + amount, 0)
const fundedTotal = settlement.stateProjections.find(({ stage }) => stage === 'funded')!.observation.allocatorBalance
const activatedLiability = settlement.stateProjections.find(({ stage }) => stage === 'activated')!.observation.outstandingLiability
const allocationTotal = Object.values(settlement.calculatedAllocations).reduce((sum, amount) => sum + amount, 0)

export default function StablecoinsPage() {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>For stablecoin systems</span>
      <h1>Know what happens when liquidity, obligations and execution diverge.</h1>
      <p className={styles.lede}>Model liquidity shortfalls, verify allocation rules, trace beneficiary payments and reconcile what remains.</p>
      <p className={styles.lede}>Explore how reproducible evidence and proof gated operations can support trustworthy capital workflows.</p>
      <div className={styles.ctas}><Link href={featured.route}>Follow the complete shortfall settlement →</Link><Link href="/demos#withdrawals-accounting">Explore withdrawals &amp; accounting →</Link></div>
    </header>

    <section className={styles.lifecycle} aria-labelledby="lifecycle-title">
      <span className={styles.eyebrow}>Withdrawals &amp; accounting · retained local operation</span>
      <h2 id="lifecycle-title">Follow requests through payment—not just allocation.</h2>
      <p className={styles.lifecycleLead}>Follow the distinct accounting stages in this controlled example. Calculated allocations, capital movement, recorded liabilities and beneficiary payments are separate facts.</p>
      <div className={styles.lifecycleGrid}>
        <article className={styles.lifecycleStep}><span>Requested</span><strong>{settlement.inputs.requested}</strong><small>units across the request set</small></article>
        <article className={styles.lifecycleStep}><span>Calculated allocation</span><strong>{allocationTotal}</strong><small>{manifest.economicInputs.requests.map((request) => `${request.participant} ${settlement.calculatedAllocations[request.claimId as keyof typeof settlement.calculatedAllocations]}`).join(' · ')}</small></article>
        <article className={styles.lifecycleStep}><span>Funded</span><strong>{fundedTotal}</strong><small>observed in allocator custody</small></article>
        <article className={styles.lifecycleStep}><span>Activated liability</span><strong>{activatedLiability}</strong><small>recorded as owed; activation moves no tokens</small></article>
        <article className={styles.lifecycleStep}><span>Locally withdrawn</span><strong>{paidTotal}</strong><small>observed beneficiary claims</small></article>
        <article className={styles.lifecycleStep}><span>Funded claimant liability</span><strong>{finalLiability}</strong><small>remaining at local closure</small></article>
      </div>
      <p className={styles.unmetNote}><b>{settlement.inputs.unmet} unmet units are unfilled requests.</b> They are not funded claimant liabilities or deferred claims. This is the order of retained evidence; the cards do not imply automatic token transfers.</p>
      <p className={styles.lifecycleQualification}>Pro-rata scope: the retained policy produces the shown allocation for this fixture. The example does not test remainder ties or cap redistribution, and policy compliance does not establish fairness. <Link href="/demos/composed-pro-rata-settlement#evidence-allocation">Inspect the allocation check →</Link></p>
      <p className={styles.lifecycleQualification}>Withdrawal scope: the retained run uses Required mode. It does not qualify the full Requested/Required mutation matrix, callback reentrancy behavior or every physical representation.</p>
      <p className={styles.lifecycleQualification}>Local Foundry fixture-token evidence only. These observations do not establish public-chain stablecoin payments, reserve backing or redemption behavior.</p>
      <Link className={styles.lifecycleLink} href="/demos/composed-pro-rata-settlement#withdrawals">Inspect each withdrawal and the reconciliation evidence →</Link>
    </section>

    <section className={styles.section} aria-labelledby="questions-title">
      <h2 id="questions-title">Questions stablecoin teams can investigate</h2>
      <div className={styles.questionGrid}>{questions.map(([question, answer, demo]) => <article className={styles.question} key={question}><h3>{question}</h3><p>{answer} <Link href={`/demos/${demo}`}>See the related demo →</Link></p></article>)}</div>
    </section>

    <section className={styles.section} aria-labelledby="forensics-title">
      <span className={styles.eyebrow}>Forensic evidence</span>
      <h2 id="forensics-title">Trace the settlement from source records to final reconciliation.</h2>
      <p className={styles.lede}>The retained operation exposes a reviewable trail through the decision and each consequential state change:</p>
      <ol className={styles.forensicGrid}>
        <li className={styles.forensicStep}><span>01</span><h3>Identify the source and deployment</h3><em className={styles.evidenceStatus}>Unverified externally</em><p>Check operation identity, fixture inputs, source roots and locally recorded contract identities. These checks do not authenticate external requests or deployment authority.</p><Link href="/demos/composed-pro-rata-settlement#evidence-source">Inspect source evidence →</Link></li>
        <li className={styles.forensicStep}><span>02</span><h3>Reconstruct the allocation</h3><em className={styles.evidenceStatus}>Independently reproduced</em><p>Compare retained implementations for the declared requests and policy: 35 / 21 / 14 calculated entitlements.</p><Link href="/demos/composed-pro-rata-settlement#evidence-allocation">Inspect allocation evidence →</Link></li>
        <li className={styles.forensicStep}><span>03</span><h3>Check proof and authority</h3><em className={styles.evidenceStatus}>Cryptographically checked locally</em><p>Trace proof admission and operation bindings in the retained local verifier path. This does not establish public governance approval.</p><Link href="/demos/composed-pro-rata-settlement#evidence-admission">Inspect admission evidence →</Link></li>
        <li className={styles.forensicStep}><span>04</span><h3>Follow funding and activation</h3><em className={styles.evidenceStatus}>Locally observed</em><p>Funding moves capital; activation separately records the funded entitlement liability.</p><Link href="/demos/composed-pro-rata-settlement#evidence-funding">Inspect funding evidence →</Link></li>
        <li className={styles.forensicStep}><span>05</span><h3>Verify beneficiary withdrawals</h3><em className={styles.evidenceStatus}>Locally observed</em><p>Inspect each claim opening, withdrawal record, transfer amount and post-claim liability.</p><Link href="/demos/composed-pro-rata-settlement#evidence-withdrawal">Inspect withdrawal evidence →</Link></li>
        <li className={styles.forensicStep}><span>06</span><h3>Reconcile custody and liabilities</h3><em className={styles.evidenceStatus}>Reconciled from local observations</em><p>Check custody, payments, the separate restricted refund and funded claimant liability closure.</p><Link href="/demos/composed-pro-rata-settlement#evidence-closure">Inspect reconciliation and gaps →</Link></li>
      </ol>
      <p className={styles.forensicScope}>This is a local Foundry evidence trail. It records one controlled operation; it does not establish public-chain USDC settlement or real-world stablecoin redemption behavior.</p>
    </section>

    <section className={styles.section} aria-labelledby="featured-title">
      <span className={styles.eyebrow}>Featured demonstration</span><h2 id="featured-title">{featured.title}</h2>
      <DemoCard demo={featured} />
    </section>

    <section className={styles.section} aria-labelledby="existing-demos-title">
      <h2 id="existing-demos-title">Explore the canonical demonstrations</h2>
      <div className={styles.demoGrid}>{supporting.map((demo) => <DemoCard demo={demo} key={demo.id} />)}</div>
    </section>

    <p className={styles.scope}>The local shortfall examples do not establish real stablecoin redemption behaviour, reserve backing, depegging protection, compliance or public-chain USDC settlement. These are potential applications or future validation workloads, not capabilities demonstrated here.</p>
    <p className={styles.framework}>PRF is a reusable framework for modelling, testing, evidence generation and independent verification. Protected operations are implementations that integrate assurance with capital or state transitions. This page illustrates capabilities; it is not a financial service or certification. Implementers and operators are responsible for assessing their activities, jurisdictions, licensing, registration, security, consumer-protection and operational obligations.</p>
  </main>
}

function DemoCard({ demo }: { demo: (typeof demos)[number] }) {
  return <article className={styles.demoCard}>
    <span className={styles.evidenceLevel}>{demo.evidenceClass}</span><span className={styles.evidenceDescription}>{demo.evidenceLevel}</span>
    <h3><Link href={demo.route}>{demo.title}</Link></h3>
    <p>{demo.question}</p>
    <details className={styles.disclosure}><summary>What the retained evidence supports and its limits</summary>
      <b>Supported claims</b><ul>{demo.verifiedClaims.map((claim) => <li key={claim}>{claim}</li>)}</ul>
      <b>Limitations</b><ul>{demo.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul>
      {demo.notebook || demo.artifacts.length > 0 ? <p className={styles.resources}>{demo.notebook && <Link className={styles.resourceLink} href={demo.notebook}>Published notebook →</Link>}{demo.artifacts.map((artifact) => <a className={styles.resourceLink} href={artifact.href} key={artifact.href}>{artifact.label} ↗</a>)}</p> : null}
    </details>
    <Link className={styles.demoLink} href={demo.route}>Open canonical demo →</Link>
  </article>
}
