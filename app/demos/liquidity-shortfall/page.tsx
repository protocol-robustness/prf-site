import type { Metadata } from 'next'
import DemoShell from '@/components/demo/DemoShell'
import { DistributionCard, PolicyCard, RequestsCard, VerificationCard, VerificationSummary } from '@/components/demo/AllocationCards'
import EvidencePanel from '@/components/demo/EvidencePanel'
import TechnicalProofCTA from '@/components/demo/TechnicalProofCTA'
import { assertPublicDemo } from '@/lib/validate-public-demo'
import type { LiquidityShortfallDemo } from '@/lib/public-demo'
import raw from '@/generated/demos/liquidity-shortfall.json'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Provably Fair Pro-Rata',
  description:
    'See how PRF independently reconstructs and verifies a pro-rata allocation when $100 of valid requests compete for $70 of available liquidity.',
}

// Fail closed at build time: this throws if the generated artifact is missing
// any required evidence, so the page can never silently render an empty shell.
assertPublicDemo(raw)
const demo = raw as LiquidityShortfallDemo

export default function LiquidityShortfallPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>Flagship demonstration</span>
      <h1 className={styles.title}>Provably Fair Pro-Rata</h1>
      <p className={styles.question}>$100 requested. $70 available. Who gets what — and can anyone independently prove the allocation was correct?</p>

      <VerificationSummary demo={demo} />
      <DemoShell
        steps={[
          { id: 'requests', label: 'Requests', node: <RequestsCard demo={demo} /> },
          { id: 'policy', label: 'Policy', node: <PolicyCard demo={demo} /> },
          { id: 'distribution', label: 'Distribution', node: <DistributionCard demo={demo} /> },
          { id: 'verification', label: 'Verification', node: <VerificationCard demo={demo} /> },
          { id: 'evidence', label: 'Evidence', node: <EvidencePanel demo={demo} /> },
        ]}
      />

      <div className={styles.proofWrap}>
        <TechnicalProofCTA demo={demo} />
      </div>
    </div>
  )
}
