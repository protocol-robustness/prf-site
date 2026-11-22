'use client'

import { useState } from 'react'
import manifest from '../../../public/evidence/composed-pro-rata-v2-settlement/manifest.json'
import result from '../../../public/evidence/composed-pro-rata-v2-settlement/validation-result.json'
import pin from '../../../public/evidence/manifests/composed-pro-rata-v2-settlement.publication.json'
import EvidenceCheckpoint from './EvidenceCheckpoint'
import styles from './page.module.css'

type ContractKey = keyof typeof result.deployedContractIdentities
type Dependency = { key: ContractKey; name: string; role: string; source: string; stage: string }

const evidenceRoot = '/evidence/composed-pro-rata-v2-settlement'
const sourceBase = `https://github.com/protocol-robustness/prf-evm/blob/${pin.sourceRevision}`
const testSource = `${sourceBase}/test/PartialFillV3Controlled.t.sol`
const dependencies: Dependency[] = [
  { key: 'verifier', name: 'SP1 Groth16 verifier', role: 'Checks the Groth16 proof. This fixture deploys the real verifier from pinned SP1 source.', source: `https://github.com/succinctlabs/sp1-contracts/tree/${manifest.dependencies.sp1Contracts}`, stage: 'admission' },
  { key: 'adapter', name: 'Successor verifier adapter', role: 'Binds the verifier to the V1 successor program, VKey, ELF and 288-byte public-values profile.', source: `${sourceBase}/src/verification/adapters/PrfSourceBoundEntitlementVerifierAdapterV1.sol`, stage: 'admission' },
  { key: 'registry', name: 'Verifier registry', role: 'Records the selected adapter, program identities and schemas in a sealed registry snapshot.', source: `${sourceBase}/src/core/PrfVerifierRegistry.sol`, stage: 'admission' },
  { key: 'admission', name: 'Statement admission', role: 'Uses the configured registry selection to admit the proof and bind its receipt to the local configuration.', source: `${sourceBase}/src/core/PrfStatementAdmission.sol`, stage: 'admission' },
  { key: 'preparedController', name: 'Prepared-operation controller V2', role: 'Commits the operation, chain, reserve, token, allocator, configuration and proof profile before ratification.', source: `${sourceBase}/src/applications/shortfall/SourceBoundProRataControllerV2.sol`, stage: 'source' },
  { key: 'assurance', name: 'Source assurance', role: 'Matches admitted proof output to the prepared operation and supplies the assurance consumed at ratification.', source: `${sourceBase}/src/applications/shortfall/SourceBoundProRataEntitlementAssuranceV1.sol`, stage: 'ratification' },
  { key: 'ratification', name: 'Ratification controller', role: 'Checks authority, prepared context and live reserve state, then atomically ratifies and funds through the bound route.', source: `${sourceBase}/src/applications/shortfall/SourceBoundProRataEntitlementRatificationControllerV1.sol`, stage: 'ratification' },
  { key: 'reserve', name: 'Shortfall reserve V3', role: 'Holds 80 fixture units, restricts 10, funds 70 and returns the restricted capital only after terminal conditions pass.', source: `${sourceBase}/src/applications/shortfall/OnchainShortfallReserveV3.sol`, stage: 'funding' },
  { key: 'allocator', name: 'Pro-rata allocator V2', role: 'Accepts funding from the bound reserve, activates the admitted entitlements and pays the three one-time claims.', source: `${sourceBase}/src/applications/pro-rata/ProductionProRataAllocatorV2.sol`, stage: 'withdrawal' },
  { key: 'token', name: 'Local fixture asset', role: 'The existing test’s LOCAL ERC-20 carries custody and payments. It is not USDC or a PRF/SEW governance token.', source: testSource, stage: 'closure' },
]

// These are source-defined contract relationships, not a deployment ordering
// DAG or newly authenticated observations of live constructor/storage values.
const bindings: { from: ContractKey; to: ContractKey; kind: string; detail: string }[] = [
  { from: 'adapter', to: 'verifier', kind: 'Constructor binding', detail: 'The successor adapter receives the deployed SP1 verifier, pinned VKey and ELF digest.' },
  { from: 'registry', to: 'adapter', kind: 'Registered selection', detail: 'The local test registers the adapter and program/profile identities, then seals the registry snapshot.' },
  { from: 'admission', to: 'registry', kind: 'Constructor binding', detail: 'Admission receives the registry together with genesis and the configuration executor.' },
  { from: 'assurance', to: 'admission', kind: 'Constructor binding', detail: 'Assurance consumes receipts from this admission contract.' },
  { from: 'assurance', to: 'adapter', kind: 'Constructor binding', detail: 'Assurance decodes the successor public values using this adapter.' },
  { from: 'assurance', to: 'preparedController', kind: 'Constructor binding', detail: 'Assurance checks the prepared operation held by this controller.' },
  { from: 'ratification', to: 'assurance', kind: 'Constructor binding', detail: 'Ratification uses this assurance contract and consumes the matched assurance.' },
  { from: 'ratification', to: 'preparedController', kind: 'Constructor binding', detail: 'Ratification uses this prepared-operation controller.' },
  { from: 'ratification', to: 'reserve', kind: 'Constructor binding', detail: 'Ratification is constructed for this reserve; live reserve commitment checking precedes funding.' },
  { from: 'preparedController', to: 'ratification', kind: 'Bound authority', detail: 'The local setup binds the ratification controller before preparing the operation.' },
  { from: 'assurance', to: 'ratification', kind: 'Bound authority', detail: 'The local setup binds the assurance contract’s ratification controller.' },
  { from: 'reserve', to: 'ratification', kind: 'Bound authority', detail: 'The reserve binds the controller as its ratification authority.' },
  { from: 'allocator', to: 'reserve', kind: 'Bound funding authority', detail: 'The allocator binds this reserve as its funding authority.' },
  { from: 'reserve', to: 'allocator', kind: 'Constructor binding', detail: 'The reserve is constructed for this allocator and the scoped operation.' },
  { from: 'reserve', to: 'token', kind: 'Constructor binding', detail: 'The reserve is constructed for this exact token. Deposit and funding observations use it.' },
  { from: 'allocator', to: 'token', kind: 'Prepared-operation asset', detail: 'The prepared operation names this token; the recorded claim transfers use the same asset.' },
]

const nameOf = (key: ContractKey) => dependencies.find((dependency) => dependency.key === key)!.name

export default function DeployedDependencies() {
  const [selected, setSelected] = useState<ContractKey>('admission')
  const dependency = dependencies.find(({ key }) => key === selected)!
  const identity = result.deployedContractIdentities[selected]
  const related = bindings.filter(({ from, to }) => from === selected || to === selected)

  return <div className={styles.explorer}>
    <p><b>{dependencies.length} recorded local address/runtime pairs.</b> Select a contract to follow its role, deployed identity, connected dependencies and supporting evidence.</p>
    <div className={styles.dependencyButtons} role="group" aria-label="Recorded deployed dependencies">
      {dependencies.map(({ key, name }) => <button key={key} type="button" aria-pressed={selected === key}
        onClick={() => setSelected(key)}>{name}</button>)}
    </div>
    <div className={styles.observation} aria-live="polite" aria-atomic="true" data-dependency-inspector="true">
      <span className={styles.evidenceLabel}>Recorded local deployment · chain 31337 · identity coverage: {selected}</span>
      <h3>{dependency.name}</h3>
      <p>{dependency.role}</p>
      <dl className={styles.identities}>
        <dt>Recorded deployed address</dt><dd><code data-recorded-address={selected}>{identity.address}</code></dd>
        <dt>Recorded runtime code hash</dt><dd><code data-recorded-runtime={selected}>{identity.codeHash}</code></dd>
        <dt>Operation using this dependency</dt><dd><code>{manifest.operation.id}</code></dd>
      </dl>
      <div className={styles.downloads}><a href={dependency.source}>Pinned implementation/source →</a><a href={`#evidence-${dependency.stage}`}>Follow its execution evidence →</a></div>
      <h4>Connected contract bindings</h4>
      <p className={styles.caption}>These relationships come from the pinned test and contract sources. Constructor, registry and authority bindings are distinct; these arrows do not specify deployment order.</p>
      <ul className={styles.bindingList}>
        {related.map(({ from, to, kind, detail }) => <li key={`${from}-${to}-${kind}`}>
          <span>{kind} · pinned-source relationship</span>
          <div><button type="button" onClick={() => setSelected(from)}>Follow {nameOf(from)}</button><span aria-hidden="true"> → </span><button type="button" onClick={() => setSelected(to)}>Follow {nameOf(to)}</button></div>
          <p>{detail}</p>
        </li>)}
      </ul>
      <EvidenceCheckpoint evidence={{
        classification: 'Recorded deployed identity + pinned-source dependency relationships',
        records: [{ label: 'Original identity observation', href: `${evidenceRoot}/execution.log` }, { label: 'Validated runtime inventory', href: `${evidenceRoot}/validation-result.json` }, { label: 'Pinned manifest and operation', href: `${evidenceRoot}/manifest.json` }, { label: 'Setup and binding calls', href: testSource }],
        check: 'The publication checker matches every recorded address and runtime hash to the unique identity record in the hash-pinned execution log, and checks the reserve/token/allocator against the prepared witness. Relationship descriptions are traced separately to pinned source.',
        conclusion: 'This identifies the local contract recorded for this role and the source-defined bindings used by the retained test.',
        limit: 'No current RPC, historical account proof or public deployment receipt is checked here. The runtime hash is a retained observation, not a fresh independent bytecode attestation.',
      }} />
    </div>
    <details className={styles.forensics}>
      <summary>All ten recorded deployed identities</summary>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <caption>Local execution identity inventory · chain 31337</caption>
        <thead><tr><th scope="col">Contract role</th><th scope="col">Recorded address</th><th scope="col">Recorded runtime hash</th></tr></thead>
        <tbody>{dependencies.map(({ key, name }) => <tr key={key} data-deployed-dependency={key}><th scope="row">{name}</th><td><code>{result.deployedContractIdentities[key].address}</code></td><td><code>{result.deployedContractIdentities[key].codeHash}</code></td></tr>)}</tbody>
      </table></div>
    </details>
    <div className={styles.scope}>
      <h3>Deployment evidence coverage</h3>
      <p>The pinned test also uses a genesis contract, authority adapter, configuration executor, local operation dispatcher and packed entitlement representation. Their full address/runtime pairs are not included in this validated ten-contract inventory. Inspect the pinned setup and activation code; this view does not invent identities for them.</p>
      <p>The fixture creates its infrastructure locally. Reuse of an admitted infrastructure release and external dependency admission are not demonstrated by this run. Source-library dependencies remain listed separately below.</p>
      <div className={styles.downloads}><a href={testSource}>Inspect the complete fixture topology →</a><a href={`${evidenceRoot}/README.md`}>Qualification and evidence limits →</a></div>
    </div>
  </div>
}
