import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const funnelPrimaryButtonClass = [
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 py-3',
  'font-heading text-sm font-bold text-evergreen-950 shadow-[0_12px_32px_rgba(255,176,32,.18)]',
  'transition hover:bg-action-hover active:translate-y-px',
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-action/45',
  'disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink-muted/60 disabled:shadow-none',
].join(' ')

export const funnelSecondaryButtonClass = [
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/15 bg-paper px-4 py-2.5',
  'text-sm font-semibold text-ink-muted transition hover:border-trust/40 hover:text-ink',
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/35',
  'disabled:cursor-not-allowed disabled:opacity-45',
].join(' ')

export const funnelTextButtonClass = [
  'inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-trust-dark',
  'transition hover:bg-trust/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/35',
  'disabled:cursor-not-allowed disabled:opacity-45',
].join(' ')

export interface FunnelActionsProps extends ComponentProps<'div'> {
  primary: ReactNode
  secondary?: ReactNode
  sticky?: boolean
}

export function FunnelActions({
  className,
  primary,
  secondary,
  sticky = false,
  ...props
}: FunnelActionsProps) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)]',
        !secondary && 'sm:grid-cols-1',
        sticky && 'sticky bottom-0 z-10 -mx-5 border-t border-ink/10 bg-paper/95 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0',
        className,
      )}
      {...props}
    >
      {secondary}
      {primary}
    </div>
  )
}
