import result from '../../../public/evidence/partial-fill-v3-anvil-same-block/result.json'
import styles from '../../content.module.css'

const transitions = result.execution.transitions
const evidenceFiles = ['result.json', 'receipts.json', 'accounting-journal.json', 'manifest.json', 'manifest.json.sha256']
const sourceRevision = '2ed0eccd4dcd44c8a7e63fed03e0fc25807d41e5'
const claimantNames: Record<string, string> = { 'claim-a': 'Alice', 'claim-b': 'Bob', 'claim-c': 'Carol' }

export default function AnvilSameBlockEvidence() {
  return <section className={styles.section} aria-labelledby="anvil-order-title">
    <span className={styles.kicker}>Separate retained evidence · local Anvil</span>
    <h2 id="anvil-order-title">Same-block transactions, ordered by receipt index</h2>
    <p className={styles.sectionLead}>A fixed sequence of four independently submitted transactions was included in one local Anvil block. The receipt indexes show the order the EVM applied: Alice’s claim, a duplicate Alice claim, Bob’s claim, then Carol’s claim.</p>
    <p className={styles.boundary}>This is a separate local chain 31337 qualification. It demonstrates one fixed same-block transaction sequence, not arbitrary concurrent execution, public-chain inclusion, Sepolia deployment, or proof-system qualification. The restricted 10 units remain in reserve; this run does not finalize their refund.</p>
    <div className={styles.tableScroll}><table className={styles.table}><caption>Retained local Anvil block {result.execution.blockNumber}; transaction indexes and post-transaction claimant liability</caption><thead><tr><th scope="col">Index</th><th scope="col">Action</th><th scope="col">Outcome</th><th scope="col">Attempted amount</th><th scope="col">Claimed after transaction</th><th scope="col">Funded liability after transaction</th></tr></thead><tbody>{transitions.map((transition) => <tr key={transition.transactionHash}><td>{transition.transactionIndex}</td><td>{claimantNames[transition.claimId] ?? transition.claimId}{transition.success ? ' claim' : ' duplicate claim'}</td><td>{transition.success ? 'Success' : `Reverted: ${transition.failure?.error ?? 'rejected'}`}</td><td>{transition.amount}</td><td>{transition.stateAfter.claimedAmount}</td><td>{transition.stateAfter.outstandingLiability}</td></tr>)}</tbody></table></div>
    <p className={styles.textEquivalent}>Text equivalent: in one local Anvil block, index 0 pays Alice 35 and leaves 35 claimant units outstanding; index 1 rejects a duplicate 35-unit Alice claim and leaves state unchanged, with no transfer; index 2 pays Bob 21 and leaves 14 outstanding; index 3 pays Carol 14 and leaves zero claimant liability. The final reserve balance remains 10 because this sequence does not execute the separate restricted-capital refund.</p>
    <dl className={styles.facts}><dt>Chain and block</dt><dd>Local Anvil · chain ID {result.execution.chainId} · block {result.execution.blockNumber}</dd><dt>Block hash</dt><dd><code>{result.execution.blockHash}</code></dd><dt>Normalized projection root for this Anvil result</dt><dd><code>{result.normalizedTerminalProjectionRoot}</code></dd><dt>Final claimant payments</dt><dd>Alice 35 · Bob 21 · Carol 14 · 70 total · zero funded claimant liability</dd><dt>Final reserve</dt><dd>{result.normalizedTerminalProjection.balances.reserve} restricted units remain; no refund transaction in this evidence scope.</dd><dt>Operation ID</dt><dd><code>{result.execution.operationId}</code></dd><dt>PRF EVM source revision pinned by manifest</dt><dd><code>{sourceRevision}</code></dd></dl>
    <p className={styles.textEquivalent}>The Anvil root above belongs to this separate transaction-inclusion artifact. It is not the six-order Foundry qualification’s terminal root; each result has its own evidence scope and identity.</p>
    <div className={styles.linkRow}>{evidenceFiles.map((file) => <a key={file} href={`/evidence/partial-fill-v3-anvil-same-block/${file}`} download>{file} ↓</a>)}</div>
    <p className={styles.textEquivalent}>The site publishes the result, receipts, accounting journal and source-pinning manifest. The manifest identifies source and test files by hash; the site does not copy unpublished PRF implementation sources.</p>
  </section>
}
