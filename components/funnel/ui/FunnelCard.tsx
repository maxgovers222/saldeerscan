import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const surfaceClasses = {
  paper: 'border-ink/10 bg-paper',
  mist: 'border-ink/10 bg-mist',
  trust: 'border-trust/25 bg-trust/10',
} as const

export interface FunnelCardProps extends ComponentProps<'div'> {
  surface?: keyof typeof surfaceClasses
}

export function FunnelCard({ className, surface = 'paper', ...props }: FunnelCardProps) {
  return (
    <div
      className={cn('rounded-2xl border p-4 text-ink sm:p-5', surfaceClasses[surface], className)}
      {...props}
    />
  )
}
