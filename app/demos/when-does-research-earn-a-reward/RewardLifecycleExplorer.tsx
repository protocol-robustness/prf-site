'use client'
import { useState } from 'react'
import styles from './page.module.css'
const modes=[
 {id:'qualified',label:'Eligible example',states:['passed','accepted','eligible','created','separate'],title:'A useful contribution clears every gate',detail:'Local test suites exercise a verified, reviewer-accepted contribution that meets a frozen example policy and produces a rooted reward obligation. This does not represent a public researcher or funded challenge.'},
 {id:'pending',label:'Awaiting review',states:['passed','pending','blocked','none','separate'],title:'Evidence alone does not earn an incentive',detail:'When the contribution is not yet accepted by the authorized reviewer, eligibility and obligation creation remain pending.'},
 {id:'outside',label:'Out of scope',states:['not-qualified','not-run','ineligible','none','separate'],title:'Out-of-scope work does not advance',detail:'The workflow tests reject unqualified, duplicate, untrusted or out-of-scope evidence without granting experience or creating an obligation.'},
] as const
const steps=[
 {title:'Evidence verification',icon:'✓',description:'Rooted input and computation are checked against the declared method.'},
 {title:'Reviewer approval',icon:'⚖',description:'An authorized reviewer accepts or rejects the contribution.'},
 {title:'Reward eligibility',icon:'◇',description:'The frozen contribution and incentive policy determines eligibility.'},
 {title:'Reward obligation',icon:'▤',description:'An authorized obligation binds the eligibility and proposal roots.'},
 {title:'Payment record',icon:'⇢',description:'Payment requires separate authority and external evidence.'},
]
export default function RewardLifecycleExplorer(){const [selected,setSelected]=useState(0);const mode=modes[selected];return <section className={styles.explorer} aria-label="Illustrative contribution review">
 <div className={styles.explorerTop}><div><span className={styles.explorerKicker}>Illustrative contribution review</span><h2>What has to happen before a reward?</h2></div><span className={styles.prototype}>Local workflow prototype</span></div>
 <div className={styles.tabs} role="tablist" aria-label="Contribution outcome">{modes.map((m,i)=><button key={m.id} type="button" role="tab" id={`reward-${m.id}`} aria-selected={selected===i} aria-controls="reward-panel" tabIndex={selected===i?0:-1} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(i+(e.key==='ArrowRight'?1:modes.length-1))%modes.length;setSelected(n);document.getElementById(`reward-${modes[n].id}`)?.focus()}}}>{m.label}</button>)}</div>
 <div id="reward-panel" role="tabpanel" aria-labelledby={`reward-${mode.id}`} aria-live="polite" className={styles.modePanel}><h3>{mode.title}</h3><p>{mode.detail}</p>
  <div className={styles.lifecycle}>{steps.map((step,i)=>{const state=mode.states[i];const good=state==='passed'||state==='accepted'||state==='eligible'||state==='created';const warn=state==='pending'||state==='separate';const fail=state==='not-qualified'||state==='ineligible';const status=state==='passed'?'Verified in test':state==='accepted'?'Accepted in test':state==='eligible'?'Eligible in example':state==='created'?'Obligation constructed':state==='pending'?'Awaiting authorized review':state==='blocked'?'Not eligible yet':state==='not-qualified'?'Not qualified':state==='ineligible'?'Ineligible':state==='none'?'None created':'Not established';return <div className={`${styles.lifecycleItem} ${good?styles.good:''} ${warn?styles.warn:''} ${fail?styles.fail:''}`} key={step.title}><div className={styles.lifecycleIcon} aria-hidden="true">{good?'✓':warn?'⚠':fail?'×':step.icon}</div><div className={styles.lifecycleText}><span>0{i+1}</span><strong>{step.title}</strong><small>{step.description}</small><b>{status}</b></div>{i<steps.length-1&&<span className={styles.lifecycleArrow} aria-hidden="true">→</span>}</div>})}</div>
  <p className={styles.paymentNote}>The payment stage is separate. The local obligation builder creates no payment authority; no challenge budget, approved obligation or transfer is represented here.</p>
 </div>
 </section>}
