import { cn } from '../../lib/utils'

/**
 * Reusable page header.
 *
 * Props:
 *   title     string    Page heading
 *   subtitle  string?   Supporting copy
 *   actions   ReactNode Buttons / controls on the right
 *   dark      boolean   Use dark (admin) text colours
 */
export default function PageHeader({ title, subtitle, actions, dark = false, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1
          className={cn(
            'text-xl font-semibold',
            dark ? 'text-white' : 'text-slate-900 dark:text-slate-100'
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={cn('text-sm mt-0.5', dark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400')}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
