import { cn } from '../../lib/utils'

const variants = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',   // EML dark blue
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
  ghost:     'hover:bg-slate-100 text-slate-600',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  dark:      'bg-admin-surface hover:bg-white/5 text-slate-100 border border-admin-border',
}

const sizes = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-5 py-2.5 text-sm gap-2',
  xl:  'px-6 py-3 text-base gap-2.5',
}

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  className,
  disabled,
  loading,
  icon,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
