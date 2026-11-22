// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.33;

import {Vm} from "forge-std/Vm.sol";
import {Test, console2} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SP1Verifier} from "@sp1-contracts/v6.1.0/SP1VerifierGroth16.sol";
import {ISP1Verifier} from "../src/verification/interfaces/ISP1Verifier.sol";
import {PrfVerifierRegistry} from "../src/core/PrfVerifierRegistry.sol";
import {PrfChainInstanceGenesis} from "../src/core/PrfChainInstanceGenesis.sol";
import {PrfStatementAdmission} from "../src/core/PrfStatementAdmission.sol";
import {SewGovernanceAuthorityAdapter} from "../src/integrations/sew/SewGovernanceAuthorityAdapter.sol";
import {SewConfigurationExecutor} from "../src/integrations/sew/SewConfigurationExecutor.sol";
import {PrfSourceBoundEntitlementVerifierAdapterV1 as Adapter} from "../src/verification/adapters/PrfSourceBoundEntitlementVerifierAdapterV1.sol";
import {SourceBoundEntitlementV1Commitments as Commitments} from "../src/verification/SourceBoundEntitlementV1Commitments.sol";
import {ProductionProRataAllocatorV2 as Allocator} from "../src/applications/pro-rata/ProductionProRataAllocatorV2.sol";
import {PublicPackedEntitlementRepresentationV1 as Representation} from "../src/applications/pro-rata/PublicPackedEntitlementRepresentationV1.sol";
import {OnchainShortfallReserveV2 as Reserve} from "../src/applications/shortfall/OnchainShortfallReserveV2.sol";
import {SourceBoundProRataControllerV2 as Prepared} from "../src/applications/shortfall/SourceBoundProRataControllerV2.sol";
import {SourceBoundProRataEntitlementAssuranceV1 as Assurance} from "../src/applications/shortfall/SourceBoundProRataEntitlementAssuranceV1.sol";
import {SourceBoundProRataEntitlementRatificationControllerV1 as Ratification} from "../src/applications/shortfall/SourceBoundProRataEntitlementRatificationControllerV1.sol";
import {IOnchainShortfallEntitlementReserveV1} from "../src/interfaces/IOnchainShortfallEntitlementReserveV1.sol";
import {IEntitlementRepresentationV1} from "../src/interfaces/IEntitlementRepresentationV1.sol";
import {IShortfallAllocatorV2} from "../src/interfaces/IShortfallAllocatorV2.sol";

contract PartialFillToken is ERC20 {
    constructor() ERC20("Controlled local units", "LOCAL") {}
    function mint(address to, uint256 value) external { _mint(to, value); }
}

/// Test-only single-operation dispatcher. No arbitrary-call or role-changing surface.
contract PartialFillOperator {
    address public immutable principal;
    bytes32 public immutable operation;
    Ratification public immutable controller;
    constructor(address who, bytes32 op, Ratification target) {
        require(block.chainid == 31337, "local only");
        principal = who; operation = op; controller = target;
    }
    modifier authorized() { require(msg.sender == principal, "unauthorized operator"); _; }
    function fund(bytes32 reserveRoot) external authorized { controller.ratifyAndFund(operation, reserveRoot, principal); }
    function activate(IEntitlementRepresentationV1 representation) external authorized { controller.activateEntitlement(operation, representation); }
    function replace(bytes32 oldRoot, bytes32 newRoot, uint64 generation, bytes32 receipt, bytes calldata values) external authorized {
        controller.replaceStaleAssurance(operation, oldRoot, newRoot, generation, receipt, values);
    }
}

/// Local EVM qualification, not public-chain transaction evidence.
/// Bootstrap/configuration/genesis export stages never admit a proof or move allocated capital.
contract PartialFillControlledTest is Test {
    string constant DIR = "test/fixtures/partial-fill/";
    string constant PROGRAM = "source-bound-entitlement-controlled-sp1-program.v1";
    bytes32 constant OP = keccak256("partial-fill-controlled-local.v1");
    bytes32 constant PROFILE = keccak256("immutable-address-v1");
    address constant ALICE = 0x1111111111111111111111111111111111111111;
    address constant BOB = 0x2222222222222222222222222222222222222222;
    address constant CAROL = 0x3333333333333333333333333333333333333333;
    uint256 stage;
    PartialFillToken token;
    Adapter adapter;
    SP1Verifier verifier;
    PrfVerifierRegistry registry;
    PrfChainInstanceGenesis genesis;
    SewGovernanceAuthorityAdapter authority;
    SewConfigurationExecutor executor;
    PrfStatementAdmission admission;
    Allocator allocator;
    Reserve reserve;
    Prepared prepared;
    Assurance assurance;
    Ratification ratification;
    PartialFillOperator operator;
    bytes32 registryRoot;
    bytes32 vkey;
    bytes32 elf;
    bytes32 configurationRoot;
    bytes32 sourceRoot;
    bytes32 preparedRoot;
    bytes32 reserveRoot;
    bytes32 verifierId;
    bool fundingTransferObserved;
    bool reserveDepositObserved;

    function setUp() public {
        vm.chainId(31337);
        stage = vm.envOr("PARTIAL_FILL_STAGE", uint256(0));
        string memory identity = vm.readFile(string.concat(DIR, "identity.json"));
        vkey = vm.parseJsonBytes32(identity, ".vkey");
        elf = vm.parseJsonBytes32(identity, ".elf_sha256");
        verifierId = keccak256(bytes(PROGRAM));
        token = new PartialFillToken();
        verifier = new SP1Verifier();
        adapter = new Adapter(ISP1Verifier(address(verifier)), vkey, elf);
        registry = new PrfVerifierRegistry(address(this));
        _registerVerifier();
        if (stage == 0) return;
        string memory config = vm.readFile(string.concat(DIR, "configuration.json"));
        configurationRoot = vm.parseJsonBytes32(config, ".configurationRoot");
        sourceRoot = vm.parseJsonBytes32(config, ".sourceRoot");
        bytes32 protocolRoot = vm.parseJsonBytes32(config, ".protocolRoot");
        bytes32 authorityRoot = vm.parseJsonBytes32(config, ".authorityRoot");
        authority = new SewGovernanceAuthorityAdapter(protocolRoot, address(this), authorityRoot);
        genesis = new PrfChainInstanceGenesis(protocolRoot, 31337, 31337, address(authority), authorityRoot, configurationRoot, address(this));
        if (stage == 1) return;
        string memory chain = vm.readFile(string.concat(DIR, "genesis.json"));
        genesis.sealGenesis(vm.parseJsonBytes32(chain, ".chainRoot"), address(genesis).codehash, address(authority).codehash);
        executor = new SewConfigurationExecutor(genesis, authority, registry, registryRoot);
        admission = new PrfStatementAdmission(genesis, executor, registry, configurationRoot, 0);
        allocator = new Allocator(address(this), executor);
        reserve = new Reserve(token, address(this), 10, allocator);
        prepared = new Prepared();
        assurance = new Assurance(admission, adapter, prepared, address(this));
        ratification = new Ratification(prepared, assurance, reserve);
        prepared.bindRatificationController(address(ratification));
        assurance.bindRatificationController(address(ratification));
        reserve.bindRatificationAuthority(address(ratification));
        allocator.bindFundingAuthority(address(reserve));
        operator = new PartialFillOperator(address(this), OP, ratification);
        ratification.bindExecutionCaller(address(operator));
        vm.recordLogs();
        token.mint(address(this), 80);
        token.approve(address(reserve), 80);
        reserve.deposit(80);
        Vm.Log[] memory fundingLogs = vm.getRecordedLogs();
        bytes32 transferTopic = keccak256("Transfer(address,address,uint256)");
        bytes32 depositTopic = keccak256("Deposited(address,uint256)");
        uint256 observedSponsorDeposit;
        for (uint256 i; i < fundingLogs.length; ++i) {
            Vm.Log memory entry = fundingLogs[i];
            if (entry.emitter == address(token) && entry.topics.length == 3 && entry.topics[0] == transferTopic) {
                address from = address(uint160(uint256(entry.topics[1])));
                address to = address(uint160(uint256(entry.topics[2])));
                uint256 amount = abi.decode(entry.data, (uint256));
                if (from == address(this) && to == address(reserve) && amount == 80) {
                    fundingTransferObserved = true;
                    observedSponsorDeposit = amount;
                }
            }
            if (entry.emitter == address(reserve) && entry.topics.length == 2 && entry.topics[0] == depositTopic) {
                address from = address(uint160(uint256(entry.topics[1])));
                uint256 amount = abi.decode(entry.data, (uint256));
                if (from == address(this) && amount == 80) reserveDepositObserved = true;
            }
        }
        assertTrue(fundingTransferObserved, "sponsor ERC20 transfer to reserve observed");
        assertTrue(reserveDepositObserved, "reserve deposit attribution observed");
        assertEq(observedSponsorDeposit, 80);
        Commitments.PreparedOperation memory p = _prepared();
        preparedRoot = prepared.prepareEntitlementOperation(p);
        reserveRoot = reserve.currentCommitment(preparedRoot);
    }

    function _registerVerifier() private {
        bytes32[] memory ids = new bytes32[](1); ids[0] = verifierId;
        address[] memory adapters = new address[](1); adapters[0] = address(adapter);
        bytes32[] memory keys = new bytes32[](1); keys[0] = vkey;
        bytes32[] memory elfs = new bytes32[](1); elfs[0] = elf;
        string[] memory programs = new string[](1); programs[0] = PROGRAM;
        bytes32[] memory schemas = new bytes32[](1); schemas[0] = adapter.statementSchemaVersion();
        bytes32[] memory publicSchemas = new bytes32[](1); publicSchemas[0] = adapter.publicValuesSchema();
        bool[] memory active = new bool[](1); active[0] = true;
        registryRoot = registry.computeCanonicalRoot(ids, adapters, keys, elfs, programs, schemas, publicSchemas, active);
        registry.registerVerifier(registryRoot, verifierId, address(adapter), vkey, elf, PROGRAM, schemas[0], publicSchemas[0]);
        registry.sealRegistry(registryRoot);
    }

    function _prepared() private view returns (Commitments.PreparedOperation memory) {
        return Commitments.PreparedOperation({operationId: OP, initiator: address(this), chainId: 31337,
            reserve: address(reserve), token: address(token), allocator: address(allocator),
            configurationRoot: configurationRoot, configurationEpoch: 0, sourceVerifierId: verifierId,
            executionVerifierId: verifierId, sourceProgramVKey: vkey, sourceProgramElfSha256: elf,
            sourceStatementSchema: adapter.statementSchemaVersion(), sourcePublicValuesSchema: adapter.publicValuesSchema(),
            executionStatementSchema: adapter.statementSchemaVersion(), executionPublicValuesSchema: adapter.publicValuesSchema(),
            policyRoot: sourceRoot, beneficiaryProfile: Commitments.BeneficiaryProfile.ImmutableAddressV1,
            residualRecipient: address(this)});
    }

    function test_ExportBootstrap() public {
        require(stage == 0);
        string memory obj = "bootstrap";
        vm.serializeAddress(obj, "governor", address(this));
        vm.serializeAddress(obj, "token", address(token));
        vm.serializeAddress(obj, "sourceAdapter", address(adapter));
        vm.serializeBytes32(obj, "adapterCodeHash", address(adapter).codehash);
        vm.serializeBytes32(obj, "verifierCodeHash", address(verifier).codehash);
        vm.serializeBytes32(obj, "registryCodeHash", address(registry).codehash);
        vm.serializeBytes32(obj, "registryRoot", registryRoot);
        vm.serializeBytes32(obj, "vkey", vkey);
        console2.log("PARTIAL_FILL_JSON", vm.serializeBytes32(obj, "elf", elf));
    }

    function test_ExportGenesis() public {
        require(stage == 1);
        string memory obj = "chain";
        vm.serializeAddress(obj, "genesis", address(genesis));
        vm.serializeAddress(obj, "authority", address(authority));
        vm.serializeBytes32(obj, "genesisCodeHash", address(genesis).codehash);
        console2.log("PARTIAL_FILL_JSON", vm.serializeBytes32(obj, "authorityCodeHash", address(authority).codehash));
    }

    function test_ExportWitness() public { require(stage == 2); _exportContext(); }
    function test_ExportRecoveryWitness() public { require(stage == 2); _changeReserve(); _exportContext(); }

    function _exportContext() private {
        Commitments.PreparedOperation memory p = _prepared();
        string memory obj = "prepared";
        vm.serializeBytes32(obj, "operation-id", OP);
        vm.serializeAddress(obj, "initiator", address(this));
        vm.serializeString(obj, "chain-id", "31337");
        vm.serializeAddress(obj, "reserve", address(reserve));
        vm.serializeAddress(obj, "token", address(token));
        vm.serializeAddress(obj, "allocator", address(allocator));
        vm.serializeBytes32(obj, "configuration-root", configurationRoot);
        vm.serializeString(obj, "configuration-epoch", "0");
        vm.serializeBytes32(obj, "source-verifier-id", verifierId);
        vm.serializeBytes32(obj, "execution-verifier-id", verifierId);
        vm.serializeBytes32(obj, "source-program-vkey", vkey);
        vm.serializeBytes32(obj, "source-program-elf-sha256", elf);
        vm.serializeBytes32(obj, "source-statement-schema", p.sourceStatementSchema);
        vm.serializeBytes32(obj, "source-public-values-schema", p.sourcePublicValuesSchema);
        vm.serializeBytes32(obj, "execution-statement-schema", p.executionStatementSchema);
        vm.serializeBytes32(obj, "execution-public-values-schema", p.executionPublicValuesSchema);
        vm.serializeBytes32(obj, "policy-root", sourceRoot);
        vm.serializeString(obj, "beneficiary-profile", "immutable-address-v1");
        string memory operation = vm.serializeAddress(obj, "residual-recipient", address(this));
        Reserve.EconomicState memory economics = reserve.economicState(preparedRoot);
        string memory stateObj = "economics";
        vm.serializeString(stateObj, "gross-balance", vm.toString(economics.grossBalance));
        vm.serializeString(stateObj, "reserved-before", vm.toString(economics.reservedBefore));
        vm.serializeString(stateObj, "protected-capital", "10");
        vm.serializeString(stateObj, "available-amount", vm.toString(economics.availableAmount));
        string memory economicsJson = vm.serializeString(stateObj, "availability-revision", vm.toString(economics.revision));
        console2.log("PARTIAL_FILL_JSON", string.concat('{"prepared-operation":',operation,',"economic-reserve-state":',economicsJson,'}'));
    }

    function _proof(string memory name) private view returns (bytes memory proof, bytes memory values) {
        string memory fixture = vm.readFile(string.concat(DIR, name));
        require(keccak256(bytes(vm.parseJsonString(fixture, ".program_id"))) == keccak256(bytes(PROGRAM)), "wrong program");
        require(vm.parseJsonBytes32(fixture, ".vkey") == vkey && vm.parseJsonBytes32(fixture, ".elf_sha256") == elf, "identity mismatch");
        require(keccak256(bytes(vm.parseJsonString(fixture, ".proof_system"))) == keccak256("groth16"), "Groth16 required");
        return (vm.parseJsonBytes(fixture, ".proof"), vm.parseJsonBytes(fixture, ".public_values"));
    }
    function _admit(string memory name) private returns (bytes32 receipt, bytes memory values) {
        bytes memory proof; (proof, values) = _proof(name);
        Adapter.SourceBoundEntitlementPublicValuesV1 memory pv = adapter.decodePublicValues(values);
        assertEq(pv.preparedOperationRoot, preparedRoot);
        assertEq(pv.entitlementTotal, 70); assertEq(pv.entitlementCount, 3);
        receipt = admission.admitStatement(verifierId, pv.allocationBindingRoot, proof, values);
        assertEq(admission.admissionReceipt(receipt).configurationRoot, configurationRoot);
        assertEq(admission.admissionReceipt(receipt).verifierRegistryRoot, registryRoot);
    }
    function _assure() private {
        (bytes32 receipt, bytes memory values) = _admit("proof.json");
        assurance.prepareSourceAssurance(OP, receipt, values);
        ratification.registerPrepared(OP);
    }
    function _fund() private { operator.fund(reserveRoot); }
    function _roots(string memory field) private view returns (bytes32[] memory) {
        string memory replay = vm.readFile(string.concat(DIR, "replay.json"));
        string[] memory strings = abi.decode(vm.parseJson(replay, field), (string[]));
        bytes32[] memory roots = new bytes32[](strings.length);
        for (uint256 i; i < strings.length; ++i) roots[i] = vm.parseBytes32(string.concat("0x", strings[i]));
        return roots;
    }
    function _activate() private {
        operator.activate(new Representation(_roots(".evm-entitlement-commitments"), 70));
    }
    function _path(bytes32[] memory leaves, uint256 index, bytes32 domain) private pure returns (bytes32[] memory path) {
        path = new bytes32[](2);
        path[0] = index == 0 ? leaves[1] : (index == 1 ? leaves[0] : leaves[2]);
        path[1] = index < 2 ? keccak256(abi.encodePacked(domain, leaves[2], leaves[2])) : keccak256(abi.encodePacked(domain, leaves[0], leaves[1]));
    }
    function _withdraw(uint256 index, uint256 amount) private {
        address beneficiary = index == 0 ? ALICE : (index == 1 ? BOB : CAROL);
        bytes memory claim = index == 0 ? bytes("claim-a") : (index == 1 ? bytes("claim-b") : bytes("claim-c"));
        bytes32 salt = bytes32(index == 0 ? uint256(0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) : (index == 1 ? uint256(0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb) : uint256(0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc)));
        vm.prank(beneficiary);
        allocator.withdraw(OP, Allocator.EntitlementOpening(index, claim, beneficiary, amount, salt),
            _path(_roots(".evm-entitlement-commitments"), index, keccak256("prf.source-bound-entitlement.table-node.v1")), true,
            _path(_roots(".allocation-claim-leaves"), index, keccak256("prf.source-bound-entitlement.claim-node.v1")), Allocator.ProofMode.Required);
    }
    function _digest() private view returns (bytes32) {
        return keccak256(abi.encode(token.balanceOf(address(reserve)), token.balanceOf(address(allocator)), token.balanceOf(ALICE), token.balanceOf(BOB), token.balanceOf(CAROL), prepared.state(OP), ratification.state(OP), allocator.entitlementOperation(OP).state, allocator.claimedAmount(OP), allocator.claimedCount(OP), allocator.outstandingLiability(OP), admission.admittedCount(), assurance.consumedAssurance(assurance.preparedAssurance(OP).receiptId), reserve.totalReserved(), reserve.availabilityRevision(), reserve.nextSnapshotId(), token.allowance(address(reserve),address(allocator))));
    }
    function _allocatorStateLabel(IShortfallAllocatorV2.State value) private pure returns (string memory) {
        if (value == IShortfallAllocatorV2.State.None) return "None";
        if (value == IShortfallAllocatorV2.State.Created) return "Created";
        if (value == IShortfallAllocatorV2.State.Funded) return "Funded";
        if (value == IShortfallAllocatorV2.State.Activated) return "Activated";
        if (value == IShortfallAllocatorV2.State.Claims) return "Claims";
        if (value == IShortfallAllocatorV2.State.Closed) return "Closed";
        return "Cancelled";
    }

    function _ratificationStateLabel(Ratification.State value) private pure returns (string memory) {
        if (value == Ratification.State.None) return "None";
        if (value == Ratification.State.Prepared) return "Prepared";
        if (value == Ratification.State.Ratifying) return "Ratifying";
        if (value == Ratification.State.Funded) return "Funded";
        if (value == Ratification.State.Activated) return "Activated";
        return "CancelledRefunded";
    }

    /// @dev Emit live custody and liability reads after each protocol call boundary.
    function _captureAccountingState(string memory label) private {
        IShortfallAllocatorV2.State state = allocator.entitlementOperation(OP).state;
        uint256 reserveBalance = token.balanceOf(address(reserve));
        uint256 allocatorBalance = token.balanceOf(address(allocator));
        uint256 aliceBalance = token.balanceOf(ALICE);
        uint256 bobBalance = token.balanceOf(BOB);
        uint256 carolBalance = token.balanceOf(CAROL);
        uint256 paid = aliceBalance + bobBalance + carolBalance;
        uint256 protectedAmount = reserve.protectedCapital();
        uint256 reserved = reserve.totalReserved();
        uint256 activated = state == IShortfallAllocatorV2.State.Activated
            || state == IShortfallAllocatorV2.State.Claims || state == IShortfallAllocatorV2.State.Closed
            ? allocator.entitlementOperation(OP).entitlementTotal : 0;
        uint256 remaining = allocator.outstandingLiability(OP);
        uint256 totalCustody = reserveBalance + allocatorBalance + paid;
        assertEq(totalCustody, 80, "custody conservation at protocol call boundary");
        assertEq(allocator.claimedAmount(OP), paid, "claim counter matches beneficiary balances");
        if (activated > 0) assertEq(activated, paid + remaining, "activated liability reconciles at protocol call boundary");
        else assertEq(remaining, 0, "no liability before activation");
        assertGe(reserveBalance, protectedAmount + reserved, "reserve covers protected and reserved capital");

        string memory obj = string.concat("partial-fill-accounting-", label);
        vm.serializeString(obj, "stage", label);
        vm.serializeString(obj, "boundary", "after local EVM contract call");
        vm.serializeBytes32(obj, "operationId", OP);
        vm.serializeUint(obj, "requested", 100);
        vm.serializeUint(obj, "allocated", 70);
        vm.serializeUint(obj, "unmetRequest", 30);
        vm.serializeUint(obj, "reserveBalance", reserveBalance);
        vm.serializeUint(obj, "protectedCapital", protectedAmount);
        vm.serializeUint(obj, "reservedCapital", reserved);
        vm.serializeUint(obj, "uncommittedReserve", reserveBalance - protectedAmount - reserved);
        vm.serializeUint(obj, "allocatorBalance", allocatorBalance);
        vm.serializeUint(obj, "aliceBalance", aliceBalance);
        vm.serializeUint(obj, "bobBalance", bobBalance);
        vm.serializeUint(obj, "carolBalance", carolBalance);
        vm.serializeUint(obj, "paid", paid);
        vm.serializeUint(obj, "fundedEntitlement", allocator.entitlementOperation(OP).amount);
        vm.serializeUint(obj, "activatedLiability", activated);
        vm.serializeUint(obj, "remainingLiability", remaining);
        vm.serializeUint(obj, "claimedCount", allocator.claimedCount(OP));
        vm.serializeUint(obj, "totalCustody", totalCustody);
        vm.serializeString(obj, "allocatorState", _allocatorStateLabel(state));
        string memory json = vm.serializeString(obj, "ratificationState", _ratificationStateLabel(ratification.state(OP)));
        console2.log("PARTIAL_FILL_ACCOUNTING_STATE_JSON", json);
    }

    function _emitProtectedCapitalPolicyEvidence() private {
        bytes32 purpose = keccak256(bytes("Restricted refundable sponsor capital; excluded from claimant entitlements, protocol income, fees, and available allocation capital."));
        bytes32 terminal = keccak256(bytes("Only after the scoped allocator is closed, all claimant liability is zero, all reserve holds are resolved, and the reserve can be finalized with exact protected balance."));
        bytes32 root = keccak256(abi.encode(
            keccak256("eae.protected-sponsor-capital-policy.v1"), uint16(1), block.chainid,
            address(reserve), address(token), OP, address(this), CAROL, uint256(10), purpose,
            address(ratification), terminal
        ));
        string memory obj = "protected-capital-policy";
        vm.serializeString(obj, "schema", "eae.protected-sponsor-capital-policy.v1");
        vm.serializeUint(obj, "version", 1);
        vm.serializeUint(obj, "chainId", block.chainid);
        vm.serializeAddress(obj, "reserve", address(reserve));
        vm.serializeAddress(obj, "token", address(token));
        vm.serializeBytes32(obj, "operationId", OP);
        vm.serializeAddress(obj, "sponsorAndFundingSource", address(this));
        vm.serializeAddress(obj, "beneficialOwner", CAROL);
        vm.serializeAddress(obj, "refundBeneficiary", CAROL);
        vm.serializeUint(obj, "restrictedAmount", 10);
        vm.serializeString(obj, "permittedPurpose", "Restricted refundable sponsor capital; excluded from claimant entitlements, protocol income, fees, and available allocation capital.");
        vm.serializeAddress(obj, "releaseAuthority", address(ratification));
        vm.serializeString(obj, "releaseAuthorityRole", "Ratification controller may authorize terminal finalization; it is not the beneficial owner.");
        vm.serializeString(obj, "terminalConditions", "Scoped allocator Closed; claimant liability zero; no active reserve reservations; exact protected balance remains; reserve terminally finalized.");
        vm.serializeString(obj, "enforcementStatus", "Declared fixture policy only; current frozen reserve V2 has no policy-binding or protected-capital release entry point.");
        string memory policyJson = vm.serializeBytes32(obj, "policyRoot", root);
        console2.log("PARTIAL_FILL_PROTECTED_CAPITAL_POLICY_JSON", policyJson);

        string memory fundingObj = "protected-capital-funding-attribution";
        vm.serializeString(fundingObj, "scope", "Observed local test-token funding attribution; no offchain asset provenance.");
        vm.serializeAddress(fundingObj, "sponsor", address(this));
        vm.serializeAddress(fundingObj, "reserve", address(reserve));
        vm.serializeAddress(fundingObj, "token", address(token));
        vm.serializeUint(fundingObj, "sponsorMintedByFixture", 80);
        vm.serializeUint(fundingObj, "sponsorTransferredToReserve", 80);
        vm.serializeUint(fundingObj, "restrictedForCarolByPolicy", 10);
        vm.serializeBool(fundingObj, "erc20TransferObserved", fundingTransferObserved);
        string memory fundingJson = vm.serializeBool(fundingObj, "reserveDepositEventObserved", reserveDepositObserved);
        console2.log("PARTIAL_FILL_FUNDING_ATTRIBUTION_JSON", fundingJson);
    }

    function _requireQualificationStage() private view {
        require(stage == 2, "PARTIAL_FILL_STAGE must be 2 for qualification/rejection tests");
    }

    function test_QualificationWithdrawsAndClosesExactly() public {
        _requireQualificationStage();
        assertTrue(fundingTransferObserved && reserveDepositObserved);
        _emitProtectedCapitalPolicyEvidence();
        assertEq(token.balanceOf(address(reserve)),80); assertEq(token.balanceOf(address(allocator)),0);
        assertEq(token.balanceOf(ALICE),0); assertEq(token.balanceOf(BOB),0); assertEq(token.balanceOf(CAROL),0);
        vm.recordLogs();
        _captureAccountingState("prepared");
        _assure(); _captureAccountingState("proofAdmitted");
        _fund(); assertEq(token.balanceOf(address(reserve)), 10); assertEq(token.balanceOf(address(allocator)), 70);
        _captureAccountingState("funded");
        _activate(); assertEq(allocator.outstandingLiability(OP), 70);
        _captureAccountingState("activated");
        _withdraw(0,35); assertEq(allocator.outstandingLiability(OP), 35);
        _captureAccountingState("afterAlice");
        _withdraw(1,21); assertEq(allocator.outstandingLiability(OP), 14);
        _captureAccountingState("afterBob");
        _withdraw(2,14); assertEq(allocator.outstandingLiability(OP), 0);
        _captureAccountingState("closed");
        assertEq(token.balanceOf(ALICE),35); assertEq(token.balanceOf(BOB),21); assertEq(token.balanceOf(CAROL),14);
        assertEq(token.balanceOf(address(allocator)),0); assertEq(token.balanceOf(address(reserve)),10);
        assertEq(allocator.claimedAmount(OP),70); assertEq(allocator.claimedCount(OP),3);
        assertEq(uint8(allocator.entitlementOperation(OP).state),uint8(IShortfallAllocatorV2.State.Closed));
        Vm.Log[] memory recorded=vm.getRecordedLogs();
        string memory transfers="["; uint256 count;
        for(uint256 i; i<recorded.length; ++i) {
            if(recorded[i].emitter!=address(token) || recorded[i].topics.length!=3 || recorded[i].topics[0]!=keccak256("Transfer(address,address,uint256)")) continue;
            address from=address(uint160(uint256(recorded[i].topics[1])));
            address to=address(uint160(uint256(recorded[i].topics[2])));
            uint256 value=abi.decode(recorded[i].data,(uint256));
            transfers=string.concat(transfers,count==0?"":",",'{"token":"',vm.toString(address(token)),'","from":"',vm.toString(from),'","to":"',vm.toString(to),'","amount":',vm.toString(value),'}');
            ++count;
        }
        assertEq(count,4);
        console2.log("PARTIAL_FILL_TRANSFERS_JSON",string.concat(transfers,"]"));
        console2.log("PARTIAL_FILL_FINAL_JSON", '{"requested":100,"allocated":70,"funded":70,"withdrawn":[35,21,14],"unmetRequests":[15,9,6],"deferred":0,"haircut":0,"remainingFundedLiability":0,"allocatorBalance":0,"protectedReserveBalance":10,"operation":"Closed","scope":"local Foundry EVM execution; no public-chain transaction"}');
    }
    function test_RejectProofPublicValueSubstitution() public {
        _requireQualificationStage();
        (bytes memory proof, bytes memory values) = _proof("proof.json");
        bytes32 statementRoot = adapter.decodePublicValues(values).allocationBindingRoot;
        for (uint256 i=1; i<9; ++i) {
            bytes memory altered = abi.encodePacked(values);
            assembly ("memory-safe") { mstore(add(add(altered,32),mul(i,32)), 0xBAD) }
            bytes32 before = _digest(); vm.expectRevert(); admission.admitStatement(verifierId,statementRoot,proof,altered); assertEq(_digest(),before);
        }
    }
    function test_RejectUnauthorizedAndRouteBypass() public {
        _requireQualificationStage();
        _assure(); bytes32 before = _digest();
        vm.prank(address(0xBAD)); vm.expectRevert(); operator.fund(reserveRoot); assertEq(_digest(),before);
        vm.expectRevert(); ratification.ratifyAndFund(OP,reserveRoot,address(this)); assertEq(_digest(),before);
        vm.expectRevert(); allocator.fundEntitlement(OP); assertEq(_digest(),before);
    }
    function test_RejectRatificationAndFundingReplay() public {
        _requireQualificationStage();
        _assure(); _fund(); bytes32 before=_digest(); vm.expectRevert(); _fund(); assertEq(_digest(),before);
        vm.expectRevert(); allocator.fundEntitlement(OP); assertEq(_digest(),before);
    }
    function test_RejectProofForAnotherOperationAndPolicyMutation() public {
        _requireQualificationStage();
        (bytes32 receipt, bytes memory values)=_admit("proof.json");
        Commitments.PreparedOperation memory changed = _prepared();
        changed.policyRoot = keccak256("unauthorized-policy-change");
        bytes32 before=_digest(); vm.expectRevert(); prepared.prepareEntitlementOperation(changed); assertEq(_digest(),before);
        changed=_prepared(); changed.operationId=keccak256("other-operation");
        prepared.prepareEntitlementOperation(changed);
        before=_digest(); vm.expectRevert(); assurance.prepareSourceAssurance(changed.operationId,receipt,values); assertEq(_digest(),before);
        assertEq(uint8(assurance.preparedAssurance(changed.operationId).state),uint8(Assurance.State.None));
    }
    function test_RejectOverWithdrawalAndDuplicateConsumption() public {
        _requireQualificationStage();
        _assure(); _fund(); _activate(); bytes32 before=_digest(); vm.expectRevert(); _withdraw(0,40); assertEq(_digest(),before);
        _withdraw(0,35); before=_digest(); vm.expectRevert(); _withdraw(0,35); assertEq(_digest(),before);
    }
    function test_RejectCarolClaimIncludingProtectedSponsorCapital() public {
        _requireQualificationStage();
        _assure(); _fund(); _activate();
        bytes32 before = _digest();
        // Carol's 14-unit claim cannot be enlarged with her separately classified 10-unit sponsor refund.
        vm.expectRevert(); _withdraw(2,24); assertEq(_digest(),before);
        assertEq(reserve.protectedCapital(),10);
        assertEq(token.balanceOf(address(reserve)),10);
        _withdraw(2,14);
        assertEq(token.balanceOf(CAROL),14);
        assertEq(token.balanceOf(address(reserve)),10);
    }

    function test_FrozenV2HasNoTerminalProtectedRefundEntryPoint() public {
        _requireQualificationStage();
        _assure(); _fund(); _activate();
        _withdraw(0,35); _withdraw(1,21); _withdraw(2,14);
        assertEq(uint8(allocator.entitlementOperation(OP).state),uint8(IShortfallAllocatorV2.State.Closed));
        assertEq(allocator.outstandingLiability(OP),0);
        bytes32 before = _digest();
        (bool released,) = address(reserve).call(abi.encodeWithSignature("releaseProtectedCapital(address)",CAROL));
        assertFalse(released, "the immutable V2 protected amount has no release entry point");
        assertEq(_digest(),before);
        assertEq(reserve.protectedCapital(),10);
        assertEq(token.balanceOf(address(reserve)),10);
        assertEq(token.balanceOf(CAROL),14);
    }

    function test_RejectChangedAllocationRepresentation() public {
        _requireQualificationStage();
        _assure(); _fund();
        bytes32[] memory changed = _roots(".evm-entitlement-commitments");
        ( , bytes memory values)=_proof("proof.json");
        bytes32 binding=adapter.decodePublicValues(values).allocationBindingRoot;
        changed[0] = keccak256(abi.encode(keccak256("prf.source-bound-entitlement.commitment.v1"),binding,OP,uint256(0),
            keccak256(abi.encodePacked(bytes1(0x20),bytes1(0x07),bytes("claim-a"))),ALICE,uint256(40),PROFILE,
            bytes32(uint256(0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))));
        changed[1] = keccak256(abi.encode(keccak256("prf.source-bound-entitlement.commitment.v1"),binding,OP,uint256(1),
            keccak256(abi.encodePacked(bytes1(0x20),bytes1(0x07),bytes("claim-b"))),BOB,uint256(16),PROFILE,
            bytes32(uint256(0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))));
        // 40 + 16 + 14 still conserves 70, but violates the committed pro-rata distribution.
        Representation invalid = new Representation(changed,70);
        bytes32 before = _digest();
        vm.expectRevert(); operator.activate(invalid); assertEq(_digest(),before);
        _activate(); _withdraw(0,35); _withdraw(1,21); _withdraw(2,14);
        assertEq(allocator.outstandingLiability(OP),0);
    }
    function test_RejectFundingMoreThanCommittedCapital() public {
        _requireQualificationStage();
        _assure();
        ( ,bytes memory values)=_proof("proof.json");
        Adapter.SourceBoundEntitlementPublicValuesV1 memory pv=adapter.decodePublicValues(values);
        IOnchainShortfallEntitlementReserveV1.EntitlementRatificationRequest memory request = IOnchainShortfallEntitlementReserveV1.EntitlementRatificationRequest({
            operationId: OP, preparedOperationRoot: preparedRoot, expectedReserveStateCommitment: reserveRoot,
            allocationBindingRoot: pv.allocationBindingRoot, descriptorRoot: pv.entitlementRepresentationDescriptorRoot,
            evmEntitlementTableRoot: pv.evmEntitlementTableRoot, entitlementCount:3, entitlementTotal:80,
            allocationClaimRoot: pv.allocationClaimRoot, beneficiaryProfileWord:PROFILE, residualRecipient:address(this)});
        bytes32 before=_digest();
        // Exercise the reserve's amount guard even under its configured authority.
        vm.prank(address(ratification)); vm.expectRevert(Reserve.InsufficientAvailability.selector);
        reserve.ratifyAndFundEntitlement(request); assertEq(_digest(),before);
    }
    function _changeReserve() private {
        token.mint(address(this),1); token.approve(address(reserve),1); reserve.deposit(1);
        reserve.reserveForOtherObligation(keccak256("separate-one-unit-obligation"),1,uint64(block.timestamp+1000));
    }
    function test_RejectStaleReserveThenRecoverWithFreshRealProof() public {
        _requireQualificationStage();
        _assure(); _changeReserve(); bytes32 before=_digest(); vm.expectRevert(); _fund(); assertEq(_digest(),before);
        (bytes32 receipt, bytes memory values)=_admit("recovery-proof.json");
        bytes32 oldRoot=assurance.assuranceCommitment(OP);
        bytes32 nextRoot=assurance.assuranceCommitmentFor(OP,receipt,keccak256(values),2);
        operator.replace(oldRoot,nextRoot,1,receipt,values);
        reserveRoot=reserve.currentCommitment(preparedRoot); _fund(); _activate();
        _withdraw(0,35); _withdraw(1,21); _withdraw(2,14);
        assertEq(allocator.outstandingLiability(OP),0); assertEq(token.balanceOf(address(reserve)),11);
        assertEq(reserve.totalReserved(),1);
    }
}
