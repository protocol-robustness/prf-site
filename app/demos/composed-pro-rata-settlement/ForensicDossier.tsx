import dossier from '../../../public/evidence/reports/composed-pro-rata-v2-forensic-dossier.v1.json'
import styles from './page.module.css'

const stageLabels: Record<string, string> = {
  opening: 'Opening reserve',
  proof_admitted: 'Proof admitted',
  funded: 'Allocator funded',
  activated: 'Liability activated',
  after_alice_claim: 'Alice claim',
  after_bob_claim: 'Bob claim',
  allocator_closed: 'Carol claim / allocator closed',
  reserve_finalized: 'Restricted refund / reserve finalized',
}

const reportHref = '/evidence/reports/composed-pro-rata-v2-forensic-dossier.v1.json'
const evidenceRoot = '/evidence/composed-pro-rata-v2-settlement'
const formatDeltas = (deltas: Record<string, number>) => Object.entries(deltas)
  .filter(([, value]) => value !== 0)
  .map(([key, value]) => `${key.replace('Balance', '')} ${value > 0 ? '+' : ''}${value}`)
  .join(', ') || 'no balance change'

export default function ForensicDossier() {
  return <>
    <section className={styles.panel} id="evidence-dossier" aria-labelledby="dossier-heading">
      <span className={styles.kicker}>Forensic dossier · retained local operation</span>
      <h2 id="dossier-heading">One evidence index for the whole outcome</h2>
      <p>The site derives this report from the pinned operation manifest, proof fixture, replay outputs, local execution records and accounting observations. It is a readable site projection, not a new PRF canonical record. The machine-readable report and the tables below share the same claims and gaps.</p>
      <div className={styles.heroLinks}>
        <a href={reportHref} download>Download the reconstructed dossier →</a>
        <a href={`${evidenceRoot}/README.md`}>Read the independent reproduction instructions →</a>
        <a href={`${evidenceRoot}/manifest.json`}>Inspect the retained operation manifest →</a>
      </div>
      <p className={styles.caption}>Subject <code>{dossier.subject.operationId}</code> · source revision <code>{dossier.subject.sourceRevision}</code> · local chain {dossier.subject.chainId} · proof {dossier.subject.proofSystem} · {dossier.subject.publicValuesLength} public-value bytes.</p>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Evidence provenance and trust dimensions</caption>
        <thead><tr><th scope="col">Dimension</th><th scope="col">Result for this operation</th></tr></thead>
        <tbody>{dossier.verificationDimensions.map(({ dimension, result }) => <tr key={dimension}><th scope="row">{dimension}</th><td>{result}</td></tr>)}</tbody>
      </table></div>
      <p className={styles.caption}>The local file pins establish reproducible byte relationships inside the retained bundle. They do not independently authenticate who published the pin or prove a public chain state.</p>
    </section>

    <section className={styles.panel} id="economic-ledger" aria-labelledby="ledger-heading">
      <span className={styles.kicker}>Economic reconstruction · eight observed states</span>
      <h2 id="ledger-heading">Follow custody and liabilities separately</h2>
      <p>This ledger recomputes balance deltas from the retained state snapshots and transfer sequence. The records are Foundry call-boundary observations, not transaction-indexed mined receipts.</p>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Observed transition, reconstructed asset movement and outstanding claim liability · fixture-token units</caption>
        <thead><tr><th scope="col">Sequence</th><th scope="col">Transition</th><th scope="col">Reconstructed movement</th><th scope="col">Custody after</th><th scope="col">Claim liability</th><th scope="col">Site record digest</th><th scope="col">Evidence</th></tr></thead>
        <tbody>{dossier.economicLedger.transitions.map((record) => <tr key={record.sequence} data-dossier-stage={record.stage} data-dossier-record={record.projectionRecordSha256}>
          <td>{record.sequence}</td><th scope="row">{stageLabels[record.stage] ?? record.stage}</th>
          <td>{formatDeltas(record.balanceDelta)}</td><td>{record.custodyTotal}</td><td>{record.outstandingLiability}</td>
          <td><code>{record.projectionRecordSha256.slice(0, 16)}</code><small>Presentation hash · {record.evidenceRefs.length} digest-bound references</small></td>
          <td>{record.evidenceRefs.map((ref) => {
            const label = ref.path.endsWith('funding-observation.json') ? 'opening funding' : `${ref.kind} ${ref.jsonPointer}`
            return <span key={`${ref.path}:${ref.jsonPointer}`}>· <a href={`/${ref.path}`}>{label}</a></span>
          })}</td>
        </tr>)}</tbody>
      </table></div>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Independent equations derived from observations</caption>
        <thead><tr><th scope="col">Ledger</th><th scope="col">Equation</th><th scope="col">Reconstructed result</th><th scope="col">Status</th></tr></thead>
        <tbody>
          <tr><th scope="row">Demand</th><td>100 requested = allocation + unmet request</td><td>70 allocated + 30 unmet</td><td>holds</td></tr>
          <tr><th scope="row">Available capital</th><td>80 reserve deposit = restricted + allocation pool</td><td>10 restricted + 70 available</td><td>holds</td></tr>
          <tr><th scope="row">Claim obligations</th><td>70 funded = claims paid + remaining claim liability</td><td>35 + 21 + 14 + 0</td><td>{dossier.economicLedger.obligations.holds ? 'holds' : 'fails'}</td></tr>
          <tr><th scope="row">Custody</th><td>reserve + allocator + participant balances</td><td>{dossier.economicLedger.assetConservation.opening} opening = {dossier.economicLedger.assetConservation.terminal} terminal</td><td>{dossier.economicLedger.assetConservation.holdsAtAllEightObservations ? 'holds at all eight states' : 'fails'}</td></tr>
        </tbody>
      </table></div>
      <p className={styles.refund}><b>Separate flow:</b> the 14-unit Carol claim is paid by the allocator; the restricted 10-unit refund later leaves the reserve. They have distinct transfer records and neither is counted as the other’s liability.</p>
      <p className={styles.caption}>The opening 80-unit sponsor-to-reserve transfer is supported by the separate V3 funding observation. The later five transfer records reconcile against the eight local snapshots. Neither source includes a mined transaction hash or block identity.</p>
    </section>

    <section className={styles.panel} id="authority-and-build" aria-labelledby="authority-heading">
      <span className={styles.kicker}>Proof, authority and deployed code</span>
      <h2 id="authority-heading">Check what is bound—and what is still missing</h2>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Proof-to-capital and authority binding visible in the retained run</caption>
        <thead><tr><th scope="col">Boundary</th><th scope="col">Recorded identity or check</th><th scope="col">Evidence limit</th></tr></thead>
        <tbody>
          <tr><th scope="row">Proof verification</th><td><code>{dossier.authorityAndProofBinding.verifier.vkey}</code><br />Groth16 · {dossier.authorityAndProofBinding.verifier.address}</td><td>Verified in the retained local EVM test; page viewing does not re-run verification.</td></tr>
          <tr><th scope="row">Admission route</th><td>Adapter <code>{dossier.authorityAndProofBinding.verifier.adapter}</code> → registry <code>{dossier.authorityAndProofBinding.verifier.registry}</code> → admission <code>{dossier.authorityAndProofBinding.verifier.admission}</code></td><td>Fixture configuration and authority; no public governance approval.</td></tr>
          <tr><th scope="row">Prepared operation</th><td>Operation <code>{dossier.authorityAndProofBinding.operation.id}</code><br />Prepared root <code>{dossier.authorityAndProofBinding.operation.preparedOperationRoot}</code></td><td>Cross-checked against proof output and the retained test operation.</td></tr>
          <tr><th scope="row">Reserve freshness</th><td>Commitment <code>{dossier.authorityAndProofBinding.operation.reserveStateCommitment}</code></td><td>Checked by local ratification; no block-pinned public state observation.</td></tr>
          <tr><th scope="row">Funded asset path</th><td>Token <code>{dossier.authorityAndProofBinding.preparedAssets.token}</code> · reserve <code>{dossier.authorityAndProofBinding.preparedAssets.reserve}</code> · allocator <code>{dossier.authorityAndProofBinding.preparedAssets.allocator}</code></td><td>Prepared bindings and ten local address/runtime pairs match the retained identity log.</td></tr>
          <tr><th scope="row">Local authority and genesis</th><td>Adapter <code>{dossier.authorityAndProofBinding.localPrincipals.configurationAuthorityAdapter.address}</code> · genesis <code>{dossier.authorityAndProofBinding.localPrincipals.chainGenesis.address}</code><br />Principal/sponsor <code>{dossier.authorityAndProofBinding.localPrincipals.localTestContractPrincipalAndSponsor}</code> · operator <code>{dossier.authorityAndProofBinding.localPrincipals.executionOperator}</code></td><td>Genesis/authority address and code hashes come from a separately retained local context. The principal is the test contract, not an approved Safe or public governance identity.</td></tr>
          <tr><th scope="row">Authority classification</th><td>{dossier.authorityAndProofBinding.principalClassification}</td><td>No external signer or authority authentication.</td></tr>
        </tbody>
      </table></div>
      <h3>Source → build → deployed runtime</h3>
      <p>The manifest records base commit <code>{dossier.subject.manifestBaseGitCommit}</code>; the publication pin identifies qualification revision <code>{dossier.subject.sourceRevision}</code>. They differ, so the source file digests must be checked against the pinned prf-evm checkout using the external publication gate. Compiler and dependency revisions, plus local deployed address/runtime pairs, are recorded. Creation transactions and constructor bytes are absent, so source-to-runtime bytecode equivalence remains unestablished.</p>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Role-to-source reference and local runtime observation; links are not bytecode equivalence proofs</caption>
        <thead><tr><th scope="col">Deployed role</th><th scope="col">Source/dependency reference</th><th scope="col">Manifest source digest</th><th scope="col">Observed local identity</th></tr></thead>
        <tbody>{dossier.sourceBuildRuntime.contractBindings.map((binding) => {
          const sourceHref = binding.sourceFile
            ? `https://github.com/protocol-robustness/prf-evm/blob/${dossier.sourceBuildRuntime.sourceRevision}/${binding.sourceFile}`
            : `https://github.com/succinctlabs/sp1-contracts/tree/${dossier.sourceBuildRuntime.pinnedDependencies.sp1Contracts}`
          const sourceLabel = binding.sourceFile ?? `sp1-contracts ${dossier.sourceBuildRuntime.pinnedDependencies.sp1Contracts}`
          return <tr key={binding.role}><th scope="row">{binding.role}</th><td><a href={sourceHref}><code>{sourceLabel}</code></a></td><td><code>{binding.manifestRecordedSourceSha256 ?? 'external dependency revision only'}</code></td><td><code>{binding.address}</code><br /><code>{binding.runtimeCodeHash}</code></td></tr>
        })}</tbody>
      </table></div>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Solidity implementation files whose digests are listed in the retained source manifest</caption>
        <thead><tr><th scope="col">Pinned source file</th><th scope="col">SHA-256</th></tr></thead>
        <tbody>{Object.entries(dossier.sourceBuildRuntime.sourceFileDigests).map(([path, digest]) => <tr key={path}><th scope="row"><a href={`https://github.com/protocol-robustness/prf-evm/blob/${dossier.sourceBuildRuntime.sourceRevision}/${path}`}><code>{path}</code></a></th><td><code>{digest}</code></td></tr>)}</tbody>
      </table></div>
      <p className={styles.caption}>The file digests are values recorded in the pinned manifest. Confirming them against the owning repository requires the pinned prf-evm checkout and the external publication verification command.</p>
    </section>

    <section className={styles.panel} id="recovery-and-scale" aria-labelledby="recovery-heading">
      <span className={styles.kicker}>Qualification boundaries</span>
      <h2 id="recovery-heading">Recovery and scale remain separate tests</h2>
      <div className={styles.twoColumn}>
        <article><h3>Recovery</h3><p>{dossier.recovery.staleAssuranceReplacement}. This tests reserve-staleness liveness, not a process crash, restart or safe transaction resumption.</p><p className={styles.caption}>{dossier.recovery.retryBoundaryEvidence}</p><a href="/evidence/partial-fill/v3-live-context/recovery/README.md">Inspect retained recovery branch →</a></article>
        <article><h3>Scale</h3><p>The retained happy path has {dossier.scale.entitlementCount} entitlements. Aggregate test gas is {dossier.scale.aggregateQualificationTestGas?.toLocaleString('en-GB')}; it includes the test harness and is not a per-stage benchmark.</p><p className={styles.caption}>No supported maximum, gas envelope or scaling claim is established.</p><a href="/evidence/entitlement-size/entitlement-table-deployment-bound-local.json">Inspect the separate deployment-bound sizing artifact →</a></article>
      </div>
    </section>

    <section className={styles.panel} id="typed-gaps" aria-labelledby="gaps-heading">
      <span className={styles.kicker}>Open forensic findings</span>
      <h2 id="gaps-heading">Missing evidence stays visible</h2>
      <p>These statuses are derived from the retained report. “Not tested” does not mean a conflict exists or does not exist; it means the bundle contains no test that exercises that condition.</p>
      <ul className={styles.gapList}>{dossier.gaps.map((gap) => <li key={`${gap.type}-${gap.claim}`} data-dossier-gap={gap.type}>
        <span>{gap.type} · {gap.status}</span><b>{gap.claim}</b><p>{gap.detail}</p>
      </li>)}</ul>
    </section>
  </>
}
