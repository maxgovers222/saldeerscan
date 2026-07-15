import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FunnelTrustLineProps extends ComponentProps<'div'> {
  items?: readonly string[]
  children?: ReactNode
}

export function FunnelTrustLine({ children, className, items, ...props }: FunnelTrustLineProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-ink-muted', className)}
      {...props}
    >
      {items?.map(item => (
        <span key={item} className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-trust" aria-hidden="true" />
          {item}
        </span>
      ))}
      {children}
    </div>
  )
}
