import { cn } from '../../lib/utils'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card',
        'dark:bg-slate-800 dark:border-slate-700 dark:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-slate-100', 'dark:border-slate-700', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-800', 'dark:text-slate-100', className)}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

// Dark variant for Admin surfaces (always dark — not affected by portalTheme)
export function DarkCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-admin-surface rounded-xl border border-admin-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
