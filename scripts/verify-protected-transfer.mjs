#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { deriveProtectedTransferTimeline, readProtectedTransferEvidence } from '../lib/protected-transfer-timeline.mjs'

const root = resolve(fileURLToPath(new URL('../public/evidence/protected-transfer-v1', import.meta.url)))
const output = resolve(root, 'site-timeline.json')
const write = process.argv[2] === '--write'
assert.ok(process.argv.length === 2 || (process.argv.length === 3 && write), 'usage: node scripts/verify-protected-transfer.mjs [--write]')

const python = spawnSync('python3', [resolve(root, 'verify.py')], { encoding: 'utf8' })
if (python.status !== 0) {
  process.stderr.write(python.stdout)
  process.stderr.write(python.stderr)
  process.exit(python.status ?? 1)
}
const { evidence, hashes } = readProtectedTransferEvidence(root)
const timeline = deriveProtectedTransferTimeline(evidence, hashes)
const serialized = `${JSON.stringify(timeline, null, 2)}\n`
if (write) {
  writeFileSync(output, serialized)
  console.log(`wrote checked presentation projection: ${output}`)
} else {
  assert.equal(readFileSync(output, 'utf8'), serialized, 'checked site projection is stale; rerun with --write after reviewing evidence changes')
  console.log(`protected-transfer evidence PASS: ${timeline.subject.operationId}; ${timeline.steps.length} steps; ${timeline.economics.available} allocated units; ${timeline.economics.terminal.paid} paid; localOnly`)
}
process.stdout.write(python.stdout)
console.log('Scope: site projection and bundled evidence verifier only; no live RPC, fresh proof generation or public-chain authentication.')
