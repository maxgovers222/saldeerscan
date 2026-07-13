import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function DarkHeroShell({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-evergreen-950 text-white',
        'before:pointer-events-none before:absolute before:inset-0',
        'before:bg-[radial-gradient(circle_at_50%_0%,rgba(0,184,117,.16),transparent_58%)]',
        className,
      )}
      {...props}
    />
  )
}
