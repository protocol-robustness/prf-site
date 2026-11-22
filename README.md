# PRF Product Site

A static product/demo site for the Protocol Robustness Framework. It makes PRF
understandable to a newcomer — **Understand → Believe → Inspect → Verify** —
without ever letting the polished public story diverge from what the framework
actually computes.

This repo is standalone. The framework itself (Clojure), its executable demos,
and the screenshot/notebook generation pipeline live in the **prf main repo**;
this site consumes committed artifacts from it.

> **Scope notice:** This site is an explanatory demo, not an independent
> verifier, production qualification, or security audit. Displayed claims inherit
> the exact scope and limitations of their source artifacts; presentation does
> not add assurance beyond those artifacts.

## Architecture

```
            ONE EXECUTABLE TRUTH
                      |
                      v
                  PRF / Clojure          (prf main repo)
                      |
        +-------------+-------------+
        |                           |
        v                           v
  public-demo.v1 JSON          Clerk notebook
  (generated/demos/*.json)     (not_admitted — the deep evidence notebook)
        |                           |
        v                           v
  Product demo                Assurance / inspection
  Next.js App Router          (deep-link, not iframe)
        |                           |
        +-------------+-------------+
                      |
                      v
              same evidence
```

Three ownership rules:

- **PRF owns the result.** The frontend never recomputes protocol semantics.
  It renders the projected artifact.
- **The website owns the explanation.** Copy, layout and demo narrative live
  here and simplify what PRF proved — never strengthen it.
- **Clerk owns deep inspection.** The demo pages link out to the executable
  notebook; they do not embed it.

## Development commands

Prerequisites: Node 22+ and `pnpm@11.9.0` (`pnpm-lock.yaml` is the single
lockfile).

| Command                        | What it does                                    |
|--------------------------------|-------------------------------------------------|
| `pnpm install`                 | Install dependencies                            |
| `pnpm dev`                     | Local dev server                                |
| `pnpm build`                   | Static export to `out/`                         |
| `pnpm typecheck`               | TypeScript check without a full build           |
| `pnpm verify:demos`            | Validate the committed `public-demo.v1` artifacts |
| `pnpm verify:flagship`         | Check flagship publication/proof identities; add `--export` to also check exported links and anchors |
| `pnpm verify:links`            | Crawl `out/` and assert every internal link resolves (`--require-deferred` also requires composed `/lab`) |

## The demos

The site has three generated `public-demo.v1` stories plus local EVM settlement and cancellation-boundary
walkthroughs. Together they show allocation computation and aggregate checks, evidence admission, and
proof-bound custody behavior without requiring framework vocabulary:

| Demo                | Question                                        | Source / evidence | Shape |
|---------------------|-------------------------------------------------|--------------------------------|-------|
| Current Head        | Can a verified result be changed?               | `resubmission_chain` / custody verifier | narrative (baseline → change → outcome) |
| Liquidity Shortfall | $100 of requests vs $70 of liquidity?           | `pro-rata.allocation/allocate` | allocation (pool → per-request → conservation) |
| Reordered Evidence  | Does evidence order matter?                     | `reorder_chain` | narrative |
| Proof-Bound Pro-Rata Settlement | Can admitted entitlements settle or refund safely? | Gate E local evidence | proof → funding → activation → settlement/refund |
| Cancel or Activate? | What changes at the activation boundary? | Two Gate E local runs | pre-activation refund vs activated settlement |
| Proof-Bound Ratification | What must line up before capital moves? | Gate E run plus pinned conformance source | proof → assurance → ratification → funding |
| Entitlement Table Size | Where does one-shot deployment hit the byte ceiling? | Local Anvil deployment observations | 1,000/1,456 deployed; 1,457 rejected |

The three generated `public-demo.v1` pages import JSON from
`generated/demos/<id>.json`, run `assertPublicDemo` at build time
(`lib/validate-public-demo.ts`), and render framework-supplied facts exactly as
supplied. `/demos/pro-rata-settlement/` is a separate technical walkthrough of
retained local EVM forensic observations; it identifies its local-chain scope
and does not treat those observations as a canonical economic artifact. The cancellation-boundary page compares two separate runs and does not claim a same-operation race. The ratification page separates retained v1 run records from V2 source-level conformance assertions. The entitlement-size page reports local Anvil measurements only, not a Base/L2 production qualification.

## Generation flow

1. An executable PRF demo produces a result in the prf main repo.
2. Its projector copies presentation-safe facts into a `public-demo.v1`
   artifact and fails closed if required evidence is absent.
3. `bb demo:public-build` (prf repo) serialises the artifact deterministically
   into this repo as `generated/demos/<id>.json`; it is committed here.
4. `pnpm verify:demos` re-checks the committed artifacts independently of
   Next.js; `bb demo:public-check` (prf repo) fails on any drift between the
   committed JSON and fresh PRF output.

## Public demo evidence manifests

The stress, accounting, and research workflow pages publish a shared
`prf-demo-manifest.v1` JSON format under `public/evidence/manifests/`. Each
manifest identifies its subject and revision status, hashes the public inputs
and retained evidence, lists reproduction or verification commands, and records
expected outputs and scope limits. `git_revision` is left null when the source
revision was not retained; content hashes and run roots are reported separately
and never presented as a substitute for a source revision. The shared JSON
Schema is downloadable beside each manifest.

## public-demo.v1 compatibility policy

`public-demo.v1` is a real boundary, not an internal convenience. Three rules:

1. **Existing v1 fields retain their meaning.** Never reinterpret an existing
   field; consumers depend on current semantics.
2. **New optional fields may be additive.** Adding an optional explanatory or
   provenance field is allowed within v1.
3. **Meaning changes or structurally-different formerly-optional evidence
   require `public-demo.v2`.**

The version discriminator is the `schema` field; both producers and validators
assert the same value.

## Provenance and conservation (P0)

Every artifact carries a `source` block binding the page's facts to **one**
executable result (`result-root` == `evidence.committed-hash`, plus an
`input-root`). Validators enforce cross-field consistency: a rejected outcome
must be backed by exactly the failing evidence declared; liquidity totals and
conservation must reconcile. This makes it impossible for a projection bug to
splice individually-correct facts from different executions into one "valid"
page.

## The shots gallery (`/shots/`)

`public/shots/` holds the screenshot gallery generated by the prf repo's
screenshot pipeline (per-run archives, notebook galleries, explore pages). It
is **kept out of git** (see `.gitignore`) because of its size (~140MB).

Production serving does not go through the build at all: the gallery is
synced straight into the site's S3 bucket under `shots/` by
`infra/assurance-lab-terraform/scripts/publish_shots.sh`, so `/shots/*`
resolves on the distribution with no rebuild. All gallery HTML uses relative
links, so it works unchanged under any path prefix.

To test locally, either sync a copy into `public/shots/` before `pnpm build`,
or just browse against the published bucket.

## Notebook surfaces

The header links directly to **Notebooks** and **Cleanroom**. The notebook index
distinguishes three different surfaces:

- **Published notebooks (`/notebooks/`)** are deterministic static exports
  committed under `public/notebooks/`. `pnpm verify:flagship` checks that the
  pinned settlement export matches its publication pin.
- **Cleanroom notebook (`/cleanroom/notebooks/not_admitted/`)** is a committed
  Clerk export under `public/cleanroom/`. Its adjacent `SOURCE.md` records the
  source repository, revision and build command. Because it is part of `public/`,
  it is included in the site build and its navigation link is checked with the
  other internal links.
- **Executable notebooks (`/lab/notebooks/`)** are composed into `out/lab/`
  after `pnpm build` by the PRF repository. Demo “Inspect … notebook” links
  point there in production. Until that separate build is composed, those links
  are unavailable.

`pnpm verify:links` crawls `out/` and reports unresolved internal links;
`--require-deferred` additionally requires the externally composed `/lab/`
links. Deploy runs that strict form when `out/lab/` is present.

## Publication flow

The site exports fully statically (`output: 'export'`, trailing slashes,
unoptimized images). It is hosted on **AWS S3 + CloudFront**, provisioned by
Terraform in the `infra` repo (`assurance-lab-terraform/prf_site.tf`): a
private bucket behind an Origin Access Control, served on the default
`*.cloudfront.net` domain until a custom domain is added.

Workflows:

- `.github/workflows/ci.yml` runs on every PR: typecheck, demo-artifact
  verification (`pnpm verify:demos`), flagship publication identity
  (`pnpm verify:flagship`), the composed-evidence gate, a full static export
  build, then exported-link and flagship-anchor checks
  (`pnpm verify:flagship --export` and `pnpm verify:links`).
- `.github/workflows/deploy.yml` runs on push to `main`: the same checks, then
  syncs `out/` to S3 via GitHub OIDC (no long-lived keys) and invalidates
  CloudFront. Content-hashed assets and timestamped run screenshots are
  uploaded with immutable cache headers; HTML gets a short TTL. When the lab or
  clean-room trees are composed into `out/`, it requires their links to resolve
  before syncing.

Required repository variables (values come from the infra Terraform outputs):

| Variable | Meaning |
|----------|---------|
| `AWS_SITE_BUCKET` | target bucket (`terraform output site_bucket_name`) |
| `AWS_SITE_DISTRIBUTION_ID` | distribution to invalidate |
| `AWS_SITE_DEPLOY_ROLE_ARN` | OIDC deploy role (`site_deploy_role_arn`) |
| `AWS_REGION` | bucket region |

Absolute-URL metadata (canonical Open Graph image, `sitemap.xml`, the
`robots.txt` sitemap pointer) is emitted only when `NEXT_PUBLIC_SITE_URL` is set
at build time; without it those fields are omitted rather than pointed at a
placeholder origin. The favicon (`/prf-logo.png`) and `robots.txt` are always
emitted.

Screenshots are **not** part of this repo or its CI: publish them straight to
the site bucket with
`infra/assurance-lab-terraform/scripts/publish_shots.sh <shots-dir>` (syncs
under `shots/`, immutable cache for run archives, invalidates `/shots/*`).

The trailing-slash export is resolved by a viewer-request CloudFront Function
(`infra/assurance-lab-terraform/functions/prf_site_index.js`) — S3 does not do
directory-index resolution behind OAC. Manual deploys from a laptop:
`pnpm build` in this repo, then
`assurance-lab-terraform/scripts/publish_site.sh out`.

Not yet automated in CI: composing `out/lab/` (the executable Clerk notebook
build) after `pnpm build`. The deploy workflow warns when that tree is absent;
the published Cleanroom notebook is already included in the static export.

## Shortfall flagship

The home page leads to `/demos/composed-pro-rata-settlement/`. Pro-rata allocation,
Pro-Rata V2 contract composition and verifiable forensics are named explicitly. Its interactive
custody timeline, evidence questions and adversarial-case selector render the
retained projection for **one** controlled local operation. They do not submit
transactions, recompute allocation semantics or run cryptographic verification
in the browser. The exact 288-byte Groth16 fixture is linked from
`/evidence/partial-fill/v3-live-context/proof.json`; its digest must match the
composed manifest. The older partial-fill proof is a different artifact.

Required withdrawal behavior is demonstrated by the pinned contract test.
Requested mode is explained from the pinned source and is not presented as a
separately qualified mode matrix. Current library references are distinguished
from the historical fixture's pinned contract and compiler dependencies. No
external Solidity library-link deployment is claimed by this bundle.

Verify the presentation before publishing:

```sh
pnpm typecheck
pnpm verify:demos
pnpm verify:flagship
pnpm build
pnpm verify:flagship --export
```

`verify:flagship` checks publication integrity and exact identity cross-links.
For an independent reconstruction using the original PRF/prf-evm validator,
use a separate checkout at the revision in the publication pin:

```sh
PRF_EVM_ROOT=/path/to/pinned-prf-evm pnpm verify:composed-pro-rata-publication
```

The source validator and real local EVM/proof replay commands are retained in
`public/evidence/composed-pro-rata-v2-settlement/README.md`. The settlement
notebook consumes the same fixture. The slashing and yield notebooks are linked
as separate companion models. Evidence artifacts, notebook exports and their
publication pins are not rewritten by the flagship presentation.

Evidence accompanies the shortfall throughout: source and deployment checks
precede the calculation, every execution step links its supporting records,
each withdrawal connects claim/proof/transfer/post-state evidence, and every
selected custody stage identifies its forensic check, supported conclusion and
remaining limit. Closure and component provenance have their own visible
checkpoints. The forensic inspector revisits this same trail; it is not the
only place the demo presents evidence. `verify:flagship --export` requires
all eight execution steps to retain their direct evidence links and checks.

The deployed-dependency explorer presents all ten address/runtime pairs in the
validated local execution inventory. Connections distinguish constructor
bindings, sealed registry selection, configured authority and the prepared
asset; their descriptions come from pinned source, not newly queried storage.
The publication checker matches all ten pairs to the unique identity observation
in the hash-pinned execution log, checks chain and program/configuration context,
and matches reserve/token/allocator addresses to the prepared witness. Export
checks compare the rendered inventory with those same observations.

The genesis, authority adapter, configuration executor, operation dispatcher and
packed representation remain explicitly outside this inventory's complete
address/runtime coverage. This historical fixture creates infrastructure
locally; it does not demonstrate consumption of an admitted infrastructure
release, current RPC code verification or public-network deployment. Source
library references are separate from the deployed-instance explorer.

The shortfall dossier adds a derived, site-level forensic projection and
reconstructs the eight retained custody/liability observations against the
recorded token transfers. It does not create PRF canonical identities or change
the source evidence bundle. It also lists the source/build/runtime, authority,
external-authentication, interruption/recovery, packed-representation and scale
gaps as typed findings. In particular, the available records do not contain
mined transaction hashes or block identities, process-interruption checkpoints,
an independent immutable-aware source-to-runtime match, or a qualified gas
envelope. The observed stale-assurance recovery branch is a separate result and
does not establish crash-safe resumption.

Run the deterministic report reconstruction and nine adversarial input tests:

```sh
pnpm verify:shortfall-evidence
```

This command cross-checks the generated report against the publication-pinned
manifest, projection, proof, funding observation, replay outputs, runtime log,
state snapshots and transfer observations. The independent source/EVM replay
still requires the pinned prf-evm checkout described above; the dossier command
does not execute Solidity or verify a proof anew. The report is available at
`/evidence/reports/composed-pro-rata-v2-forensic-dossier.v1.json` and identifies
itself as a presentation projection rather than canonical evidence.

Each economic transition also has a deterministic site-report record digest and
links to digest-bound state, validator-projection and applicable transfer
observations. These digests are report references, not PRF canonical transition
identities. The tests include a fully re-pinned bundle substitution: the
bundle's own pin accepts its replacement, while the original independently
retained pin rejects it. To check against a pin obtained through a trusted,
independent channel, run:

```sh
pnpm verify:shortfall-pin --trusted-pin /path/to/trusted-publication-pin.json
```

The report-only command is deterministic reconstruction, not a fresh Foundry
execution or live-chain verification. The pinned Solidity source validator and
Foundry reproduction commands remain documented above and in the evidence
README.
