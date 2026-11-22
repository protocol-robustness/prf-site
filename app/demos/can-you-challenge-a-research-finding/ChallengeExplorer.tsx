'use client'
import { useState } from 'react'
import styles from './page.module.css'

const views = [
 { id:'original',label:'Original',title:'Claim under review',text:'The candidate asks whether two declared cap-excess redistribution policies produce identical per-row allocations across its bounded shortfall domain.',status:'Candidate proposition · not an accepted finding',tone:'neutral' },
 { id:'reproduction',label:'Reproduction',title:'Both policies replay from the same case',text:'The current allocator recomputes a complete result for each declared policy. Both result hashes validate and both result invariant sets are empty.',status:'Replay · ID-only calibration variant',tone:'verified' },
 { id:'counterexample',label:'Counterexample',title:'A per-row difference is reproduced',text:'For this finite shortfall input, the allocation to rows B and C differs by 12 units. This contradicts policy equivalence for this case; it does not establish a protocol invariant failure.',status:'Difference found · novelty not established',tone:'warning' },
] as const

export default function ChallengeExplorer() {
 const [path,setPath]=useState<'calibration'|'qualification'>('calibration')
 const [active,setActive]=useState(0)
 const view=views[active]
 return <section className={styles.explorer} aria-label="Research claim challenge walkthrough">
  <div className={styles.pathTabs} role="group" aria-label="Challenge paths">
   <button type="button" aria-pressed={path==='calibration'} onClick={()=>setPath('calibration')}>Path A · Calibration comparison</button>
   <button type="button" aria-pressed={path==='qualification'} onClick={()=>setPath('qualification')}>Path B · Qualification target</button>
  </div>
  {path==='calibration' ? <div id="challenge-path-panel" role="tabpanel">
   <p className={styles.pathIntro}>A valid same-input comparison can show a real policy difference without establishing novelty or a qualifying challenge.</p>
   <div className={styles.tabs} role="tablist" aria-label="Inspect the claim and evidence">{views.map((item,i)=><button key={item.id} type="button" role="tab" aria-selected={active===i} aria-controls="challenge-panel" id={`challenge-${item.id}`} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(i+(e.key==='ArrowRight'?1:views.length-1))%views.length;setActive(n);document.getElementById(`challenge-${views[n].id}`)?.focus()}}}>{item.label}</button>)}</div>
   <div id="challenge-panel" role="tabpanel" aria-labelledby={`challenge-${view.id}`} className={`${styles.panel} ${styles[view.tone]}`} aria-live="polite"><span className={styles.panelKicker}>{view.status}</span><h2>{view.title}</h2><p>{view.text}</p>
    {active>0&&<><div className={styles.comparison}><div className={styles.policy}><span>Unallocated cap excess</span><b>10 · 33 · 33</b><small>76 total allocated</small><code>Result root · e49ed7d3…6a295b1b</code></div><span className={styles.compareArrow} aria-hidden="true">↔</span><div className={styles.policy}><span>Redistribute cap excess</span><b>10 · 45 · 45</b><small>100 total allocated</small><code>Result root · 2d61bc61…5e36b93</code></div></div>
     {active===2&&<div className={styles.gateBlocked}><span aria-hidden="true">⚠</span><div><strong>Candidate qualification is not established</strong><p>The candidate pins policy roots that differ from the current allocator's recomputed roots. Source revision is also unpinned. The comparison is retained; admission, acceptance and incentive eligibility are not established.</p></div></div>}
     <div className={styles.metrics}><div><span>Available capital · same input</span><b>100</b></div><div><span>Maximum row difference</span><b>12</b></div><div><span>Invariant violations</span><b className={styles.invariants}>✓ 0</b></div></div>
    </>}
    <p className={styles.caption}>Local PRF comparison from the calibration economics with only a test allocation ID changed. Both requests share available capital, rows, requests, caps, rounding and tie-break rules; redistribution policy is the declared difference. The 76 vs 100 totals reflect each policy's residual handling. ID changes alone do not establish novelty.</p>
   </div>
  </div> : <div id="challenge-path-panel" role="tabpanel" className={styles.targetPath}>
   <span className={styles.pathBadge}>Target state · no retained qualifying fixture yet</span><h2>What a successful challenge path must establish</h2>
   <p>Challenge 001 remains a proposal. The current local fixture does not pass its candidate gate, and its identifier-only variation is not a novel contribution. A successful path needs a source-bound case that meets the published scope and novelty rules.</p>
   <ol><li><b>✓ Same-case evidence</b><span>Canonical inputs and fresh outputs bind to one comparison.</span></li><li><b>⚠ Policy roots requalified</b><span>Candidate roots must match the allocator from the captured source revision.</span></li><li><b>⚠ Novel counterexample reviewed</b><span>A materially distinct case must satisfy scope; an authorized reviewer must record acceptance.</span></li><li><b>⚠ Eligibility and obligation reconstructed</b><span>Policy-bound incentive steps need their own evidence. No public approval or payment is qualified.</span></li></ol>
   <p className={styles.targetFoot}>No successful qualification path is claimed here. Requalification must update source identity, policy roots and dependent candidate records together; the existing root mismatch remains visible as a negative check.</p>
  </div>}
 </section>
}
