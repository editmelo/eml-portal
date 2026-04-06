/**
 * RichBrief — renders a project brief with lightweight formatting.
 *
 * Supported syntax (typed in a plain textarea):
 *   **bold text**   → <strong>bold text</strong>
 *   Line breaks     → preserved as-is (whitespace-pre-line)
 *
 * Usage: <RichBrief text={project.brief} className="text-sm text-slate-600" />
 */
export default function RichBrief({ text, className = '' }) {
  if (!text) return null

  // Split on **…** segments, alternating plain / bold
  const parts = text.split(/(\*\*[^*]+\*\*)/)

  return (
    <p className={`whitespace-pre-line leading-relaxed ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
