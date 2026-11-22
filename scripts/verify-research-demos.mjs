#!/usr/bin/env node
/** Validate research demo routes, manifests, downloadable artifacts and replay instructions. */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const publicRoot = join(root, 'public')
const manifestDir = join(publicRoot, 'evidence/manifests')
const ids = [
  'what-breaks-under-stress',
  'where-did-every-token-go',
  'can-anyone-verify-the-research',
  'can-you-challenge-a-research-finding',
  'when-does-research-earn-a-reward',
]
const failures = []
const checkedFiles = new Set()
function fail(where, message) { failures.push(`${where}: ${message}`) }
function sha256(file) { return createHash('sha256').update(readFileSync(file)).digest('hex') }
function checkArtifact(manifestId, artifact) {
  if (!artifact?.path) return fail(manifestId, 'artifact is missing path')
  const relative = artifact.path.replace(/^\//, '')
  const file = join(publicRoot, relative)
  if (!existsSync(file)) return fail(manifestId, `download missing: /${relative}`)
  checkedFiles.add(relative)
  if (!artifact.sha256) fail(manifestId, `artifact has no sha256: /${relative}`)
  else if (sha256(file) !== artifact.sha256) fail(manifestId, `sha256 mismatch: /${relative}`)
}

for (const id of ids) {
  const manifestRel = `evidence/manifests/${id}.v1.json`
  const manifestPath = join(publicRoot, manifestRel)
  const routePath = join(root, 'app', 'demos', id, 'page.tsx')
  if (!existsSync(manifestPath)) { fail(id, `manifest missing: /${manifestRel}`); continue }
  if (!existsSync(routePath)) fail(id, `route missing: /demos/${id}`)
  let manifest
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) }
  catch (error) { fail(id, `invalid manifest JSON: ${error.message}`); continue }
  if (manifest.schema !== 'prf-demo-manifest.v1' || manifest.manifest_version !== 1) fail(id, 'unexpected manifest schema/version')
  if (manifest.demo?.id !== id || manifest.demo?.page !== `/demos/${id}`) fail(id, 'manifest identity does not match route')
  const page = existsSync(routePath) ? readFileSync(routePath, 'utf8') : ''
  if (!page.includes(`/${manifestRel}`)) fail(id, 'route does not link its versioned manifest')
  for (const artifact of [...(manifest.inputs ?? []), ...(manifest.retained_evidence ?? [])]) checkArtifact(id, artifact)
  for (const source of manifest.source_files ?? []) {
    const snapshot = join(publicRoot, 'evidence/source/research', source.path.split('/').at(-1))
    if (existsSync(snapshot)) {
      checkedFiles.add(`evidence/source/research/${source.path.split('/').at(-1)}`)
      if (!source.sha256 || sha256(snapshot) !== source.sha256) fail(id, `source snapshot hash mismatch: ${source.path}`)
    }
  }
  if (!Array.isArray(manifest.verification) || manifest.verification.length === 0) fail(id, 'manifest has no replay/verification instructions')
  for (const [index, step] of (manifest.verification ?? []).entries()) {
    if (!step.command || !step.purpose || !step.working_directory) fail(id, `verification[${index}] needs command, purpose and working_directory`)
  }
  for (const [, href] of page.matchAll(/href="(\/evidence\/[^"#?]+)"/g)) {
    const relative = href.slice(1)
    const file = join(publicRoot, relative)
    if (!existsSync(file)) fail(id, `route download missing: ${href}`)
    else checkedFiles.add(relative)
  }
}

const challengeInstructions = join(publicRoot, 'evidence/research/shortfall-challenge/replay-instructions.md')
if (!existsSync(challengeInstructions)) fail('can-you-challenge-a-research-finding', 'replay instructions download missing')
else {
  const instructions = readFileSync(challengeInstructions, 'utf8')
  for (const token of ['clojure -M:test', 'policy-root-mismatch', 'not a novelty-qualified']) {
    if (!instructions.includes(token)) fail('challenge replay instructions', `missing required boundary or command text: ${token}`)
  }
}

if (failures.length) {
  console.error('verify-research-demos FAILED:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(`verify-research-demos OK: ${ids.length} routes, ${checkedFiles.size} downloadable artifacts, replay metadata and challenge instructions`)
