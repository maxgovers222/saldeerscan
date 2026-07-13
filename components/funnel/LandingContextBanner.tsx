import type { ConversionContext } from '@/lib/conversion-context'

function humanizeSlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function LandingContextBanner({
  context,
}: {
  context: ConversionContext | null
}) {
  if (!context || context.pseoLevel === 'home') return null
  const place = context.postcode
    ? `Postcode ${context.postcode}`
    : [context.straat, context.wijk, context.stad, context.provincie]
        .filter((value): value is string => Boolean(value))
        .map(humanizeSlug)
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 2)
        .join(', ')
  if (!place) return null
  return (
    <aside
      data-testid="landing-context"
      className="mb-4 rounded-xl border border-trust/25 bg-trust/10 px-4 py-3 text-sm text-white/75"
    >
      <p className="font-semibold text-white">{place}</p>
      <p className="mt-1">We nemen deze regio mee in uw check.</p>
    </aside>
  )
}
