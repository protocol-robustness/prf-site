# Protected Withdrawal V1 evidence bundle

This directory packages the exact deployment-bound Gate E artifacts and forensic records for the local Anvil run `gate-e-20261010-current-00d90`, along with a second successful replay from a fresh Anvil process.

Run the offline integrity and cross-link checks from any directory:

```sh
python3 evidence/protected-withdrawal-v1-portable/verify.py
```

The verifier checks artifact SHA-256 values, proof/public-value identity, deployment addresses, record hash links, and both runs' recorded funding/activation/withdrawal accounting. It makes no RPC calls and does not claim that unsigned RPC observations are chain proofs.

## Fresh local replay

`fresh-anvil-replay.json` records the successful fresh-process replay. A second operator should perform it from a disposable checkout/worktree of this revision, so Foundry's `broadcast/` and `cache/` output cannot overwrite retained artifacts. The commands below assume that checkout has its normal dependencies installed and are run from its root. They use only the standard public Anvil test key; no funded key or `.env` is needed.

```sh
set -euo pipefail
DATA=evidence/protected-withdrawal-v1-portable/fresh-anvil-replay.json
BUNDLE=evidence/protected-withdrawal-v1-portable/source-bound-entitlement-v1.json
PROOF=evidence/protected-withdrawal-v1-portable/proof-raw.json
ARTIFACTS="$(mktemp -d /tmp/prf-withdrawal-replay.XXXXXX)"
RPC=http://127.0.0.1:18547
PORT=18547 # choose another unused local port if needed

python3 evidence/protected-withdrawal-v1-portable/verify.py
anvil --host 127.0.0.1 --port "$PORT" --chain-id 31337 >"$ARTIFACTS/anvil.log" 2>&1 &
ANVIL_PID=$!
trap 'kill "$ANVIL_PID" 2>/dev/null || true' EXIT
until cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; do sleep 1; done
cast rpc anvil_setNonce 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0x4e --rpc-url "$RPC"

export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export GATE_E_RPC_URL="$RPC"
export GATE_E_PROTOCOL_GENESIS_ROOT="$(jq -r '.replay_setup.deployment_inputs.protocol_genesis_root' "$DATA")"
export GATE_E_AUTHORITY_STATE_ROOT="$(jq -r '.replay_setup.deployment_inputs.authority_state_root' "$DATA")"
export GATE_E_CHAIN_INSTANCE_GENESIS_ROOT="$(jq -r '.replay_setup.deployment_inputs.chain_instance_genesis_root' "$DATA")"
export GATE_E_CONFIGURATION_ROOT_0="$(jq -r '.replay_setup.deployment_inputs.configuration_root' "$DATA")"
export GATE_E_OPERATION_ID="$(jq -r '.replay_setup.deployment_inputs.operation_id' "$DATA")"
export GATE_E_POLICY_ROOT="$(jq -r '.replay_setup.deployment_inputs.policy_root' "$DATA")"
export GATE_E_RESERVE_BINDING_ROOT="$(jq -r '.replay_setup.deployment_inputs.reserve_binding_root' "$DATA")"
export GATE_E_SOURCE_PROGRAM_VKEY="$(jq -r '.replay_setup.deployment_inputs.source_program_vkey' "$DATA")"
export GATE_E_SOURCE_PROGRAM_ELF_SHA256="$(jq -r '.replay_setup.deployment_inputs.source_program_elf_sha256' "$DATA")"
export GATE_E_SOURCE_VERIFIER_ID="$(jq -r '.replay_setup.deployment_inputs.source_verifier_id' "$DATA")"
export GATE_E_EXECUTION_VERIFIER_ID="$(jq -r '.replay_setup.deployment_inputs.execution_verifier_id' "$DATA")"
export GATE_E_EXECUTION_STATEMENT_SCHEMA="$(jq -r '.replay_setup.deployment_inputs.execution_statement_schema' "$DATA")"
export GATE_E_EXECUTION_PUBLIC_VALUES_SCHEMA="$(jq -r '.replay_setup.deployment_inputs.execution_public_values_schema' "$DATA")"
export GATE_E_RESIDUAL_RECIPIENT="$(jq -r '.replay_setup.deployment_inputs.residual_recipient' "$DATA")"
export GATE_E_ENTITLEMENT_MANIFEST="$ARTIFACTS/manifest.json"
pnpm gate-e-entitlement:deploy
cmp "$GATE_E_ENTITLEMENT_MANIFEST" evidence/protected-withdrawal-v1-portable/manifest.json

export GATE_E_ENTITLEMENT_INPUT="$ARTIFACTS/witness.json"
bash scripts/prepare-gate-e-entitlement-witness.sh "$GATE_E_ENTITLEMENT_MANIFEST" "$BUNDLE" "$GATE_E_ENTITLEMENT_INPUT"
node scripts/adapt-gate-e-entitlement-fixture.mjs "$GATE_E_ENTITLEMENT_MANIFEST" "$BUNDLE" "$GATE_E_ENTITLEMENT_INPUT" "$PROOF" "$ARTIFACTS/fixture.json"
cmp "$GATE_E_ENTITLEMENT_INPUT" evidence/protected-withdrawal-v1-portable/witness.json
cmp "$ARTIFACTS/fixture.json" evidence/protected-withdrawal-v1-portable/gate-e-proof-fixture.json
export GATE_E_ENTITLEMENT_FIXTURE="$ARTIFACTS/fixture.json"

# Permit Foundry scripts/tests to read only this run's temporary artifacts.
sed "/fs_permissions = \[/a\\    { access = \"read\", path = \"$ARTIFACTS\" }," foundry.toml > "$ARTIFACTS/foundry.toml"
FOUNDRY=(--config-path "$ARTIFACTS/foundry.toml" --root "$PWD")
forge test "${FOUNDRY[@]}" --fork-url "$RPC" --match-contract GateEEntitlementDeploymentDerivedRealProofTest -vv
forge script "${FOUNDRY[@]}" script/RunGateEEntitlementLocal.s.sol:RunGateEEntitlementLocal --rpc-url "$RPC" --broadcast
forge script "${FOUNDRY[@]}" script/ActivateGateEEntitlementLocal.s.sol:ActivateGateEEntitlementLocal --rpc-url "$RPC" --broadcast
forge script "${FOUNDRY[@]}" script/WithdrawGateEEntitlementLocal.s.sol:WithdrawGateEEntitlementLocal --rpc-url "$RPC" --broadcast
printf 'replay artifacts: %s\n' "$ARTIFACTS"
```

The command block also compares the regenerated manifest, witness, and converted fixture byte-for-byte with the packaged artifacts. Compare the final on-chain state with `fresh-anvil-replay.json` and the packaged accounting records. The run should finish Closed with payouts 35/21/14, zero liability, zero allocator balance, and reserve balance 10. Preserve the printed artifact directory, Anvil log, and Foundry broadcasts when submitting replay evidence.

The replay reproduced the packaged manifest, witness, and converted proof fixture byte-for-byte. All 41 deployment/funding/activation/withdrawal transaction receipts succeeded. Final state was Closed with 3 claims and 70 units discharged, zero liability, zero allocator token balance, reserve/protected capital of 10, and beneficiary balances 35/21/14. The replay report retains the transaction hashes and final block observation.

## Scope and limits

This is a portable, hash-checked evidence package. It preserves the B2 vector bundle, raw proof input, manifest, raw deployment-bound witness, Groth16 fixture, original and fresh deployment/funding/activation/withdrawal broadcast files, forensic records, and execution DAGs. The proof fixture contains the proof bytes and the exact 288-byte public values.

The fresh local replay succeeded in this environment. A second, independent operator has not yet repeated it. Level 3 independent network execution remains open; these runs used chain ID 31337.

The preserved forensic limitations include unsigned RPC observations, block-level balance snapshots, and replay rejections observed with `eth_call` rather than mined failed transactions. The withdrawal record's execution evidence is not a canonical economic identity.

No private key, `.env` file, prover runtime path, or local cache is included.
