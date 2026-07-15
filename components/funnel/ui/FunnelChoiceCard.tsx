import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export interface FunnelChoiceCardProps extends ComponentProps<'button'> {
  selected?: boolean
}

export function FunnelChoiceCard({
  className,
  selected = false,
  type = 'button',
  ...props
}: FunnelChoiceCardProps) {
  return (
    <button
      type={type}
      aria-pressed={props['aria-pressed'] ?? selected}
      className={cn(
        'min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/40',
        selected
          ? 'border-trust bg-trust/10 text-trust-dark'
          : 'border-ink/15 bg-paper text-ink-muted hover:border-trust/45 hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    />
  )
}
