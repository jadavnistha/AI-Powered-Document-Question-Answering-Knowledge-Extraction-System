import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingUnderline from '../components/LoadingUnderline'
import ToolsPanel from '../components/ToolsPanel'
import ChatPanel from '../components/ChatPanel'
import * as documentsApi from '../api/documents'
import { useToast } from '../context/ToastContext'

const POLL_INTERVAL_MS = 2000

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  const fetchDocument = useCallback(async () => {
    try {
      const res = await documentsApi.getDocument(id)
      setDocument(res.data.document)
      return res.data.document
    } catch (err) {
      showToast(err.message)
      navigate('/dashboard')
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    fetchDocument().finally(() => setLoading(false))
  }, [fetchDocument])

  useEffect(() => {
    if (document?.status === 'processing' && !pollRef.current) {
      pollRef.current = setInterval(fetchDocument, POLL_INTERVAL_MS)
    }
    if (document?.status !== 'processing' && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [document, fetchDocument])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-xs mx-auto mt-16">
          <LoadingUnderline label="Loading document…" />
        </div>
      </div>
    )
  }

  if (!document) return null

  const documentReady = document.status === 'ready'

  return (
    <div className="h-screen flex flex-col bg-paper">
      <Navbar />

      <div className="border-b border-rule bg-paper-alt px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-ink-soft hover:text-ink transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <FileText size={18} className="text-annotation shrink-0" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink truncate">
            {document.original_filename}
          </p>
          <p className="text-xs text-ink-soft font-mono">
            {documentReady
              ? `${document.page_count} pages · ${document.chunk_count} chunks`
              : 'Processing…'}
          </p>
        </div>
        <StatusBadge status={document.status} />
      </div>

      {document.status === 'failed' ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="card border-danger/30 px-6 py-5 max-w-md text-center">
            <p className="text-sm text-danger font-medium mb-1">Processing failed</p>
            <p className="text-sm text-ink-soft">{document.error_message}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          <div className="border-b md:border-b-0 md:border-r border-rule overflow-hidden flex flex-col h-[45vh] md:h-full">
            <ToolsPanel documentId={id} documentReady={documentReady} />
          </div>
          <div className="overflow-hidden flex flex-col flex-1 md:h-full">
            <ChatPanel documentId={id} documentReady={documentReady} />
          </div>
        </div>
      )}
    </div>
  )
}
