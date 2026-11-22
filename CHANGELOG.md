# Changelog

## Unreleased

- Added `lib/site-links.ts` as the single source of truth for published and executable notebook links, and a `/notebooks` index of the published exports; the nav "Notebooks" entry now points there instead of a deferred `/lab` path.
- Added `pnpm verify:links` (`scripts/verify-export-links.mjs`), which crawls `out/` and resolves every internal link and anchor; `--require-deferred` also requires composed `/lab` and `/cleanroom` links.
- CI and deploy now run `pnpm verify:flagship` before the build and `pnpm verify:flagship --export` plus the link check after it; deploy requires composed publication links to resolve whenever `out/lab` or `out/cleanroom` are present.
- Added a favicon, `robots.txt` and `sitemap.xml`; absolute-URL metadata is emitted only when `NEXT_PUBLIC_SITE_URL` is set at build time.
- Removed unnecessary `suppressHydrationWarning`, added a screen-reader "opens in a new tab" affordance to `ExtLink`, and added `:focus-visible` styles to the nav and brand links.

- Added a separately identified Pro-Rata V2 allocator-mismatch Foundry case to the Protected Transfer replay; the UI distinguishes that unit test from the proof-backed operation and keeps caller-selected destination substitution marked as untested.

- Added a deterministic shortfall forensic dossier and `pnpm verify:shortfall-evidence`; the report reconstructs local custody and liability transitions, exposes provenance/authority/source-build bindings, and records unqualified recovery, scale and external-authentication gaps.

- Economic ledger rows now bind deterministic report-record digests to state and transfer artifact hashes. Added trusted publication-pin verification and a whole-bundle re-pinning adversarial test; report digests are not PRF canonical identities.
- Added a deployed-dependency explorer for all ten recorded local contract identities, source-defined dependency bindings and explicit inventory gaps. Publication validation now matches runtime/address pairs to the pinned execution log and prepared operation, and checks the exported inventory.

- Evidence and forensic checkpoints now accompany the shortfall source, calculation, every execution stage, each withdrawal, terminal reconciliation and component provenance. The exported-publication gate requires the complete eight-stage evidence trail.

- The home page now leads to the complete controlled-shortfall settlement demo, with Required withdrawals, a retained custody timeline, adversarial results, evidence inspection, linked component references and notebook reproduction. Local execution and separate companion fixtures remain explicit.
- Added `pnpm verify:flagship` to check pinned publication/proof identities and notebook availability; `pnpm verify:flagship --export` also checks the flagship, home and demo-index static links and anchors. This checks publication integrity, not new proof or chain verification.
- Replaced the illustrative Protected Transfer preview with an evidence-checked local replay of the dedicated 70-unit successor-entitlement operation. The view now links its retained deployment, Groth16, funding, activation and withdrawal records and identifies unsupported claims explicitly.

