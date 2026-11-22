'use client'

import { useState } from 'react'
import styles from './page.module.css'

const scenarios = [
  { id: 'normal', label: 'Normal', liquidity: 100, demand: 50, shortfall: 0, title: 'Liquidity covers demand', detail: 'Under these assumptions, available liquidity covers withdrawal demand.', tone: 'healthy' },
  { id: 'shock', label: 'Liquidity shock', liquidity: 65, demand: 90, shortfall: 25, title: 'Demand exceeds available liquidity', detail: 'Investigate how the protocol treats unsatisfied claims and whether its invariants are preserved.', tone: 'warning' },
  { id: 'adversarial', label: 'Adversarial', liquidity: 40, demand: 120, shortfall: 80, title: 'Adversarial stress', detail: 'Limited liquidity and adversarial timing expose the effects of execution order, priority rules and loss distribution.', tone: 'severe' },
] as const

export default function StressScenarioExplorer() {
  const [selected, setSelected] = useState(0)
  const scenario = scenarios[selected]
  return (
    <section className={styles.explorer} aria-labelledby="scenario-heading">
      <div className={styles.explorerHeading}>
        <div><span className={styles.label}>Interactive scenario · illustrative</span><h2 id="scenario-heading">Change the economic conditions</h2></div>
        <span className={styles.illustrativeBadge}>Illustrative scenario — not a measured PRF result</span>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Economic scenario">
        {scenarios.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={selected === index} aria-controls="scenario-panel" id={`scenario-tab-${item.id}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = (index + (event.key === 'ArrowRight' ? 1 : scenarios.length - 1)) % scenarios.length; setSelected(next); document.getElementById(`scenario-tab-${scenarios[next].id}`)?.focus() }
        }}>{item.label}</button>)}
      </div>
      <div id="scenario-panel" role="tabpanel" aria-labelledby={`scenario-tab-${scenario.id}`} className={`${styles.scenarioPanel} ${styles[scenario.tone]}`}>
        <div className={styles.metrics}>
          <Metric title="Liquidity" value={scenario.liquidity} tone={selected === 0 ? 'healthy' : 'warning'} />
          <Metric title="Demand" value={scenario.demand} tone="neutral" />
          <Metric title="Shortfall" value={scenario.shortfall} tone={scenario.shortfall === 0 ? 'healthy' : selected === 1 ? 'warning' : 'severe'} />
        </div>
        <div className={styles.flowChart} aria-label={`Liquidity ${scenario.liquidity} percent, demand ${scenario.demand} percent, shortfall ${scenario.shortfall} percent`}>
          <div className={styles.barLine}><span>Available liquidity</span><div className={styles.barTrack}><i className={styles.liquidityBar} style={{ width: `${scenario.liquidity / 1.2}%` }} /></div><b>{scenario.liquidity}%</b></div>
          <div className={styles.barLine}><span>Withdrawal demand</span><div className={styles.barTrack}><i className={styles.demandBar} style={{ width: `${scenario.demand / 1.2}%` }} /></div><b>{scenario.demand}%</b></div>
          <div className={styles.scaleLabels}><span>0</span><span>50</span><span>100</span><span>120% reference base</span></div>
        </div>
        <div className={styles.outcome} aria-live="polite">
          <span className={styles.statusIcon} aria-hidden="true">{scenario.shortfall === 0 ? '✓' : '⚠'}</span>
          <div><strong>{scenario.title}</strong><p>{scenario.detail}</p></div>
          <span className={styles.statusWord}>{scenario.shortfall === 0 ? 'Covered' : 'Stress condition'}</span>
        </div>
        <p className={styles.chartCaption}>Percentages share a 100-unit reference asset base. Shortfall is demand above available liquidity; it does not by itself establish an invariant violation.</p>
      </div>
    </section>
  )
}

function Metric({ title, value, tone }: { title: string; value: number; tone: string }) {
  return <div className={`${styles.metric} ${styles[`metric_${tone}`]}`}><span>{title}</span><strong>{value}<small>%</small></strong></div>
}
