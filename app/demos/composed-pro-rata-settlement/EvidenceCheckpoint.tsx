import styles from './page.module.css'

// Presentation of retained checks, not a canonical evidence schema or verdict.
export type ForensicEvidence = {
  classification: string
  records: { label: string; href: string }[]
  check: string
  conclusion: string
  limit: string
}

export default function EvidenceCheckpoint({ evidence }: { evidence: ForensicEvidence }) {
  return <aside className={styles.evidenceCheckpoint} aria-label="Evidence and forensic checks">
    <h3>Evidence and forensic checks</h3>
    <p className={styles.evidenceLabel}>{evidence.classification}</p>
    <div className={styles.downloads}><b>Evidence:</b>{evidence.records.map(({ label, href }) => <a key={href} href={href}>{label} →</a>)}</div>
    <p><b>Forensic check:</b> {evidence.check}</p>
    <p><b>Supported conclusion:</b> {evidence.conclusion}</p>
    <p className={styles.caption}><b>Remaining limit:</b> {evidence.limit}</p>
  </aside>
}
