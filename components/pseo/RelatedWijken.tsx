import Link from 'next/link'
import { getWijkenByStad, getTopWijken } from '@/lib/pseo'
import { toDisplaySlug } from '@/lib/pseo-hubs'

type RelatedWijk = {
  provincie: string
  stad: string
  wijk: string
  score?: number | null
  bouwjaar?: number | null
}

type Props = {
  limit?: number
  provincie?: string
  stad?: string
  excludeWijk?: string
  title?: string
  description?: string
}

async function loadRelatedWijken({
  limit = 4,
  provincie,
  stad,
  excludeWijk,
}: Props): Promise<RelatedWijk[]> {
  if (provincie && stad) {
    const wijken = await getWijkenByStad(provincie, stad)
    return wijken
      .filter(w => w.wijk !== excludeWijk)
      .slice(0, limit)
      .map(w => ({
        provincie,
        stad,
        wijk: w.wijk,
        score: w.gem_health_score,
        bouwjaar: w.gem_bouwjaar,
      }))
  }

  const top = await getTopWijken(limit + (excludeWijk ? 1 : 0))
  return top
    .filter(w => !provincie || w.provincie === provincie)
    .filter(w => w.wijk !== excludeWijk)
    .slice(0, limit)
    .map(w => ({ ...w }))
}

export async function RelatedWijken({
  limit = 4,
  provincie,
  stad,
  excludeWijk,
  title = 'Bekijk wijk-analyses',
  description = 'Bekijk hoe deze informatie voor specifieke wijken in Nederland uitpakt.',
}: Props) {
  let wijken: RelatedWijk[] = []
  try {
    wijken = await loadRelatedWijken({ limit, provincie, stad, excludeWijk })
  } catch {
    return null
  }

  if (wijken.length === 0) return null

  return (
    <section className="mt-12 border-t border-white/10 pt-8" data-testid="related-wijken">
      <h2 className="font-heading text-xl text-white font-bold mb-2">
        {title}
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        {description}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {wijken.map(({ provincie: prov, stad: city, wijk, score, bouwjaar }) => (
          <Link
            key={`${prov}/${city}/${wijk}`}
            href={`/${prov}/${city}/${wijk}`}
            data-analytics-event="pseo_second_click"
            data-analytics-label={`related:${city}:${wijk}`}
            className="group bg-slate-900/40 border border-white/10 rounded-xl p-4 hover:border-amber-500/40 hover:bg-slate-900/60 transition-all"
          >
            <div className="text-white font-semibold text-sm group-hover:text-amber-300 transition-colors leading-tight">
              {toDisplaySlug(wijk)}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              {toDisplaySlug(city)}
              {score ? ` · ${score}/100` : ''}
              {bouwjaar ? ` · ${bouwjaar}` : ''}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
