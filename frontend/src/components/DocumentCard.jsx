import { useNavigate } from 'react-router-dom'
import { FileText, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function DocumentCard({ document, onDelete }) {
  const navigate = useNavigate()
  const canOpen = document.status === 'ready'

  return (
    <div
      onClick={() => canOpen && navigate(`/documents/${document.id}`)}
      className={`card p-4 flex flex-col gap-3 transition-shadow ${
        canOpen ? 'cursor-pointer hover:border-annotation/40' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <FileText size={20} className="text-annotation shrink-0 mt-0.5" strokeWidth={1.5} />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(document.id)
          }}
          className="text-ink-soft hover:text-danger transition-colors"
          aria-label="Delete document"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-ink truncate" title={document.original_filename}>
          {document.original_filename}
        </p>
        <p className="text-xs text-ink-soft mt-1 font-mono">
          {document.status === 'ready'
            ? `${document.page_count} pages · ${document.chunk_count} chunks`
            : new Date(document.created_at).toLocaleDateString()}
        </p>
        {document.status === 'failed' && document.error_message && (
          <p className="text-xs text-danger mt-1">{document.error_message}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <StatusBadge status={document.status} />
        <span className="text-xs text-ink-soft font-mono">
          {new Date(document.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
