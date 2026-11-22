import Link from 'next/link'
import { publishedNotebookHref } from '../../lib/site-links'
import styles from './NotebookReproductionCTA.module.css'

export default function NotebookReproductionCTA({
  label = 'Reproduce this settlement in the validated notebook',
  detail,
}: {
  label?: string
  detail: string
}) {
  return <aside className={styles.callout} aria-label="Notebook reproduction">
    <Link href={publishedNotebookHref('composed-pro-rata-v2-settlement')}>{label} →</Link>
    <p>{detail}</p>
  </aside>
}
