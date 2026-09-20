import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="text-center max-w-sm">
        <FileQuestion size={40} className="text-annotation mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="text-3xl font-serif text-ink mb-2">Page not found</h1>
        <p className="text-ink-soft mb-6">
          This page is not in the margins of QueryDoc AI. It may have been
          moved or never existed.
        </p>
        <Link to="/dashboard" className="btn-primary inline-block">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
