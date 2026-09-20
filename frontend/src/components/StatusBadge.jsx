const STYLES = {
  ready: 'bg-annotation/10 text-annotation border-annotation/30',
  processing: 'text-ink-soft border-rule',
  failed: 'bg-danger/10 text-danger border-danger/30',
}

const LABELS = {
  ready: 'Ready',
  processing: 'Processing',
  failed: 'Failed',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${STYLES[status] || STYLES.processing}`}
    >
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-ink-soft animate-pulse" />
      )}
      {LABELS[status] || status}
    </span>
  )
}
