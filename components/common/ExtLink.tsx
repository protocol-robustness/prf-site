import Link from 'next/link'

export default function ExtLink({
  href,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
