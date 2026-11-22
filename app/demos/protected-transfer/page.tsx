import type { Metadata } from 'next'
import Link from 'next/link'
import timeline from '@/public/evidence/protected-transfer-v1/site-timeline.json'
import styles from './page.module.css'
import ProtectedTransferStoryboard from './ProtectedTransferStoryboard'

export const metadata: Metadata = {
  title: 'The Protected Transfer · Local forensic replay',
  description: 'Explore one retained local proof-backed shortfall operation from source and deployment through pro-rata withdrawals and forensic reconciliation.',
}

export default function ProtectedTransferPage() {
  const data = timeline as Parameters<typeof ProtectedTransferStoryboard>[0]['timeline']
  return <main className={styles.page}>
    <Link href="/demos" className={styles.back}>← All demonstrations</Link>
    <header className={styles.hero}>
      <span className={styles.kicker}>Sew Protocol integration · Pro-rata / Pro-Rata V2 · forensic replay</span>
      <h1>The Protected Transfer</h1>
      <p className={styles.lede}>Follow one controlled shortfall from committed requests to proof-backed funding, activated entitlements, observed withdrawals and a reconciled outcome.</p>
      <p>This retained local deployment includes <code>SewGovernanceAuthorityAdapter</code> and <code>SewConfigurationExecutor</code>. It demonstrates this bounded protected-transfer path; it does not qualify Sew’s wider escrow, release or dispute-resolution behavior.</p>
      <p className={styles.notice} role="note"><b>Local-only evidence.</b> This replay uses a controlled fixture token on Anvil, chain 31337. It is not USDC, public-chain execution, or an external claims-authority demonstration.</p>
      <p>The evidence-bound operation requested 100 units. The reserve held 80, with 10 protected, leaving 70 available. The retained run funded 70 and recorded payments of 35, 21 and 14. The remaining 30 is unmet demand, not a funded liability or observed loss.</p>
      <div className={styles.links}>
        <a href="/evidence/protected-transfer-v1/README.md">Reproduction instructions →</a>
        <a href="/evidence/protected-transfer-v1/bundle.json">Evidence bundle index →</a>
        <a href="/evidence/protected-transfer-v1/deployment-broadcast.json">Sew integration deployment record →</a>
        <a href="/evidence/protected-transfer-v1/verify.py">Offline verifier →</a>
        <Link href="/demos/composed-pro-rata-settlement">Separate 100/70 flagship operation →</Link>
      </div>
    </header>

    <section className={styles.summary} aria-label="Observed economic summary">
      <Summary label="Requested" amount={data.economics.requested} />
      <Summary label="Available" amount={data.economics.available} />
      <Summary label="Paid" amount={data.economics.terminal.paid} />
      <Summary label="Unmet" amount={data.economics.unmet} />
    </section>

    <ProtectedTransferStoryboard timeline={data} />

    <section className={styles.boundary} aria-labelledby="boundary-title">
      <span className={styles.kicker}>What this evidence supports</span>
      <h2 id="boundary-title">One operation, with its limits kept visible</h2>
      <ul>
        <li><b>Proof and deployment:</b> the retained fixture identifies the source-bound entitlement V1 SP1 program, Groth16 proof, VKey, ELF digest, deployed verifier adapter, registry and statement-admission contracts. The retained local Foundry suite reports proof admission, ratification, funding and activation.</li>
        <li><b>Deployed dependencies:</b> this run has its own local deployment manifest and receipts for the verifier, adapter, registry, admission, reserve, allocator, controllers, assurance, token and local authority/configuration contracts. No receipts from the separate flagship operation are mixed into this timeline.</li>
        <li><b>Forensics throughout:</b> each step links its retained manifest, witness, proof, broadcast or forensic record. Receipt block hashes, transfer logs, operation identity and evidence cross-links are rechecked by the site verifier.</li>
        <li><b>Withdrawals:</b> Alice, Bob and Carol received 35, 21 and 14 fixture-token units. The retained evidence also records Requested/Required mode per withdrawal and three read-only duplicate-claim replays that reverted after closure.</li>
        <li><b>Allocator substitution:</b> a separate Pro-Rata V2 Foundry unit test rejects a prepared allocator that differs from the reserve-bound allocator before assurance consumption. The replay labels this as a separate test-harness case, not a transaction in the proof-backed operation.</li>
      </ul>
      <p><b>Not established:</b> public-chain authentication, production source authority, USDC behavior, or caller-selected destination substitution within the proof-backed operation. The retained allocator test uses a separate Foundry test operation and has no transaction receipt. Duplicate-claim checks were read-only calls rather than mined reverted transactions. The deployment uses local fixture configuration values; it does not qualify a public deployment.</p>
      <p>The bundle verifier confirms artifact hashes and cross-links, including a separate fresh-Anvil reproduction. Those local observations are reproducible evidence, not a chain-state proof independently authenticated outside the bundle.</p>
    </section>
  </main>
}

function Summary({ label, amount }: { label: string; amount: number }) {
  return <div><span>{label}</span><strong>{amount}</strong><small>fixture units</small></div>
}
