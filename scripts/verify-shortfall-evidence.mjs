#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildShortfallDossier, serializeShortfallDossier, verifyShortfallDossier } from './lib/shortfall-dossier.mjs'

const args = process.argv.slice(2)
assert(args.length === 0
  || (args.length === 1 && args[0] === '--write')
  || (args.length === 2 && args[0] === '--trusted-pin'),
'usage: node scripts/verify-shortfall-evidence.mjs [--write | --trusted-pin <trusted-publication-pin.json>]')
const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicRoot = resolve(siteRoot, 'public')
if (args[0] === '--write') {
  const dossier = buildShortfallDossier(publicRoot)
  const target = resolve(publicRoot, 'evidence/reports/composed-pro-rata-v2-forensic-dossier.v1.json')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, serializeShortfallDossier(dossier))
  console.log(`wrote derived shortfall dossier: ${target}`)
} else {
  const trustedPin = args[0] === '--trusted-pin' ? JSON.parse(readFileSync(resolve(args[1]), 'utf8')) : null
  const { dossier, sha256 } = verifyShortfallDossier(publicRoot, trustedPin)
  assert.equal(dossier.schema, 'eae.site-shortfall-forensic-dossier.v1')
  assert.equal(dossier.economicLedger.transitions.length, 8)
  assert.equal(dossier.economicLedger.assetConservation.holdsAtAllEightObservations, true)
  assert.equal(dossier.economicLedger.obligations.holds, true)
  console.log(`shortfall forensic dossier PASS: ${dossier.subject.operationId}; 8 states; ${dossier.economicLedger.assetConservation.transfersReconciled} transfer observations; sha256:${sha256}`)
  console.log(trustedPin
    ? 'Scope: checked against the caller-supplied publication pin; pin authenticity depends on its independent trusted distribution. No chain authentication or public qualification.'
    : 'Scope: deterministic reconstruction from the bundled publication pin; not external pin authentication, chain authentication, proof execution or public qualification.')
}
