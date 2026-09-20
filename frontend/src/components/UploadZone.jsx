import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

export default function UploadZone({ onFileSelected, uploading, progress }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`card border-dashed flex flex-col items-center justify-center text-center px-6 py-10 cursor-pointer transition-colors ${
        dragActive ? 'border-annotation bg-annotation/5' : ''
      } ${uploading ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <UploadCloud size={28} className="text-annotation mb-3" strokeWidth={1.5} />
      {uploading ? (
        <div className="w-full max-w-xs">
          <p className="text-sm text-ink-soft mb-2">Uploading… {progress}%</p>
          <div className="loading-underline" />
        </div>
      ) : (
        <>
          <p className="text-sm text-ink">
            <span className="text-annotation font-medium">Click to upload</span> or
            drag and drop a PDF
          </p>
          <p className="text-xs text-ink-soft mt-1">Max 20MB per file</p>
        </>
      )}
    </div>
  )
}
