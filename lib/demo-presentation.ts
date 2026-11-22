export type Capability = 'security' | 'operations' | 'withdrawals' | 'incentives'
export type Audience = 'stablecoins' | 'auditability'
export type EvidenceClass = 'Computed' | 'Independently reproduced' | 'Locally observed' | 'Integrity checked' | 'Cryptographically verified locally' | 'Reconciled from local observations' | 'Declared record scope' | 'Unverified externally' | 'Locally tested' | 'Qualification not established'

export interface DemoPresentation {
  id: string
  route: `/demos/${string}`
  title: string
  capabilities: readonly Capability[]
  audiences: readonly Audience[]
  question: string
  evidenceClass: EvidenceClass
  evidenceLevel: string
  verifiedClaims: readonly string[]
  limitations: readonly string[]
  notebook?: string
  artifacts: readonly { label: string; href: string }[]
}

// Presentation metadata curates canonical demo routes. Each demo page and its
// retained evidence remain authoritative for the claims and qualifications.
export const demoPresentations: readonly DemoPresentation[] = [
  {
    id: 'what-breaks-under-stress', route: '/demos/what-breaks-under-stress', title: 'What Breaks Under Stress?',
    capabilities: ['security'], audiences: ['stablecoins'],
    question: 'What happens to modeled withdrawals when available liquidity falls or claim order is adversarial?',
    evidenceClass: 'Computed',
    evidenceLevel: 'Retained simulator fixtures; suite checks pass for the stated model revision.',
    verifiedClaims: ['The three published yield-v1 cases report zero recorded invariant failures.', 'The tested ordering attempt does not falsify the stated expectations.'],
    limitations: ['Passing these fixtures does not establish that every timing, market condition or implementation has been explored.'],
    artifacts: [{ label: 'Yield reference suite results', href: '/evidence/stress/yield-reference-v1-scenario-results.json' }],
  },
  {
    id: 'liquidity-shortfall', route: '/demos/liquidity-shortfall', title: 'Pro-Rata Allocation Under Shortfall',
    capabilities: ['security', 'withdrawals'], audiences: ['stablecoins'],
    question: 'How are declared policy rules applied when $100 of requests compete for $70 of liquidity?',
    evidenceClass: 'Independently reproduced',
    evidenceLevel: 'Retained fixture with independent recipient-level policy reconstruction and aggregate checks.',
    verifiedClaims: ['The recipient allocations are reconstructed from the declared policy.', 'Aggregate conservation checks are recorded for this fixture.'],
    limitations: ['Policy fairness and actual recipient payments are not established by this allocation fixture.'],
    notebook: '/notebooks/pro-rata-allocation-result/',
    artifacts: [{ label: 'Versioned liquidity shortfall manifest', href: '/evidence/manifests/liquidity-shortfall.v1.json' }],
  },
  {
    id: 'ratification', route: '/demos/ratification', title: 'What Must Line Up Before Capital Moves?',
    capabilities: ['operations'], audiences: ['stablecoins'],
    question: 'Can a proof, prepared operation and live reserve commitment gate funding?',
    evidenceClass: 'Locally observed',
    evidenceLevel: 'Retained local EVM run plus source-level conformance assertions.',
    verifiedClaims: ['The retained local run funded 70 units while preserving a 10-unit reserve floor.', 'The demonstrated ratification path binds the operation, proof admission and reserve commitment.'],
    limitations: ['This is not an integration deployed to a third-party protocol.', 'The V2 ratification path ends at Funded; this demo does not claim V2 activation or withdrawal.'],
    artifacts: [{ label: 'Settlement operation manifest', href: '/evidence/pro-rata-settlement/settlement-manifest.json' }],
  },
  {
    id: 'protected-transfer', route: '/demos/protected-transfer', title: 'The Protected Transfer',
    capabilities: ['operations', 'withdrawals'], audiences: ['stablecoins'],
    question: 'Can one retained operation connect proof admission, protected funding and beneficiary withdrawals?',
    evidenceClass: 'Locally observed',
    evidenceLevel: 'Locally observed Anvil execution with retained bundle checks and a fresh local reproduction.',
    verifiedClaims: ['The retained run records 35, 21 and 14 fixture-token withdrawals.', 'The bundle verifier checks artifact hashes and cross-links.'],
    limitations: ['Local fixture-token execution only; not USDC, public-chain execution or an external claims-authority demonstration.', 'Local observations are not independently authenticated chain-state proofs.'],
    artifacts: [{ label: 'Evidence bundle index', href: '/evidence/protected-transfer-v1/bundle.json' }, { label: 'Reproduction instructions', href: '/evidence/protected-transfer-v1/README.md' }],
  },
  {
    id: 'where-did-every-token-go', route: '/demos/where-did-every-token-go', title: 'Where Did Every Token Go?',
    capabilities: ['withdrawals'], audiences: ['stablecoins', 'auditability'],
    question: 'Who was paid, what remains in custody and which claimant liabilities remain?',
    evidenceClass: 'Locally observed',
    evidenceLevel: 'Retained local EVM observations across funding, activation and withdrawals.',
    verifiedClaims: ['The published records reconcile custody, funded entitlements, beneficiary payments and outstanding liabilities for this run.'],
    limitations: ['The evidence is from a retained local settlement operation and does not authenticate public-chain activity.'],
    artifacts: [{ label: 'Withdrawal and payout observations', href: '/evidence/pro-rata-settlement/settlement-withdrawals.json' }, { label: 'Run manifest', href: '/evidence/pro-rata-settlement/settlement-manifest.json' }],
  },
  {
    id: 'composed-pro-rata-settlement', route: '/demos/composed-pro-rata-settlement', title: 'From Shortfall to Settlement',
    capabilities: ['operations', 'withdrawals'], audiences: ['stablecoins', 'auditability'],
    question: 'Can a shortfall proceed through allocation, proof admission, protected funding, withdrawals and reconciliation?',
    evidenceClass: 'Locally observed',
    evidenceLevel: 'Retained controlled local Foundry operation with proof verification and forensic records.',
    verifiedClaims: ['The 100-unit request had 70 available units; 35, 21 and 14 were locally withdrawn.', 'The funded claimant liability closed at zero in this local operation.'],
    limitations: ['Local controlled fixture; not public-chain USDC settlement.', 'The 30 unfilled units are unmet requests, not deferred claimant liabilities.'],
    notebook: '/notebooks/composed-pro-rata-v2-settlement/',
    artifacts: [{ label: 'Settlement validation result', href: '/evidence/composed-pro-rata-v2-settlement/validation-result.json' }, { label: 'Settlement manifest', href: '/evidence/composed-pro-rata-v2-settlement/manifest.json' }],
  },
  {
    id: 'canonical-comparison', route: '/demos/canonical-comparison', title: 'Can Two Programs Verify the Same Record?',
    capabilities: ['security'], audiences: ['auditability'],
    question: 'Can independent Clojure and Rust verifiers reconstruct the same retained economic record?',
    evidenceClass: 'Independently reproduced',
    evidenceLevel: 'Retained fixture; cross-language implementations agree on the declared canonical record.',
    verifiedClaims: ['The implementations produce the same canonical result root for this fixture.'],
    limitations: ['A matching fingerprint does not prove input truth, policy fairness, authorization or payment.'],
    artifacts: [{ label: 'Canonical comparison evidence manifest', href: '/evidence/canonical-comparison/canonical-comparison.v1.json' }],
  },
  {
    id: 'reordered-evidence', route: '/demos/reordered-evidence', title: 'Tamper-Evident Evidence',
    capabilities: ['security'], audiences: ['auditability'],
    question: 'Does reordering committed evidence preserve the same verified meaning?',
    evidenceClass: 'Integrity checked',
    evidenceLevel: 'Retained public demo artifact checked by the chain verifier.',
    verifiedClaims: ['The verifier rejects the changed evidence order in the retained case.'],
    limitations: ['The result concerns this committed sequence and verifier; it does not authenticate external facts.'],
    artifacts: [],
  },
  {
    id: 'current-head', route: '/demos/current-head', title: 'Authoritative State',
    capabilities: ['security', 'operations'], audiences: ['auditability'],
    question: 'Can a stale result become the basis of a new protocol action?',
    evidenceClass: 'Locally tested',
    evidenceLevel: 'Retained state-transition demo artifact checked by the chain facade.',
    verifiedClaims: ['The tested stale submission is refused and the current verified head remains unchanged.'],
    limitations: ['The claim is bounded to the retained history and tested transition; it is not a general deployed-protocol audit.'],
    artifacts: [],
  },
  {
    id: 'can-anyone-verify-the-research', route: '/demos/can-anyone-verify-the-research', title: 'Can Anyone Verify the Research?',
    capabilities: ['security', 'incentives'], audiences: ['auditability'],
    question: 'Do two separately written implementations produce the same result from rooted inputs?',
    evidenceClass: 'Independently reproduced',
    evidenceLevel: 'Local reproduction with distinct implementation and execution artifact identities.',
    verifiedClaims: ['Both implementations return 8 for the retained rooted input fixture.'],
    limitations: ['Distinct artifacts do not establish different people, organizations or independently generated upstream observations.'],
    artifacts: [{ label: 'Versioned reproduction manifest', href: '/evidence/manifests/can-anyone-verify-the-research.v1.json' }, { label: 'Local reproduction fixture', href: '/evidence/research/interaction-reproduction.edn' }],
  },
  {
    id: 'can-you-challenge-a-research-finding', route: '/demos/can-you-challenge-a-research-finding', title: 'Can You Challenge a Research Finding?',
    capabilities: ['security', 'incentives'], audiences: ['auditability'],
    question: 'Can a policy comparison support a qualified, reviewable challenge?',
    evidenceClass: 'Qualification not established',
    evidenceLevel: 'Retained local comparison; candidate qualification currently fails.',
    verifiedClaims: ['A 12-unit per-row difference is recorded for two policies on the same economic inputs.', 'The candidate gate failure is retained as a negative qualification result.'],
    limitations: ['The evidence does not establish novelty, a live protocol vulnerability, an unsafe deployed system, an accepted finding or an active public challenge.'],
    artifacts: [{ label: 'Local comparison and gate record', href: '/evidence/research/shortfall-challenge/policy-counterexample.v1.json' }],
  },
  {
    id: 'when-does-research-earn-a-reward', route: '/demos/when-does-research-earn-a-reward', title: 'How Research Rewards Work',
    capabilities: ['incentives'], audiences: [],
    question: 'How do evidence verification, reviewer authority and policy eligibility relate to researcher rewards?',
    evidenceClass: 'Locally tested',
    evidenceLevel: 'Local workflow and policy tests; no live reward opportunity.',
    verifiedClaims: ['Local tests exercise evidence verification, review, eligibility and rooted obligation construction as separate capabilities.'],
    limitations: ['There is no accepted public challenge, funded public obligation or qualified public payment execution.'],
    artifacts: [{ label: 'Versioned reward workflow manifest', href: '/evidence/manifests/when-does-research-earn-a-reward.v1.json' }],
  },
]

export function demosForAudience(audience: Audience): DemoPresentation[] {
  return demoPresentations.filter((demo) => demo.audiences.includes(audience))
}

export function demosForCapability(capability: Capability): DemoPresentation[] {
  return demoPresentations.filter((demo) => demo.capabilities.includes(capability))
}
