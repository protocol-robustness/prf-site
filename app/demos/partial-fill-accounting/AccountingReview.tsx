'use client'

import { useReducer } from 'react'
import Link from 'next/link'
import DemoShell from '../../../components/demo/DemoShell'
import evidence from '../../../generated/verification/accounting-review.v1.json'
import EconomicIcon from '../../../components/demo/EconomicIcon'
import { initialReview, reviewTransition, type ReviewAction, type ReviewState } from '../../../lib/accounting-review-state'
import styles from './AccountingReview.module.css'

const summary = evidence.summary
const eligible = { A: summary.candidates.A.verification.eligible, B: summary.candidates.B.verification.eligible }
const base = '/evidence/partial-fill/accounting-review/'
const files = ['manifest.json', 'policies.edn', 'validation-method.edn', 'subjects.edn', 'histories.edn', 'verification.edn', 'checkpoints.edn', 'trust-pins.edn', 'canonical-preimages.json', 'accounting-ratification.edn', 'accounting-ratification-realized.edn', 'evm-input.json', 'summary.json', 'qualification.json', 'capital-boundary-test.log', 'AccountingReviewBoundary.t.sol', 'README.md', 'ui-description.md', 'architecture.md', 'run.clj']

function Status({ value }: { value: string }) {
  const passed = ['Passed', 'Accepted', 'Ratified'].includes(value)
  const failed = ['Failed', 'Rejected', 'Blocked'].includes(value)
  return <span className={passed ? styles.passed : failed ? styles.failed : value === 'Pending' ? styles.pending : styles.inactive}>
    <span aria-hidden="true">{passed ? '✓' : failed ? '✕' : value === 'Pending' ? '⚠' : '○'}</span> {value}
  </span>
}

export default function AccountingReview() {
  const [state, dispatch] = useReducer(
    (s: ReviewState, a: ReviewAction) => reviewTransition(s, a, eligible), initialReview(),
  )
  const candidate = summary.candidates[state.candidate]
  const canAccept = state.role === 'Reviewer' && state.verification === 'Passed' && state.acceptance === 'Pending' && candidate.verification.eligible
  const canReject = state.role === 'Reviewer' && state.acceptance === 'Pending'
  const canRatify = state.role === 'Ratifier' && state.verification === 'Passed' && state.acceptance === 'Accepted' && state.ratification !== 'Ratified' && candidate.verification.eligible
  const inspected = state.verification !== 'Pending'
  const explanation = state.acceptance === 'Rejected' ? 'The reviewer rejected this candidate. Ratification is blocked.'
    : state.verification === 'Failed' ? 'Conservation passes, but the restricted-capital and recipient-policy checks fail. Accept and Ratify are disabled.'
    : state.ratification === 'Ratified' ? 'The accepted statement is now adopted for this simulated accounting purpose. This grants no capital authority.'
    : state.acceptance === 'Accepted' ? 'Accepted, but not yet authoritative. Select the Ratifier role to simulate adoption for the named purpose.'
    : state.verification === 'Passed' ? 'Verification passed. A reviewer can still accept or reject the supported, bounded statement.'
    : 'Verify the candidate to inspect its checks. Acceptance requires a passing, eligible candidate and the simulated Reviewer role.'
  const allocationEvents = summary.allocation.events
  const realizedEvents = summary.realized.events
  const decisionSteps = [
    {
      id: 'allocation-verified', label: 'Verify allocation',
      narration: 'Candidate A passes conservation, protected-capital and recipient-policy checks. Its verified result is the subject a reviewer may accept.',
      status: 'verified-check' as const, identity: summary.candidates.A.verification.root,
      scope: 'Retained local accounting calculation; it does not establish external ownership or complete outside obligations.',
      node: <DecisionRecordCard title="Candidate A · allocation classification" actor="Deterministic verifier" action="Passed" identity={summary.candidates.A.verification.root} facts={[
        ['Conservation', 'passed'], ['Protected 10 remains outside allocation', 'passed'], ['Recipient policy', 'passed'],
        ['Calculated allocation', summary.candidates.A.allocations.join(' / ') + ' units'],
      ]} />,
    },
    {
      id: 'allocation-accepted', label: 'Reviewer accepts',
      narration: `The local fixture reviewer ${allocationEvents[0].authorityId} signs an accept decision under the allocation-classification policy.`,
      status: 'qualified' as const, identity: allocationEvents[0].root,
      scope: 'Signature and history are checked under local fixture policy. The reviewer has no externally established appointment.',
      node: <DecisionRecordCard title="Candidate A · reviewer decision" actor={allocationEvents[0].authorityId} action={allocationEvents[0].action} identity={allocationEvents[0].root} facts={[
        ['Purpose', allocationEvents[0].purpose], ['Policy root', allocationEvents[0].policyRoot], ['Subject root', allocationEvents[0].subjectRoot],
        ['Sequence', String(allocationEvents[0].sequence)], ['Previous history root', allocationEvents[0].previousRoot],
      ]} signature={allocationEvents[0].signatureHex} />,
    },
    {
      id: 'allocation-rejected', label: 'Reviewer rejects B',
      narration: `Candidate B is a synthetic interpretation. Its protected-capital and recipient-policy checks fail; the reviewer records ${summary.allocation.events[1].action}.`,
      status: 'rejected' as const, identity: summary.allocation.events[1].root,
      scope: 'This is a retained negative accounting decision for a synthetic candidate, not a payment or execution failure.',
      node: <DecisionRecordCard title="Candidate B · synthetic restricted-capital violation" actor={summary.allocation.events[1].authorityId} action={summary.allocation.events[1].action} identity={summary.allocation.events[1].root} facts={[
        ['Conservation', summary.candidates.B.verification.conservation ? 'passed' : 'failed'],
        ['Protected-capital restriction', summary.candidates.B.verification.restriction ? 'passed' : 'failed'],
        ['Recipient policy', summary.candidates.B.verification.recipientPolicy ? 'passed' : 'failed'],
        ['Reviewer decision sequence', String(summary.allocation.events[1].sequence)],
      ]} signature={summary.allocation.events[1].signatureHex} />,
    },
    {
      id: 'allocation-ratified', label: 'Ratifier adopts A',
      narration: `A separate local ratifier ${summary.allocation.events[2].authorityId} adopts the accepted Candidate A record for the named allocation-classification purpose.`,
      status: 'qualified' as const, identity: summary.allocation.events[2].root,
      scope: 'Accounting adoption does not grant authority to move capital. This is a local fixture role, not an external appointment.',
      node: <DecisionRecordCard title="Candidate A · accounting ratification" actor={summary.allocation.events[2].authorityId} action={summary.allocation.events[2].action} identity={summary.allocation.events[2].root} facts={[
        ['Purpose', summary.allocation.events[2].purpose], ['Policy root', summary.allocation.events[2].policyRoot],
        ['Accepted decision root', summary.allocation.events[2].acceptanceRoot ?? 'none'], ['Sequence', String(summary.allocation.events[2].sequence)],
        ['Previous history root', summary.allocation.events[2].previousRoot],
      ]} signature={summary.allocation.events[2].signatureHex} />,
    },
    {
      id: 'realized-accepted', label: 'Review settlement',
      narration: 'After local execution, the realized-settlement statement is checked as a separate subject and purpose. Its reviewer signs acceptance of that record.',
      status: 'qualified' as const, identity: realizedEvents[0].root,
      scope: 'This is an authenticated local accounting history over the retained settlement record, not a formal financial audit.',
      node: <DecisionRecordCard title="Realized settlement · reviewer decision" actor={realizedEvents[0].authorityId} action={realizedEvents[0].action} identity={realizedEvents[0].root} facts={[
        ['Purpose', realizedEvents[0].purpose], ['Policy root', realizedEvents[0].policyRoot], ['Subject root', realizedEvents[0].subjectRoot],
        ['Sequence', String(realizedEvents[0].sequence)], ['Previous history root', realizedEvents[0].previousRoot],
      ]} signature={realizedEvents[0].signatureHex} />,
    },
    {
      id: 'realized-ratified', label: 'Ratify settlement',
      narration: 'A separate ratifier adopts the realized statement under its distinct purpose-specific history. It does not authorize another capital operation.',
      status: 'qualified' as const, identity: realizedEvents[1].root,
      scope: 'The history is local and purpose-bound. External beneficial ownership and obligations outside the fixture remain unverified.',
      node: <DecisionRecordCard title="Realized settlement · accounting ratification" actor={realizedEvents[1].authorityId} action={realizedEvents[1].action} identity={realizedEvents[1].root} facts={[
        ['Purpose', realizedEvents[1].purpose], ['Policy root', realizedEvents[1].policyRoot],
        ['Accepted decision root', realizedEvents[1].acceptanceRoot ?? 'none'], ['Sequence', String(realizedEvents[1].sequence)],
        ['Previous history root', realizedEvents[1].previousRoot],
      ]} signature={realizedEvents[1].signatureHex} />,
    },
  ]

  return <section id="accounting-review" className={styles.review} aria-labelledby="accounting-review-heading">
    <span className={styles.kicker}>Separate V3 local run · accounting authority</span>
    <h2 id="accounting-review-heading">Verified. Accepted. Authoritative.</h2>
    <p className={styles.lead}>Three different decisions. Accounting can reconcile before anyone accepts it; an accepted statement still needs a separate authority decision to become the basis for a named purpose.</p>

    <figure className={styles.architecture}>
      <div className={styles.source}><EconomicIcon name="ledger"/><div><strong>Canonical economic evidence</strong><span>Funding, allocations, claims, balances, transfers and provenance</span></div></div>
      <span className={styles.arrow} aria-hidden="true">↓</span>
      <div className={styles.reduction}>Deterministic accounting statement and reconciliation</div>
      <span className={styles.arrow} aria-hidden="true">↙　↘</span>
      <div className={styles.paths}>
        <div><h3><EconomicIcon name="scales"/> Accounting authority</h3><p>Verification <span aria-hidden="true">→</span> reviewer acceptance <span aria-hidden="true">→</span> statement ratification</p><small>Adopt content for a specified accounting purpose.</small></div>
        <div><h3><EconomicIcon name="shield"/> Capital authority</h3><p>Operation assurance <span aria-hidden="true">→</span> AO admission <span aria-hidden="true">→</span> protected execution</p><small>Require independent proof, live state and authorization.</small></div>
      </div>
      <figcaption>Two independent authority paths. Accounting is an optional downstream layer; protocol verification and protected execution can operate without accounting acceptance. Accounting ratification does not authorize capital movement. Actual execution produces new settlement evidence for renewed accounting.</figcaption>
    </figure>

    <section className={styles.decisionHistory} aria-labelledby="decision-history-heading">
      <span className={styles.kicker}>Retained local signed history</span>
      <h3 id="decision-history-heading">Who agreed, and under which rules?</h3>
      <p>Step through the verified calculation, reviewer decisions and purpose-specific ratification. The records bind each action to a subject, policy and previous history root.</p>
      <DemoShell steps={decisionSteps.map((step) => ({
        id: step.id,
        label: step.label,
        node: step.node,
        narration: step.narration,
        evidence: { status: step.status, sourceLabel: 'accounting-review/summary.json', sourceHref: `${base}summary.json`, identity: step.identity, scope: step.scope },
      }))} />
      <p className={styles.caption}>Reviewer and ratifier IDs are local fixture roles. Their external appointment is not established; ratification here adopts an accounting statement and grants no capital authority.</p>
    </section>

    <div className={styles.simulation} role="region" aria-label="Accounting review simulation">
      <header><h3>Review a candidate</h3><span className={styles.prototype}>Illustrative interaction</span></header>
      <p>Pre-settlement allocation accounting · 100 requested, 80 deposited. The retained V3 requests are Alice 50, Bob 30 and Carol 20. These proposed amounts are allocations, not payments.</p>
      <div className={styles.buttons} role="group" aria-label="Accounting candidate">
        <button type="button" aria-pressed={state.candidate === 'A'} onClick={() => dispatch({ type: 'select', candidate: 'A' })}>A · 70 allocated, 10 restricted</button>
        <button type="button" aria-pressed={state.candidate === 'B'} onClick={() => dispatch({ type: 'select', candidate: 'B' })}>B · 80 allocated, restriction consumed</button>
      </div>
      <p className={state.candidate === 'B' ? styles.pending : styles.caption}>{state.candidate === 'B'
        ? '⚠ Candidate B is a synthetic adversarial interpretation. No payment or executed allocation branch is attributed to it.'
        : 'Candidate A follows the retained V3 source, policy and 70-unit available-capital boundary.'}</p>
      <div className={styles.tableWrap}><table><caption>Proposed accounting · local test-token units</caption><thead><tr><th scope="col">Recipient</th><th scope="col">Requested</th><th scope="col">Calculated allocation</th><th scope="col">Unmet</th></tr></thead><tbody>{['Alice', 'Bob', 'Carol'].map((name, i) => <tr key={name}><th scope="row">{name}</th><td>{[50, 30, 20][i]}</td><td>{candidate.allocations[i]}</td><td>{[50, 30, 20][i] - candidate.allocations[i]}</td></tr>)}</tbody></table></div>
      <div className={styles.findings} aria-live="polite">
        <p><span>Conservation · 80 = allocated + restricted</span><Status value={!inspected ? 'Pending' : candidate.verification.conservation ? 'Passed' : 'Failed'}/></p>
        <p><span>Protected 10 remains outside allocation capital</span><Status value={!inspected ? 'Pending' : candidate.verification.restriction ? 'Passed' : 'Failed'}/></p>
        <p><span>Every recipient follows the committed allocation policy</span><Status value={!inspected ? 'Pending' : candidate.verification.recipientPolicy ? 'Passed' : 'Failed'}/></p>
      </div>

      <div className={styles.stages} role="group" aria-label="Accounting decision stages" aria-live="polite">
        <div><span>1 · Deterministic verification</span><Status value={state.verification}/></div>
        <span className={styles.stepArrow} aria-hidden="true">→</span>
        <div><span>2 · Reviewer acceptance</span><Status value={state.acceptance}/></div>
        <span className={styles.stepArrow} aria-hidden="true">→</span>
        <div><span>3 · Accounting ratification</span><Status value={state.ratification}/></div>
      </div>
      <div className={styles.buttons} role="group" aria-label="Simulated policy role">{(['Reviewer', 'Ratifier'] as const).map(role => <button type="button" key={role} aria-pressed={state.role === role} onClick={() => dispatch({ type: 'role', role })}>{role} role</button>)}</div>
      <div className={styles.buttons} role="group" aria-label="Simulated accounting review actions">
        <button type="button" disabled={state.verification !== 'Pending'} onClick={() => dispatch({ type: 'verify' })}>Verify candidate</button>
        <button type="button" disabled={!canAccept} aria-describedby="review-action-help" onClick={() => dispatch({ type: 'accept' })}>Accept</button>
        <button type="button" disabled={!canReject} aria-describedby="review-action-help" onClick={() => dispatch({ type: 'reject' })}>Reject</button>
        <button type="button" disabled={!canRatify} aria-describedby="review-action-help" onClick={() => dispatch({ type: 'ratify' })}>Ratify</button>
        <button type="button" onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      <p id="review-action-help" className={styles.explanation} aria-live="polite">{explanation}</p>
      <p className={styles.caption}>These controls simulate decisions and policy roles. They create no real signature, authority record or transaction. Ratification here refers to adoption for allocation classification; operational <code>ratifyAndFund</code> has separate authority and live-reserve checks.</p>
    </div>

    <div className={styles.retained}>
      <h3>What the downloadable local history actually establishes</h3>
      <p>A local fixture reviewer and a separate ratifier signed the retained records below. Reconstruction verifies both identities against the pinned purpose-specific policies. These are local fixture appointments, not externally appointed accounting authorities.</p>
      <div className={styles.tableWrap}><table><caption>Retained, authenticated local decisions · independent of the controls above</caption><thead><tr><th scope="col">Statement</th><th scope="col">Verification</th><th scope="col">Review</th><th scope="col">Adoption</th></tr></thead><tbody>
        <tr><th scope="row">A · allocation classification</th><td><Status value="Passed"/></td><td><Status value="Accepted"/></td><td><Status value="Ratified"/></td></tr>
        <tr><th scope="row">B · synthetic restricted-capital violation</th><td><Status value="Failed"/></td><td><Status value="Rejected"/></td><td><Status value="Blocked"/></td></tr>
        <tr><th scope="row">Realized V3 settlement · separate purpose</th><td><Status value="Passed"/></td><td><Status value="Accepted"/></td><td><Status value="Ratified"/></td></tr>
      </tbody></table></div>
      <p className={styles.equation}>Observed local settlement: 35 paid to Alice + 21 to Bob + 14 to Carol as claimant + a separate 10-unit fixture refund to Carol = 80. Remaining claimant liability: 0. Unmet requests: 30.</p>
      <p><span className={styles.passed}>✓ Capital boundary checked locally.</span> The existing EVM gates rejected BOTH signed accounting records (allocation and realized settlement) as proofs, rejected each root as an assurance receipt, and rejected direct funding without the execution caller. Checked capital and operation state stayed unchanged. <a href={`${base}capital-boundary-test.log`} download>Inspect the local rejection test ↓</a></p>
      <p className={styles.pending}>⚠ Acceptance and ratification preserve the evidence boundary: Carol’s external beneficial ownership and completeness of outside obligations remain unverified. This is neither public-chain evidence nor a production accounting audit.</p>
      <details><summary>Signed artifacts and independent reproduction</summary>
        <p>The canonical EDN records preserve exact types and roots. The Clojure replay recomputes subject checks and authenticated history from the original V3 files. Retain policy and checkpoint pins from an independently trusted checkout.</p>
        <div className={styles.downloads}>{files.map(file => <a key={file} href={`${base}${file}`} download>{file} ↓</a>)}</div>
        <pre>clojure -M examples/partial-fill/accounting-review/run.clj verify-anchored \
  examples/partial-fill/accounting-review/evidence-v2 \
  examples/partial-fill/evidence/v3-live-context \
  examples/partial-fill/accounting-review/trust-pins-v2.edn</pre>
        <p className={styles.caption}>Browser controls are simulated. The downloadable signatures and local replay are real. Neither creates authority to execute a capital operation.</p>
      </details>
      <Link href="/demos/partial-fill">Inspect the separately protected capital path →</Link>
    </div>
  </section>
}

function DecisionRecordCard({ title, actor, action, identity, facts, signature }: {
  title: string
  actor: string
  action: string
  identity: string
  facts: Array<[string, string]>
  signature?: string
}) {
  return <article className={styles.decisionRecord}>
    <div><span>Recorded decision</span><h4>{title}</h4></div>
    <div className={styles.decisionIdentity}><span>{actor}</span><b>{action}</b></div>
    <dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><code>{value}</code></dd></div>)}<div><dt>Decision root</dt><dd><code>{identity}</code></dd></div></dl>
    {signature && <p className={styles.signature}>Retained signature <code>{signature.slice(0, 18)}…</code></p>}
  </article>
}
