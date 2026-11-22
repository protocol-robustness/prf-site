import type { Metadata } from 'next'
import NetworkScenarios from './NetworkScenarios'

export const metadata: Metadata = {
  title: 'Network Checkpoint Scenarios',
  description:
    'Illustrative checkpoint fork, witness quorum, membership change and withheld-head scenarios.',
}

export default function NetworkScenariosPage() {
  return <NetworkScenarios />
}
