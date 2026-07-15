import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FunnelStageShellProps extends ComponentProps<'section'> {
  aside?: ReactNode
  description?: ReactNode
  eyebrow: string
  title: string
}

export function FunnelStageShell({
  aside,
  children,
  className,
  description,
  eyebrow,
  title,
  ...props
}: FunnelStageShellProps) {
  return (
    <section className={cn('space-y-6 p-5 sm:p-7', className)} {...props}>
      <header className={cn('gap-4', aside && 'grid sm:grid-cols-[1fr_auto] sm:items-start')}>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-trust-dark">{eyebrow}</p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          {description && (
            <div className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
              {description}
            </div>
          )}
        </div>
        {aside}
      </header>
      {children}
    </section>
  )
}
