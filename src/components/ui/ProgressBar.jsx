import { cn } from '../../lib/utils'

export default function ProgressBar({ value = 0, max = 100, className, color = 'brand' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const colors = {
    brand:   'bg-brand-500',
    blue:    'bg-blue-500',
    violet:  'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
  }

  return (
    <div className={cn('relative h-2 w-full bg-slate-100 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
