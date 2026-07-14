import { getWijkenByStad, getTopWijken } from '@/lib/pseo'
import { toDisplaySlug } from '@/lib/pseo-hubs'
import { PseoCardGrid } from './PseoCardGrid'

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
      <p className="mb-6 text-base text-white/55">
        {description}
      </p>
      <PseoCardGrid
        items={wijken.map(({ provincie: prov, stad: city, wijk, score, bouwjaar }) => ({
          href: `/${prov}/${city}/${wijk}`,
          title: toDisplaySlug(wijk),
          meta: `${toDisplaySlug(city)}${score ? ` · ${score}/100` : ''}${bouwjaar ? ` · ${bouwjaar}` : ''}`,
          analyticsLabel: `related:${city}:${wijk}`,
        }))}
      />
    </section>
  )
}
