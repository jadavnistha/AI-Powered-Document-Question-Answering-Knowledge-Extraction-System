import { BookMarked } from 'lucide-react'

export default function Logo({ size = 30, showText = true }) {
  return (
    <div className="flex items-center gap-3">
      <BookMarked
        size={size}
        className="text-annotation"
        strokeWidth={2}
      />

      {showText && (
        <span className="font-serif text-2xl font-semibold text-ink">
          QueryDoc <span className="text-annotation">AI</span>
        </span>
      )}
    </div>
  )
}