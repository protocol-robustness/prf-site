import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Use the project's existing compiler so this test also works on Node 22
// releases predating native TypeScript stripping.
const source = readFileSync(new URL('../lib/accounting-review-state.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText
const { initialReview, reviewTransition } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const eligibility = { A: true, B: false }
const step = (s, action) => reviewTransition(s, action, eligibility)

test('verification, review and adoption need separate actions and roles', () => {
  let s = initialReview()
  assert.equal(step(s, { type: 'accept' }), s)
  s = step(s, { type: 'verify' })
  assert.equal(s.acceptance, 'Pending')
  assert.equal(step(s, { type: 'ratify' }), s)
  s = step(s, { type: 'accept' })
  assert.equal(s.ratification, 'Not ratified')
  assert.equal(step(s, { type: 'ratify' }), s)
  s = step(s, { type: 'role', role: 'Ratifier' })
  s = step(s, { type: 'ratify' })
  assert.equal(s.ratification, 'Ratified')
})

test('invalid candidate remains blocked despite conservation', () => {
  let s = initialReview('B')
  s = step(s, { type: 'verify' })
  assert.equal(s.verification, 'Failed')
  assert.equal(step(s, { type: 'accept' }), s)
  s = step(s, { type: 'role', role: 'Ratifier' })
  assert.equal(step(s, { type: 'ratify' }), s)
  s = step(s, { type: 'role', role: 'Reviewer' })
  s = step(s, { type: 'reject' })
  assert.equal(s.acceptance, 'Rejected')
  assert.equal(s.ratification, 'Blocked')
})

test('reviewer can reject a verified candidate; verification cannot reverse it', () => {
  let s = step(initialReview(), { type: 'verify' })
  s = step(s, { type: 'reject' })
  assert.equal(step(s, { type: 'accept' }), s)
  s = step(s, { type: 'verify' })
  assert.equal(s.acceptance, 'Rejected')
  assert.equal(s.ratification, 'Blocked')
})

test('reset and candidate changes remove simulated authority state', () => {
  let s = step(initialReview(), { type: 'verify' })
  s = step(s, { type: 'accept' })
  assert.deepEqual(step(s, { type: 'select', candidate: 'B' }), initialReview('B'))
  assert.deepEqual(step(s, { type: 'reset' }), initialReview('A'))
})
