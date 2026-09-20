import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import MessageBubble from './MessageBubble'
import LoadingUnderline from './LoadingUnderline'
import * as chatApi from '../api/chat'
import { useToast } from '../context/ToastContext'

export default function ChatPanel({ documentId, documentReady }) {
  const [messages, setMessages] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const { showToast } = useToast()
  const bottomRef = useRef(null)

  useEffect(() => {
    chatApi
      .getHistory(documentId)
      .then((res) => setMessages(res.data.messages))
      .catch((err) => showToast(err.message))
      .finally(() => setLoadingHistory(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, asking])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || asking) return

    const optimisticUserMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      sources: [],
    }
    setMessages((prev) => [...prev, optimisticUserMessage])
    setQuestion('')
    setAsking(true)

    try {
      const res = await chatApi.askQuestion(documentId, trimmed)
      setMessages((prev) => [
        ...prev,
        {
          id: res.data.message_id,
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
        },
      ])
    } catch (err) {
      showToast(err.message)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id))
      setQuestion(trimmed)
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {loadingHistory ? (
          <div className="max-w-xs mx-auto mt-8">
            <LoadingUnderline label="Loading conversation…" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-8">
            <p className="text-ink-soft text-sm">
              Ask a question about this document. Every answer is grounded in
              the PDF and cites its source page.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {asking && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-paper-alt border border-rule shrink-0" />
            <div className="w-40 pt-2.5">
              <LoadingUnderline />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-rule bg-paper-alt px-4 sm:px-6 py-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!documentReady || asking}
          placeholder={
            documentReady ? 'Ask a question about this document…' : 'Waiting for document to be ready…'
          }
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={!documentReady || asking || !question.trim()}
          className="btn-primary shrink-0 flex items-center gap-1.5"
        >
          <Send size={15} />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  )
}
