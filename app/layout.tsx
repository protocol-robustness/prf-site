import type { Metadata } from 'next'
import Link from 'next/link'
import { navItems } from '../lib/site-links'
import './globals.css'
import styles from './site.module.css'

// Absolute-URL metadata (canonical, Open Graph image, sitemap) requires a real
// public origin. The distribution serves on a CloudFront domain, so it is set
// via NEXT_PUBLIC_SITE_URL at build time; without it we omit those fields
// rather than emit localhost or placeholder URLs.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: 'Economic Assurance for Ethereum',
    template: '%s · Economic Assurance for Ethereum',
  },
  description:
    'PRF examines economic outcomes in Ethereum systems, beginning with pro-rata allocation, distribution, withdrawals and shortfall resolution.',
  icons: { icon: '/prf-logo.png' },
  openGraph: {
    title: 'Economic Assurance for Ethereum',
      description:
      'Examine pro-rata allocation, distribution, withdrawals and shortfall outcomes in Ethereum systems.',
    type: 'website',
    ...(siteUrl ? { images: ['/prf-logo.png'] } : {}),
  },
  ...(siteUrl
    ? { twitter: { card: 'summary_large_image' as const, images: ['/prf-logo.png'] } }
    : {}),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandText}>Economic Assurance for Ethereum</span>
            </Link>
            <nav className={styles.nav} aria-label="Primary navigation">
              {navItems.map((item) => (
                'staticDocument' in item && item.staticDocument ? (
                  <a key={item.href} href={item.href} className={styles.navLink}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.href} href={item.href} className={styles.navLink}>
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p>
              The Protocol Robustness Framework examines economic outcomes in
              Ethereum systems, including pro-rata allocation, distribution,
              withdrawals and shortfalls. Each demonstration states what its
              evidence establishes and where its limits remain.
            </p>
            <nav className={styles.footerLinks} aria-label="About PRF">
              <Link href="/assurance">Public Initiative &amp; Assurance</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}
