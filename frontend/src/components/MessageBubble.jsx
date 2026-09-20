import ReactMarkdown from 'react-markdown'
import { User } from 'lucide-react'
import Logo from './Logo'
import CitationPill from './CitationPill'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const uniquePages = [...new Set((message.sources || []).map((s) => s.page))]

  if (isUser) {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="bg-paper-alt border border-rule rounded px-4 py-2.5 max-w-[85%] sm:max-w-[75%]">
          <p className="text-sm text-ink whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center shrink-0 mt-0.5">
          <User size={14} className="text-paper" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-paper-alt border border-rule flex items-center justify-center shrink-0 mt-0.5">
        <Logo size={14} showText={false} />
      </div>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="bg-paper border-l-[3px] border-annotation rounded px-4 py-2.5">
          <div className="prose-sm text-sm text-ink [&_p]:mb-2 [&_p:last-child]:mb-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
        {uniquePages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {uniquePages.map((page) => (
              <CitationPill key={page} page={page} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
