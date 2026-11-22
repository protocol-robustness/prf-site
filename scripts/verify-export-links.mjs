#!/usr/bin/env node
// Crawl the static export in out/ and assert every internal link resolves.
//
// Two link surfaces are supplied outside the Next build: /lab/ is composed by
// the PRF repo and /shots/ is synced straight to the distribution. They are
// reported as warnings by default and only required with --require-deferred.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
assert(args.every((arg) => arg === '--require-deferred'),
  'usage: node scripts/verify-export-links.mjs [--require-deferred]')
const requireDeferred = args.includes('--require-deferred')

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const exportRoot = join(root, 'out')
assert(existsSync(exportRoot), 'out/ is missing; run `pnpm build` first')

const DEFERRED = [/^\/lab\//, /^\/shots\//]

function walkHtml(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walkHtml(path, acc)
    else if (entry.endsWith('.html')) acc.push(path)
  }
  return acc
}

function resolveInternal(pathname) {
  const base = join(exportRoot, decodeURIComponent(pathname))
  const candidates = [base, join(base, 'index.html'), `${base}.html`]
  return candidates.find((candidate) => existsSync(candidate))
}

const pages = walkHtml(exportRoot)
const failures = []
const deferred = new Map()
let checked = 0

for (const page of pages) {
  const html = readFileSync(page, 'utf8')
  const from = page.slice(exportRoot.length)
  for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue
    const [rawPath, hash] = href.split('#')
    if (!rawPath) continue
    const pathname = rawPath.split('?')[0]
    const target = resolveInternal(pathname)
    if (!target) {
      if (DEFERRED.some((re) => re.test(pathname))) {
        if (!deferred.has(pathname)) deferred.set(pathname, new Set())
        deferred.get(pathname).add(from)
        continue
      }
      failures.push(`${from} -> ${href}`)
      continue
    }
    if (hash && target.endsWith('.html')) {
      const ids = new Set(
        [...readFileSync(target, 'utf8').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
      )
      if (!ids.has(decodeURIComponent(hash))) failures.push(`${from} -> ${href} (missing anchor)`)
    }
    checked += 1
  }
}

for (const [pathname, sources] of deferred) {
  const where = [...sources].slice(0, 3).join(', ')
  if (requireDeferred) failures.push(`deferred link unresolved: ${pathname} (from ${where})`)
  else console.log(`deferred (composed outside Next build): ${pathname} (from ${where})`)
}

assert.equal(failures.length, 0, `unresolved internal links:\n${failures.join('\n')}`)
console.log(`verify-export-links OK: ${pages.length} pages, ${checked} internal links resolved` +
  (deferred.size ? `, ${deferred.size} deferred${requireDeferred ? '' : ' (warned)'}` : ''))
