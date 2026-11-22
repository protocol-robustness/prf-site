# Composed Pro-Rata V2 settlement evidence

This fixture composes the existing `ProductionProRataAllocatorV2`, operation-preparation V2 path, source-bound assurance/admission, and `OnchainShortfallReserveV3`. The proof profile and public-values schema are explicitly **V1** (`source-bound-entitlement-controlled-sp1-program.v1` and `prf/source-bound-entitlement-public-values.v1`). It is a local EVM qualification, not public-chain execution.

## Qualified path

The retained witness commits Alice 50, Bob 30, Carol 20 (100 total) and 70 available units under the controlled pro-rata policy. The real SP1 Groth16 proof is tied to the operation, prepared-operation root, source root, reserve snapshot, entitlement roots, verifier identity and configuration. Its source witness hash matches the retained input; the Clojure and Rust replay projections match each other and the EVM fixture. The Foundry test admits the proof through the configured registry and admission gate, then uses the existing ratification controller/AO execution caller to fund 70 units.

The controlled local token reserve receives 80 units. Ten are restricted sponsor capital recorded for refund to Carol under the fixture policy; 70 are available and funded into the allocator. Claims are activated at 35, 21 and 14. The test records intermediate liabilities of 70, 35 and 14, then zero after the third claim. The allocator reaches `Closed`; separately, the reserve finalizes and refunds the protected 10 to its recorded Carol address. This terminal path is implemented by the existing V3 reserve lifecycle; the demonstration does not route around the AO adapter.

The request and policy source is fixture-authoritative for this test. It is not an authenticated real-world request set. The restricted-capital attribution is declared by fixture policy and enforced locally; external beneficial ownership is not established.

## Reproduce and validate

Use Foundry with Solidity 0.8.33, the dependency revisions listed in `manifest.json`, and the ordinary checked-out project submodules. Then run from the repository root:

```sh
PARTIAL_FILL_STAGE=2 forge test --offline \
  --match-path test/PartialFillV3Controlled.t.sol \
  --match-test test_QualificationWithdrawsAndClosesExactly -vv

PARTIAL_FILL_STAGE=2 forge test --offline \
  --match-path test/PartialFillV3Controlled.t.sol \
  --match-test 'test_(RejectUnauthorizedRecipientSubstitution|RejectProofForAnotherOperationAndPolicyMutation|RejectChangedAllocationRepresentation|RejectOverWithdrawalAndDuplicateConsumption|RejectUnauthorizedAndRouteBypass|RejectRatificationAndFundingReplay|RejectProofPublicValueSubstitution|RejectStaleReserveWithoutChangingState|RejectFundingMoreThanCommittedCapital|RejectUnauthorizedAndPrematureProtectedFinalization|RecoveryWithFreshV3Proof)' -vv

PARTIAL_FILL_STAGE=2 forge test --offline \
  --match-path test/PartialFillV3Controlled.t.sol \
  --match-test 'test_(ExportWitness|ExportRecoveryWitness|Qualification|Reject|Recovery)' -vv

python3 scripts/verify-composed-pro-rata-v2.py
```

The first command is the composed positive path. The second runs ten negative cases plus the fresh-proof recovery after stale-reserve assurance. The third runs all 14 stage-2 export, positive, negative and recovery tests together. Recovery is a separate branch: it settles the same 70-unit claimant liability, but leaves an unrelated one-unit reserve hold and correctly does not finalize the reserve. `PARTIAL_FILL_STAGE=2` is required because stage 0 and stage 1 only export bootstrap/genesis identities and do not execute the proof path. The independent validator is read-only: it checks manifest file hashes, witness/proof identity, both language replays, reconstructed allocation, proof public values, logged contract identities, state transitions, custody/liability equations and observed token transfer events.

The `execution.log` and `adversarial-tests.log` were produced by these local Foundry commands. `accounting-states.json`, `transfers.json`, `accounting-journal.json` and `reconciliation.json` reuse the existing PRF V3 projections for this exact operation; the retained PRF evidence manifest is included and the validator checks its hashes against these copies. The journal is a deterministic event projection, not double-entry bookkeeping. State snapshots and token `Transfer` logs are emitted at Foundry call boundaries. They are **not separate mined transaction receipts** and do not include transaction hashes. They are suitable for a notebook fixture/replay view but must be labelled local execution observations.

## Qualification labels

- **Independently reproduced:** the retained witness is reduced by the Clojure and Rust paths; their replay projections match. The verifier checks request inputs and derives the 35/21/14 result from the stated pro-rata policy.
- **Cryptographically verified:** the retained SP1 Groth16 proof is verified by the real SP1 verifier in the local EVM test and admitted under the local registry/configuration. The proof identity is the V1 profile named above; the allocator/operation components are V2 and the reserve is V3.
- **Locally observed:** Foundry getter snapshots and ERC-20 transfer events show funding, intermediate liabilities, recipient amounts, allocator closure, exact restricted refund and reserve finalization.
- **Not established:** public-chain deployment or transactions, production authority, external truth/completeness of requests, external legal ownership of the restricted capital, separate mined receipt/block observations, or general behavior outside this fixture.

## Adversarial matrix

| Attempt | Test | Result |
|---|---|---|
| Substitute another source/policy root or source operation | `test_RejectProofForAnotherOperationAndPolicyMutation`, `test_RejectStaleReserveWithoutChangingState` | Rejected; state unchanged |
| Change proof public values | `test_RejectProofPublicValueSubstitution` | Rejected |
| Substitute an allocation that conserves 70 but changes recipient amounts | `test_RejectChangedAllocationRepresentation` | Rejected; valid 35/21/14 claims still close |
| Bypass the authorized operation route or use an unauthorized operator | `test_RejectUnauthorizedAndRouteBypass` | Rejected; state unchanged |
| Request funding above committed capital or replay funding | `test_RejectFundingMoreThanCommittedCapital`, `test_RejectRatificationAndFundingReplay` | Rejected; state unchanged |
| Withdraw above entitlement or withdraw twice | `test_RejectOverWithdrawalAndDuplicateConsumption` | Rejected; state unchanged |
| Substitute a different payout recipient | `test_RejectUnauthorizedRecipientSubstitution` | Rejected; entitlement destination remains committed |
| Refresh stale reserve assurance with current V3 proof | `test_RecoveryWithFreshV3Proof` | Claims recover and close; separate one-unit reserve hold correctly blocks terminal reserve finalization |
| Finalize before all obligations are resolved or replay finalization | `test_RejectUnauthorizedAndPrematureProtectedFinalization` | Rejected; state unchanged |

Withdrawal itself is permissionless: any caller may trigger it, but the proof-bound beneficiary is the only payout destination. The negative case therefore tests recipient substitution, the actual protected boundary, rather than treating caller identity as a requirement.

## Notebook-ready data and visual description

The retained `validation-result.json` and validator output provide a stable notebook interface: `inputs`, `calculatedAllocations`, `localObservedWithdrawals`, `intermediateLiabilities`, `stateProjections`, `transferObservations`, `reconciliation`, `deployedContractIdentities`, `terminal`, `negativeTestsPassed`, `evidenceClasses`, and `limitations`. Source, proof, replay and root data are in the adjacent fixture files.

For a future notebook or site, use these elements in this order:

1. **Shortfall panel:** three neutral input rows for Alice 50, Bob 30 and Carol 20; a proportional horizontal bar with 70 teal units available and 30 amber units unmet; a separate neutral/amber chip for 10 restricted reserve units. Label 30 as unmet request, not debt or loss.
2. **Allocation panel:** three rows with arrows from requested to calculated/funded entitlement to observed withdrawal: `50 → 35 → 35`, `30 → 21 → 21`, `20 → 14 → 14`. Use green checks only beside the independent replay match, admitted proof, and observed matching transfer. Show amounts as calculated, funded, then locally observed in distinct columns.
3. **Execution path:** left-to-right arrows `Source committed → Allocation calculated → Proof verified/admitted → Operation authorized → 70 funded → Entitlements activated → Withdrawals → Allocator Closed → Reserve finalized`. Green checks indicate the logged local pass; gray means not performed; amber marks fixture authority or public-chain qualification limits. Do not conflate allocator closure with reserve finalization.
4. **Accounting timeline:** selecting a stage highlights that stage’s retained balances and liability: `70 → 35 → 14 → 0` unpaid liability after activation and successive claims. Show reserve/allocator/recipient balances under it. Stage selection is an evidence viewer only and does not execute transactions or let visitors edit verified inputs.
5. **Evidence disclosure:** closed-by-default details expose witness/proof hashes, source and policy roots, operation ID, reserve snapshot, contract addresses/code hashes, verifier identity, raw replay and logs. Any hypothetical alternative branch must be labeled illustrative and must not share a verified color or status.

Status and color meanings must also be written in adjacent text: teal/green plus a check = a specific passed verification or observed successful movement; amber plus warning = limitation or unresolved authority scope; gray = inactive/not run; red plus cross = a demonstrated rejection. Arrows indicate causal execution order, not public-chain chronology. No future visual should label a computed allocation as a payment before the transfer observation supports it.
