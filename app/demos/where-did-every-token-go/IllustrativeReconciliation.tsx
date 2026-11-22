'use client'

import { useState } from 'react'
import styles from './page.module.css'
import EconomicIcon from '../../../components/demo/EconomicIcon'

export default function IllustrativeReconciliation() {
  const [paid, setPaid] = useState(50)
  const payable = 20
  const assets = 70
  const obligations = 100
  const loss = 30
  const assetAccounted = paid + payable
  const obligationsAccounted = paid + payable + loss
  const assetDelta = assetAccounted - assets
  const obligationDelta = obligationsAccounted - obligations
  const balanced = assetDelta === 0 && obligationDelta === 0
  return <section className={styles.illustrative} aria-labelledby="illustrative-heading">
    <div className={styles.illustrativeHeading}><div><span className={styles.illustrativeTag}>Illustrative example · recognized loss</span><h2 id="illustrative-heading">A 100-unit obligation, reconciled</h2><p>One shared reference base makes the shortfall visible. This example is separate from the retained EVM run below.</p></div><EconomicIcon name="ledger" className={styles.ledgerIcon} /></div>
    <div className={styles.reconBars}>
      <div className={styles.reconBarLabel}><strong>Opening obligations</strong><b>100 units</b></div>
      <div className={styles.fullBar} aria-label="Opening obligations: 100 units"><span>100 obligations</span></div>
      <div className={styles.reconBarLabel}><strong>Realized assets</strong><b>70 units</b></div>
      <div className={styles.assetBar} aria-label="Realized assets: 70 units, with 30-unit recognized shortfall"><span className={styles.availableBar}>70 · realized assets</span><span className={styles.lossBar}>30 · recognized loss</span></div>
      <div className={styles.flowLegend}><span><i className={styles.dotPaid}/>Paid to beneficiaries</span><span><i className={styles.dotPayable}/>Remaining payable</span><span><i className={styles.dotLoss}/>Recognized loss</span></div>
    </div>
    <div className={styles.reconMetrics}>
      <div className={styles.paidMetric}><strong>{paid}</strong><span>Paid</span></div>
      <div className={styles.payableMetric}><strong>{payable}</strong><span>Remaining payable entitlement</span></div>
      <div className={styles.lossMetric}><strong>{loss}</strong><span>Recognized shortfall</span></div>
    </div>
    <div className={styles.reconAdjust}>
      <label htmlFor="paid-adjustment">Simulate a changed payout entry <output htmlFor="paid-adjustment">{paid} units</output></label>
      <input id="paid-adjustment" type="range" min="40" max="60" step="1" value={paid} onChange={event => setPaid(Number(event.target.value))} aria-describedby="adjustment-note" />
      <p id="adjustment-note">This changes the recorded paid amount only. Payable entitlement and recognized loss stay fixed so you can see when the ledger stops balancing.</p>
    </div>
    <div className={styles.reconChecks}>
      <ReconciliationCheck ok={assetDelta === 0} title="Asset reconciliation" equation={`${assets} = ${paid} + ${payable}`} detail="Realized assets equal completed payouts plus assets allocated to outstanding entitlements." delta={assetDelta}/>
      <ReconciliationCheck ok={obligationDelta === 0} title="Obligation reconciliation" equation={`${obligations} = ${paid} + ${payable} + ${loss}`} detail="Original obligations are accounted for as paid, remaining payable, and recognized loss." delta={obligationDelta}/>
    </div>
    <p className={balanced ? styles.reconState : styles.reconError} aria-live="polite">{balanced ? '✓ Both illustrative reconciliations balance.' : `✕ Ledger mismatch: ${Math.abs(assetDelta || obligationDelta)} unit${Math.abs(assetDelta || obligationDelta) === 1 ? '' : 's'} ${assetDelta > 0 || obligationDelta > 0 ? 'over-accounted' : 'unaccounted'} in the fixed entries.`}</p>
    <p className={styles.distinction}>Accounting conservation, allocation-policy compliance and economic fairness are separate properties. The 30-unit amount here is a recognized loss, not a temporary liquidity shortage.</p>
  </section>
}

function ReconciliationCheck({ ok, title, equation, detail, delta }: { ok: boolean; title: string; equation: string; detail: string; delta: number }) {
  return <article className={`${styles.reconCheck} ${ok ? styles.checkPass : styles.checkFail}`}>
    <span className={styles.reconIcon} aria-hidden="true">{ok ? '✓' : '×'}</span><div><strong>{title}</strong><code>{equation}</code><p>{detail}</p>{!ok && <b className={styles.delta}>Difference: {Math.abs(delta)} units</b>}</div>
  </article>
}
