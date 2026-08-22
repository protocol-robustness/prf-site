# PRF Product Site

A static product/demo site for the Protocol Robustness Framework. It makes PRF
understandable to a newcomer — **Understand → Believe → Inspect → Verify** —
without ever letting the polished public story diverge from what the framework
actually computes.

This repo is standalone. The framework itself (Clojure), its executable demos,
and the screenshot/notebook generation pipeline live in the **prf main repo**;
this site consumes committed artifacts from it.

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

## The demos

Three public demos tell a coherent story about protocol robustness without
requiring any framework vocabulary:

| Demo                | Question                                        | Executable source (prf repo)   | Shape |
|---------------------|-------------------------------------------------|--------------------------------|-------|
| Current Head        | Can a verified result be changed?               | `resubmission_chain` / custody verifier | narrative (baseline → change → outcome) |
| Liquidity Shortfall | $100 of requests vs $70 of liquidity?           | `pro-rata.allocation/allocate` | allocation (pool → per-request → conservation) |
| Reordered Evidence  | Does evidence order matter?                     | `reorder_chain`                | narrative |

Each page imports its JSON from `generated/demos/<id>.json`, runs
`assertPublicDemo` at build time (`lib/validate-public-demo.ts`), and renders
framework-supplied facts exactly as supplied.

## Generation flow

1. An executable PRF demo produces a result in the prf main repo.
2. Its projector copies presentation-safe facts into a `public-demo.v1`
   artifact and fails closed if required evidence is absent.
3. `bb demo:public-build` (prf repo) serialises the artifact deterministically
   into this repo as `generated/demos/<id>.json`; it is committed here.
4. `pnpm verify:demos` re-checks the committed artifacts independently of
   Next.js; `bb demo:public-check` (prf repo) fails on any drift between the
   committed JSON and fresh PRF output.

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
is **kept out of git** (see `.gitignore`) because of its size (~140MB) and must
be present under `public/shots/` at build time so that `out/shots/` ships with
the export. All gallery HTML uses relative links, so it works unchanged under
any path prefix. The site nav ("Screenshots") and demo CTAs link into it.

To refresh locally: `scripts/sync-shots.sh <bundle-url>` (the same release
asset the deploy workflow consumes), then `pnpm build`.

## Lab notebooks (`/lab/`)

In production builds, each demo's "Inspect … notebook" CTA points to
`/lab/notebooks/<name>/` — the static Clerk build produced by `bb
demo:public-lab` in the prf repo. That build must be composed **after**
`pnpm build` (the export wipes `out/`) by copying the lab output into
`out/lab/`. In dev, the CTA targets the live Clerk server at
`localhost:7777`. Until the lab is composed, those deep links 404 while the
rest of the site works.

## Publication flow

The site exports fully statically (`output: 'export'`, trailing slashes,
unoptimized images), so any static host works — GitHub Pages first, S3 +
CloudFront later for heavy run archives.

For GitHub Pages:

- `public/.nojekyll` is exported so Pages serves `_next/` untouched.
- `.github/workflows/ci.yml` runs on every PR: typecheck, demo-artifact
  verification (`pnpm verify:demos`), and a full static export build.
- `.github/workflows/deploy.yml` runs on push to `main`: same checks, then
  publishes via `actions/deploy-pages` — there is no `gh-pages` branch; the
  deployed artifact is composed from `out/`.
- The deploy workflow fetches the screenshot bundle from the repository
  variable `PRF_SHOTS_URL` (a prf-repo release asset: gzipped tarball whose
  top-level entry is `shots/`, extracted into `public/shots/` before the
  build). Until it is set, deploys succeed without the gallery and `/shots`
  links 404.
- If publishing under a subpath (`<user>.github.io/<repo>/`), absolute paths
  in the app need `basePath` handling or a user/org site / custom domain.
- Not yet automated in CI: composing `out/lab/` (the Clerk notebook build)
  after `pnpm build`.
