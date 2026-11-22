type IconName = 'flask' | 'ledger' | 'network' | 'scales' | 'shield' | 'document' | 'clock'

export default function EconomicIcon({ name, className }: { name: IconName; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
    {name === 'flask' && <g {...common}><path d="M9 3h6M10 3v6l-5.2 8.2A2.5 2.5 0 0 0 6.9 21h10.2a2.5 2.5 0 0 0 2.1-3.8L14 9V3"/><path d="M7.5 15h9"/></g>}
    {name === 'ledger' && <g {...common}><path d="M5 3.5h12a2 2 0 0 1 2 2V21H7a2 2 0 0 1-2-2z"/><path d="M5 17.5h14M8.5 7.5h7M8.5 11.5h7M7 3.5v14"/></g>}
    {name === 'network' && <g {...common}><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m10.8 7.2-4.5 8.6m6.9-8.6 4.5 8.6M7.5 18h9"/></g>}
    {name === 'scales' && <g {...common}><path d="M12 3v17M7 21h10M6 6h12M12 4l-6 2-3 6h6L6 6m12 0-3 6h6l-3-6"/><path d="M3 14c0 2 1.3 3 3 3s3-1 3-3m6 0c0 2 1.3 3 3 3s3-1 3-3"/></g>}
    {name === 'shield' && <g {...common}><path d="M12 3 20 6v5c0 5.1-3.3 8.2-8 10-4.7-1.8-8-4.9-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></g>}
    {name === 'document' && <g {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6m-6 4h6"/></g>}
    {name === 'clock' && <g {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></g>}
  </svg>
}
