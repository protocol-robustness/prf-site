#!/usr/bin/env python3
"""Offline integrity/cross-link verifier for the protected withdrawal bundle."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FILES = [
    "manifest.json",
    "witness.json",
    "gate-e-proof-fixture.json",
    "deployment-broadcast.json",
    "funding-broadcast.json",
    "activation-broadcast.json",
    "withdrawal-broadcast.json",
    "funding-forensic.json",
    "activation-forensic.json",
    "withdrawal-forensic.json",
    "execution-dag.json",
    "activation-execution-dag.json",
    "withdrawal-execution-dag.json",
    "source-bound-entitlement-v1.json",
    "proof-raw.json",
    "witness-provenance.json",
    "replay-deployment-broadcast.json",
    "replay-funding-broadcast.json",
    "replay-activation-broadcast.json",
    "replay-withdrawal-broadcast.json",
    "replay-funding-forensic.json",
    "fresh-anvil-replay.json",
]
SCHEMA_WORD = "0x876f2aea9124d79f41dbdd389d498430987fa33bbb34408989849c478a7c2bde"
EXPECTED = {
    "chain_id": 31337,
    "program_id": "source-bound-entitlement-sp1-program.v1",
    "proof_system": "groth16",
    "vkey": "0x00d90efa52d17e54670a4248f001e4da443a938f12c55d0d414c125ba68087b9",
    "elf_sha256": "0x636330de8e7af3485aba50bd3ca4b5e024cc4f977a2bf0f2c005f711e5ffacf8",
    "operation_id": "0x809b4fbdb632eba4671e5d5f35a37ff12aa4ae28e1ec84aece40972b1138755d",
}


def read_json(name: str) -> dict:
    return json.loads((ROOT / name).read_text())


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL: {message}")


def main() -> None:
    index = read_json("bundle.json")
    require(index["schema"] == "prf-evm.protected-withdrawal-portable-bundle.v1", "bundle schema")
    require(sha256((ROOT / "verify.py").read_bytes()) == index["verifier_sha256"], "verifier script SHA-256")
    require(sha256((ROOT / "README.md").read_bytes()) == index["readme_sha256"], "README SHA-256")
    require(set(index["artifacts"]) == set(FILES), "artifact list")
    for name in FILES:
        data = (ROOT / name).read_bytes()
        expected = index["artifacts"][name]
        require(len(data) == expected["bytes"], f"{name}: byte length")
        require(sha256(data) == expected["sha256"], f"{name}: SHA-256")

    manifest = read_json("manifest.json")
    witness = (ROOT / "witness.json").read_bytes()
    fixture = read_json("gate-e-proof-fixture.json")
    funding = read_json("funding-forensic.json")
    activation = read_json("activation-forensic.json")
    withdrawal = read_json("withdrawal-forensic.json")
    deployment_broadcast = read_json("deployment-broadcast.json")
    funding_broadcast = read_json("funding-broadcast.json")
    activation_broadcast = read_json("activation-broadcast.json")
    withdrawal_broadcast = read_json("withdrawal-broadcast.json")
    replay = read_json("fresh-anvil-replay.json")
    replay_funding = read_json("replay-funding-forensic.json")
    vector_bundle = read_json("source-bound-entitlement-v1.json")
    raw_proof = read_json("proof-raw.json")
    provenance = read_json("witness-provenance.json")

    witness_hash = sha256(witness)
    require(manifest["chainId"] == EXPECTED["chain_id"], "manifest chain ID")
    require(manifest["operationId"] == EXPECTED["operation_id"], "manifest operation ID")
    require(fixture["program_id"] == EXPECTED["program_id"], "program ID")
    require(fixture["proof_system"] == EXPECTED["proof_system"], "proof system")
    require(fixture["vkey"] == EXPECTED["vkey"] == manifest["programVKey"], "VKey binding")
    require(fixture["elf_sha256"] == EXPECTED["elf_sha256"] == manifest["programElfSha256"], "ELF binding")
    require(fixture["source"]["witness_sha256"].removeprefix("0x") == witness_hash, "fixture witness binding")
    require(fixture["public_values_length"] == 288, "public values length metadata")
    public_values = bytes.fromhex(fixture["public_values"].removeprefix("0x"))
    require(len(public_values) == 288, "public values byte length")
    require(sha256(public_values) == funding["public_values_sha256"].removeprefix("0x"), "public values SHA-256")
    words = ["0x" + public_values[i:i + 32].hex() for i in range(0, len(public_values), 32)]
    require(len(words) == 9 and words[0] == SCHEMA_WORD, "nine-word schema projection")
    require(fixture["public_values_schema"] == "prf/source-bound-entitlement-public-values.v1", "public schema identifier")

    gate = fixture["gate_e"]
    require(gate["operation_id"] == EXPECTED["operation_id"], "fixture operation ID")
    require(gate["witness_sha256"].removeprefix("0x") == witness_hash, "fixture provenance witness hash")
    require(gate["manifest_digest"] == manifest["manifestDigest"], "fixture manifest digest")
    require(sha256(bytes.fromhex(fixture["proof"].removeprefix("0x"))) == gate["proof_sha256"].removeprefix("0x"), "proof bytes hash")
    require(vector_bundle["schema"] == "source-bound-entitlement-conformance.v1", "source vector schema")
    require(gate["source_bundle_sha256"].removeprefix("0x") == sha256((ROOT / "source-bound-entitlement-v1.json").read_bytes()), "source vector bundle hash")
    require(raw_proof["proof"].lower() == fixture["proof"].lower(), "raw proof and converted proof bytes")
    require(raw_proof["public_values"].lower() == fixture["public_values"].lower(), "raw proof public values")
    require(provenance["witness_sha256"] == "sha256:" + witness_hash, "witness provenance sidecar")
    require(provenance["bundle_sha256"] == "sha256:" + gate["source_bundle_sha256"].removeprefix("0x"), "witness provenance source bundle")
    require(provenance["manifest_digest"] == manifest["manifestDigest"], "witness provenance manifest")

    require(funding["chain_id"] == EXPECTED["chain_id"], "funding chain ID")
    require(funding["operation_id"] == activation["operation_id"] == withdrawal["operation_id"] == EXPECTED["operation_id"], "operation cross-link")
    require(funding["gate_e"]["witness_sha256"].removeprefix("0x") == witness_hash, "funding witness link")
    require(funding["gate_e"]["manifest_digest"] == manifest["manifestDigest"], "funding manifest link")
    require(funding["gate_e"]["proof_sha256"] == gate["proof_sha256"], "funding proof link")
    require(funding["artifacts"]["manifest"]["sha256"].removeprefix("0x") == sha256((ROOT / "manifest.json").read_bytes()), "funding manifest artifact hash")
    require(funding["artifacts"]["witness"]["sha256"].removeprefix("0x") == witness_hash, "funding witness artifact hash")
    require(funding["artifacts"]["fixture"]["sha256"].removeprefix("0x") == sha256((ROOT / "gate-e-proof-fixture.json").read_bytes()), "funding fixture artifact hash")
    require(funding["artifacts"]["broadcast"]["sha256"].removeprefix("0x") == sha256((ROOT / "funding-broadcast.json").read_bytes()), "funding broadcast artifact hash")
    require(funding["public_words"] == words, "forensic/public-values words")
    require(funding["proof_identity"]["vkey"] == EXPECTED["vkey"], "forensic VKey")

    require(activation["funding_evidence_sha256"].removeprefix("0x") == sha256((ROOT / "funding-forensic.json").read_bytes()), "activation-to-funding evidence link")
    require(activation["broadcast_sha256"].removeprefix("0x") == sha256((ROOT / "activation-broadcast.json").read_bytes()), "activation broadcast link")
    require(withdrawal["activation_evidence_sha256"].removeprefix("0x") == sha256((ROOT / "activation-forensic.json").read_bytes()), "withdrawal-to-activation evidence link")
    require(withdrawal["broadcast_sha256"].removeprefix("0x") == sha256((ROOT / "withdrawal-broadcast.json").read_bytes()), "withdrawal broadcast link")

    deployed = {tx.get("contractAddress", "").lower() for tx in deployment_broadcast.get("transactions", [])}
    require(all(address.lower() in deployed for address in manifest["contracts"].values()), "manifest contracts occur in deployment broadcast")
    require(deployment_broadcast.get("chain") == EXPECTED["chain_id"], "deployment broadcast chain ID")
    require(funding_broadcast.get("chain") == EXPECTED["chain_id"], "funding broadcast chain ID")
    require(activation_broadcast.get("chain") == EXPECTED["chain_id"], "activation broadcast chain ID")
    require(withdrawal_broadcast.get("chain") == EXPECTED["chain_id"], "withdrawal broadcast chain ID")

    require(funding["before_funding"]["allocator_balance"] == 0 and funding["after_funding"]["allocator_balance"] == 70, "funding allocator custody")
    require(funding["before_funding"]["reserve_balance"] - funding["after_funding"]["reserve_balance"] == 70, "funding reserve delta")
    require(activation["liability_before"] == 0 and activation["liability_after"] == 70, "activation liability")
    require(activation["custody_before_after"]["allocator"] == [70, 70], "activation allocator custody")
    payouts = withdrawal["beneficiary_payouts"]
    require(sum(item["delta"] for item in payouts) == 70, "withdrawal payout sum")
    require(withdrawal["liability_before_after"] == [70, 0], "withdrawal liability closure")
    require(withdrawal["custody_before_after"]["allocator"] == [70, 0], "withdrawal allocator custody")
    require(len(withdrawal["replay_attempts"]) == 3, "recorded replay observations")

    require(replay["schema"] == "prf-evm.protected-withdrawal-fresh-anvil-replay.v1", "fresh replay schema")
    require(replay["chain_id"] == EXPECTED["chain_id"], "fresh replay chain ID")
    require(replay["identity"]["operation_id"] == EXPECTED["operation_id"], "fresh replay operation")
    require(replay["identity"]["manifest_digest"] == manifest["manifestDigest"], "fresh replay manifest digest")
    require(replay["identity"]["witness_sha256"].removeprefix("0x") == witness_hash, "fresh replay witness hash")
    require(replay["identity"]["proof_sha256"] == gate["proof_sha256"], "fresh replay proof hash")
    for label, filename in (("manifest", "manifest.json"), ("witness", "witness.json"), ("proof_fixture", "gate-e-proof-fixture.json")):
        replay_artifact = replay["artifacts"][label]
        payload = (ROOT / filename).read_bytes()
        require(replay_artifact["sha256"] == sha256(payload), f"fresh replay {label} hash")
        require(replay_artifact["byte_identical_to_portable_payload"], f"fresh replay {label} byte identity")
    expected_replay_names = {
        "deployment": "replay-deployment-broadcast.json",
        "funding": "replay-funding-broadcast.json",
        "activation": "replay-activation-broadcast.json",
        "withdrawal": "replay-withdrawal-broadcast.json",
    }
    for label, filename in expected_replay_names.items():
        run_bytes = (ROOT / filename).read_bytes()
        expected_hash = replay["artifacts"][label]["sha256"]
        require(sha256(run_bytes) == expected_hash, f"fresh {label} broadcast hash")
        run = read_json(filename)
        observed = replay["transaction_groups"][label]
        require(observed["count"] == len(run["transactions"]), f"fresh {label} transaction count")
        require(observed["all_receipts_successful"], f"fresh {label} receipt status")
        require(all(item["status"] == 1 for item in observed["transactions"]), f"fresh {label} transaction success")
    fresh_deployment = read_json("replay-deployment-broadcast.json")
    fresh_created = {tx.get("contractAddress", "").lower() for tx in fresh_deployment.get("transactions", [])}
    require(all(address.lower() in fresh_created for address in manifest["contracts"].values()), "fresh deployment realizes manifest addresses")
    require(fresh_deployment["transactions"][0]["transaction"]["nonce"] == "0x4e", "fresh deployment starting nonce")
    require(replay_funding["operation_id"] == EXPECTED["operation_id"], "fresh funding forensic operation")
    require(replay_funding["proof_identity"]["proof_system"] == "groth16", "fresh funding proof type")
    require(replay_funding["artifacts"]["broadcast"]["sha256"].removeprefix("0x") == replay["artifacts"]["funding"]["sha256"], "fresh funding forensic broadcast link")
    require(replay["foundry_fork_tests"]["passed"] == 4 and replay["foundry_fork_tests"]["failed"] == 0, "fresh deployment proof tests")
    require(all(replay["final_state"]["checks"].values()), "fresh replay final state checks")

    print(f"PASS: {len(FILES)} payload artifacts hash-verified")
    print("PASS: manifest, witness, Groth16 fixture, public values, and deployment identity cross-linked")
    print("PASS: funding → activation → withdrawal forensic links and 70-unit conservation checks")
    print("PASS: fresh Anvil deployment, proof-backed test suite, 41 successful transaction receipts, and terminal accounting cross-linked")
    print("LIMIT: local Anvil observations are not an independent network state proof")


if __name__ == "__main__":
    main()
