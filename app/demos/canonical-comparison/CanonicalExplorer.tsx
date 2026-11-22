'use client'

import { useState } from 'react'
import styles from './page.module.css'

type CaseId = 'order' | 'amount' | 'domain'
const cases: Record<CaseId, { label: string; title: string; status: string; explanation: string }> = {
  order: { label: 'Reorder fields', title: 'Same canonical bytes', status: 'Verified fixture match', explanation: 'The frozen map-ab and map-ba vectors contain the same key-value pairs in different input orders. Canonical map encoding sorts encoded keys, so both implementations produce the same bytes.' },
  amount: { label: 'Change an amount', title: 'A changed value changes the record', status: 'Conceptual · modified digest not computed', explanation: 'Changing Alice’s request from 60 to 61 changes the input. No retained paired mutation fixture or independently computed modified digest is published here, so this case shows the comparison rule without claiming a verified output.' },
  domain: { label: 'Change record type', title: 'Different record scopes', status: 'Not comparable as equivalent records', explanation: 'The retained claim and allocation-result artifacts have different declared domains and meanings. Their roots identify separate records; matching-looking fields would not make them equivalent.' },
}

export default function CanonicalExplorer() {
  const [active, setActive] = useState<CaseId>('order')
  const current = cases[active]
  return <section className={styles.explorer} aria-labelledby="experiment-heading">
    <div className={styles.explorerHeading}><span className={styles.eyebrow}>Three small experiments</span><h2 id="experiment-heading">What happens when a record changes?</h2></div>
    <div className={styles.tabs} role="group" aria-label="Canonical comparison experiment">
      {(Object.keys(cases) as CaseId[]).map((id) => <button key={id} type="button" aria-pressed={active === id} onClick={() => setActive(id)}>{cases[id].label}</button>)}
    </div>
    <article className={styles.experiment} aria-live="polite">
      <div className={`${styles.verdict} ${active === 'order' ? styles.verified : styles.caution}`}><span aria-hidden="true">{active === 'order' ? '✓' : '⚠'}</span><div><strong>{current.title}</strong><small>{current.status}</small></div></div>
      {active === 'order' && <div className={styles.compareGrid}><RecordCard title="Frozen vector · map-ab" body={'{"a": 1, "b": 2}'} foot="Fields supplied in a, b order" /><span className={styles.compareArrow} aria-hidden="true">→</span><RecordCard title="Frozen vector · map-ba" body={'{"b": 2, "a": 1}'} foot="Fields supplied in b, a order" /></div>}
      {active === 'amount' && <div className={styles.compareGrid}><RecordCard title="Reference input" body="Alice request: 60" foot="Value in the retained primary fixture" /><span className={styles.compareArrow} aria-hidden="true">→</span><RecordCard title="Illustrative edit" body="Alice request: 61" foot="No output hash is asserted or displayed" /></div>}
      {active === 'domain' && <div className={styles.compareGrid}><RecordCard title="Claim artifact" body="PRF_CLEAN_PRO_RATA_CLAIM_V1" foot="A committed participant request" /><span className={styles.compareArrow} aria-hidden="true">≠</span><RecordCard title="Allocation result" body="PRF_CLEAN_PRO_RATA_RESULT_V1" foot="A derived allocation record" /></div>}
      <p className={styles.explanation}>{current.explanation}</p>
      {active === 'order' && <p className={styles.byteMatch}><span>Canonical bytes</span><code>310220016110022001621004</code><strong>Identical in the frozen vectors</strong></p>}
      {active === 'domain' && <p className={styles.domainRoots}><span>Claim root</span><code>716e5515…baf2f74</code><span>Result root</span><code>3fb97bad…fd120fc9</code></p>}
    </article>
    <p className={styles.smallNote}>Reordering is harmless only where the declared schema treats map-field order as presentation. Sequence and evidence order can be meaningful.</p>
  </section>
}

function RecordCard({ title, body, foot }: { title: string; body: string; foot: string }) {
  return <article className={styles.recordCard}><span>{title}</span><code>{body}</code><small>{foot}</small></article>
}
