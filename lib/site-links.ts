// Single source of truth for published and executable notebook destinations.
// The published surfaces ship with this site; the executable lab is composed
// separately and must not be conflated with a static export.
//
// - Published notebooks (`PUBLISHED_NOTEBOOK_BASE`) are deterministic static
//   exports committed under `public/notebooks/` and gated by
//   `verify:flagship`. They resolve in the repo build, in CI and on the
//   distribution.
// - Executable notebooks (`EXECUTABLE_NOTEBOOK_BASE`) are the live Clerk build
//   served on `localhost:7777` in dev and composed into `out/lab/notebooks/` at
//   publication time. They do not exist in the repo build.

export const PUBLISHED_NOTEBOOK_BASE = '/notebooks' as const

export const EXECUTABLE_NOTEBOOK_BASE =
  process.env.NODE_ENV === 'production'
    ? ('/lab/notebooks' as const) // static Clerk build composed by bb demo:public-lab
    : ('http://localhost:7777/notebooks' as const) // live Clerk dev server

// The published Cleanroom Clerk export is checked into public/cleanroom and is
// included in this site's static export.
export const CLEANROOM_BASE = '/cleanroom/notebooks' as const

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Framework', href: '/framework' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Demos', href: '/demos' },
  { label: 'Notebooks', href: '/notebooks' },
  { label: 'Cleanroom', href: `${CLEANROOM_BASE}/not_admitted/index.html`, staticDocument: true },
  { label: 'Benchmarks', href: '/benchmarks' },
  { label: 'Research', href: '/research' },
] as const

export function publishedNotebookHref(slug: string): string {
  return `${PUBLISHED_NOTEBOOK_BASE}/${slug}/`
}

export function executableNotebookHref(name: string): string {
  return `${EXECUTABLE_NOTEBOOK_BASE}/${name}`
}
