import type { ComponentProps } from 'react'
import { BRAND_WORDMARK } from '@/lib/brand-colors'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'

export interface BrandLockupProps extends ComponentProps<'span'> {
  contextLabel?: string
  contextLabelClassName?: string
  markClassName?: string
  tone?: 'dark' | 'light'
  wordmarkClassName?: string
}

export function BrandLockup({
  className,
  contextLabel,
  contextLabelClassName,
  markClassName,
  tone = 'light',
  wordmarkClassName,
  ...props
}: BrandLockupProps) {
  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-3', className)}
      {...props}
    >
      <BrandMark className={markClassName} />
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate font-heading text-base font-bold tracking-tight sm:text-lg',
            tone === 'dark' ? 'text-white' : 'text-ink',
            wordmarkClassName,
          )}
        >
          {BRAND_WORDMARK.name}
          <span className={tone === 'dark' ? 'text-trust' : 'text-trust-dark'}>
            {BRAND_WORDMARK.suffix}
          </span>
        </span>
        {contextLabel && (
          <span
            className={cn(
              'block truncate text-xs',
              tone === 'dark' ? 'text-white/55' : 'text-ink-muted',
              contextLabelClassName,
            )}
          >
            {contextLabel}
          </span>
        )}
      </span>
    </span>
  )
}
