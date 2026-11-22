import type { Metadata } from 'next'
import DemoShell from '@/components/demo/DemoShell'
import { BaselineCard, ChangeCard, OutcomeCard, WhyCard, CommitmentsCard } from '@/components/demo/StateCards'
import EvidencePanel from '@/components/demo/EvidencePanel'
import TechnicalProofCTA from '@/components/demo/TechnicalProofCTA'
import { assertPublicDemo } from '@/lib/validate-public-demo'
import type { CurrentHeadDemo } from '@/lib/public-demo'
import raw from '@/generated/demos/current-head.json'
import styles from './page.module.css'
import records from './records.module.css'

export const metadata: Metadata = {
  title: 'Current Head',
  description:
    'Can a resubmission extend an older, superseded result? The real chain facade refuses it and leaves the current verified head unchanged.',
}

assertPublicDemo(raw)
const demo = raw as CurrentHeadDemo

export default function CurrentHeadPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>Admission</span>
      <h1 className={styles.title}>Current Head</h1>
      <p className={styles.question}>{demo.demo.question}</p>

      <DemoShell
        steps={[
          { id: 'scenario', label: 'Verified history', node: <HistoryCard demo={demo} />, narration: `The retained sequence is ${demo.scenario.records.items.join(' → ')}.`, evidence: { status: 'verified-check', sourceLabel: 'generated/demos/current-head.json', identity: demo.evidence['committed-hash'], scope: 'This fixture represents a bounded resubmission history.' } },
          { id: 'baseline', label: 'Current head', node: <BaselineCard demo={demo} />, narration: `${demo.baseline.value} is admitted as the current head.`, evidence: { status: 'verified-check', sourceLabel: 'generated/demos/current-head.json', identity: demo.evidence['committed-hash'], scope: 'The current-head claim is relative to this retained history.' } },
          { id: 'change', label: 'Stale submission', node: <ChangeCard demo={demo} />, narration: `${demo.change.label}: candidate parent ${demo.change.to} is older than current head ${demo.change.from}.`, evidence: { status: 'qualified', sourceLabel: 'generated/demos/current-head.json', identity: demo.evidence['committed-hash'], scope: 'The stale candidate is part of the retained fixture, not a public network submission.' } },
          { id: 'outcome', label: 'Admission result', node: <OutcomeCard demo={demo} />, narration: `The stale candidate is ${demo.outcome.admitted ? 'admitted' : 'rejected'}; the retained check reports ${demo.evidence.checks.map((check) => `${check.id}: ${check.status}`).join('; ')}.`, evidence: { status: demo.outcome.admitted ? 'verified-check' : 'rejected', sourceLabel: 'generated/demos/current-head.json', identity: demo.source['result-root'], scope: 'The evidence shows this test history refuses the stale parent and preserves its head.' } },
          { id: 'why', label: 'Why', node: <WhyCard demo={demo} />, narration: demo.why, evidence: { status: 'qualified', sourceLabel: 'generated/demos/current-head.json', identity: demo.evidence['committed-hash'], scope: 'This does not establish global latestness across a public Ethereum network.' } },
          { id: 'evidence', label: 'Evidence', node: <><EvidencePanel demo={demo} /><div className={styles.spacer} /><CommitmentsCard demo={demo} /></>, narration: `The committed result is ${demo.source['result-root']}.`, evidence: { status: 'qualified', sourceLabel: 'generated/demos/current-head.json', identity: demo.source['result-root'], scope: 'This record identity does not authenticate a globally canonical history.' } },
        ]}
      />

      <div className={styles.proofWrap}><TechnicalProofCTA demo={demo} /></div>
    </div>
  )
}

function HistoryCard({ demo }: { demo: CurrentHeadDemo }) {
  return (
    <section className={records.card} aria-label="Verified resubmission history">
      <div className={records.cardLabel}>Verified history</div>
      <p className={records.lede}>The chain has one current head: only that receipt may receive the next successor.</p>
      <ol className={records.order}>
        {demo.scenario.records.items.map((item, i) => <li key={item}><span className={records.seq}>{i + 1}</span><span className={records.item}>{item}</span></li>)}
      </ol>
    </section>
  )
}
