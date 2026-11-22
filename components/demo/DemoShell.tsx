'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './demo-shell.module.css'

export type EvidenceStatus =
  | 'verified-check'
  | 'qualified'
  | 'rejected'
  | 'illustrative'
  | 'computed'
  | 'independently-reproduced'
  | 'locally-observed'
  | 'source-assertion'

export interface Step {
  id: string
  label: string
  node: ReactNode
  narration: string
  evidence: {
    status: EvidenceStatus
    sourceLabel: string
    sourceHref?: string
    identity: string
    scope: string
  }
}

const statusLabels: Record<EvidenceStatus, string> = {
  'verified-check': 'Verified check',
  qualified: 'Qualified evidence',
  rejected: 'Rejected / failed check',
  illustrative: 'Illustrative',
  computed: 'Computed result',
  'independently-reproduced': 'Independently reproduced',
  'locally-observed': 'Locally observed',
  'source-assertion': 'Source-level assertion',
}

export default function DemoShell({ steps }: { steps: Step[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const current = steps[activeIndex]

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setReducedMotion(preference.matches)
      if (preference.matches) setPlaying(false)
    }
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!playing || reducedMotion) return
    if (activeIndex >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const timer = window.setTimeout(() => setActiveIndex(activeIndex + 1), 4200)
    return () => window.clearTimeout(timer)
  }, [playing, activeIndex, reducedMotion, steps.length])

  function goTo(index: number) {
    setPlaying(false)
    setActiveIndex(Math.max(0, Math.min(steps.length - 1, index)))
  }

  function togglePlay() {
    if (reducedMotion) {
      goTo(activeIndex + 1)
      return
    }
    if (activeIndex === steps.length - 1) {
      setActiveIndex(0)
      setPlaying(true)
      return
    }
    setPlaying((value) => !value)
  }

  return (
    <section className={styles.story} aria-label="Evidence-backed demonstration player">
      <div className={styles.stepNav} role="group" aria-label="Choose a demonstration step">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={index === activeIndex ? styles.stepButtonActive : styles.stepButton}
            onClick={() => goTo(index)}
            aria-current={index === activeIndex ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>{step.label}
          </button>
        ))}
      </div>

      <div className={styles.controls} aria-label="Animation controls">
        <button type="button" onClick={() => goTo(0)} disabled={activeIndex === 0 && !playing}>Restart</button>
        <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0}>Previous</button>
        <button type="button" onClick={togglePlay} disabled={reducedMotion && activeIndex === steps.length - 1} aria-pressed={reducedMotion ? undefined : playing}>
          {reducedMotion ? (activeIndex === steps.length - 1 ? 'At final step' : 'Next step') : playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === steps.length - 1}>Next</button>
        <span className={styles.counter}>Step {activeIndex + 1} of {steps.length}</span>
      </div>

      <div className={styles.progress} aria-hidden="true">
        {steps.map((step, index) => <span key={step.id} className={index <= activeIndex ? styles.progressActive : undefined} />)}
      </div>

      <div key={current.id} className={styles.currentStep}>
        <div className={styles.stepSummary} aria-live="polite">
          <span className={`${styles.status} ${styles[current.evidence.status]}`}>{statusLabels[current.evidence.status]}</span>
          <p>{current.narration}</p>
        </div>
        <div className={styles.scene}>{current.node}</div>
        <aside className={styles.provenance} aria-label="Step evidence and scope">
          <div><b>Source</b>{current.evidence.sourceHref
            ? <a href={current.evidence.sourceHref}>{current.evidence.sourceLabel}</a>
            : <span>{current.evidence.sourceLabel}</span>}</div>
          <div><b>Identity</b><code>{current.evidence.identity}</code></div>
          <div><b>Scope</b><span>{current.evidence.scope}</span></div>
        </aside>
      </div>

      <details className={styles.transcript}>
        <summary>Read the complete text timeline</summary>
        <ol>
          {steps.map((step, index) => <li key={step.id} aria-current={index === activeIndex ? 'step' : undefined}>
            <b>{step.label} · {statusLabels[step.evidence.status]}.</b> {step.narration}
            <span> Source: {step.evidence.sourceLabel}. Identity: {step.evidence.identity}. Scope: {step.evidence.scope}</span>
          </li>)}
        </ol>
      </details>
    </section>
  )
}
