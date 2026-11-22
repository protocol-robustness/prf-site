'use client'

import { useState } from 'react'
import DemoShell from '@/components/demo/DemoShell'
import styles from './page.module.css'
import EvidenceCheckpoint from './EvidenceCheckpoint'
import type { ForensicEvidence } from './EvidenceCheckpoint'

type StateProjection = {
  stage: string
  source_ref: string
  computed_total_custody: number
  custody_equation_holds: boolean
  observation: {
    reserveBalance: number
    allocatorBalance: number
    aliceBalance: number
    bobBalance: number
    carolBalance: number
    outstandingLiability: number
    claimedAmount: number
    claimedCount: number
  }
}

const stages: Record<string, { label: string; explanation: string }> = {
  opening: { label: 'Reserve funded', explanation: 'The reserve holds 80 fixture-token units. Ten are restricted; 70 are available for this allocation. No claimant liability has been activated.' },
  proof_admitted: { label: 'Proof admitted', explanation: 'Admission authorizes no token transfer by itself. The operation still has to pass ratification and live-reserve checks.' },
  funded: { label: 'Allocator funded', explanation: 'Seventy units have moved into allocator custody. Outstanding activated liability is still zero.' },
  activated: { label: 'Entitlements activated', explanation: 'Activation binds the representation to the admitted table root, count and total. Seventy units now become authoritative claimant liabilities; activation moves no tokens.' },
  after_alice_claim: { label: 'Alice withdraws', explanation: 'Alice has received her 35-unit entitlement. The allocator retains 35 units for the remaining claims.' },
  after_bob_claim: { label: 'Bob withdraws', explanation: 'Bob has received 21 units. Fourteen units remain in allocator custody and as outstanding claimant liability.' },
  allocator_closed: { label: 'Carol withdraws', explanation: 'Carol has received her 14-unit entitlement. All three claims are consumed, allocator custody is zero and the allocator is Closed.' },
  reserve_finalized: { label: 'Restricted capital returned', explanation: 'After claimant closure, the separate restricted 10 is returned to Carol under the fixture policy. Her balance is now 24: a 14-unit claim plus a 10-unit refund.' },
}

const evidenceRoot = '/evidence/composed-pro-rata-v2-settlement'
const stateRecords = [
  { label: 'State observations', href: `${evidenceRoot}/accounting-states.json` },
  { label: 'Execution log', href: `${evidenceRoot}/execution.log` },
]
const transferRecords = [
  { label: 'Token transfers', href: `${evidenceRoot}/transfers.json` },
  ...stateRecords,
]
const localObservationLimit = 'Local Foundry call-boundary records; no separately mined receipt or authenticated public-chain state.'
const stageEvidence: Record<string, ForensicEvidence> = {
  opening: {
    classification: 'Fixture declaration + local observation',
    records: [{ label: 'Committed source and reserve inputs', href: `${evidenceRoot}/source-witness.json` }, ...stateRecords],
    check: 'The fixture validator cross-checks the witness reserve inputs and the opening balance projection; the manifest pins their file identities.',
    conclusion: 'The retained run starts with 80 reserve units and a declared 10-unit restriction, leaving 70 available.',
    limit: 'The fixture establishes its own request and capital policy. It does not authenticate external claims or beneficial ownership.',
  },
  proof_admitted: {
    classification: 'Retained cryptographic verification + local admission',
    records: [{ label: 'Exact Groth16 proof', href: '/evidence/partial-fill/v3-live-context/proof.json' }, { label: 'Program, operation and configuration', href: `${evidenceRoot}/manifest.json` }, ...stateRecords],
    check: 'The retained Foundry test invokes the real verifier and registry/admission route. The offline validator checks proof identity, public values and operation bindings.',
    conclusion: 'This proof was admitted for this local operation; admission itself moved no capital.',
    limit: 'Inspecting this record does not rerun cryptographic verification or establish externally approved configuration.',
  },
  funded: {
    classification: 'Observed transfer + custody reconciliation',
    records: transferRecords,
    check: 'The validator matches transfers.json record 0 to the reserve-to-allocator movement and the funded state projection, including zero outstanding activated liability.',
    conclusion: 'Seventy units moved to allocator custody through the retained protected funding path.',
    limit: localObservationLimit,
  },
  activated: {
    classification: 'Local activation + commitment and liability checks',
    records: [{ label: 'Derived entitlement commitments', href: `${evidenceRoot}/rust-replay.json` }, ...stateRecords],
    check: 'The retained contract test checks representation binding at activation; the validator checks the activated state and its 70-unit liability without a new token transfer.',
    conclusion: 'The admitted representation becomes the authoritative 70-unit claimant liability in this execution.',
    limit: 'This run uses the packed representation. It does not establish equivalence with every other representation.',
  },
  after_alice_claim: {
    classification: 'Claim evidence + observed payment + remaining liability',
    records: [{ label: 'Committed claim-a beneficiary', href: `${evidenceRoot}/source-witness.json` }, ...transferRecords],
    check: 'The validator reconciles transfers.json record 1 with Alice’s 35-unit payment and the after_alice_claim projection: 35 left in custody and as liability.',
    conclusion: 'Alice’s 35-unit entitlement was paid locally; Bob and Carol’s funded claims remain.',
    limit: localObservationLimit,
  },
  after_bob_claim: {
    classification: 'Claim evidence + observed payment + remaining liability',
    records: [{ label: 'Committed claim-b beneficiary', href: `${evidenceRoot}/source-witness.json` }, ...transferRecords],
    check: 'The validator reconciles transfers.json record 2 with Bob’s 21-unit payment and the after_bob_claim projection: 14 left in custody and as liability.',
    conclusion: 'Bob’s 21-unit entitlement was paid locally; Carol’s 14-unit funded claim remains.',
    limit: localObservationLimit,
  },
  allocator_closed: {
    classification: 'Final claim evidence + observed claimant closure',
    records: [{ label: 'Committed claim-c beneficiary', href: `${evidenceRoot}/source-witness.json` }, ...transferRecords, { label: 'Reconciliation', href: `${evidenceRoot}/reconciliation.json` }],
    check: 'The validator reconciles transfers.json record 3 with Carol’s 14-unit claim, three consumed claims, 70 paid and zero allocator custody/liability.',
    conclusion: 'The claimant lifecycle is Closed. The separate restricted 10 is still in reserve at this stage.',
    limit: localObservationLimit,
  },
  reserve_finalized: {
    classification: 'Observed restricted refund + terminal reconciliation',
    records: [...transferRecords, { label: 'Derived journal', href: `${evidenceRoot}/accounting-journal.json` }, { label: 'Terminal reconciliation', href: `${evidenceRoot}/reconciliation.json` }],
    check: 'The validator checks transfers.json record 4 as a separate reserve refund and reconciles terminal balances: 35 + 21 + 24 = 80, with zero reserve/allocator custody.',
    conclusion: 'Claim settlement and the restricted-capital refund are separately accounted for; the local reserve is finalized.',
    limit: 'Carol’s refund entitlement is fixture-policy-bound. External beneficial ownership and public-chain finality remain unverified.',
  },
}

export function SettlementTimeline({ states }: { states: StateProjection[] }) {
  return <DemoShell steps={states.map((state) => {
    const evidence = stageEvidence[state.stage] ?? {
      classification: 'Unverified stage', records: stateRecords,
      check: 'No stage-specific forensic check is defined for this observation.',
      conclusion: 'No verified stage relationship is inferred.',
      limit: 'Investigate the unsupported stage before relying on it.',
    }
    return {
      id: state.stage,
      label: stages[state.stage]?.label ?? state.stage,
      narration: stages[state.stage]?.explanation ?? 'No stage-specific narrative is defined.',
      evidence: {
        status: state.stage === 'opening' ? 'qualified' as const : 'locally-observed' as const,
        sourceLabel: evidence.records[0]?.label ?? 'Retained settlement state record',
        sourceHref: evidence.records[0]?.href,
        identity: state.source_ref,
        scope: evidence.limit,
      },
      node: <SettlementObservation state={state} evidence={evidence} />,
    }
  })} />
}

function SettlementObservation({ state, evidence }: { state: StateProjection; evidence: ForensicEvidence }) {
  const observation = state.observation
  return <div className={styles.observation} aria-live="polite" aria-atomic="true" data-settlement-observation="true">
    <h3>{stages[state.stage]?.label ?? state.stage}</h3>
    <EvidenceCheckpoint evidence={evidence} />
    <div className={styles.tableScroll}>
      <table className={styles.dataTable}>
        <caption>Observed balances and liabilities · fixture-token units</caption>
        <thead><tr><th scope="col">Reserve</th><th scope="col">Allocator</th><th scope="col">Alice</th><th scope="col">Bob</th><th scope="col">Carol</th><th scope="col">Outstanding liability</th></tr></thead>
        <tbody><tr><td>{observation.reserveBalance}</td><td>{observation.allocatorBalance}</td><td>{observation.aliceBalance}</td><td>{observation.bobBalance}</td><td>{observation.carolBalance}</td><td>{observation.outstandingLiability}</td></tr></tbody>
      </table>
    </div>
    <p className={styles.caption}>Recorded total custody: {state.computed_total_custody} units. Reconciliation: {state.custody_equation_holds ? 'holds' : 'does not hold'}. Activated liability is an obligation against custody; do not add it to token balances.</p>
    <p className={styles.caption}>{observation.claimedCount} claims consumed · {observation.claimedAmount} entitlement units paid. Source: <code>{state.source_ref}</code> in the retained projection. Inspect the <a href="/evidence/composed-pro-rata-v2-settlement/accounting-states.json">state observations</a> and <a href="/evidence/composed-pro-rata-v2-settlement/execution.log">execution log</a>.</p>
  </div>
}

export type EvidenceClaim = {
  id: string
  question: string
  classification: string
  finding: string
  validator: string
  limitation: string
  artifacts: { label: string; href: string }[]
}

export function EvidenceExplorer({ claims }: { claims: EvidenceClaim[] }) {
  const [selected, setSelected] = useState(claims[0].id)
  const claim = claims.find(({ id }) => id === selected) ?? claims[0]

  return <div className={styles.explorer}>
    <div className={styles.questionButtons} role="group" aria-label="Choose a claim to inspect">
      {claims.map(({ id, question }) => <button key={id} type="button" aria-pressed={selected === id}
        onClick={() => setSelected(id)}>{question}</button>)}
    </div>
    <div className={styles.observation} aria-live="polite" aria-atomic="true">
      <span className={styles.evidenceLabel}>{claim.classification}</span>
      <h3>{claim.question}</h3>
      <p>{claim.finding}</p>
      <p><b>Check performed:</b> {claim.validator}</p>
      <div className={styles.downloads}>{claim.artifacts.map(({ label, href }) => <a key={href} href={href}>{label} →</a>)}</div>
      <p className={styles.caption}><b>Evidence limit:</b> {claim.limitation}</p>
    </div>
  </div>
}

export type AdversarialCase = {
  test: string
  attempt: string
  guard: string
  outcome: string
}

export function AdversarialExplorer({ cases, passed }: { cases: AdversarialCase[]; passed: string[] }) {
  const [selected, setSelected] = useState(cases[0].test)
  const attack = cases.find(({ test }) => test === selected) ?? cases[0]

  return <div className={styles.explorer}>
    <label className={styles.selectLabel} htmlFor="retained-attack">Inspect a retained adversarial test</label>
    <select className={styles.caseSelect} id="retained-attack" value={selected} onChange={(event) => setSelected(event.target.value)}>
      {cases.map(({ test, attempt }) => <option key={test} value={test}>{attempt}</option>)}
    </select>
    <div className={styles.observation} aria-live="polite" aria-atomic="true">
      <h3>{attack.attempt}</h3>
      <p><b>Enforced boundary:</b> {attack.guard}</p>
      <p>{attack.outcome}</p>
      <p className={styles.evidenceLabel}>{passed.includes(attack.test) ? 'Retained test: passed' : 'No retained passing result'}</p>
      <p><b>Forensic check:</b> Match this test identifier and its rejection result in the execution log with the validator’s negative-test inventory. The recorded outcome above states which state-preservation checks this case supports.</p>
      <p className={styles.caption}><code>{attack.test}</code> · <a href="/evidence/composed-pro-rata-v2-settlement/adversarial-tests.log">Read the execution evidence →</a> · <a href={`${evidenceRoot}/validation-result.json`}>Cross-check the validator inventory →</a></p>
    </div>
    <p className={styles.caption}>These controls inspect recorded test results. Selecting a case does not execute a transaction or run a new test.</p>
  </div>
}
