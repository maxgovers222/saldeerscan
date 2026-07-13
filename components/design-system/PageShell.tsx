import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({
  surface = 'mist',
  className,
  ...props
}: ComponentProps<'div'> & { surface?: 'mist' | 'evergreen' }) {
  return (
    <div
      className={cn(
        'min-h-dvh w-full overflow-x-clip',
        surface === 'mist'
          ? 'bg-mist text-ink'
          : 'bg-evergreen-950 text-white',
        className,
      )}
      {...props}
    />
  )
}
