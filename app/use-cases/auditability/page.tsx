import type { Metadata } from 'next'
import Link from 'next/link'
import { demosForAudience } from '../../../lib/demo-presentation'
import styles from '../use-cases.module.css'

export const metadata: Metadata = {
  title: 'Auditability & Verification',
  description: 'Reproduce economic claims, follow evidence provenance and inspect what independent checks establish—and what they do not.',
}

const questionDemos = [
  ['Can independent implementations agree on the same record?', 'Compare canonical outputs from separate Clojure and Rust implementations.', 'canonical-comparison'],
  ['Can evidence substitution or reordering be detected?', 'Inspect the committed sequence and the verifier result.', 'reordered-evidence'],
  ['Can outdated findings still trigger operations?', 'Follow current-head checks against stale submissions.', 'current-head'],
  ['Can a reported outcome be reconstructed or challenged?', 'Reproduce a rooted result, then inspect the qualification boundary for a challenge.', 'can-anyone-verify-the-research'],
] as const

const demos = demosForAudience('auditability')
const order = ['canonical-comparison', 'reordered-evidence', 'current-head', 'can-anyone-verify-the-research', 'can-you-challenge-a-research-finding', 'where-did-every-token-go']
const curated = order.map((id) => demos.find((demo) => demo.id === id)!).filter(Boolean)

export default function AuditabilityPage() {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>For reviewers and auditability teams</span>
      <h1>Don't just trust the result. Reproduce it.</h1>
      <p className={styles.lede}>Follow economic claims back to their inputs, policy, state, execution evidence and verification checks.</p>
      <p className={styles.lede}>Inspect what the evidence establishes, challenge unsupported conclusions and independently reproduce results.</p>
      <div className={styles.ctas}><Link href="/demos/canonical-comparison">Start with independent verification →</Link><Link href="/demos#independent-research">Browse research demos →</Link></div>
    </header>

    <section className={styles.section} aria-labelledby="questions-title">
      <h2 id="questions-title">Questions reviewers can investigate</h2>
      <div className={styles.questionGrid}>{questionDemos.map(([question, answer, demo]) => <article className={styles.question} key={question}><h3>{question}</h3><p>{answer} <Link href={`/demos/${demo}`}>See the related demo →</Link></p></article>)}</div>
    </section>

    <section className={styles.section} aria-labelledby="forensics-title">
      <span className={styles.eyebrow}>Forensic evidence</span>
      <h2 id="forensics-title">Follow a claim through its complete evidence lineage.</h2>
      <p className={styles.lede}>Inspect the records that connect an economic conclusion to its scope, inputs, policy, computation and any observed operation. Each step links to an existing demo and its retained material.</p>
      <ol className={styles.forensicGrid}>
        <li className={styles.forensicStep}><span>01</span><h3>Fix the question and scope</h3><em className={styles.evidenceStatus}>Declared record scope</em><p>Identify the claim, fixture revision, declared policy and records included in the comparison. A declared scope does not establish external source truth.</p><Link href="/demos/canonical-comparison">Inspect a bound canonical record →</Link></li>
        <li className={styles.forensicStep}><span>02</span><h3>Reconstruct independently</h3><em className={styles.evidenceStatus}>Independently reproduced</em><p>Compare distinct implementations and execution identities against the same rooted inputs.</p><Link href="/demos/can-anyone-verify-the-research">Inspect reproduction evidence →</Link></li>
        <li className={styles.forensicStep}><span>03</span><h3>Check integrity and order</h3><em className={styles.evidenceStatus}>Integrity checked</em><p>Follow committed evidence and see which changes cause the verifier to reject it. Integrity checks do not authenticate external facts.</p><Link href="/demos/reordered-evidence">Inspect tamper-evident checks →</Link></li>
        <li className={styles.forensicStep}><span>04</span><h3>Bind findings to current state</h3><em className={styles.evidenceStatus}>Locally tested</em><p>Check that the tested stale result cannot silently become the basis for a later operation.</p><Link href="/demos/current-head">Inspect authoritative-state checks →</Link></li>
        <li className={styles.forensicStep}><span>05</span><h3>Trace realized effects</h3><em className={styles.evidenceStatus}>Locally observed</em><p>Where a local operation is retained, follow custody, funding, withdrawals and remaining liabilities.</p><Link href="/demos/where-did-every-token-go">Inspect the accounting evidence →</Link></li>
        <li className={styles.forensicStep}><span>06</span><h3>Keep challenges qualified</h3><em className={styles.evidenceStatus}>Qualification not established</em><p>Review counterexamples together with source pins, candidate gates and reviewer authority.</p><Link href="/demos/can-you-challenge-a-research-finding">Inspect challenge qualification →</Link></li>
      </ol>
      <p className={styles.forensicScope}>Hashes and reproducibility help identify and compare records. They do not authenticate external facts unless a named source or authority check establishes that connection.</p>
    </section>

    <section className={styles.section} aria-labelledby="trust-title">
      <h2 id="trust-title">Read each evidence level in context</h2>
      <div className={styles.questionGrid}>
        <article className={styles.question}><h3>Declared or integrity checked</h3><p>Records and hashes identify the reviewed material. Neither a declaration nor a matching hash alone proves who supplied it or whether external facts are true.</p></article>
        <article className={styles.question}><h3>Computed</h3><p>A calculation follows its stated inputs and policy; this alone does not establish that inputs are true or that funds moved.</p></article>
        <article className={styles.question}><h3>Independently reproduced</h3><p>A separate implementation reproduces a result within the recorded scope; this does not by itself prove upstream observations or human independence.</p></article>
        <article className={styles.question}><h3>Authenticated</h3><p>Authentication applies only where a named source or authority is checked. A content hash identifies bytes; it does not authenticate the external facts described.</p></article>
        <article className={styles.question}><h3>Locally observed</h3><p>A retained local execution records what happened in its fixture. It is not evidence of a public-chain transaction.</p></article>
        <article className={styles.question}><h3>Unverified or still qualified</h3><p>Open gates, missing source pins and unsupported conclusions remain visible on the relevant demo page. None of the linked local examples authenticates public-chain activity or external claimant identity.</p></article>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="demos-title">
      <h2 id="demos-title">Explore the canonical demonstrations</h2>
      <div className={styles.demoGrid}>{curated.map((demo) => <DemoCard demo={demo} key={demo.id} />)}</div>
    </section>

    <p className={styles.scope}>Reproducibility is not equivalent to a formal financial audit, complete source-data authentication or comprehensive security assurance. Each demo states which inputs, methods and checks its evidence covers.</p>
    <p className={styles.framework}>PRF is an open framework; protected operations integrate assurance with capital or state transitions. This page illustrates framework capabilities and is not a packaged financial service or certification. Organisations implementing or operating applications are responsible for assessing their activities, jurisdictions, licensing, registration, security, consumer-protection and operational obligations. Each demo remains a specific example with its own qualifications.</p>
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
