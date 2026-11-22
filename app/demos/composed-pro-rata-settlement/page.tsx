import type { Metadata } from 'next'
import Link from 'next/link'
import manifest from '../../../public/evidence/composed-pro-rata-v2-settlement/manifest.json'
import result from '../../../public/evidence/composed-pro-rata-v2-settlement/validation-result.json'
import publicationPin from '../../../public/evidence/manifests/composed-pro-rata-v2-settlement.publication.json'
import styles from './page.module.css'
import EvidenceCheckpoint from './EvidenceCheckpoint'
import DeployedDependencies from './DeployedDependencies'
import ForensicDossier from './ForensicDossier'
import { AdversarialExplorer, EvidenceExplorer, SettlementTimeline } from './SettlementExplorer'
import type { AdversarialCase, EvidenceClaim } from './SettlementExplorer'

export const metadata: Metadata = {
  title: 'From Shortfall to Verified Settlement',
  description: 'Follow 100 requested units through a 70-unit allocation, real proof admission, protected funding and withdrawals, then independently inspect the local evidence.',
}

const evidenceRoot = '/evidence/composed-pro-rata-v2-settlement'
// This is the same proof file, checked against manifest.proofIdentity.proofFixtureSha256
// by verify:flagship. The older /evidence/partial-fill/proof.json is a different proof.
const proofHref = '/evidence/partial-fill/v3-live-context/proof.json'
const sourceBase = `https://github.com/protocol-robustness/prf-evm/blob/${publicationPin.sourceRevision}`
const sourceFile = (path: string) => `${sourceBase}/${path}`
const capital = result.reconciliation
const libraryLinks: Record<string, string> = {
  forgeStd: `https://github.com/foundry-rs/forge-std/tree/${manifest.dependencies.forgeStd}`,
  openzeppelinContracts: `https://github.com/OpenZeppelin/openzeppelin-contracts/tree/${manifest.dependencies.openzeppelinContracts}`,
  sp1Contracts: `https://github.com/succinctlabs/sp1-contracts/tree/${manifest.dependencies.sp1Contracts}`,
}

const evidenceClaims: EvidenceClaim[] = [
  {
    id: 'allocation', question: 'Why 35 / 21 / 14?', classification: 'Independently reproduced calculation',
    finding: 'The retained Clojure and Rust projections agree on the committed 50/30/20 requests, 70 available units and the source-bound pro-rata allocation.',
    validator: 'The fixture validator checks both replay artifacts, reconstructs the allocation and compares its inputs with the witness and proof public values.',
    limitation: 'This example does not exercise a remainder tie or cap redistribution. It does not establish external truth or completeness of requests.',
    artifacts: [{ label: 'Source witness', href: `${evidenceRoot}/source-witness.json` }, { label: 'Clojure replay', href: `${evidenceRoot}/clojure-replay.json` }, { label: 'Rust replay', href: `${evidenceRoot}/rust-replay.json` }],
  },
  {
    id: 'proof', question: 'Which proof authorized funding?', classification: 'Cryptographic verification retained · local admission',
    finding: 'The real SP1 Groth16 proof was verified and admitted under the local verifier registry and configuration. Its program and public-values profile are V1; the allocator is V2 and reserve lifecycle V3.',
    validator: 'The retained Foundry qualification invokes the real verifier and admission contracts. The offline fixture validator cross-checks proof identity and public values; a new cryptographic check requires replaying the verifier test.',
    limitation: 'A file hash authenticates bytes, not their source authority. The local configuration does not establish public governance approval.',
    artifacts: [{ label: 'Exact Groth16 fixture', href: proofHref }, { label: 'Program and operation bindings', href: `${evidenceRoot}/manifest.json` }, { label: 'Local verifier and admission evidence', href: `${evidenceRoot}/prf-v3-live-context-manifest.json` }],
  },
  {
    id: 'payment', question: 'Did Alice receive 35?', classification: 'Local execution observation + reconciliation',
    finding: 'The local token Transfer record shows 35 sent from the allocator to Alice’s fixture address. The after-Alice snapshot records Alice at 35 and the remaining liability at 35.',
    validator: 'The fixture validator checks observed transfers, balance snapshots and the custody/liability equations for this operation.',
    limitation: 'These are Foundry call-boundary observations. They are not separately mined receipts, authenticated public-chain state proofs or evidence of Alice’s external identity.',
    artifacts: [{ label: 'Token transfers', href: `${evidenceRoot}/transfers.json` }, { label: 'State observations', href: `${evidenceRoot}/accounting-states.json` }, { label: 'Execution log', href: `${evidenceRoot}/execution.log` }],
  },
  {
    id: 'closure', question: 'Where did all 80 units go?', classification: 'Economic reconciliation of retained observations',
    finding: 'Seventy units settled the three entitlements. The separate restricted 10 was returned to the fixture-recorded Carol address after claimant closure. Terminal balances are Alice 35, Bob 21, Carol 24, reserve 0 and allocator 0.',
    validator: 'The fixture validator reconciles the token transfers, all retained state projections, the derived event journal and terminal reserve finalization.',
    limitation: 'Carol’s 24 combines two different economic flows: a 14-unit entitlement and a 10-unit restricted-capital refund. The journal is an event projection, not a universal accounting ledger.',
    artifacts: [{ label: 'Reconciliation', href: `${evidenceRoot}/reconciliation.json` }, { label: 'Derived journal', href: `${evidenceRoot}/accounting-journal.json` }, { label: 'Validator report', href: `${evidenceRoot}/validation-result.json` }],
  },
  {
    id: 'limits', question: 'What remains unverified?', classification: 'Explicit evidence gaps',
    finding: 'Public-chain observations, external authentication of the request source and fixture authorities, completeness of external obligations and external beneficial ownership are not established by this bundle.',
    validator: 'The publication pin and validator retain these scope limitations. A declared reference or a green local test cannot supply the missing evidence.',
    limitation: 'No research acceptance, reward eligibility, payment authorization or public deployment qualification is inferred.',
    artifacts: [{ label: 'Scope and reproduction instructions', href: `${evidenceRoot}/README.md` }, { label: 'Publication pin', href: '/evidence/manifests/composed-pro-rata-v2-settlement.publication.json' }],
  },
]

const attacks: AdversarialCase[] = [
  { test: 'test_RejectProofForAnotherOperationAndPolicyMutation', attempt: 'Substitute another operation or policy', guard: 'The proof, prepared operation and policy commitments must agree.', outcome: 'The mismatched proof/source-policy branch rejects in the retained qualification.' },
  { test: 'test_RejectChangedAllocationRepresentation', attempt: 'Change the entitlement allocation', guard: 'Activation requires the representation to match the admitted logical table commitment.', outcome: 'The changed representation rejects; the original representation can still settle the 35/21/14 entitlements.' },
  { test: 'test_RejectUnauthorizedRecipientSubstitution', attempt: 'Redirect Alice’s withdrawal', guard: 'The entitlement opening binds the beneficiary and amount to the committed table.', outcome: 'Recipient substitution rejects. The test checks unchanged state and then exercises Alice’s valid withdrawal.' },
  { test: 'test_RejectOverWithdrawalAndDuplicateConsumption', attempt: 'Withdraw too much or withdraw twice', guard: 'The committed amount and one-time claim consumption constrain settlement.', outcome: 'The over-withdrawal and duplicate-consumption attempts reject with the test’s state digest unchanged.' },
  { test: 'test_RejectStaleReserveWithoutChangingState', attempt: 'Fund against a stale reserve', guard: 'Ratification must match the authoritative live reserve commitment.', outcome: 'Stale assurance rejects with the test’s state digest unchanged; retained recovery is a separate fresh-proof branch.' },
  { test: 'test_RejectUnauthorizedAndRouteBypass', attempt: 'Bypass protected execution', guard: 'The operation-bound authority and protected route are enforced by contracts.', outcome: 'Unauthorized and direct-route attempts reject in the retained test.' },
  { test: 'test_RejectProofPublicValueSubstitution', attempt: 'Tamper with proof public values', guard: 'The verifier and admission path bind the exact proof output.', outcome: 'Substituted public values reject. Browsing this case does not perform a new cryptographic verification.' },
  { test: 'test_RejectFundingMoreThanCommittedCapital', attempt: 'Fund more than the committed amount', guard: 'The protected funding amount must agree with the admitted capital commitment.', outcome: 'The excess-funding attempt rejects in the retained qualification.' },
  { test: 'test_RejectUnauthorizedAndPrematureProtectedFinalization', attempt: 'Release restricted capital too early', guard: 'The bound finalization authority and terminal lifecycle conditions protect the separate restricted balance.', outcome: 'Unauthorized or premature finalization rejects; the restricted capital remains outside claimant entitlements.' },
  { test: 'test_RejectRatificationAndFundingReplay', attempt: 'Repeat ratification or funding', guard: 'Consumed assurance and operation lifecycle state prevent replay.', outcome: 'Repeated economic execution rejects in the retained qualification.' },
]

const lifecycleSteps = [
  { id: 'source', phase: '01 · Committed', title: 'Requests and reserve', check: 'Match the source witness, prepared operation, local contract identities and reserve snapshot against the manifest.', records: [{ label: 'Witness', file: 'source-witness.json' }, { label: 'Manifest', file: 'manifest.json' }] },
  { id: 'allocation', phase: '02 · Reproduced', title: 'Pro-rata allocation', check: 'Compare the independently retained Clojure and Rust projections and the validator’s reconstructed allocation.', records: [{ label: 'Clojure replay', file: 'clojure-replay.json' }, { label: 'Rust replay', file: 'rust-replay.json' }] },
  { id: 'admission', phase: '03 · Verified locally', title: 'Groth16 proof admitted', check: 'Inspect the real-verifier execution evidence and cross-check the exact program, proof, public values and configured registry.', records: [{ label: 'Verification evidence', file: 'prf-v3-live-context-manifest.json' }, { label: 'Admission execution', file: 'execution.log' }] },
  { id: 'ratification', phase: '04 · Authorized', title: 'Operation ratified', check: 'Trace assurance consumption, bound authority, prepared context and live reserve checking in the retained protected execution.', records: [{ label: 'Execution log', file: 'execution.log' }, { label: 'Stale/unauthorized rejections', file: 'adversarial-tests.log' }] },
  { id: 'funding', phase: '05 · Observed', title: '70 units funded', check: 'Reconcile transfer record 0 with the funded reserve/allocator balances. Activated claimant liability remains zero.', records: [{ label: 'Transfer record 0', file: 'transfers.json' }, { label: 'Funded observation', file: 'accounting-states.json' }] },
  { id: 'activation', phase: '06 · Bound', title: 'Entitlements activated', check: 'Follow representation binding in the contract test and the activated observation: 70 liability, with no token transfer at activation.', records: [{ label: 'Entitlement commitments', file: 'rust-replay.json' }, { label: 'Activation state', file: 'accounting-states.json' }] },
  { id: 'withdrawal', phase: '07 · Observed', title: 'Required withdrawals', check: 'Connect each committed claim to its checked opening, recipient transfer and post-claim liability: 35, then 14, then zero remaining.', records: [{ label: 'Transfer records 1–3', file: 'transfers.json' }, { label: 'Post-claim states', file: 'accounting-states.json' }] },
  { id: 'closure', phase: '08 · Reconciled', title: 'Lifecycle closed', check: 'Separate the restricted refund from claimant payments; reconcile all 80 units and confirm zero claimant liability and terminal custody.', records: [{ label: 'Reconciliation', file: 'reconciliation.json' }, { label: 'Derived journal', file: 'accounting-journal.json' }] },
]



export default function ComposedProRataSettlementPage() {
  return <div className={styles.page}>
    <Link href="/demos" className={styles.back}>← All demonstrations</Link>
    <header className={styles.hero}>
      <span className={styles.kicker}>Flagship · shortfall · Pro-rata / Pro-Rata V2 · forensics</span>
      <h1>From Shortfall to Verified Settlement</h1>
      <p className={styles.lede}>When 100 units are requested and only 70 are available, who receives what—and how can anyone verify it?</p>
      <p>Follow one committed operation from pro-rata allocation through Pro-Rata V2 protected funding, withdrawals and closure. At every stage, inspect the evidence, follow its forensic checks and see exactly which conclusion it supports.</p>
      <p className={styles.scope}><b>Evidence scope:</b> controlled fixture-token units · local Foundry chain ID 31337. No public-chain transaction or mined receipt is claimed. The source is a controlled example, not a production claims authority.</p>
      <div className={styles.heroLinks}><a href="#shortfall">Follow the shortfall and its evidence ↓</a><a href="#deployed-dependencies">Inspect deployed dependencies →</a><a href="#reproduce">Verify and reproduce →</a><Link href="/notebooks/composed-pro-rata-v2-settlement/">Open the settlement notebook →</Link></div>
      <p className={styles.caption}>Retained validator: <b>{result.status}</b> · {result.negativeTestsPassed.length} negative tests · <a href={`${evidenceRoot}/validation-result.json`}>Inspect the report</a>. Opening this page does not rerun the verifier.</p>
    </header>

    <nav className={styles.sectionNav} aria-label="Flagship sections">
      <a href="#shortfall">1. Shortfall</a><a href="#deployed-dependencies">Deployed dependencies</a><a href="#protected-path">2. Execution + evidence trail</a><a href="#withdrawals">3. Withdrawals + reconciliation</a><a href="#evidence-dossier">Evidence dossier</a><a href="#economic-ledger">Economic ledger</a><a href="#authority-and-build">Authority + build</a><a href="#recovery-and-scale">Recovery + scale</a><a href="#typed-gaps">Open gaps</a><a href="#adversarial">4. Rejections</a><a href="#evidence-lineage">5. Verifiable forensics</a><a href="#libraries">6. Components</a><a href="#reproduce">7. Reproduce</a>
    </nav>

    <section className={styles.panel} aria-labelledby="shortfall">
      <span className={styles.kicker}>1 · Economic shortfall</span>
      <h2 id="shortfall">The requests exceed available capital</h2>
      <p>Three participants request {result.inputs.requested} units. The reserve holds {manifest.economicInputs.reserveDeposit}, of which {manifest.economicInputs.protectedRestrictedCapital} are restricted refundable capital. The policy allocates the {result.inputs.available} available units proportionally.</p>
      <EvidenceCheckpoint evidence={{
        classification: 'Source/deployment declarations + retained integrity checks',
        records: [{ label: 'Source witness', href: `${evidenceRoot}/source-witness.json` }, { label: 'Operation and runtime inventory', href: `${evidenceRoot}/manifest.json` }, { label: 'Explore deployed dependencies', href: '#deployed-dependencies' }, { label: 'Validator report', href: `${evidenceRoot}/validation-result.json` }],
        check: 'The fixture validator checks retained file hashes and cross-links the source, operation, prepared context, reserve commitment and logged local contract identities. Inspect those bindings before interpreting the numbers.',
        conclusion: 'These are the declared inputs and local deployment context for this controlled shortfall operation.',
        limit: 'The source is fixture-authoritative. File integrity does not establish external request authenticity, completeness or public deployment approval.',
      }} />
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <caption>Committed requests and calculated entitlements · fixture-token units</caption>
          <thead><tr><th scope="col">Participant</th><th scope="col">Requested</th><th scope="col">Calculated allocation</th><th scope="col">Unmet request</th></tr></thead>
          <tbody>{manifest.economicInputs.requests.map((request) => <tr key={request.claimId}><th scope="row">{request.participant}</th><td>{request.requested}</td><td>{result.calculatedAllocations[request.claimId as keyof typeof result.calculatedAllocations]}</td><td>{request.unfilled}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row">Total</th><td>{result.inputs.requested}</td><td>{result.inputs.available}</td><td>{result.inputs.unmet}</td></tr></tfoot>
        </table>
      </div>
      <EvidenceCheckpoint evidence={{
        classification: 'Independent calculation reconstruction',
        records: [{ label: 'Clojure replay', href: `${evidenceRoot}/clojure-replay.json` }, { label: 'Rust replay', href: `${evidenceRoot}/rust-replay.json` }, { label: 'Validated allocation', href: `${evidenceRoot}/validation-result.json` }],
        check: 'The validator compares both retained replay projections and reconstructs the 35/21/14 allocation from the committed requests, available amount and policy.',
        conclusion: 'The calculated entitlement total is 70; the remaining 30 is unmet request under this fixture’s stated disposition.',
        limit: 'A calculated entitlement is not a payment. This exact-division fixture does not exercise remainder ties or cap redistribution.',
      }} />
      <p><b>Pro-rata</b> is the allocation rule. <b>Pro-Rata V2</b> is the allocator and prepared-operation composition used here. The shortfall application supplies the source and reserve policy; forensic verification reconstructs the evidence for the resulting execution.</p>
      <p className={styles.caption}>The {result.inputs.unmet} unmet units are unfilled requests under this fixture policy. They are not recognized loss, deferred claims or continuing funded liability.</p>
      <details className={styles.forensics}><summary>Why this allocation?</summary><p>The committed policy uses pro-rata allocation with largest-remainder rounding and canonical claim order. These inputs divide exactly: Alice receives 50% of 70, Bob 30% and Carol 20%. This run does not exercise a rounding tie or cap redistribution.</p><div className={styles.downloads}><a href={`${evidenceRoot}/source-witness.json`}>Committed witness →</a><Link href="/demos/liquidity-shortfall">Explore the separate allocation-policy walkthrough →</Link></div></details>
    </section>

    <section className={styles.panel} id="deployed-dependencies" aria-labelledby="deployment-heading">
      <span className={styles.kicker}>Deployment context · contracts used by this operation</span>
      <h2 id="deployment-heading">Follow the deployed dependencies</h2>
      <p>The proof and its capital path depend on actual contract instances. Follow the real local verifier, selected adapter and registry through admission, assurance, ratification, reserve custody and the Pro-Rata V2 allocator.</p>
      <p className={styles.caption}>This is the retained local Foundry deployment context for the same operation. It is not a Base Sepolia deployment, a deployment-ledger release or evidence that these addresses are currently live on an RPC endpoint.</p>
      <DeployedDependencies />
    </section>

    <section className={styles.panel} aria-labelledby="protected-path">
      <span className={styles.kicker}>2 · Proof, authority and capital</span>
      <h2 id="protected-path">Capital moves only through the protected path</h2>
      <p>Walk the forensic trail with the execution: inspect the source record, reconstruct the allocation, verify the proof/authority bindings, then reconcile each observed movement. Each step below links its own evidence.</p>
      <ol className={styles.flow} aria-label="Execution and forensic evidence trail">
        {lifecycleSteps.map((step) => <li key={step.id} id={`evidence-${step.id}`} data-evidence-stage={step.id}>
          <span>{step.phase}</span><b>{step.title}</b>
          <small><strong>Forensic check:</strong> {step.check}</small>
          <div className={styles.stepEvidence}><span>Evidence:</span>{step.records.map(({ label, file }) => <a key={file} href={`${evidenceRoot}/${file}`}>{label} →</a>)}</div>
        </li>)}
      </ol>
      <p className={styles.caption}>This is causal order within one local Foundry test, not a series of independently mined public transactions. Ratification and funding execute atomically in the retained contract call. V1 proof/public values compose with V2 allocation/preparation and V3 reserve lifecycle.</p>
      <details className={styles.forensics}><summary>Inspect this operation’s exact bindings</summary><dl className={styles.identities}><dt>Operation</dt><dd><code>{manifest.operation.id}</code></dd><dt>Prepared operation</dt><dd><code>{manifest.operation.preparedOperationRoot}</code></dd><dt>Reserve snapshot</dt><dd><code>{manifest.operation.reserveStateCommitment}</code></dd><dt>Configuration</dt><dd><code>{manifest.operation.configurationRoot}</code></dd><dt>Verifier registry</dt><dd><code>{manifest.operation.verifierRegistryRoot}</code></dd><dt>Program</dt><dd><code>{manifest.proofIdentity.programId}</code></dd><dt>VKey</dt><dd><code>{manifest.proofIdentity.vkey}</code></dd><dt>ELF SHA-256</dt><dd><code>{manifest.proofIdentity.elfSha256}</code></dd><dt>Public-values schema</dt><dd><code>{manifest.proofIdentity.publicValuesSchema}</code> · 9 words / 288 bytes</dd></dl><a href={proofHref}>Inspect the exact Groth16 proof fixture →</a></details>
    </section>

    <section className={styles.panel} aria-labelledby="withdrawals">
      <span className={styles.kicker}>3 · Protected withdrawals and accounting</span>
      <h2 id="withdrawals">An entitlement becomes an observed payment</h2>
      <p>For each withdrawal, follow the committed claim and beneficiary through proof checking to the transfer observation and the remaining liability. The forensic trail must support the payment claim as well as the allocation.</p>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Claim → calculated entitlement → observed payment → forensic evidence</caption>
        <thead><tr><th scope="col">Recipient / claim</th><th scope="col">Calculated</th><th scope="col">Observed withdrawal</th><th scope="col">Evidence trail</th></tr></thead>
        <tbody>{manifest.economicInputs.requests.map((request, index) => <tr key={request.claimId}>
          <th scope="row">{request.participant}<small>{request.claimId}</small></th>
          <td>{result.calculatedAllocations[request.claimId as keyof typeof result.calculatedAllocations]}</td><td>{result.localObservedWithdrawals[index]}</td>
          <td><div className={styles.claimEvidence}>
            <a href={`${evidenceRoot}/source-witness.json`}>{request.claimId} / beneficiary →</a>
            <a href={proofHref}>Admitted proof →</a>
            <a href={`${evidenceRoot}/transfers.json`}>Transfer record {index + 1} →</a>
            <a href={`${evidenceRoot}/accounting-states.json`}>Post-claim state →</a>
          </div></td>
        </tr>)}</tbody>
      </table></div>
      <p className={styles.caption}>Transfer records use zero-based JSON array indices: record 0 is funding; 1–3 are the three claims; 4 is the separate restricted refund. The state file names the corresponding stages.</p>
      <p>The retained test withdraws in <b>Required</b> mode. Every claim supplies its entitlement-table opening and canonical allocation-claim proof. The beneficiary and amount must match, and each claim can be consumed only once.</p>
      <details className={styles.forensics}><summary>Requested versus Required: what changes?</summary><p>Both modes enforce the committed entitlement-table opening. Required also rejects a missing or invalid allocation-claim proof. Requested records the optional allocation-proof outcome without making that proof a condition of transfer. The effective mode is the stricter of the live mode and the caller’s minimum, so the caller cannot downgrade a live Required setting.</p><p>This execution demonstrates Required withdrawals. It does not qualify the full Requested/Required mutation matrix, callback reentrancy behavior or every physical representation.</p><div className={styles.downloads}><a href={sourceFile('src/applications/pro-rata/ProductionProRataAllocatorV2.sol')}>Pinned withdrawal implementation →</a><a href={sourceFile('test/PartialFillV3Controlled.t.sol')}>Pinned Required-mode test →</a></div></details>
      <h3>Follow custody and outstanding liability</h3>
      <p>Choose an observed stage. Funding, activation and withdrawal are different economic transitions.</p>
      <SettlementTimeline states={result.stateProjections} />
      <p className={styles.refund}><b>Keep the two Carol flows separate:</b> {result.localObservedWithdrawals[2]} is her entitlement withdrawal. The additional {capital.restrictedCapitalSettlement.refund} is the restricted-capital refund after claimant closure. Her terminal balance is {capital.terminalCustody.CarolIncludingRefund}.</p>
      <EvidenceCheckpoint evidence={{
        classification: 'Observed terminal state + independent economic reconciliation',
        records: [{ label: 'Observed transfers', href: `${evidenceRoot}/transfers.json` }, { label: 'Terminal state', href: `${evidenceRoot}/accounting-states.json` }, { label: 'Derived journal', href: `${evidenceRoot}/accounting-journal.json` }, { label: 'Reconciliation', href: `${evidenceRoot}/reconciliation.json` }],
        check: 'The validator reconciles claimant payments of 35 + 21 + 14, the separate 10-unit refund, terminal recipient balances of 35/21/24 and zero reserve/allocator custody and claimant liability.',
        conclusion: 'All 80 starting custody units are accounted for in the retained local outcome. The 30 unmet request is not an additional funded liability.',
        limit: 'The journal is derived from observations; it is not an independent observation or proof of public-chain state. External beneficial ownership remains unverified.',
      }} />
      <p className={styles.caption}>The {result.inputs.unmet} unmet request never enters the activated {result.inputs.available}-unit liability. The retained reconciliation independently tracks requested demand, capital custody and funded obligations.</p>
      <details className={styles.forensics}><summary>What if the operation stops before activation?</summary><p>The pre-activation cancel/refund branch has separate retained evidence. It is not a second outcome of this settled operation.</p><Link href="/demos/cancel-or-activate">Inspect the separate cancellation-boundary demonstration →</Link></details>
    </section>

    <ForensicDossier />

    <section className={styles.panel} aria-labelledby="adversarial">
      <span className={styles.kicker}>4 · Try to break the operation</span>
      <h2 id="adversarial">Inspect the attempts that were rejected</h2>
      <p>{result.negativeTestsPassed.length} negative tests passed in the retained run. Select a case to see its enforced boundary and supporting evidence.</p>
      <AdversarialExplorer cases={attacks} passed={result.negativeTestsPassed} />
      <p className={styles.caption}>The fresh-proof recovery case is separate: it restores claimant settlement after a reserve change but leaves an unrelated one-unit reserve hold. Terminal finalization then rejects with state unchanged.</p>
    </section>

    <section className={styles.panel} id="evidence-lineage" aria-labelledby="lineage">
      <span className={styles.kicker}>5 · Verifiable forensics</span>
      <h2 id="lineage">Follow each conclusion to its evidence</h2>
      <p>The forensic checkpoints above accompany the operation from source to closure. Use this cross-cutting inspector to revisit a conclusion, compare its evidence and identify what is still missing. A link alone is a declared reference; verification requires the named validator.</p>
      <EvidenceExplorer claims={evidenceClaims} />
      <p className={styles.caption}>The browser explains retained validation results. It does not authenticate chain state, verify Groth16 in JavaScript or turn a declared relationship into canonical evidence.</p>
    </section>

    <section className={styles.panel} aria-labelledby="libraries">
      <span className={styles.kicker}>6 · Linked components and libraries</span>
      <h2 id="libraries">Pro-rata, Pro-Rata V2 and their linked libraries</h2>
      <p>Allocation arithmetic, source policy, proof admission and capital execution have distinct owners. The links below expose those boundaries and the pinned contract sources.</p>
      <div className={styles.tableScroll}><table className={styles.dataTable}><caption>Component responsibilities and inspection links</caption><thead><tr><th scope="col">Component</th><th scope="col">Responsibility</th><th scope="col">Inspect</th></tr></thead><tbody>
        <tr><th scope="row">Canonical core</th><td>Artifact encoding, domain separation and commitments</td><td><a href="https://github.com/protocol-robustness/protocol-robustness-framework/tree/main/packages/canonical">Library reference ↗</a></td></tr>
        <tr><th scope="row">Pro-rata allocation</th><td>Allocation arithmetic, rounding and redistribution</td><td><a href="https://github.com/protocol-robustness/protocol-robustness-framework/tree/main/packages/pro-rata-allocation">Library reference ↗</a> · <a href={`${evidenceRoot}/clojure-replay.json`}>Retained replay</a></td></tr>
        <tr><th scope="row">Shortfall application</th><td>Controlled requests, source policy and reserve binding</td><td><a href={`${evidenceRoot}/source-witness.json`}>Bound source</a> · <a href={sourceFile('src/applications/shortfall/OnchainShortfallReserveV3.sol')}>Pinned reserve</a></td></tr>
        <tr><th scope="row">Pro-Rata V2 composition</th><td>V2 allocator and prepared operations, source assurance, protected ratification and V3 reserve lifecycle</td><td><a href={sourceFile('test/PartialFillV3Controlled.t.sol')}>Pinned composed test</a> · <a href="https://github.com/protocol-robustness/protocol-robustness-framework/blob/main/docs/architecture/PROTECTED_CAPITAL_PRO_RATA_V2_SEMANTICS.md">Semantic reference ↗</a></td></tr>
        <tr><th scope="row">Protected operations</th><td>Authority, admission, ratification and execution route</td><td><a href={sourceFile('test/PartialFillV3Controlled.t.sol')}>Pinned composition</a></td></tr>
        <tr><th scope="row">Entitlement lifecycle</th><td>Representation binding, claim consumption and liability closure</td><td><a href={sourceFile('src/applications/pro-rata/ProductionProRataAllocatorV2.sol')}>Pinned allocator</a> · <a href={sourceFile('src/applications/pro-rata/PublicPackedEntitlementRepresentationV1.sol')}>Packed representation</a></td></tr>
      </tbody></table></div>
      <p className={styles.caption}><code>pro-rata-v2</code> describes this composed lifecycle, not a V2 SP1 public-values profile: the retained proof schema remains V1. Library references describe the current source packages; they are not claims that today’s extracted packages produced this historical fixture. The exact run is identified by its pinned source and file hashes. This bundle does not establish deployed external Solidity library links; package dependencies and bytecode linking are different facts.</p>
      <EvidenceCheckpoint evidence={{
        classification: 'Pinned source/artifact provenance + local runtime observations',
        records: [{ label: 'Source and dependency inventory', href: `${evidenceRoot}/manifest.json` }, { label: 'Published revision and digests', href: '/evidence/manifests/composed-pro-rata-v2-settlement.publication.json' }, { label: 'Logged runtime identities', href: `${evidenceRoot}/execution.log` }],
        check: 'The publication gate compares the pinned source revision and artifact hashes with the retained fixture. The fixture validator checks the logged contract identities and operation bindings.',
        conclusion: 'The evidence identifies which contract implementations and dependencies this local run used.',
        limit: 'Current library reference links are navigation, not evidence that a newer package was used. Historical local runtime observations do not authenticate current public-network code.',
      }} />
      <details className={styles.forensics}><summary>Pinned dependencies, contract addresses and runtime identities</summary><dl className={styles.identities}>{Object.entries(manifest.dependencies).map(([name, version]) => <div key={name}><dt>{name}</dt><dd>{libraryLinks[name] ? <a href={libraryLinks[name]}><code>{version}</code> ↗</a> : <code>{version}</code>}</dd></div>)}<div><dt>Fixture source revision</dt><dd><code>{publicationPin.sourceRevision}</code></dd></div></dl><a href="#deployed-dependencies">Inspect the recorded deployed-contract dependencies →</a><p>The manifest retains implementation and test file digests; these addresses and code identities were observed locally, not on Base Sepolia.</p><a href={`${evidenceRoot}/manifest.json`}>Full source and artifact inventory →</a></details>
    </section>

    <section className={styles.panel} id="reproduce" aria-labelledby="reproduction">
      <span className={styles.kicker}>7 · Independent reconstruction</span>
      <h2 id="reproduction">Inspect the notebook. Re-run the checks.</h2>
      <p>The settlement notebook consumes this pinned fixture and validated projection. It distinguishes the allocation, proof, contract transitions and accounting evidence.</p>
      <div className={styles.heroLinks}><Link href="/notebooks/composed-pro-rata-v2-settlement/">Open the settlement notebook →</Link><a href={`${evidenceRoot}/README.md`}>Full reproduction instructions →</a></div>
      <details className={styles.forensics}><summary>Reproduce the actual proof-to-withdrawal test</summary><p>Use a separate prf-evm checkout at the pinned revision, with the submodule revisions and compiler/tool versions in the manifest. The test invokes the real local verifier; it does not require a public-network transaction.</p><pre>{`git checkout ${publicationPin.sourceRevision}\ngit submodule update --init --recursive\nPARTIAL_FILL_STAGE=2 forge test --offline \\\n  --match-path test/PartialFillV3Controlled.t.sol \\\n  --match-test test_QualificationWithdrawsAndClosesExactly -vv\npython3 scripts/verify-composed-pro-rata-v2.py`}</pre><p>The Python validator checks retained files, bindings, projections and reconciliation. The Foundry command performs cryptographic verification and contract execution. The full 14-test command, negative cases and prerequisites are in the README.</p></details>
      <details className={styles.forensics}><summary>Download the exact retained evidence</summary><div className={styles.downloads}>{['manifest.json', 'manifest.sha256', 'validation-result.json', 'README.md', 'source-witness.json', 'clojure-replay.json', 'rust-replay.json', 'execution.log', 'adversarial-tests.log', 'full-stage2-qualification.log', 'accounting-states.json', 'accounting-journal.json', 'reconciliation.json', 'transfers.json', 'prf-v3-live-context-manifest.json'].map((file) => <a key={file} href={`${evidenceRoot}/${file}`} download>{file} ↓</a>)}<a href={proofHref} download>Exact Groth16 proof fixture ↓</a><a href="/evidence/manifests/composed-pro-rata-v2-settlement.publication.json" download>Publication pin ↓</a></div></details>
      <h3>Explore related models and investigations</h3>
      <p className={styles.caption}>These are separate examples, not additional evidence for this operation.</p>
      <nav className={styles.related} aria-label="Separate companion notebooks"><Link href="/notebooks/pro-rata-allocation-result/">Slashing allocation and evidence notebook →</Link><Link href="/notebooks/ef-demo-pro-rata-allocation/">Attestation DAG notebook →</Link><Link href="/notebooks/yield-shortfall-partial-withdrawal-fills/">Yield-module liquidity-shortfall notebook →</Link><Link href="/demos/can-anyone-verify-the-research">Independent research and reproduction →</Link></nav>
    </section>

    <section className={styles.limit} aria-labelledby="scope-limit">
      <h2 id="scope-limit">What the demonstration establishes</h2>
      <p><b>Independently reproduced:</b> the retained Clojure and Rust projections agree on the source-bound allocation.</p>
      <p><b>Cryptographically verified locally:</b> the retained SP1 Groth16 proof passed the local verifier and admission route.</p>
      <p><b>Locally observed and reconciled:</b> protected funding, Required withdrawals, zero claimant liability, exact restricted refund and reserve finalization.</p>
      <p><b>Open evidence requirements:</b> public-chain deployment and receipts, external authentication of fixture authorities, external truth or completeness of requests, and Carol’s external legal beneficial ownership. Cross-representation equivalence, scaling and reentrancy qualification require their own evidence.</p>
      <p>This is a bounded controlled-shortfall demonstration. It grants no research acceptance, reward entitlement or public deployment approval.</p>
    </section>
  </div>
}
