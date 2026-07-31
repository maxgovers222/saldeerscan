import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/design-system/Container'
import { PseoCardGrid } from '@/components/pseo/PseoCardGrid'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { PseoHero } from '@/components/pseo/PseoHero'
import { PseoPageShell } from '@/components/pseo/PseoPageShell'
import type { PseoStatus } from '@/components/pseo/PseoStatusBadge'
import { getTopStadden, getWijkenByStad } from '@/lib/pseo'
import {
  buildBreadcrumbListLd,
  buildHubCollectionLd,
  hubBreadcrumbItems,
  toDisplaySlug,
} from '@/lib/pseo-hubs'
import { buildHubMetadata, provincieDisplaySlug } from '@/lib/pseo-metadata'
import { rankUrgentWijken, summarizeStad } from '@/lib/pseo-variation'

export const revalidate = 604800

type Params = { provincie: string; stad: string }

export async function generateStaticParams() {
  try {
    const stads = await getTopStadden(0)
    return stads.map(item => ({ provincie: item.provincie, stad: item.stad }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { provincie, stad } = await params
  const wijken = await getWijkenByStad(provincie, stad)
  if (wijken.length === 0) return { title: 'Pagina niet gevonden' }
  const summary = summarizeStad(wijken)
  return buildHubMetadata({
    kind: 'stad',
    provincie,
    stad,
    stadSummary: {
      wijkCount: summary.wijkCount,
      roodCount: summary.netcongestie.ROOD,
      gemScore: summary.gemiddeldeScore,
    },
  })
}

function toStatus(status: string | null): PseoStatus | undefined {
  return status === 'ROOD' || status === 'ORANJE' || status === 'GROEN'
    ? status
    : undefined
}

export default async function StadPage({ params }: { params: Promise<Params> }) {
  const { provincie, stad } = await params
  const wijken = await getWijkenByStad(provincie, stad)
  if (wijken.length === 0) notFound()

  const stadDisplay = toDisplaySlug(stad)
  const provDisplay = provincieDisplaySlug(provincie)
  const totalWoningen = wijken.reduce((sum, wijk) => sum + (wijk.aantal_woningen ?? 0), 0)
  const scoredWijken = wijken.filter(wijk => wijk.gem_health_score)
  const avgScore = Math.round(
    scoredWijken.reduce((sum, wijk) => sum + (wijk.gem_health_score ?? 0), 0) /
    (scoredWijken.length || 1),
  )
  const roodCount = wijken.filter(wijk => wijk.netcongestie_status === 'ROOD').length

  const hubChildren = wijken.map(wijk => ({
    name: `${toDisplaySlug(wijk.wijk)} ${stadDisplay} — 2027 Saldeercheck`,
    url: `/${provincie}/${stad}/${wijk.wijk}`,
  }))
  const jsonLd = buildHubCollectionLd({
    name: `Zonnepanelen ${stadDisplay} — 2027 Saldeercheck`,
    description: `Overzicht van alle wijken in ${stadDisplay} met 2027 saldering impact, netcongestie en energiescore.`,
    url: `/${provincie}/${stad}`,
    children: hubChildren,
  })
  const breadcrumbLd = buildBreadcrumbListLd(hubBreadcrumbItems({ provincie, stad }))
  const urgentWijken = rankUrgentWijken(wijken, 9)

  return (
    <PseoPageShell headerContext={`${stadDisplay}, ${provDisplay}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <PseoHero
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: provDisplay, href: `/${provincie}` },
          { name: stadDisplay },
        ]}
        eyebrow="Zonnepanelen per wijk"
        title={`Zonnepanelen ${stadDisplay}`}
        summary={`${wijken.length} wijken in ${provDisplay}, met lokale netdruk en woningfit.`}
        metrics={[
          { label: 'Wijken', value: String(wijken.length) },
          {
            label: 'Woningen',
            value: totalWoningen > 0 ? `${Math.round(totalWoningen / 1000)}k+` : '—',
          },
          {
            label: 'Vol stroomnet',
            value: String(roodCount),
            tone: roodCount > 0 ? 'danger' : 'default',
          },
        ]}
      />

      <PseoConversionCard
        context={{
          landingPath: `/${provincie}/${stad}`,
          pseoLevel: 'stad',
          provincie,
          stad,
        }}
        title={`Uw woning in ${stadDisplay} persoonlijk controleren`}
        description="Krijg uw woningkenmerken, 2027-impact en beste vervolgstap in plaats van alleen het wijkgemiddelde."
        placeholder={`Uw adres in ${stadDisplay}`}
      />

      <div className="border-y border-action/20 bg-action/10 px-4 py-3 text-center">
        <p className="text-sm text-action">
          Deadline 1 januari 2027 — woningbezitters in {stadDisplay} verliezen gemiddeld €{avgScore > 60 ? '650' : '450'}–€{avgScore > 60 ? '950' : '700'} per jaar aan saldeervoordeel
        </p>
      </div>

      {urgentWijken.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <p className="text-sm font-semibold text-action">Focus 2027</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Wijken met de hoogste urgentie</h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Gesorteerd op netdruk (ROOD → ORANJE → GROEN) en lagere energiescore — waar saldering na 2027 het hardst voelt.
            </p>
            <div className="mt-6">
              <PseoCardGrid
                items={urgentWijken.map(wijk => ({
                  href: `/${provincie}/${stad}/${wijk.wijk}`,
                  title: toDisplaySlug(wijk.wijk),
                  meta: `Score ${wijk.gem_health_score ?? '—'}/100${wijk.gem_bouwjaar ? ` · bouwjaar ${wijk.gem_bouwjaar}` : ''}`,
                  status: toStatus(wijk.netcongestie_status),
                  analyticsLabel: `stad-urgent:${wijk.wijk}`,
                }))}
              />
            </div>
          </Container>
        </section>
      )}

      <section className="bg-evergreen-900/40 py-12 sm:py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-trust">Wijken</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Alle wijken in {stadDisplay}</h2>
            </div>
            <Link
              href="#adrescheck"
              data-analytics-event="pseo_check_cta"
              data-analytics-label={`stad-address:${stad}`}
              className="min-h-11 content-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/65 transition hover:border-trust/40 hover:text-white"
            >
              Mijn adres scannen →
            </Link>
          </div>
          <div className="mt-6">
            <PseoCardGrid
              items={wijken.map(wijk => {
                const score = wijk.gem_health_score ?? 52
                return {
                  href: `/${provincie}/${stad}/${wijk.wijk}`,
                  title: toDisplaySlug(wijk.wijk),
                  meta: `Score ${score}/100${wijk.gem_bouwjaar ? ` · bouwjaar ${wijk.gem_bouwjaar}` : ''}${wijk.aantal_woningen ? ` · ${wijk.aantal_woningen.toLocaleString('nl-NL')} woningen` : ''}`,
                  status: toStatus(wijk.netcongestie_status),
                  analyticsLabel: `stad-grid:${wijk.wijk}`,
                }
              })}
            />
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container className="flex flex-wrap gap-3">
          <Link
            href="/kennisbank"
            className="min-h-11 content-center rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:border-trust/40 hover:text-white"
          >
            Kennisbank zonnepanelen
          </Link>
          <Link
            href="/nieuws"
            className="min-h-11 content-center rounded-xl border border-white/10 px-4 text-sm text-white/55 transition hover:border-trust/40 hover:text-white"
          >
            Nieuws saldering 2027
          </Link>
        </Container>
      </section>
    </PseoPageShell>
  )
}
