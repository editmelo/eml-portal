import { cn } from '../../lib/utils'
import { getInitials } from '../../lib/utils'

const sizes = {
  xs:  'h-6 w-6 text-xs',
  sm:  'h-8 w-8 text-xs',
  md:  'h-10 w-10 text-sm',
  lg:  'h-12 w-12 text-base',
  xl:  'h-16 w-16 text-xl',
}

/** Avatar with image fallback to initials */
export default function Avatar({ name = '', src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-500 text-white font-semibold',
        'flex items-center justify-center shrink-0 select-none',
        sizes[size],
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}
