# Shortfall challenge comparison replay

This replay checks the retained local comparison and the current Challenge 001 candidate gate. It does not establish a novel finding or an accepted challenge.

From the PRF repository root, run:

```sh
clojure -M:test -e '(require (quote resolver-sim.research.shortfall-pilot-test) (quote clojure.test)) (let [result (clojure.test/run-tests (quote resolver-sim.research.shortfall-pilot-test))] (when (pos? (+ (:fail result) (:error result))) (System/exit 1)))'
```

The arithmetic test recomputes both allocator results from closed canonical inputs, checks result hashes and invariant violations, and reports the 12-unit maximum row difference. The current candidate-scope test also evaluates the pinned policy roots. In the inspected working copy it fails with `challenge-001-policy-root-mismatch`: the candidate roots do not match the current allocator roots. That failure is retained as a qualification boundary, not bypassed.

The compared requests share available capital (100), row identities, requests (100 each), caps, rounding policy and tie-break policy. Only the declared redistribution policy differs. The allocations are `[10, 33, 33]` (76 total) and `[10, 45, 45]` (100 total). Both computed result invariant sets are empty. The unallocated policy's residual field is policy-specific.

The test's allocation identifier is changed from the published calibration case solely to exercise the scope gate. Identifier renaming is not novel; this is not a novelty-qualified contribution. A successful challenge still requires a captured source revision, source-consistent policy roots, a materially distinct in-scope counterexample, and authorized review. Challenge 001 remains proposed and unauthorized.
