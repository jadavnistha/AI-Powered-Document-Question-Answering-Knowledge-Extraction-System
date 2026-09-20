import { useCallback, useEffect, useRef, useState } from 'react'
import { FileX2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import UploadZone from '../components/UploadZone'
import DocumentCard from '../components/DocumentCard'
import LoadingUnderline from '../components/LoadingUnderline'
import * as documentsApi from '../api/documents'
import { useToast } from '../context/ToastContext'

const POLL_INTERVAL_MS = 2000

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { showToast } = useToast()
  const pollRef = useRef(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await documentsApi.listDocuments()
      setDocuments(res.data.documents)
      return res.data.documents
    } catch (err) {
      showToast(err.message)
      return []
    }
  }, [showToast])

  useEffect(() => {
    fetchDocuments().finally(() => setLoading(false))
  }, [fetchDocuments])

  // Poll while any document is still processing.
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing')
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(fetchDocuments, POLL_INTERVAL_MS)
    }
    if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [documents, fetchDocuments])

  const handleFileSelected = async (file) => {
    if (file.type !== 'application/pdf') {
      showToast('Only PDF files are supported')
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      await documentsApi.uploadDocument(file, setProgress)
      showToast('Upload received — processing your document', 'success')
      await fetchDocuments()
    } catch (err) {
      showToast(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    const previous = documents
    setDocuments((docs) => docs.filter((d) => d.id !== id))
    try {
      await documentsApi.deleteDocument(id)
    } catch (err) {
      setDocuments(previous)
      showToast(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-serif text-ink mb-1">Your documents</h1>
        <p className="text-ink-soft text-sm mb-6">
          Upload a PDF to start asking it questions.
        </p>

        <div className="mb-8">
          <UploadZone
            onFileSelected={handleFileSelected}
            uploading={uploading}
            progress={progress}
          />
        </div>

        {loading ? (
          <div className="max-w-xs">
            <LoadingUnderline label="Loading documents…" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileX2 size={32} className="text-ink-soft mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-ink-soft text-sm">
              No documents yet. Upload your first PDF above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
