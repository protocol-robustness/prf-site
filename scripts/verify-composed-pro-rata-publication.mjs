#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const evidenceRelative = 'public/evidence/composed-pro-rata-v2-settlement'
const siteEvidence = join(siteRoot, evidenceRelative)
const pinPath = join(siteRoot, 'public/evidence/manifests/composed-pro-rata-v2-settlement.publication.json')
const pin = JSON.parse(readFileSync(pinPath, 'utf8'))
const errors = []
const expectedRevision = '10f592994975bb6f51e12b6f94bd190c06bbbd27'

function sha256(data) {
  return createHash('sha256').update(data).digest('hex')
}

function walkFiles(root, current = root) {
  return readdirSync(current).flatMap((name) => {
    const path = join(current, name)
    return statSync(path).isDirectory() ? walkFiles(root, path) : [relative(root, path)]
  }).sort()
}

function requireCheck(condition, message) {
  if (!condition) errors.push(message)
}

const evmRootValue = process.env.PRF_EVM_ROOT
if (!evmRootValue) errors.push('PRF_EVM_ROOT must point to the prf-evm checkout at the pinned source revision')
const evmRoot = evmRootValue ? resolve(evmRootValue) : null

if (evmRoot) {
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: evmRoot, encoding: 'utf8' })
  requireCheck(revision.status === 0 && revision.stdout.trim() === expectedRevision,
    `prf-evm revision mismatch: expected ${expectedRevision}, got ${revision.stdout?.trim() || revision.stderr?.trim()}`)

  const sourceEvidence = join(evmRoot, 'evidence/composed-pro-rata-v2-settlement')
  const manifestBytes = readFileSync(join(sourceEvidence, 'manifest.json'))
  requireCheck(sha256(manifestBytes) === pin.manifestSha256, 'retained fixture manifest digest differs from publication pin')
  requireCheck(pin.sourceRevision === expectedRevision, 'publication pin source revision differs from required source revision')
  requireCheck(pin.qualification.publicChainExecution === false
    && pin.qualification.minedPublicReceipts === false
    && pin.qualification.externalRequestAuthentication === false
    && pin.qualification.externalAuthorityAuthentication === false,
  'publication pin overstates external or public-chain qualification')

  const sidecar = readFileSync(join(sourceEvidence, 'manifest.sha256'), 'utf8').trim().split(/\s+/)[0]
  requireCheck(sidecar === pin.manifestSha256, 'fixture manifest sidecar does not match the pinned digest')

  const validator = spawnSync('python3', ['scripts/verify-composed-pro-rata-v2.py'],
    { cwd: evmRoot, encoding: 'utf8' })
  requireCheck(validator.status === 0, `read-only fixture validator failed: ${validator.stderr?.trim() || validator.stdout?.trim()}`)
  if (validator.status === 0) {
    let projection
    try { projection = JSON.parse(validator.stdout) } catch { errors.push('validator output is not valid JSON') }
    requireCheck(projection?.status === 'PASS', `validator status is ${projection?.status || 'missing'}, expected PASS`)
    const publishedProjection = readFileSync(join(siteEvidence, 'validation-result.json'))
    requireCheck(publishedProjection.equals(Buffer.from(validator.stdout)),
      'published validation projection is not byte-identical to current validator output')
    requireCheck(sha256(publishedProjection) === pin.validatedProjectionSha256,
      'published validation projection digest differs from publication pin')
  }

  const sourceFiles = walkFiles(sourceEvidence)
  const publishedFiles = walkFiles(siteEvidence)
  requireCheck(JSON.stringify(sourceFiles) === JSON.stringify(publishedFiles), 'published evidence bundle file list differs from retained fixture')
  for (const file of sourceFiles) {
    const sourceBytes = readFileSync(join(sourceEvidence, file))
    const publishedBytes = readFileSync(join(siteEvidence, file))
    requireCheck(sourceBytes.equals(publishedBytes), `published evidence is not byte-identical: ${file}`)
  }
}

const pagePath = join(siteRoot, 'app/demos/composed-pro-rata-settlement/page.tsx')
const page = readFileSync(pagePath, 'utf8')
requireCheck(page.includes('No public-chain transaction or mined receipt is claimed.'), 'demo must disclose the local-only execution boundary')
requireCheck(page.includes('external truth or completeness of requests'), 'demo must disclose the request-authentication boundary')
requireCheck(page.includes("result.calculatedAllocations") && page.includes("result.stateProjections")
  && page.includes("result.negativeTestsPassed"), 'demo must display the validated projection fields')
requireCheck(!/(?:public[- ]chain|Base Sepolia).{0,70}\b(?:settled|executed|finalized|qualified|passed)\b/i.test(page),
  'demo contains an unsupported public-chain success claim')
requireCheck(!/\b(?:requests?|fixture authorities)\s+(?:are|were)\s+(?:externally\s+)?authenticated\b/i.test(page),
  'demo contains an unsupported external-authentication claim')

const notebookPath = join(siteRoot, 'public/notebooks/composed-pro-rata-v2-settlement/index.html')
requireCheck(sha256(readFileSync(notebookPath)) === pin.publishedNotebookHtmlSha256,
  'published Clerk notebook differs from the pinned static build')

if (errors.length) {
  console.error('composed pro-rata publication gate FAILED:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`composed pro-rata publication gate PASS: ${expectedRevision}; manifest ${pin.manifestSha256}; projection ${pin.validatedProjectionSha256}`)
