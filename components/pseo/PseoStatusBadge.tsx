import { cn } from '@/lib/utils'

const styles = {
  ROOD: 'border-red-700/50 bg-red-950/40 text-red-300',
  ORANJE: 'border-action/50 bg-action/10 text-action',
  GROEN: 'border-trust/50 bg-trust/10 text-trust',
} as const

export type PseoStatus = keyof typeof styles

export function PseoStatusBadge({
  status,
  label,
}: {
  status: PseoStatus
  label?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
        styles[status],
      )}
    >
      {label ?? status}
    </span>
  )
}
