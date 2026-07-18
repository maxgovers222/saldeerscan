import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/design-system/Container'
import { PseoCardGrid } from '@/components/pseo/PseoCardGrid'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { PseoHero } from '@/components/pseo/PseoHero'
import { PseoPageShell } from '@/components/pseo/PseoPageShell'
import type { PseoStatus } from '@/components/pseo/PseoStatusBadge'
import { buildCheckHref } from '@/lib/conversion-context'
import { getProvincieHubStats, getStaddenByProvincie, getUrgentWijkenByProvincie } from '@/lib/pseo'
import {
  buildBreadcrumbListLd,
  buildHubCollectionLd,
  hubBreadcrumbItems,
  toDisplaySlug,
} from '@/lib/pseo-hubs'
import { ALL_PROVINCIE_SLUGS, buildHubMetadata, provincieDisplaySlug } from '@/lib/pseo-metadata'

export const revalidate = 604800

type Params = { provincie: string }

export async function generateStaticParams() {
  return ALL_PROVINCIE_SLUGS.map(provincie => ({ provincie }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { provincie } = await params
  const provincieSummary = await getProvincieHubStats(provincie)
  return buildHubMetadata({ kind: 'provincie', provincie, provincieSummary })
}

function toStatus(status: string | null): PseoStatus | undefined {
  return status === 'ROOD' || status === 'ORANJE' || status === 'GROEN'
    ? status
    : undefined
}

export default async function ProvincePage({ params }: { params: Promise<Params> }) {
  const { provincie } = await params
  if (!ALL_PROVINCIE_SLUGS.includes(provincie)) notFound()

  const [stads, urgentWijken] = await Promise.all([
    getStaddenByProvincie(provincie),
    getUrgentWijkenByProvincie(provincie, 12),
  ])
  if (stads.length === 0) notFound()

  const provLabel = provincieDisplaySlug(provincie)
  const totalWoningen = stads.reduce((sum, city) => sum + city.totalWoningen, 0)
  const checkHref = buildCheckHref({
    landingPath: `/${provincie}`,
    pseoLevel: 'provincie',
    provincie,
  })

  const hubChildren = stads.map(city => ({
    name: `Zonnepanelen ${toDisplaySlug(city.stad)} — 2027 Saldeercheck`,
    url: `/${provincie}/${city.stad}`,
  }))
  const jsonLd = buildHubCollectionLd({
    name: `Zonnepanelen ${provLabel} — 2027 Saldeercheck`,
    description: `Overzicht per stad in ${provLabel} voor de 2027 salderingsimpact op zonnepanelen.`,
    url: `/${provincie}`,
    children: hubChildren,
  })
  const breadcrumbLd = buildBreadcrumbListLd(hubBreadcrumbItems({ provincie }))

  return (
    <PseoPageShell headerContext={provLabel} ctaHref={checkHref}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <PseoHero
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: provLabel },
        ]}
        eyebrow="Zonnepanelen per regio"
        title={`Zonnepanelen ${provLabel}`}
        summary={`${stads.length} steden en lokale wijkanalyses voor de impact van stoppen met salderen.`}
        metrics={[
          { label: 'Steden', value: String(stads.length) },
          {
            label: 'Woningen',
            value: totalWoningen > 0 ? `${Math.round(totalWoningen / 1000)}k+` : '—',
          },
          { label: 'Deadline', value: '1 jan 2027', tone: 'warning' },
        ]}
      />

      <PseoConversionCard
        context={{
          landingPath: `/${provincie}`,
          pseoLevel: 'provincie',
          provincie,
        }}
        title={`Wat betekent 2027 voor uw woning in ${provLabel}?`}
        description="Provinciecijfers zijn gemiddelden. Vul uw adres in voor woningdata, netstatus en uw persoonlijke financiële impact."
        placeholder={`Uw adres in ${provLabel}`}
      />

      {urgentWijken.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <p className="text-sm font-semibold text-action">Focus 2027</p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Meest urgente wijken in {provLabel}
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Wijken met de zwaarste netdruk en het hoogste geschatte verschil na het einde van salderen — spring direct naar de wijkanalyse.
            </p>
            <div className="mt-6">
              <PseoCardGrid
                items={urgentWijken.map(wijk => ({
                  href: `/${provincie}/${wijk.stad}/${wijk.wijk}`,
                  title: toDisplaySlug(wijk.wijk),
                  meta: `${toDisplaySlug(wijk.stad)} · score ${wijk.gem_health_score ?? '—'}/100${wijk.gem_bouwjaar ? ` · bouwjaar ${wijk.gem_bouwjaar}` : ''}`,
                  status: toStatus(wijk.netcongestie_status),
                  analyticsLabel: `prov-urgent:${wijk.stad}:${wijk.wijk}`,
                }))}
              />
            </div>
          </Container>
        </section>
      )}

      <section className="bg-evergreen-900/40 py-12 sm:py-16">
        <Container>
          <p className="text-sm font-semibold text-trust">Steden</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Alle steden in {provLabel}</h2>
          <div className="mt-6">
            <PseoCardGrid
              items={stads.map(city => ({
                href: `/${provincie}/${city.stad}`,
                title: toDisplaySlug(city.stad),
                meta: city.totalWoningen > 0
                  ? `${city.totalWoningen.toLocaleString('nl-NL')} woningen · Bekijk wijken →`
                  : 'Bekijk wijken →',
                analyticsLabel: `prov-stad:${city.stad}`,
              }))}
            />
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <p className="text-sm font-semibold text-white/55">Andere provincies</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_PROVINCIE_SLUGS.filter(item => item !== provincie).map(item => (
              <Link
                key={item}
                href={`/${item}`}
                data-analytics-event="pseo_second_click"
                data-analytics-label={`prov-other:${item}`}
                className="min-h-11 content-center rounded-full border border-white/10 px-4 text-sm text-white/55 transition hover:border-trust/40 hover:text-white"
              >
                {provincieDisplaySlug(item)}
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </PseoPageShell>
  )
}
