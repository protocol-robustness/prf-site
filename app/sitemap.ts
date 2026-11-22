import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

// Sitemap entries require absolute URLs. Without a build-time public origin we
// emit an empty sitemap rather than a wrong one; set NEXT_PUBLIC_SITE_URL to
// publish a populated sitemap.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

const routes = [
  '/',
  '/demos',
  '/assurance',
  '/security',
  '/notebooks',
  '/cleanroom/notebooks/not_admitted/index.html',
  '/use-cases/stablecoins',
  '/use-cases/auditability',
  '/demos/can-anyone-verify-the-research',
  '/demos/can-you-challenge-a-research-finding',
  '/demos/cancel-or-activate',
  '/demos/canonical-comparison',
  '/demos/composed-pro-rata-settlement',
  '/demos/current-head',
  '/demos/entitlement-size',
  '/demos/liquidity-shortfall',
  '/demos/network-latestness',
  '/demos/network-scenarios',
  '/demos/partial-fill',
  '/demos/partial-fill-accounting',
  '/demos/pro-rata-settlement',
  '/demos/ratification',
  '/demos/reordered-evidence',
  '/demos/what-breaks-under-stress',
  '/demos/when-does-research-earn-a-reward',
  '/demos/where-did-every-token-go',
]

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return []
  const base = siteUrl.replace(/\/$/, '')
  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: 'weekly' as const,
  }))
}
