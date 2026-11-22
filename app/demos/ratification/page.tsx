import type { Metadata } from 'next'
import Link from 'next/link'
import DemoShell from '@/components/demo/DemoShell'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Proof-Bound Ratification · Protected Operations',
  description:
    'Trace how a source-bound proof, prepared operation, and reserve commitment gate protected capital funding.',
}

const artifacts = [
  ['Settlement funding record', 'settlement-funding.json'],
  ['Run manifest', 'settlement-manifest.json'],
  ['Proof fixture', 'settlement-proof-fixture.json'],
  ['Raw proof payload', 'settlement-proof-raw.json'],
  ['Proof witness', 'settlement-witness.json'],
  ['Input provenance', 'settlement-input-provenance.json'],
  ['Funding execution DAG', 'settlement-execution-dag.json'],
]

const sourceTests = [
  ['Tampered proof rejected without nonce or capital transition', '#L211-L225'],
  ['Proof cannot be rebound to another operation', '#L227-L259'],
  ['Proof cannot be substituted for another prepared root', '#L261-L280'],
  ['Configuration mismatch consumes nothing', '#L282-L301'],
  ['Stale reserve projection leaves assurance and capital untouched', '#L303-L321'],
  ['Direct ratification rejected outside the authorized route', '#L166-L209'],
]

const testSource =
  'https://github.com/protocol-robustness/prf-evm/blob/353062b667e900b6735fea6fd7ef7a61fd5282e3/examples/assured-operations/pro-rata-conformance/test/ProRataRealProofConformance.t.sol'

const gateScenarios = [
  {
    id: 'accepted', label: 'Recorded acceptance', failure: null,
    narration: 'The retained local EVM operation passed its gate and funded 70 units. Reserve custody moved from 80 to 10; allocator custody moved from 0 to 70.',
    status: 'locally-observed' as const, sourceLabel: 'Settlement funding record', sourceHref: '/evidence/pro-rata-settlement/settlement-funding.json', identity: 'gate-e-20261010-current-00d90 · chain 31337 · block 40',
    scope: 'Local Anvil execution and fixture-token movement; not a public-chain result or third-party protocol integration.',
  },
  {
    id: 'tampered-proof', label: 'Tampered proof', failure: 'proof',
    narration: 'For comparison, keep the proposed 70-unit funding action and change only proof validity. The pinned conformance source requires rejection without consuming the authorization or moving capital.',
    status: 'source-assertion' as const, sourceLabel: 'Pinned V2 conformance test · tampered proof', sourceHref: testSource + '#L211-L225', identity: 'prf-evm@353062b667e900b6735fea6fd7ef7a61fd5282e3 · lines 211–225',
    scope: 'Source-level rejection assertion; this branch is not an additional transaction from the retained run.',
  },
  {
    id: 'wrong-operation', label: 'Wrong operation', failure: 'operation',
    narration: 'Change only the operation binding. The pinned conformance source requires a proof for another operation to be rejected.',
    status: 'source-assertion' as const, sourceLabel: 'Pinned V2 conformance test · operation binding', sourceHref: testSource + '#L227-L259', identity: 'prf-evm@353062b667e900b6735fea6fd7ef7a61fd5282e3 · lines 227–259',
    scope: 'Source-level rejection assertion; the comparison holds other gate conditions constant for explanation.',
  },
  {
    id: 'wrong-root', label: 'Wrong prepared root', failure: 'prepared-root',
    narration: 'Change only the prepared-operation root. The proof no longer describes this action, so the source assertion requires rejection.',
    status: 'source-assertion' as const, sourceLabel: 'Pinned V2 conformance test · prepared root', sourceHref: testSource + '#L261-L280', identity: 'prf-evm@353062b667e900b6735fea6fd7ef7a61fd5282e3 · lines 261–280',
    scope: 'Source-level rejection assertion; this is not a replayed negative transaction.',
  },
  {
    id: 'configuration-mismatch', label: 'Configuration mismatch', failure: 'configuration',
    narration: 'Change only the bound verifier configuration. The source assertion requires rejection without consuming the operation authorization.',
    status: 'source-assertion' as const, sourceLabel: 'Pinned V2 conformance test · configuration mismatch', sourceHref: testSource + '#L282-L301', identity: 'prf-evm@353062b667e900b6735fea6fd7ef7a61fd5282e3 · lines 282–301',
    scope: 'Source-level rejection assertion; configuration binding is distinct from successful funding evidence.',
  },
  {
    id: 'stale-reserve', label: 'Stale reserve', failure: 'reserve',
    narration: 'Change only the current reserve projection. The source assertion requires rejection while assurance and capital remain untouched.',
    status: 'source-assertion' as const, sourceLabel: 'Pinned V2 conformance test · stale reserve projection', sourceHref: testSource + '#L303-L321', identity: 'prf-evm@353062b667e900b6735fea6fd7ef7a61fd5282e3 · lines 303–321',
    scope: 'Source-level rejection assertion; no stale-reserve transaction is claimed as retained runtime evidence.',
  },
  {
    id: 'unauthorized-route', label: 'Unauthorized route', failure: 'authority',
    narration: 'Change only the caller route. The pinned source requires direct ratification outside the authorized route to be rejected.',
    status: 'source-assertion' as const, sourceLabel: 'Pinned V2 conformance test · unauthorized route', sourceHref: testSource + '#L166-L209', identity: 'prf-evm@353062b667e900b6735fea6fd7ef7a61fd5282e3 · lines 166–209',
    scope: 'Source-level rejection assertion; this is not an observed unauthorized call in the successful run.',
  },
] as const

type GateFailure = Exclude<(typeof gateScenarios)[number]['failure'], null>

function GateDecisionCard({ failure }: { failure: GateFailure | null }) {
  const checks: Array<{ id: GateFailure; label: string }> = [
    { id: 'proof', label: 'Proof valid and admitted' },
    { id: 'operation', label: 'Proof bound to this operation' },
    { id: 'prepared-root', label: 'Prepared operation root matches' },
    { id: 'configuration', label: 'Verifier configuration matches' },
    { id: 'reserve', label: 'Current reserve commitment is sufficient' },
    { id: 'authority', label: 'Authorized execution route' },
  ]
  return <div className={styles.gateVisual}>
    <div className={styles.gateRequest}><span>Proposed action</span><b>Fund allocator · 70 units</b></div>
    <ul className={styles.gateChecks}>
      {checks.map((check) => <li key={check.id} className={failure === check.id ? styles.gateFailed : styles.gatePassed}>
        <span aria-hidden="true">{failure === check.id ? '×' : '✓'}</span><b>{check.label}</b><small>{failure === check.id ? 'fails' : 'passes in comparison'}</small>
      </li>)}
    </ul>
    <div className={`${styles.gateOutcome} ${failure ? styles.gateBlocked : styles.gateAllowed}`}>
      <strong>{failure ? 'Funding must be rejected' : 'Funding permitted in retained local run'}</strong>
      <div><span>Reserve <b>{failure ? '80 → 80' : '80 → 10'}</b></span><span>Allocator <b>{failure ? '0 → 0' : '0 → 70'}</b></span></div>
      {failure && <small>Counterfactual comparison based on the pinned source assertion; the unchanged checks are held constant to show one changed condition.</small>}
    </div>
  </div>
}

export default function RatificationPage() {
  return (
    <main className={styles.page}>
      <Link href="/demos#protected-operations" className={styles.back}>← Protected operations</Link>
      <header className={styles.hero}>
        <span className={styles.kicker}>Protected operations · assurance gate</span>
        <h1>What must line up before capital moves?</h1>
        <p className={styles.lede}>
          Ratification binds an admitted proof to one prepared operation and one
          reserve commitment. Only the authorized execution route can consume
          that assurance and fund the allocator.
        </p>
        <div className={styles.facts}>
          <span><b>1</b> prepared operation</span>
          <span><b>1</b> reserve commitment</span>
          <span><b>70</b> funded units</span>
          <span><b>10</b> protected units retained</span>
        </div>
      </header>

      <section className={styles.sequence} aria-label="Ratification sequence">
        <article><span>01</span><h2>Prepare</h2><p>Bind an operation ID to its prepared root.</p></article>
        <article><span>02</span><h2>Prove and admit</h2><p>Verify the public values under the selected program and configuration.</p></article>
        <article><span>03</span><h2>Bind assurance</h2><p>Freeze the admission receipt for that operation and reserve commitment.</p></article>
        <article><span>04</span><h2>Ratify and fund</h2><p>Recheck live reserve state, consume the authorized action, then transfer exact capital.</p></article>
      </section>

      <section className={styles.decision} aria-labelledby="decision-heading">
        <span className={styles.integrationLabel}>Evidence-backed decision</span>
        <h2 id="decision-heading">When should capital be allowed to move?</h2>
        <p>Play the retained acceptance, then change one gate condition at a time. Rejection branches are source-level conformance assertions, not additional transactions from the retained run.</p>
        <DemoShell steps={gateScenarios.map((scenario) => ({
          id: scenario.id,
          label: scenario.label,
          node: <GateDecisionCard failure={scenario.failure} />,
          narration: scenario.narration,
          evidence: { status: scenario.status, sourceLabel: scenario.sourceLabel, sourceHref: scenario.sourceHref, identity: scenario.identity, scope: scenario.scope },
        }))} />
      </section>

      <section className={styles.integration} aria-labelledby="integration-heading">
        <span className={styles.integrationLabel}>Integration pattern</span>
        <h2 id="integration-heading">Add the assurance gate at the consequential operation</h2>
        <p>Keep the protocol’s existing state and governance. Add a narrow adapter that binds the operation to its current state, admits the required proof, and routes capital movement through the authorized gate.</p>
        <div className={styles.integrationFlow}>
          <div><b>Protocol</b><span>state · rules · authority</span></div><i aria-hidden="true">→</i>
          <div><b>Adapter</b><span>canonical operation + state commitment</span></div><i aria-hidden="true">→</i>
          <div><b>Assurance gate</b><span>proof + policy + current reserve</span></div><i aria-hidden="true">→</i>
          <div><b>Existing action</b><span>fund only through authorized route</span></div>
        </div>
        <p className={styles.integrationBoundary}><strong>⚠ Demonstrated boundary:</strong> the retained run exercises this pattern in a local EVM fixture. It is not an integration deployed to a third-party protocol. A protocol-specific demo needs a named target, pinned source revision and an exercised integration test.</p>
      </section>

      <section className={styles.section}>
        <h2>Recorded successful path</h2>
        <p className={styles.intro}>In the retained local EVM run, the admitted operation funded 70 units while preserving the 10-unit reserve floor.</p>
        <div className={styles.balance}>
          <div><span>Reserve</span><b>80 → 10</b><small>10 remains protected</small></div>
          <div><span>Allocator custody</span><b>0 → 70</b><small>exact funded amount</small></div>
          <div><span>Temporary reservation</span><b>0</b><small>cleared after funding</small></div>
        </div>
        <dl className={styles.identifiers}>
          <dt>Run</dt><dd><code>gate-e-20261010-current-00d90</code></dd>
          <dt>Operation</dt><dd><code>0x809b4fbdb632eba4671e5d5f35a37ff12aa4ae28e1ec84aece40972b1138755d</code></dd>
          <dt>Prepared root</dt><dd><code>0xe0c2dc5821ca3b6ec330d8af7bcb407400b19bff4d8ee08f727970494dd85eb2</code></dd>
          <dt>Reserve commitment</dt><dd><code>0xe04f4989c32dfde256d9c2ba9f4187e64910999506bb0528b3fda7c33a8f3aee</code></dd>
          <dt>Proof program</dt><dd><code>source-bound-entitlement-sp1-program.v1 · Groth16</code></dd>
        </dl>
      </section>

      <section className={styles.challenge}>
        <h2>What rejection must preserve</h2>
        <p>The separate V2 conformance source encodes rejection checks for wrong proofs and mismatched bindings. Its assertions require rejected calls to leave capital and one-time authorization state untouched.</p>
        <div className={styles.testCases}>
          {sourceTests.map(([label, fragment]) => (
            <a key={label} href={testSource + fragment} target="_blank" rel="noreferrer">
              <span>{label}</span><b>View source ↗</b>
            </a>
          ))}
        </div>
        <p className={styles.caveat}>These are source-level conformance assertions, not additional transactions or transcripts from the retained local run above.</p>
      </section>

      <aside className={styles.scope}>
        <h2>Scope and limits</h2>
        <ul>
          <li>The downloadable EVM record is a local Anvil run on chain ID 31337 using the v1 entitlement proof program.</li>
          <li>The V2 rejection checks are linked from a separate conformance test source at a pinned repository revision.</li>
          <li>The V2 ratification path ends at Funded; this demo does not claim V2 activation or withdrawal.</li>
          <li>Local RPC observations and receipts are not cryptographic proofs of chain state.</li>
        </ul>
        <details className={styles.forensics}>
          <summary>Additional forensics</summary>
          <p>Download the retained successful-run records, and inspect the pinned conformance source.</p>
          <div className={styles.downloads}>
            {artifacts.map(([label, file]) => (
              <a key={file} href={'/evidence/pro-rata-settlement/' + file} download>{label}</a>
            ))}
            <a href={testSource} target="_blank" rel="noreferrer">V2 real-proof conformance source at pinned revision ↗</a>
          </div>
        </details>
      </aside>
    </main>
  )
}
