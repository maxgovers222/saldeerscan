import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-xl bg-trust text-white',
        className,
      )}
    >
      <svg viewBox="0 0 18 18" fill="none" className="size-5">
        <path
          d="M9 2 15.5 6v7L9 17l-6.5-4V6L9 2Z"
          fill="currentColor"
          fillOpacity=".25"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="m9 6.5 3 2V12l-3 2-3-2V8.5l3-2Z" fill="currentColor" />
      </svg>
    </span>
  )
}
