import type { Metadata } from 'next'
import DemoShell from '@/components/demo/DemoShell'
import { DistributionCard, PolicyCard, RequestsCard, VerificationCard, VerificationSummary } from '@/components/demo/AllocationCards'
import EvidencePanel from '@/components/demo/EvidencePanel'
import TechnicalProofCTA from '@/components/demo/TechnicalProofCTA'
import NotebookReproductionCTA from '@/components/demo/NotebookReproductionCTA'
import { assertPublicDemo } from '@/lib/validate-public-demo'
import type { LiquidityShortfallDemo } from '@/lib/public-demo'
import raw from '@/generated/demos/liquidity-shortfall.json'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Pro-Rata Allocation Under Shortfall',
  description:
    'Inspect an independent recipient-level policy reconstruction and aggregate evidence when $100 of requests compete for $70 of liquidity. Policy fairness and actual payments are not established.',
}

// Fail closed at build time: this throws if the generated artifact is missing
// any required evidence, so the page can never silently render an empty shell.
assertPublicDemo(raw)
const demo = raw as LiquidityShortfallDemo

export default function LiquidityShortfallPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>Flagship demonstration</span>
      <h1 className={styles.title}>Pro-Rata Allocation Under Shortfall</h1>
      <p className={styles.question}>$100 requested. $70 available. Inspect the calculated allocations, aggregate conservation checks and evidence roots.</p>

      <VerificationSummary demo={demo} />
      <DemoShell
        steps={[
          { id: 'requests', label: 'Requests', node: <RequestsCard demo={demo} />, narration: `${demo.scenario.pool.requested} units were requested and ${demo.scenario.pool.available} units were available in the retained fixture.`, evidence: { status: 'computed', sourceLabel: 'liquidity-shortfall.v1 manifest', sourceHref: '/evidence/manifests/liquidity-shortfall.v1.json', identity: demo.source['input-root'], scope: 'Fixture inputs; not a live reserve observation.' } },
          { id: 'policy', label: 'Policy', node: <PolicyCard demo={demo} />, narration: 'The declared allocation policy is applied to this fixed request and available-capacity fixture.', evidence: { status: 'qualified', sourceLabel: 'liquidity-shortfall.v1 manifest', sourceHref: '/evidence/manifests/liquidity-shortfall.v1.json', identity: demo.source['input-root'], scope: 'The fixture does not establish that this policy is fair or appropriate for a live protocol.' } },
          { id: 'distribution', label: 'Distribution', node: <DistributionCard demo={demo} />, narration: `${demo.allocation['total-allocated']} units are calculated as allocated; ${demo.allocation['unallocated-residual']} units remain unmet.`, evidence: { status: 'independently-reproduced', sourceLabel: 'liquidity-shortfall.v1 manifest', sourceHref: '/evidence/manifests/liquidity-shortfall.v1.json', identity: demo.source['result-root'], scope: 'Calculated allocations; no recipient payment is established by this fixture.' } },
          { id: 'verification', label: 'Verification', node: <VerificationCard demo={demo} />, narration: `Aggregate conservation ${demo.conservation.holds ? 'holds' : 'fails'} and the pool exhaustion check is ${demo.commitments['pool-fully-allocated'] ? 'satisfied' : 'not satisfied'}.`, evidence: { status: demo.conservation.holds && demo.commitments['pool-fully-allocated'] ? 'verified-check' : 'rejected', sourceLabel: 'liquidity-shortfall.v1 manifest', sourceHref: '/evidence/manifests/liquidity-shortfall.v1.json', identity: demo.source['result-root'], scope: 'These checks establish only the stated fixture properties.' } },
          { id: 'evidence', label: 'Evidence', node: <EvidencePanel demo={demo} />, narration: 'Inspect the retained inputs, projection identity, independent reconstruction and verification artifacts.', evidence: { status: 'qualified', sourceLabel: 'liquidity-shortfall.v1 manifest', sourceHref: '/evidence/manifests/liquidity-shortfall.v1.json', identity: demo.source['result-root'], scope: 'Artifact identity is not an independent authentication of external source facts.' } },
        ]}
      />

      <div className={styles.proofWrap}>
        <TechnicalProofCTA demo={demo} />
        <NotebookReproductionCTA
          label="Explore the related 100/70 settlement notebook"
          detail="The notebook follows a separate source-bound execution through proof admission and withdrawals; its evidence is not the fixture shown above."
        />
      </div>
    </div>
  )
}
