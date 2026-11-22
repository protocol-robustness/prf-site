'use client'

import styles from './network-forensics.module.css'

export type NetworkForensicRecord = {
  eventId: string
  eventType: string
  layer: 'browser' | 'source' | 'verifier' | 'policy'
  outcome: string
  fields: Record<string, string | number | boolean | null>
}

export default function NetworkForensicsPanel({
  scenario,
  records,
}: {
  scenario: string
  records: NetworkForensicRecord[]
}) {
  function downloadBundle() {
    const forensicRecords = records.map((record, index) => ({
      record_sequence: index + 1,
      occurred_at: null,
      observed_at: null,
      chain_included_at: null,
      ...record,
    }))
    const bundle = {
      schema: 'prf-network-demo-forensics.v1',
      classification: 'illustrative-demo-data',
      scenario,
      created_at: null,
      time_basis: 'No event, server-observation, or chain-inclusion timestamps were collected.',
      source_revision: 'not embedded in this static demonstration',
      persistence: { uploaded: false, server_recorded: false, durable: false },
      interpretation:
        'This bundle demonstrates forensic record shape. It is not evidence of a live request, signature check, checkpoint verification, or network event.',
      records: forensicRecords,
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `prf-network-demo-${scenario}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <details className={styles.panel}>
      <summary>Inspect forensic trail · illustrative records</summary>
      <p className={styles.scope}>
        This is a local fixture view. Scenario controls stay in the browser and are not uploaded. Source and verifier entries below are simulated; this page does not query endpoints or authenticate checkpoint certificates.
      </p>
      <ol className={styles.records}>
        {records.map((record) => (
          <li key={record.eventId}>
            <div className={styles.recordHeading}>
              <strong>{record.eventType}</strong>
              <span>{record.layer} · {record.outcome}</span>
            </div>
            <code>{record.eventId}</code>
            <pre>{JSON.stringify({
              occurred_at: null,
              observed_at: null,
              chain_included_at: null,
              ...record.fields,
            }, null, 2)}</pre>
          </li>
        ))}
      </ol>
      <button className={styles.download} type="button" onClick={downloadBundle}>Download illustrative JSON bundle</button>
    </details>
  )
}
