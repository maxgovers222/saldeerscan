import type { ComponentProps } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const primaryActionClassName = cn(
  'inline-flex min-h-11 items-center justify-center rounded-xl',
  'bg-action px-5 py-3 font-heading text-sm font-bold text-evergreen-950',
  'shadow-[0_12px_32px_rgba(255,176,32,.22)]',
  'transition hover:bg-action-hover active:translate-y-px',
)

export function PrimaryAction({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        primaryActionClassName,
        className,
      )}
      {...props}
    />
  )
}
