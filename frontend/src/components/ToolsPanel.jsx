import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import LoadingUnderline from './LoadingUnderline'
import * as toolsApi from '../api/tools'
import { useToast } from '../context/ToastContext'

const TABS = [
  { key: 'summary', label: 'Summary', fetcher: toolsApi.getSummary },
  { key: 'keywords', label: 'Keywords', fetcher: toolsApi.getKeywords },
  { key: 'notes', label: 'Study Notes', fetcher: toolsApi.getNotes },
]

export default function ToolsPanel({ documentId, documentReady }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [content, setContent] = useState({}) // { summary: str, keywords: [], notes: str }
  const [loadingTab, setLoadingTab] = useState(null)
  const { showToast } = useToast()

  const openTab = useCallback(
    async (key) => {
      setActiveTab(key)
      if (content[key] !== undefined || !documentReady) return

      setLoadingTab(key)
      try {
        const tab = TABS.find((t) => t.key === key)
        const res = await tab.fetcher(documentId)
        setContent((prev) => ({ ...prev, [key]: res.data.content }))
      } catch (err) {
        showToast(err.message)
      } finally {
        setLoadingTab(null)
      }
    },
    [content, documentReady, documentId, showToast],
  )

  // Auto-load the default (Summary) tab as soon as the document is ready,
  // since it is already "open" without the user clicking it.
  useEffect(() => {
    if (documentReady) openTab('summary')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentReady, documentId])

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-rule">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => openTab(tab.key)}
            className={`flex-1 text-sm py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-annotation text-annotation'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {!documentReady ? (
          <p className="text-sm text-ink-soft">
            This tool will be available once the document finishes processing.
          </p>
        ) : loadingTab === activeTab ? (
          <div className="max-w-xs">
            <LoadingUnderline label="Generating…" />
          </div>
        ) : activeTab === 'keywords' ? (
          <KeywordsList items={content.keywords} />
        ) : (
          <div className="prose-sm text-sm text-ink [&_h2]:font-serif [&_h2]:text-lg [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
            <ReactMarkdown>{content[activeTab] || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

function KeywordsList({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-ink-soft">No keywords generated yet.</p>
  }
  return (
    <dl className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border-b border-rule pb-2 last:border-b-0">
          <dt className="text-sm font-medium text-ink font-mono">{item.term}</dt>
          <dd className="text-sm text-ink-soft mt-0.5">{item.definition}</dd>
        </div>
      ))}
    </dl>
  )
}
