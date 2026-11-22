'use client'

import { useState } from 'react'
import styles from '../../content.module.css'

type Order = {
  order: string
  executionIdentity: string
  terminalProjectionRoot: string
  restrictedRefund: { recipient: string; amount: number }
  intermediateStates: { step: number; claim: string; aliceBalance: number; bobBalance: number; carolBalance: number; claimedAmount: number; outstandingLiability: number }[]
}
const claimantNames: Record<string, string> = { A: 'Alice', B: 'Bob', C: 'Carol' }
const claimOrderLabel = (order: string) => [...order].map((claim) => claimantNames[claim]).join(' → ')

export default function ParallelOrderExplorer({ orders, normalizedRoot }: { orders: Order[]; normalizedRoot: string }) {
  const [selected, setSelected] = useState(orders[0]?.order ?? '')
  const current = orders.find(({ order }) => order === selected) ?? orders[0]
  if (!current) return <p>No order records are available.</p>
  return <section className={styles.section} aria-labelledby="order-explorer-title">
    <span className={styles.kicker}>Retained local Foundry qualification</span>
    <h2 id="order-explorer-title">Six call orders. One normalized outcome.</h2>
    <p className={styles.sectionLead}>Choose a claimant order to inspect its distinct execution identity and intermediate liability states. The six histories share one normalized terminal projection root. The retained result contains per-order execution identities; it does not contain separate per-order evidence identity fields.</p>
    <div className={styles.buttons} role="group" aria-label="Select a qualified claimant call order">{orders.map(({ order }) => <button key={order} type="button" aria-pressed={selected === order} onClick={() => setSelected(order)}>{order}</button>)}</div>
    <p className={styles.textEquivalent} aria-live="polite">Selected order {current.order}: {claimOrderLabel(current.order)}. Execution identity: {current.executionIdentity}.</p>
    <p className={styles.textEquivalent}>Text equivalent: six buttons select the order of Alice, Bob and Carol’s claimant calls: ABC, ACB, BAC, BCA, CAB or CBA. Selecting a button replaces the chosen order’s execution identity and per-call balance table below. No transaction is submitted.</p>
    <p className={styles.boundary}>These are six qualified Foundry call histories on local chain ID 31337, not independently mined same-block transactions. They do not qualify arbitrary concurrent on-chain execution.</p>
    <div className={styles.tableScroll}><table className={styles.table}><caption>Call history {current.order}: {claimOrderLabel(current.order)}</caption><thead><tr><th scope="col">Call</th><th scope="col">Claimant</th><th scope="col">Alice balance</th><th scope="col">Bob balance</th><th scope="col">Carol balance</th><th scope="col">Claimed</th><th scope="col">Remaining funded liability</th></tr></thead><tbody>{current.intermediateStates.map((state) => <tr key={state.step}><th scope="row">{state.step}</th><td>{claimantNames[state.claim] ?? state.claim}</td><td>{state.aliceBalance}</td><td>{state.bobBalance}</td><td>{state.carolBalance}</td><td>{state.claimedAmount}</td><td>{state.outstandingLiability}</td></tr>)}</tbody></table></div>
    <dl className={styles.facts}><dt>Execution identity</dt><dd><code>{current.executionIdentity}</code></dd><dt>Normalized terminal projection root</dt><dd><code>{normalizedRoot}</code></dd><dt>Restricted-capital refund</dt><dd>{current.restrictedRefund.amount} units to the recorded Carol fixture recipient, separate from claimant payments.</dd></dl>
    <p className={styles.textEquivalent}>Text equivalent of the selected table: each row is a successive local contract-call boundary; the claimant’s balance increases while the remaining funded liability decreases. At the final row, cumulative claimant payments are 70 and funded liability is zero. The restricted 10-unit reserve refund is separately recorded and is not part of those 70 units.</p>
  </section>
}
