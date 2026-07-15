import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const variantClasses = {
  info: 'border-ink/10 bg-mist text-ink-muted',
  success: 'border-trust/25 bg-trust/10 text-trust-dark',
  warning: 'border-warning/25 bg-action/10 text-ink',
  danger: 'border-danger/25 bg-danger/8 text-danger',
} as const

export interface FunnelNoticeProps extends Omit<ComponentProps<'div'>, 'title'> {
  title?: ReactNode
  variant?: keyof typeof variantClasses
}

export function FunnelNotice({
  children,
  className,
  role,
  title,
  variant = 'info',
  ...props
}: FunnelNoticeProps) {
  return (
    <div
      className={cn('rounded-xl border px-4 py-3 text-sm leading-6', variantClasses[variant], className)}
      role={role ?? (variant === 'danger' ? 'alert' : undefined)}
      {...props}
    >
      {title && <p className="font-semibold text-current">{title}</p>}
      {children && <div className={cn(title && 'mt-1')}>{children}</div>}
    </div>
  )
}
