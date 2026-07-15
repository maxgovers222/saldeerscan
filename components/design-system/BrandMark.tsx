import type { ComponentProps } from 'react'
import { BRAND_MARK_GEOMETRY } from '@/lib/brand-colors'
import { cn } from '@/lib/utils'

export function BrandMark({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-xl bg-trust text-white',
        className,
      )}
      {...props}
    >
      <svg viewBox={BRAND_MARK_GEOMETRY.viewBox} fill="none" className="size-5">
        <path
          d={BRAND_MARK_GEOMETRY.outerPath}
          fill="currentColor"
          fillOpacity={BRAND_MARK_GEOMETRY.outerFillOpacity}
          stroke="currentColor"
          strokeWidth={BRAND_MARK_GEOMETRY.outerStrokeWidth}
          strokeLinejoin="round"
        />
        <path d={BRAND_MARK_GEOMETRY.innerPath} fill="currentColor" />
      </svg>
    </span>
  )
}
