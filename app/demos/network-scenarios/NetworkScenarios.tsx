'use client'

import { useState } from 'react'
import Link from 'next/link'
import { executableNotebookHref } from '@/lib/site-links'
import NetworkForensicsPanel, { type NetworkForensicRecord } from '@/components/demo/NetworkForensicsPanel'
import styles from './page.module.css'

export default function NetworkScenarios() {
  const [forkResolved, setForkResolved] = useState(false)
  const [witnesses, setWitnesses] = useState(2)
  const [membershipChanged, setMembershipChanged] = useState(false)
  const [queryIncludesNewSource, setQueryIncludesNewSource] = useState(false)
  const quorum = 3
  const eligible = membershipChanged ? Math.min(witnesses, 3) : witnesses
  const forkRecords: NetworkForensicRecord[] = [
    { eventId: 'browser-fork-resolution', eventType: 'Resolution control state', layer: 'browser', outcome: forkResolved ? 'illustrative-decision-selected' : 'conflict-preserved', fields: { interaction_id: 'demo-fork', selected: forkResolved ? 'successor-A' : 'none', uploaded: false } },
    { eventId: 'fixture-fork-a', eventType: 'Candidate checkpoint observed', layer: 'source', outcome: 'fixture-certificate-not-verified', fields: { checkpoint: 'cp-18A', sequence: 18, parent: 'cp-17 · 41ae…c902', root: 'a310…77bd', certificate_check: 'not performed' } },
    { eventId: 'fixture-fork-b', eventType: 'Candidate checkpoint observed', layer: 'source', outcome: 'fixture-certificate-not-verified', fields: { checkpoint: 'cp-18B', sequence: 18, parent: 'cp-17 · 41ae…c902', root: 'e871…120c', certificate_check: 'not performed' } },
    { eventId: 'fixture-fork-policy', eventType: 'Conflict handling projection', layer: 'policy', outcome: forkResolved ? 'illustrative-policy-choice' : 'no-resolution', fields: { selected_successor: forkResolved ? 'cp-18A' : null, policy_authority_check: 'not performed', both_branches_retained: true } },
  ]
  const quorumRecords: NetworkForensicRecord[] = [
    { eventId: 'browser-witness-controls', eventType: 'Witness controls displayed', layer: 'browser', outcome: 'illustrative-local-state', fields: { interaction_id: 'demo-witness-quorum', signatures_selected: witnesses, membership_change_selected: membershipChanged, uploaded: false } },
    { eventId: 'fixture-membership', eventType: 'Membership snapshot selected', layer: 'policy', outcome: 'fixture-only', fields: { membership_root: membershipChanged ? 'fixture-membership-v2' : 'fixture-membership-v1', eligible_members: membershipChanged ? 3 : 5, removed_members: membershipChanged ? ['Witness 4', 'Witness 5'].join(', ') : 'none' } },
    { eventId: 'fixture-quorum-check', eventType: 'Threshold comparison', layer: 'verifier', outcome: eligible >= quorum ? 'illustrative-threshold-met' : 'illustrative-threshold-not-met', fields: { eligible_signatures: eligible, required_signatures: quorum, threshold: '3-of-selected-members', signature_validation: 'not performed', certificate_root: 'not derived' } },
  ]
  const withheldRecords: NetworkForensicRecord[] = [
    { eventId: 'browser-source-query', eventType: 'Source-set control state', layer: 'browser', outcome: 'illustrative-local-state', fields: { interaction_id: 'demo-source-coverage', additional_source_queried: queryIncludesNewSource, uploaded: false } },
    { eventId: 'fixture-source-set', eventType: 'Queried source responses', layer: 'source', outcome: 'fixture-only', fields: { source_ids: 'fixture-source-1, fixture-source-2, fixture-source-3', reported_head: 'cp-29', response_times: 'not collected', source_authentication: 'not performed' } },
    { eventId: 'fixture-additional-source', eventType: 'Additional source projection', layer: 'source', outcome: queryIncludesNewSource ? 'newer-head-included' : 'source-not-queried', fields: { source_id: 'fixture-source-4', reported_head: queryIncludesNewSource ? 'cp-30' : 'possible cp-30', query_performed: queryIncludesNewSource, observation_time: 'not collected' } },
    { eventId: 'fixture-head-scope', eventType: 'Bounded head comparison', layer: 'verifier', outcome: 'illustrative-only', fields: { reported_head: queryIncludesNewSource ? 'cp-30' : 'cp-29', sources_compared: queryIncludesNewSource ? 4 : 3, global_latestness: 'not established' } },
  ]

  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Network checkpoint demonstrations</p>
      <h1 className={styles.title}>Three ways network views can disagree</h1>
      <p className={styles.lede}>
        These small scenarios explore conflict handling, witness certificates and source coverage.
        They use invented identities and do not contact a live network.
      </p>

      <section className={styles.scenario} id="fork" aria-labelledby="fork-title">
        <span className={styles.number}>01 · Fork evidence</span>
        <h2 id="fork-title">Two certified successors share one parent</h2>
        <p>Checkpoint 17 is the common parent. Two fixture certificates are labeled as valid successors at sequence 18; this page does not verify either certificate.</p>
        <div className={styles.fork}>
          <div className={styles.checkpoint}><small>Sequence 17 · shared parent</small><strong>cp-17 · 41ae…c902</strong></div>
          <div className={styles.branches}>
            <div className={styles.checkpoint}><small>Successor A · certificate valid</small><strong>cp-18A · a310…77bd</strong></div>
            <div className={styles.checkpoint}><small>Successor B · certificate valid</small><strong>cp-18B · e871…120c</strong></div>
          </div>
        </div>
        <button className={styles.action} type="button" aria-pressed={forkResolved} onClick={() => setForkResolved(!forkResolved)}>
          {forkResolved ? 'Reopen unresolved conflict' : 'Apply illustrative policy decision'}
        </button>
        <div className={styles.readout} role="status">
          <strong>{forkResolved ? 'Illustrative policy choice selected' : 'Conflict retained; no branch selected'}</strong>
          <p>{forkResolved
            ? 'The example policy decision names successor A and its exact parent. Both certificates remain in the history; the decision does not make successor B disappear.'
            : 'Arrival order and sequence number cannot distinguish these equal-height successors. Preserve both certificates and wait for an authorized, parent-bound resolution.'}</p>
        </div>
        <NetworkForensicsPanel scenario="fork-conflict" records={forkRecords} />
      </section>

      <section className={styles.scenario} id="quorum" aria-labelledby="quorum-title">
        <span className={styles.number}>02 · Witness policy</span>
        <h2 id="quorum-title">A signature counts under a membership snapshot</h2>
        <p>This example uses a 3-of-5 threshold. The certificate binds the exact checkpoint, policy root and membership root.</p>
        <div className={styles.witnesses} aria-label="Illustrative witness signatures">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < eligible ? styles.signed : styles.unsigned}>{index < eligible ? 'Signed' : 'No signature'}<small>Witness {index + 1}</small></span>
          ))}
        </div>
        <label className={styles.sliderLabel} htmlFor="witness-count">Reported signatures in the original five-member set: <strong>{witnesses}</strong> of 5</label>
        <input id="witness-count" className={styles.slider} type="range" min="0" max="5" value={witnesses} onChange={(event) => setWitnesses(Number(event.target.value))} />
        <label className={styles.toggle}><input type="checkbox" checked={membershipChanged} onChange={(event) => setMembershipChanged(event.target.checked)} />Use a successor membership snapshot that removes Witnesses 4 and 5</label>
        <div className={styles.readout} role="status">
          <strong className={eligible >= quorum ? styles.successText : styles.warningText}>
            {eligible >= quorum ? 'Threshold met under the selected snapshot' : 'Certificate threshold not met'}
          </strong>
          <p>{membershipChanged
            ? `The successor snapshot has 3 eligible members; ${eligible} of them signed. A certificate for an earlier checkpoint must still be checked against its original membership snapshot.`
            : `${eligible} eligible signatures are counted against a 3-of-5 rule. A changed membership applies to checkpoints bound to its successor snapshot, not retroactively to old certificates.`}</p>
        </div>
        <NetworkForensicsPanel scenario="witness-quorum" records={quorumRecords} />
      </section>

      <section className={styles.scenario} id="withheld" aria-labelledby="withheld-title">
        <span className={styles.number}>03 · Observation coverage</span>
        <h2 id="withheld-title">Agreement can miss a withheld checkpoint</h2>
        <p>Three queried sources agree on checkpoint 29. A fourth, unqueried source is simulated as knowing a newer checkpoint.</p>
        <div className={styles.sources}>
          <div><small>Queried sources · fresh responses</small><strong>3 of 3 report cp-29</strong></div>
          {queryIncludesNewSource && <div className={styles.newer}><small>Additional source · now queried</small><strong>Reports cp-30</strong></div>}
          {!queryIncludesNewSource && <div className={styles.hidden}><small>Not in the queried source set</small><strong>Possible cp-30 is withheld or unknown</strong></div>}
        </div>
        <button className={styles.action} type="button" aria-pressed={queryIncludesNewSource} onClick={() => setQueryIncludesNewSource(!queryIncludesNewSource)}>
          {queryIncludesNewSource ? 'Remove additional source from query' : 'Query the additional source'}
        </button>
        <div className={styles.readout} role="status">
          <strong>{queryIncludesNewSource ? 'Latest observed head is cp-30 across these four sources' : 'Latest observed head is cp-29 across these three sources'}</strong>
          <p>Even after adding a source, the result is bounded to the named sources and observation time. No finite query proves that every participant has been reached or that no newer checkpoint is being withheld.</p>
        </div>
        <NetworkForensicsPanel scenario="withheld-head" records={withheldRecords} />
      </section>

      <aside className={styles.notice}>
        <strong>Interpretation boundary</strong>
        <p>Valid certificates establish acceptance under their bound authority policy and membership snapshot. They do not by themselves resolve competing certified histories, guarantee global latestness or prove that a queried source set is complete.</p>
      </aside>

      <section className={styles.related} aria-labelledby="related-notebooks-title">
        <h2 id="related-notebooks-title">Related executable notebooks</h2>
        <p>The first link runs the concrete local checkpoint-conflict exercise. The other notebooks cover supporting DAG reachability and authenticated ratification concepts; they do not implement the quorum-change or withheld-head scenarios above.</p>
        <ul>
          <li><Link href={executableNotebookHref('network_checkpoint_head_observation')}>Run the checkpoint head-conflict walkthrough →</Link></li>
          <li><Link href={executableNotebookHref('read_only_reachability')}>Read-only DAG reachability →</Link></li>
          <li><Link href={executableNotebookHref('reachability_and_ratification')}>Reachability and ratification →</Link></li>
        </ul>
      </section>
    </main>
  )
}
