import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Withdrawal Races and Fair Shortfall Resolution in Ethereum',
  description: 'Four Ethereum cases illustrate why withdrawal ordering, loss recognition and recovery funding need explicit, independently verifiable economic rules.',
}

const referenceLinks = [
  {label: 'Moonwell: fair withdrawal mechanism for Base mUSDC (6 September 2026)', url: 'https://forum.moonwell.fi/t/governance-request-fair-withdrawal-mechanism-for-the-illiquid-base-musdc-market/2230'},
  {label: 'Moonwell: cbBTC supplier remediation request (3–19 November 2026)', url: 'https://forum.moonwell.fi/t/formal-governance-request-remediation-plan-for-suppliers-in-the-base-cbbtc-core-market/2309'},
  {label: 'Anthias Labs: reserve-repayment allocation proposal (24 August 2026)', url: 'https://forum.moonwell.fi/t/anthias-labs-reserve-recommendations-8-24-26/2197'},
  {label: 'Aave: rsETH incident report and alternative scenarios (20 April 2026)', url: 'https://governance.aave.com/t/rseth-incident-report-april-20-2026/24580'},
  {label: 'Lido: Kelp incident and EarnETH response review (21 May 2026)', url: 'https://research.lido.fi/t/kelp-incident-review-earneth-exposure-response-and-risk-framework-changes/11579'},
  {label: 'Morpho: managing bad debt in Vault V1.0 and V1.1', url: 'https://docs.morpho.org/curate/tutorials-v1/bad-debt/'},
  {label: 'Morpho: handling bad debt in Vault V2', url: 'https://docs.morpho.org/curate/tutorials-v2/bad-debt/'},
  {label: 'Morpho: liquidity shortage versus bad debt (5 October 2026)', url: 'https://help.morpho.org/en/articles/14779745-morpho-vaults-and-available-liquidity'},
]

export default function ResearchNote() {
  return (
    <article style={{maxWidth: '810px', margin: '0 auto', padding: '3rem 1.5rem 5rem'}}>
      <p style={{fontSize: '.88rem', color: 'var(--fg-muted)', letterSpacing: '.07em', textTransform: 'uppercase'}}>PRF Research · 21 November 2026</p>
      <h1 style={{fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1.13, margin: '1rem 0 1.3rem'}}>Withdrawal Races and Fair Shortfall Resolution in Ethereum</h1>
      <p style={{fontSize: '1.23rem', color: 'var(--fg-secondary)', lineHeight: 1.65}}>
        When a protocol has less recoverable capital than its users can claim, withdrawal order can become an unannounced loss-allocation policy. Recent Ethereum cases show why the rules for recognizing losses, restricting exits and distributing recoveries should be explicit and independently verifiable.
      </p>
      <p>
        A shortfall is not simply a slow withdrawal. A solvent lending market can be temporarily illiquid because assets are lent out. A shortfall arises when recoverable assets cannot satisfy the relevant claims. Uncertain valuations can make the boundary difficult to identify in real time. These states require different responses.
      </p>

      <h2 style={{marginTop: '2.5rem'}}>Four cases</h2>
      <h3>Moonwell: a live withdrawal fairness dispute</h3>
      <p>
        Following the August 2026 MAMO incident on Base, Moonwell suppliers raised a specific concern: small borrower repayments could briefly replenish market cash, only for the fastest withdrawals to consume it. A September governance request about mUSDC described how later suppliers might be left bearing a disproportionate share of unresolved bad debt. A November cbBTC supplier request explicitly asked that any recapitalization be allocated pro rata rather than released as open liquidity. These are user proposals, not adopted remediation rules. <a href={referenceLinks[0].url}>mUSDC discussion</a>; <a href={referenceLinks[1].url}>cbBTC request</a>.
      </p>
      <p>
        In a separate August proposal, Anthias Labs specified pro-rata use of <em>market reserves across eligible bad-debt borrower accounts</em>. That is not the same as compensating suppliers pro rata. Eligibility, allocation level and legal or protocol claim basis matter. <a href={referenceLinks[2].url}>Reserve proposal</a>.
      </p>

      <h3>Aave: the socialization boundary changes the answer</h3>
      <p>
        Aave service providers' April 2026 report on the Kelp rsETH bridge exploit modeled different ways to reprice collateral and assign losses. Uniform loss socialization across all rsETH holders, and loss concentration on affected remote chains, generated markedly different estimated bad-debt outcomes. The report explicitly presented these as <em>scenarios, not realized settlement results</em>. Before allocating any shortfall, a protocol must establish which claims and pools are in scope, what assets are truly backing them, and what protection or recovery commitments are admissible. <a href={referenceLinks[3].url}>Aave incident report</a>.
      </p>

      <h3>Lido Earn: pause first, price and recover before reopening</h3>
      <p>
        During the same rsETH event, Lido Earn and Mellow paused deposits and withdrawals. Lido's review explains that exits at uncertain valuations could have shifted risk from early withdrawers to those who remained. The vault reopened on 15 May 2026 after a 27-day interruption, with 143.98 ETH of specifically authorized first-loss coverage used for residual incident-related losses; the review reports users were made whole. The case demonstrates an operational alternative to a withdrawal race, but also the need for transparent authority, valuation and coverage decisions. <a href={referenceLinks[4].url}>Lido review</a>.
      </p>

      <h3>Morpho: the accounting version is an economic rule</h3>
      <p>
        Morpho's documentation distinguishes automatic recognition of losses in Vault V1.0 from delayed recognition in V1.1. Its V2 design socializes losses through share-price changes after underlying adapters report them, while warning that unrealized bad debt can let early withdrawers exit at an inflated price. Morpho also explicitly distinguishes temporary lack of liquid assets from actual bad debt. A meaningful comparison must pin the vault version, adapter behavior and recognition timing; this is a documented mechanism comparison, not an allegation that all Morpho vaults experienced the same incident. <a href={referenceLinks[5].url}>V1 guide</a>; <a href={referenceLinks[6].url}>V2 guide</a>; <a href={referenceLinks[7].url}>liquidity explanation</a>.
      </p>

      <h2 style={{marginTop: '2.5rem'}}>The allocation problem</h2>
      <p>
        Suppose eligible claims total 100 units and only 70 are available. Under a uniform 70% pro-rata rule, claims of 50, 30 and 20 receive entitlements of 35, 21 and 14. A first-come-first-served process could distribute the same 70 differently depending on who exits first. This example is illustrative, not drawn from any of the four incidents. Pro rata is not automatically the right policy for every protocol or legal arrangement; it is one explicit policy that can be tested.
      </p>
      <p>
        Fair resolution requires more than arithmetic. The claimant set and snapshot time, obligations, asset and price sources, restrictions on capital, treatment of post-incident entrants, coverage priorities, approval authority and future recoveries all affect the result. A proof of a ratio does not establish that the underlying claims were valid.
      </p>

      <h2 style={{marginTop: '2.5rem'}}>A verifiable shortfall policy</h2>
      <p>These cases suggest five practical requirements for research and implementation:</p>
      <ol style={{paddingLeft: '1.4rem'}}>
        <li><strong>Classify the condition.</strong> Distinguish illiquidity, unrealized bad debt, realized losses and uncertain valuations.</li>
        <li><strong>Bind the economic inputs.</strong> Identify claimants and obligations at a declared point in time, together with source evidence and asset restrictions.</li>
        <li><strong>Make policy and authority explicit.</strong> Record the chosen loss and recovery waterfall, its approval and any accepted exceptions.</li>
        <li><strong>Verify executable entitlements.</strong> Test conservation, rounding, exact beneficiary mapping, replay resistance and claim-order independence where required by policy.</li>
        <li><strong>Preserve the history.</strong> Keep original evidence, decisions, recovery contributions and withdrawals independently reconstructible as conditions change.</li>
      </ol>
      <p>
        The open-source <strong>Protocol Robustness Framework (PRF)</strong> investigates these requirements through deterministic scenarios, qualification evidence and verifiable pro-rata allocation. This research does not certify the four protocols, establish a legal entitlement, or imply an audited production deployment for any of them. The immediate opportunity is an open, reproducible benchmark of competing withdrawal and recovery policies.
      </p>

      <h2 style={{marginTop: '2.5rem'}}>Primary sources</h2>
      <ol style={{paddingLeft: '1.4rem'}}>
        {referenceLinks.map((source) => <li key={source.url}><a href={source.url}>{source.label}</a></li>)}
      </ol>
      <p style={{fontSize: '.9rem', color: 'var(--fg-muted)', marginTop: '2rem'}}>
        Research note based on public materials available as of 21 November 2026. Financial values, governance positions and implementation details may change. This is technical research, not financial or legal advice.
      </p>
      <p style={{marginTop: '2rem'}}><Link href="/demos/liquidity-shortfall">Explore the PRF liquidity shortfall demonstration</Link></p>
    </article>
  )
}
