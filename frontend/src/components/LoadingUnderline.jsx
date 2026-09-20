export default function LoadingUnderline({ label }) {
  return (
    <div className="w-full">
      {label && <p className="text-xs text-ink-soft mb-1.5">{label}</p>}
      <div className="loading-underline" />
    </div>
  )
}
