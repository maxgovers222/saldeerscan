import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/design-system/Container'
import { PseoCardGrid } from '@/components/pseo/PseoCardGrid'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { PseoHero } from '@/components/pseo/PseoHero'
import { PseoPageShell } from '@/components/pseo/PseoPageShell'
import type { PseoStatus } from '@/components/pseo/PseoStatusBadge'
import type { ConversionContext } from '@/lib/conversion-context'
import { buildPostcodeHubGraphLd } from '@/lib/json-ld'
import { getWijkenByPostcode } from '@/lib/pseo'
import { buildBreadcrumbListLd, hubBreadcrumbItems } from '@/lib/pseo-hubs'
import { buildPostcodeMetadata } from '@/lib/pseo-metadata'
import { postcodeClusterSummary, resolveWijkScore } from '@/lib/pseo-variation'

interface Props { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const clean = code.toUpperCase().replace(/\s/g, '')
  const prefix = clean.slice(0, 4)
  if (!/^\d{4}$/.test(prefix)) return {}
  const wijken = await getWijkenByPostcode(prefix)
  const cluster = postcodeClusterSummary(wijken)
  return buildPostcodeMetadata(prefix, cluster)
}

export const revalidate = 2592000 // 30 dagen ISR

function toStatus(status: string | null): PseoStatus | undefined {
  return status === 'ROOD' || status === 'ORANJE' || status === 'GROEN'
    ? status
    : undefined
}

export default async function PostcodePage({ params }: Props) {
  const { code } = await params
  const clean = code.toUpperCase().replace(/\s/g, '')
  const prefix = clean.slice(0, 4)
  if (!/^\d{4}$/.test(prefix)) notFound()

  const wijken = await getWijkenByPostcode(prefix)
  const cluster = postcodeClusterSummary(wijken)
  const breadcrumbLd = buildBreadcrumbListLd(hubBreadcrumbItems({ postcode: prefix }))

  const first = wijken[0]
  const topProv = first?.provincie
  const topStad = first?.stad
  const conversionContext: ConversionContext = {
    landingPath: `/postcode/${prefix}`,
    pseoLevel: 'postcode',
    postcode: prefix,
    provincie: topProv,
    stad: topStad,
  }
  return (
    <PseoPageShell headerContext={`Postcode ${prefix}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            wijken.length > 0
              ? buildPostcodeHubGraphLd({ postcode: prefix, wijken })
              : {
                  '@context': 'https://schema.org',
                  '@type': 'WebPage',
                  name: `Zonnepanelen postcode ${prefix}`,
                  description: `Netcongestiestatus en zonnepanelen-potentie voor postcode ${prefix} en omgeving.`,
                  url: `https://saldeerscan.nl/postcode/${prefix}`,
                  inLanguage: 'nl-NL',
                },
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <PseoHero
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: `Postcode ${prefix}` },
        ]}
        eyebrow="Lokale postcodeanalyse"
        title={`Zonnepanelen postcode ${prefix}`}
        summary={`Bekijk wijken, netdruk en woningfit rond postcode ${prefix}.`}
        metrics={[
          { label: 'Wijken', value: String(cluster.wijkCount) },
          { label: 'Steden', value: String(cluster.uniekeSteden) },
          { label: 'Postcode', value: prefix },
        ]}
      />

      <PseoConversionCard
        context={conversionContext}
        title={`Uw woning in postcode ${prefix} controleren`}
        description="Postcodecijfers zijn een startpunt. Vul uw volledige adres in voor uw persoonlijke rapport."
        placeholder={`Adres in postcode ${prefix}`}
      />

      <section className="py-12 sm:py-16">
        <Container>
          {topProv && topStad && (
            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                href={`/${topProv}`}
                data-analytics-event="pseo_second_click"
                data-analytics-label={`postcode:prov:${topProv}`}
                className="min-h-11 content-center rounded-full border border-white/10 px-4 text-sm text-white/65 transition hover:border-trust/40 hover:text-white"
              >
                Provinciehub {topProv.replace(/-/g, ' ')}
              </Link>
              <Link
                href={`/${topProv}/${topStad}`}
                data-analytics-event="pseo_second_click"
                data-analytics-label={`postcode:stad:${topStad}`}
                className="min-h-11 content-center rounded-full border border-white/10 px-4 text-sm text-white/65 transition hover:border-trust/40 hover:text-white"
              >
                Stadhub {topStad.replace(/-/g, ' ')}
              </Link>
            </div>
          )}

          {wijken.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-evergreen-900/70 p-8 text-center">
              <p className="text-white/55">Nog geen data beschikbaar voor postcode {prefix}.</p>
              <Link
                href="#adrescheck"
                data-analytics-event="pseo_check_cta"
                data-analytics-label={`postcode-empty:${prefix}`}
                className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/65 transition hover:border-trust/40 hover:text-white"
              >
                Bereken uw persoonlijke potentie →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-trust">Lokale wijken</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Wijken rond postcode {prefix}</h2>
              <p className="mt-3 max-w-2xl text-white/55">{cluster.kop}</p>
              <div className="mt-6">
                <PseoCardGrid
                  items={wijken.map(wijk => {
                    const score = resolveWijkScore(wijk.gem_bouwjaar, wijk.gem_health_score)
                    return {
                      href: `/${wijk.provincie}/${wijk.stad}/${wijk.wijk}`,
                      title: wijk.wijk.replace(/-/g, ' '),
                      meta: `${wijk.stad.replace(/-/g, ' ')} · Score ${score}/100${wijk.gem_bouwjaar ? ` · bouwjaar ${wijk.gem_bouwjaar}` : ''}`,
                      status: toStatus(wijk.netcongestie_status),
                      analyticsLabel: `postcode:wijk:${wijk.wijk}`,
                    }
                  })}
                />
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="#adrescheck"
                  data-analytics-event="pseo_check_cta"
                  data-analytics-label={`postcode-generic:${prefix}`}
                  className="inline-flex min-h-11 items-center text-sm text-white/55 transition hover:text-action"
                >
                  Of ga direct naar de landelijke check
                </Link>
              </div>
            </>
          )}
        </Container>
      </section>
    </PseoPageShell>
  )
}
