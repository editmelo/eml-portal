import { cn } from '../../lib/utils'
import { STATUS_CONFIG } from '../../lib/constants'

/** Generic badge */
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default:  'bg-slate-100 text-slate-600',
    brand:    'bg-brand-100 text-brand-700',
    success:  'bg-emerald-100 text-emerald-700',
    warning:  'bg-amber-100 text-amber-700',
    danger:   'bg-red-100 text-red-700',
    info:     'bg-blue-100 text-blue-700',
    purple:   'bg-purple-100 text-purple-700',
    dark:     'bg-admin-border text-slate-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

/** Project status badge — uses STATUS_CONFIG color map */
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <Badge>{status}</Badge>

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        cfg.bg,
        cfg.text
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
