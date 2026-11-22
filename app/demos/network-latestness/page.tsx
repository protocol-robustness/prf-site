import type { Metadata } from 'next'
import NetworkLatestnessDemo from './NetworkLatestnessDemo'

export const metadata: Metadata = {
  title: 'Network Checkpoints and Latestness',
  description:
    'Explore how independent observers verify checkpoint continuity, detect stale or conflicting heads, and qualify network latestness.',
}

export default function NetworkLatestnessPage() {
  return <NetworkLatestnessDemo />
}
