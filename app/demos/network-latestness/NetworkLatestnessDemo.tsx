'use client'

import { useState } from 'react'
import Link from 'next/link'
import NetworkForensicsPanel, { type NetworkForensicRecord } from '@/components/demo/NetworkForensicsPanel'
import styles from './page.module.css'

type Scenario = 'agreement' | 'lag' | 'conflict'

const scenarios: Record<Scenario, { label: string; description: string; heads: string[] }> = {
  agreement: {
    label: 'Fresh agreement',
    description: 'The fixture gives both configured observers the same checkpoint report and parent.',
    heads: ['Checkpoint 42 · 8f3a…91c2', 'Checkpoint 42 · 8f3a…91c2'],
  },
  lag: {
    label: 'One observer is behind',
    description: 'One observer reports the accepted checkpoint; the other still reports its parent.',
    heads: ['Checkpoint 42 · 8f3a…91c2', 'Checkpoint 41 · 2c71…0ad4'],
  },
  conflict: {
    label: 'Conflicting successors',
    description: 'The observers report different certified successors to the same parent.',
    heads: ['Checkpoint 42 · 8f3a…91c2', 'Checkpoint 42 · b604…77ea'],
  },
}

export default function NetworkLatestnessDemo() {
  const [scenario, setScenario] = useState<Scenario>('agreement')
  const [fresh, setFresh] = useState(true)
  const selected = scenarios[scenario]
  const sameHead = selected.heads[0] === selected.heads[1]
  const status = !fresh
    ? 'Freshness not established'
    : sameHead
      ? 'Same head observed'
      : scenario === 'lag'
        ? 'Observer lag detected'
        : 'Conflicting heads detected'
  const forensicRecords: NetworkForensicRecord[] = [
    {
      eventId: `browser-${scenario}-${fresh ? 'fresh' : 'stale'}`,
      eventType: 'Scenario controls displayed',
      layer: 'browser',
      outcome: 'illustrative-local-state',
      fields: { interaction_id: `demo-${scenario}`, scenario, freshness_toggle: fresh, uploaded: false },
    },
    ...selected.heads.map((head, index) => ({
      eventId: `fixture-source-${index + 1}-${scenario}`,
      eventType: 'Simulated source head response',
      layer: 'source' as const,
      outcome: 'fixture-only',
      fields: {
        source_id: `fixture-source-${index + 1}`,
        request_id: `fixture-request-${scenario}-${index + 1}`,
        sequence_and_root: head,
        response_age: fresh ? 'within configured window (simulated)' : 'outside or unknown (simulated)',
        source_authentication: 'not performed',
      },
    })),
    {
      eventId: `fixture-verifier-${scenario}-${fresh ? 'fresh' : 'stale'}`,
      eventType: 'Observation comparison result',
      layer: 'verifier',
      outcome: status,
      fields: {
        same_reported_head: sameHead,
        freshness_accepted: fresh,
        checkpoint_signature_check: 'not performed',
        history_reconstruction: 'not performed',
        claim_scope: 'illustrative comparison only; no network latestness established',
      },
    },
  ]

  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Network checkpoint demonstration</p>
      <h1 className={styles.title}>What does “latest” mean on a network?</h1>
      <p className={styles.lede}>
        Checkpoint certificates let participants verify an accepted state and its continuity from a known predecessor.
        Independent head observations can reveal lag or conflict. They cannot prove that no newer checkpoint exists
        somewhere else or is being withheld.
      </p>

      <section className={styles.model} aria-labelledby="model-title">
        <div className={styles.modelHeader}>
          <div><span className={styles.eyebrow}>Interactive model</span><h2 id="model-title">Compare observer reports</h2></div>
          <span className={`${styles.status} ${sameHead && fresh ? styles.good : styles.caution}`} role="status">{status}</span>
        </div>
        <div className={styles.controls} role="group" aria-label="Network observation scenario">
          {(Object.keys(scenarios) as Scenario[]).map((key) => (
            <button key={key} type="button" className={scenario === key ? styles.selected : ''} aria-pressed={scenario === key} onClick={() => setScenario(key)}>{scenarios[key].label}</button>
          ))}
        </div>
        <p className={styles.description}>{selected.description}</p>
        <div className={styles.observers}>
          {selected.heads.map((head, index) => (
            <article className={styles.observer} key={index}>
              <span className={styles.observerLabel}>Independent source {index + 1}</span>
              <strong>{head}</strong>
              <span className={styles.sourceNote}>Illustrative fixture · no live request</span>
            </article>
          ))}
        </div>
        <label className={styles.freshness}>
          <input type="checkbox" checked={fresh} onChange={(event) => setFresh(event.target.checked)} />
          Treat both responses as within the configured freshness window
        </label>
        <div className={styles.result}>
          <strong>What this observation supports</strong>
          <p>{!fresh
            ? 'The reports may be authentic, but their age is unknown or outside policy. Do not claim a fresh network head.'
            : sameHead
              ? 'The fixture shows two sources agreeing. A live verifier would still need to authenticate each source and verify the checkpoint certificate and parent chain under policy.'
              : scenario === 'lag'
                ? 'The sources disagree on height. Treat the lower report as lagging only after verifying continuity and freshness; keep investigating.'
                : 'Two valid-looking successors conflict. Preserve both reports as fork evidence and apply the network policy; do not choose by arrival order.'}</p>
        </div>
        <NetworkForensicsPanel scenario={`latestness-${scenario}`} records={forensicRecords} />
      </section>

      <section className={styles.explainer} aria-labelledby="limits-title">
        <h2 id="limits-title">A bounded claim, not global latestness</h2>
        <div className={styles.columns}>
          <article><span className={styles.number}>01</span><h3>Verify the checkpoint</h3><p>Check its network identity, sequence, parent reference, state roots, policy binding, witness eligibility and certificate.</p></article>
          <article><span className={styles.number}>02</span><h3>Compare fresh sources</h3><p>Record which authenticated sources were queried, when they were observed, and whether their verified heads agree.</p></article>
          <article><span className={styles.number}>03</span><h3>State the limit</h3><p>Report “latest among these fresh sources at this observation time.” A finite observer set cannot establish that a newer head is unknown or absent.</p></article>
        </div>
      </section>

      <aside className={styles.notice}>
        <strong>Demonstration only</strong>
        <p>This page uses illustrative checkpoint identities and observer reports. It does not query a live network, verify real signatures, or claim distributed consensus. Certification means accepted under a stated authority policy; it is not proof of universal agreement.</p>
      </aside>
      <p className={styles.related}><Link href="/demos/network-scenarios">Explore three more network scenarios: forks, witness membership and withheld checkpoints →</Link></p>
    </main>
  )
}
