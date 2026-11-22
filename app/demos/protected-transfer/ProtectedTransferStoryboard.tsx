'use client'

import { useEffect, useState } from 'react'
import styles from './storyboard.module.css'

type TxRef = { hash: string; blockNumber: number; blockHash: string; status: string }
type Transfer = { tokenAddress: string; from: string; to: string; amount: number; transactionHash: string; blockNumber: number; blockHash: string; logIndex: number; status: string }
type Step = {
  id: string; sequence: number; title: string; kind: string; narration: string
  operationId: string
  chainInstance: { chainId: number; environment: string; manifestDigest: string }
  sourceCommitment: { witnessSha256: string; sourceBundleSha256: string }
  actor: { role: string; address: string | null }
  action: string; dependencies: string[]
  preState: { reserve: number; allocator: number; paid: number; liability: number }
  postState: { reserve: number; allocator: number; paid: number; liability: number }
  assetDeltas: { token: Array<{ asset: string; account: string; amount: number }>; liability: number }
  requiredChecks: string[]
  verificationResults: Array<{ validator: string; status: string; scope: string }>
  provenance: { classification: string; sourceRevision: string; evidenceRefs: Array<{ path: string; sha256: string }> }
  trustStatus: string
  amount?: number; beneficiary?: string; withdrawalMode?: string; transaction?: TxRef
  transactions?: TxRef[]; transfer?: Transfer; evidenceRefs: Array<{ path: string; sha256: string }>
}
type Timeline = {
  schema: string; presentationDigest: string
  subject: { chainId: number; environment: string; operationId: string; manifestDigest: string; preparedOperationRoot: string; configurationRoot: string; configurationEpoch: number; programId: string; proofSystem: string; vkey: string; elfSha256: string; publicValuesSchema: string; publicValuesLength: number; publicValuesSha256: string; source: { witnessSha256: string; bundleSha256: string }; sourceRevision: string; contracts: Array<{ role: string; address: string }> }
  economics: { unit: string; requested: number; grossReserve: number; protectedReserve: number; available: number; unmet: number; allocations: Array<{ name: string; amount: number; requested: number; beneficiary: string }>; terminal: { reserve: number; allocator: number; paid: number; liability: number } }
  verification: Record<string, { status: string; scope?: string; receipts?: number; freshReplayTests?: string; transfers?: number; funded?: number; withdrawn?: number; liability?: number }>
  steps: Step[]
  attacks: {
    retained: Array<{ id: string; kind: string; originalTransaction: string; outcome: string; transactionMined: boolean }>
    isolatedTests: Array<{ id: string; kind: string; outcome: string; operation: string; expectedRejection: string; testName: string; sourceRevision: string; sourcePath: string; sourceSha256: string; sourceUrl: string; command: string; preparedAllocator: string; reserveBoundAllocator: string; postcondition: string; evidencePath: string; evidenceSha256: string; limitations: string[] }>
    notCovered: Array<{ id: string; status: string; note: string }>
  }
  transactionAttribution: Array<{ transactionHash: string; forensicFunction: string; broadcastFunction: string | null; labelsAgree: boolean }>
  limitations: string[]
}

const speeds = [0.75, 1, 1.5]

export default function ProtectedTransferStoryboard({ timeline }: { timeline: Timeline }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [mode, setMode] = useState<'explore' | 'forensics'>('explore')
  const [attackCase, setAttackCase] = useState('')
  const step = timeline.steps[index]
  const state = step.postState
  const [reducedMotion, setReducedMotion] = useState(false)
  const hasContractCall = Boolean(step.transaction || step.transactions?.length)
  const transferKind = step.transfer
    ? step.transfer.from.toLowerCase() === timeline.subject.contracts.find((contract) => contract.role === 'reserve')?.address.toLowerCase() ? 'funding' : 'withdrawal'
    : null
  const transferSource = transferKind === 'funding' ? 'Reserve' : 'Allocator'
  const transferDestination = transferKind === 'funding'
    ? 'Allocator'
    : timeline.economics.allocations.find((allocation) => allocation.beneficiary.toLowerCase() === step.transfer?.to.toLowerCase())?.name ?? 'Recipient'

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!playing || reducedMotion) return
    const timer = window.setTimeout(() => {
      if (index >= timeline.steps.length - 1) setPlaying(false)
      else setIndex(index + 1)
    }, 4200 / speed)
    return () => window.clearTimeout(timer)
  }, [playing, index, speed, reducedMotion, timeline.steps.length])

  function seek(next: number) { setPlaying(false); setIndex(Math.max(0, Math.min(timeline.steps.length - 1, next))) }
  const selectedAttack = timeline.attacks.retained.find((attack) => attack.id === attackCase)
  const selectedUnitTest = timeline.attacks.isolatedTests.find((test) => test.id === attackCase)

  return <section className={styles.story} aria-label="Evidence-driven protected transfer replay">
    <div className={styles.toolbar}>
      <div><span className={styles.status}>Local evidence replay · localOnly</span><span className={styles.position}>Step {index + 1} of {timeline.steps.length}</span></div>
      <div className={styles.modes} role="group" aria-label="Replay view">
        <button type="button" aria-pressed={mode === 'explore'} onClick={() => setMode('explore')}>Explore</button>
        <button type="button" aria-pressed={mode === 'forensics'} onClick={() => setMode('forensics')}>Forensics</button>
      </div>
    </div>

    <div className={styles.layout}>
      <div className={styles.scene}>
        <div className={styles.sceneLabel}>Observed operation <span>Chain {timeline.subject.chainId} · {timeline.subject.operationId.slice(0, 14)}…</span></div>
        <div className={styles.flow} aria-label="Reserve, protected operation, allocator and recipients">
          <BalanceCard label="Reserve" amount={state.reserve} unit="fixture units" active={step.id === 'prepare-ratify-fund' || (step.kind === 'observed-asset-transfer' && transferKind === 'funding')} />
          <span className={styles.edge} aria-hidden="true">→</span>
          <div key={step.id} className={`${styles.guard} ${hasContractCall ? styles.callActive : ''}`}><span>Protected operation</span><b>proof · authority</b></div>
          <span className={styles.edge} aria-hidden="true">→</span>
          <BalanceCard label="Allocator" amount={state.allocator} unit="fixture units" active={step.kind === 'observed-asset-transfer' || step.id === 'prepare-ratify-fund'} />
          <span className={styles.edge} aria-hidden="true">→</span>
          <BalanceCard label="Paid" amount={state.paid} unit="fixture units" active={step.kind === 'observed-asset-transfer' && transferKind === 'withdrawal'} />
        </div>
        {step.transfer ? <div className={styles.transferTrack} role="group" aria-label={`Receipt-observed transfer of ${step.transfer.amount} fixture units from ${transferSource} to ${transferDestination}`}>
          <div className={styles.transferHeading}><span>Observed transfer</span><b>{step.transfer.amount} fixture units</b></div>
          <div className={styles.transferRoute}>
            <div className={styles.transferEndpoint}><small>FROM</small><b>{transferSource}</b></div>
            <div className={styles.transferRail} aria-hidden="true"><span key={step.id} className={styles.transferToken}>{step.transfer.amount} units</span></div>
            <div className={styles.transferEndpoint}><small>TO</small><b>{transferDestination}</b></div>
          </div>
          <p>Receipt log · block {step.transfer.blockNumber} · {step.transfer.status}</p>
        </div> : hasContractCall ? <div className={styles.callTrack} role="status">Contract interaction observed · no token movement at this step</div> : null}
        <div className={styles.recipients} aria-label="Observed allocation amounts">
          {timeline.economics.allocations.map((person) => <span key={person.name}>{person.name} <b>{person.amount}</b></span>)}
        </div>
        <div className={styles.eventNote} aria-live="polite">
          {step.transfer ? `Receipt log: ${step.transfer.amount} units moved to ${step.transfer.to.slice(0, 10)}… in block ${step.transfer.blockNumber}.` : 'No token transfer is represented at this step.'}
        </div>
        {step.id.startsWith('claim-') && <p className={styles.modeHint}>Withdrawal assurance mode: {step.withdrawalMode}. This is the mode recorded for this claim.</p>}
      </div>

      <aside className={styles.explanation} aria-live="polite">
        <span className={styles.phase}>{step.kind.replaceAll('-', ' ')}</span>
        <h2>{step.title}</h2>
        <p className={styles.speech}>{step.narration}</p>
        <p><b>At this point</b><br />Reserve {state.reserve}; allocator {state.allocator}; paid {state.paid}; outstanding liability {state.liability} fixture units.</p>
        {mode === 'forensics' ? <ForensicDetails timeline={timeline} step={step} /> : <p className={styles.modeHint}>Switch to Forensics to inspect the pinned identities, receipts, checks and evidence files for this event.</p>}
      </aside>
    </div>

    <section className={styles.attack} aria-labelledby="attack-title">
      <div><h3 id="attack-title">Try a retained negative case</h3><p>These are read-only duplicate-claim replays after closure. No new transaction is sent.</p></div>
      <div className={styles.controls}>
        <label>Case <select value={attackCase} onChange={(event) => setAttackCase(event.target.value)}><option value="">Choose a retained test</option>{timeline.attacks.isolatedTests.map((test) => <option key={test.id} value={test.id}>Wrong allocator binding · Foundry unit test</option>)}{timeline.attacks.retained.map((attack, i) => <option key={attack.id} value={attack.id}>Duplicate claim {i + 1} · read-only replay</option>)}</select></label>
      </div>
      {selectedAttack && <p className={styles.rejection} role="status">Read-only replay reverted. Original transaction: <code>{selectedAttack.originalTransaction}</code>. This is not a mined failed transaction and does not test a changed funding destination.</p>}
      {selectedUnitTest && <div className={styles.rejection} role="status"><b>Separate Foundry unit test passed.</b> The test prepared allocator <code>{selectedUnitTest.preparedAllocator}</code> while the reserve was bound to <code>{selectedUnitTest.reserveBoundAllocator}</code>. Ratification reverted with <code>{selectedUnitTest.expectedRejection}</code>; assurance remained unconsumed. No transaction was mined. <p>Test operation: {selectedUnitTest.operation}. Source: <a href={selectedUnitTest.sourceUrl}>{selectedUnitTest.sourcePath} at {selectedUnitTest.sourceRevision.slice(0, 12)}</a>. <a href={selectedUnitTest.evidencePath}>Retained command/result record</a>.</p><p>This is a separate test-harness identity, not the main replay operation. It tests a prepared-versus-reserve allocator mismatch, not a caller-selected funding destination.</p></div>}
      <p className={styles.notAttached}>Caller-selected destination substitution: {timeline.attacks.notCovered[0].status}. {timeline.attacks.notCovered[0].note}</p>
    </section>

    <div className={styles.controls} aria-label="Replay controls">
      <button type="button" onClick={() => seek(0)}>Replay</button>
      <button type="button" onClick={() => reducedMotion ? setIndex((current) => Math.min(timeline.steps.length - 1, current + 1)) : setPlaying((value) => !value)} aria-pressed={playing}>{reducedMotion ? 'Step' : playing ? 'Pause' : 'Play'}</button>
      <button type="button" onClick={() => seek(index - 1)} disabled={index === 0}>Back</button>
      <button type="button" onClick={() => seek(index + 1)} disabled={index === timeline.steps.length - 1}>Next</button>
      <label>Speed <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{speeds.map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>
    </div>
    <nav className={styles.timeline} aria-label="Evidence timeline">
      {timeline.steps.map((item, itemIndex) => <button key={item.id} type="button" aria-current={itemIndex === index ? 'step' : undefined} onClick={() => seek(itemIndex)}><span>{String(item.sequence).padStart(2, '0')}</span><b>{item.title}</b></button>)}
    </nav>
    <ol className={styles.transcript} aria-label="Complete replay transcript">
      {timeline.steps.map((item, itemIndex) => <li key={item.id} aria-current={itemIndex === index ? 'step' : undefined}><b>{item.title}.</b> {item.narration}</li>)}
    </ol>
    <p className={styles.digest}>Presentation projection {timeline.schema} · SHA-256 {timeline.presentationDigest}. This site projection is not a PRF canonical identity.</p>
  </section>
}

function ForensicDetails({ timeline, step }: { timeline: Timeline; step: Step }) {
  return <div className={styles.evidence}>
    <h3>Evidence attached to this step</h3>
    <dl>
      <dt>Operation</dt><dd><code>{step.operationId}</code></dd>
      <dt>Chain instance</dt><dd>{step.chainInstance.environment} · {step.chainInstance.chainId}</dd>
      <dt>Source commitment</dt><dd>Witness <code>{step.sourceCommitment.witnessSha256}</code> · bundle <code>{step.sourceCommitment.sourceBundleSha256}</code></dd>
      <dt>Action / actor</dt><dd>{step.action} · {step.actor.role}{step.actor.address ? ` (${step.actor.address})` : ''}</dd>
      <dt>Depends on</dt><dd>{step.dependencies.length ? step.dependencies.join(', ') : 'No earlier event'}</dd>
      <dt>Trust status</dt><dd>{step.trustStatus}</dd>
      <dt>Required checks</dt><dd>{step.requiredChecks.join('; ')}</dd>
      <dt>Pre → post state</dt><dd><code>{JSON.stringify(step.preState)} → {JSON.stringify(step.postState)}</code></dd>
      <dt>Asset deltas</dt><dd><code>{JSON.stringify(step.assetDeltas)}</code></dd>
      <dt>Validator results</dt><dd>{step.verificationResults.map((result) => `${result.validator}: ${result.status} (${result.scope})`).join('; ')}</dd>
    </dl>
    <ul>{step.evidenceRefs.map((ref) => <li key={ref.path}><a href={ref.path}>{ref.path.split('/').at(-1)}</a><br /><code>{ref.sha256}</code></li>)}</ul>
    <details><summary>Deployment and proof identity</summary><dl>
      <dt>Operation</dt><dd><code>{timeline.subject.operationId}</code></dd>
      <dt>Manifest</dt><dd><code>{timeline.subject.manifestDigest}</code></dd>
      <dt>Prepared root</dt><dd><code>{timeline.subject.preparedOperationRoot}</code></dd>
      <dt>Program / proof</dt><dd>{timeline.subject.programId} · {timeline.subject.proofSystem}</dd>
      <dt>VKey</dt><dd><code>{timeline.subject.vkey}</code></dd>
      <dt>ELF SHA-256</dt><dd><code>{timeline.subject.elfSha256}</code></dd>
      <dt>Public values</dt><dd>{timeline.subject.publicValuesLength} bytes · <code>{timeline.subject.publicValuesSha256}</code></dd>
      <dt>Source revision</dt><dd><code>{timeline.subject.sourceRevision}</code></dd>
      <dt>Configuration</dt><dd>epoch {timeline.subject.configurationEpoch} · <code>{timeline.subject.configurationRoot}</code></dd>
      <dt>Source witness / bundle</dt><dd><code>{timeline.subject.source.witnessSha256}</code> / <code>{timeline.subject.source.bundleSha256}</code></dd>
    </dl></details>
    <details><summary>Deployed dependencies ({timeline.subject.contracts.length})</summary><ul>{timeline.subject.contracts.map((contract) => <li key={contract.role}><b>{contract.role}</b> <code>{contract.address}</code></li>)}</ul></details>
    <details><summary>Verification scope and limitations</summary><ul>{Object.entries(timeline.verification).map(([name, result]) => <li key={name}><b>{name}:</b> {result.status}{result.scope ? ` — ${result.scope}` : ''}</li>)}</ul><ul>{timeline.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></details>
    <details><summary>Recorded call-label comparison</summary><ul>{timeline.transactionAttribution.map((item) => <li key={item.transactionHash}><code>{item.transactionHash}</code><br />Forensic record: {item.forensicFunction}; broadcast label: {item.broadcastFunction ?? 'none'}; {item.labelsAgree ? 'labels agree' : 'label mismatch retained'}</li>)}</ul></details>
  </div>
}

function BalanceCard({ label, amount, unit, active }: { label: string; amount: number; unit: string; active: boolean }) {
  return <div className={`${styles.balance} ${active ? styles.active : ''}`}><span>{label}</span><strong>{amount}</strong><small>{unit}</small></div>
}
