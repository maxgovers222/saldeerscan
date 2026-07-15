import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FunnelFieldProps extends ComponentProps<'div'> {
  error?: ReactNode
  hint?: ReactNode
  htmlFor: string
  label: ReactNode
  optional?: boolean
}

export function FunnelField({
  children,
  className,
  error,
  hint,
  htmlFor,
  label,
  optional = false,
  ...props
}: FunnelFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {optional && <span className="ml-1 font-normal text-ink-muted">(optioneel)</span>}
        </label>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  )
}
