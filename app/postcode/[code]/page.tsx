import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWijkenByPostcode } from '@/lib/pseo'
import { buildBreadcrumbListLd, hubBreadcrumbItems } from '@/lib/pseo-hubs'
import { buildPostcodeHubGraphLd } from '@/lib/json-ld'
import { buildPostcodeMetadata } from '@/lib/pseo-metadata'
import { postcodeClusterSummary, resolveWijkScore } from '@/lib/pseo-variation'
import { buildCheckHref } from '@/lib/conversion-context'

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

export default async function PostcodePage({ params }: Props) {
  const { code } = await params
  const clean = code.toUpperCase().replace(/\s/g, '')
  const prefix = clean.slice(0, 4)
  if (!/^\d{4}$/.test(prefix)) notFound()

  const wijken = await getWijkenByPostcode(prefix)
  const cluster = postcodeClusterSummary(wijken)
  const crumbs = hubBreadcrumbItems({ postcode: prefix })
  const breadcrumbLd = buildBreadcrumbListLd(crumbs)

  const first = wijken[0]
  const topProv = first?.provincie
  const topStad = first?.stad
  const checkHref = buildCheckHref({
    landingPath: `/postcode/${prefix}`,
    pseoLevel: 'postcode',
    postcode: prefix,
  })
  const regionalCheckHref = first
    ? buildCheckHref({
        landingPath: `/postcode/${prefix}`,
        pseoLevel: 'postcode',
        postcode: prefix,
        provincie: first.provincie,
        stad: first.stad,
        wijk: first.wijk,
      })
    : checkHref

  const G = '#00aa65'

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #020617, #0f172a)' }}>
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-white/8">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: G }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-base" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              SaldeerScan<span style={{ color: G }}>.nl</span>
            </span>
          </a>
          <a
            href={checkHref}
            data-analytics-event="pseo_check_cta"
            data-analytics-label={`postcode-nav:${prefix}`}
            className="text-xs font-bold px-4 py-2 rounded-full bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 transition-all"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Gratis check
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <nav className="text-xs font-sans text-slate-500 mb-6">
          {crumbs.map((c, i) => (
            <span key={`${c.href}-${i}`}>
              {i > 0 && <span className="text-slate-600 mx-1">›</span>}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-slate-300 transition-colors">{c.name}</Link>
              ) : (
                <span className="text-slate-400">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Zonnepanelen postcode {prefix}
        </h1>
        <p className="text-slate-400 font-sans mb-6 leading-relaxed">
          Netcongestiestatus en zonnepanelen-potentie voor postcode {prefix} en omgeving.
          {cluster.wijkCount > 0 && <> {cluster.kop}</>}
          Kies uw wijk voor een gedetailleerd overzicht.
        </p>

        {topProv && topStad && (
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href={`/${topProv}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`postcode:prov:${topProv}`}
              className="text-xs font-sans px-4 py-2 rounded-full border border-white/10 text-slate-300 hover:border-amber-500/30 hover:text-amber-300 transition-colors"
            >
              Provinciehub {topProv.replace(/-/g, ' ')}
            </Link>
            <Link
              href={`/${topProv}/${topStad}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`postcode:stad:${topStad}`}
              className="text-xs font-sans px-4 py-2 rounded-full border border-white/10 text-slate-300 hover:border-amber-500/30 hover:text-amber-300 transition-colors"
            >
              Stadhub {topStad.replace(/-/g, ' ')}
            </Link>
          </div>
        )}

        {wijken.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 font-sans mb-6">
              Nog geen data beschikbaar voor postcode {prefix}.
            </p>
            <Link href={checkHref}
              data-analytics-event="pseo_check_cta"
              data-analytics-label={`postcode-empty:${prefix}`}
              className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-5 py-3 font-sans text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white">
              Bereken uw persoonlijke potentie →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {wijken.map(w => {
                const score = resolveWijkScore(w.gem_bouwjaar, w.gem_health_score)
                return (
                  <Link
                    key={`${w.provincie}/${w.stad}/${w.wijk}`}
                    href={`/${w.provincie}/${w.stad}/${w.wijk}`}
                    data-analytics-event="pseo_second_click"
                    data-analytics-label={`postcode:wijk:${w.wijk}`}
                    className="flex items-center justify-between bg-slate-900/40 border border-white/10 rounded-xl px-5 py-4 hover:border-amber-500/30 transition-colors group"
                  >
                    <div>
                      <p className="font-sans font-medium text-white capitalize group-hover:text-amber-300 transition-colors">
                        {w.wijk.replace(/-/g, ' ')}
                      </p>
                      <p className="text-sm font-sans text-slate-500 capitalize">{w.stad.replace(/-/g, ' ')}</p>
                      <p className="text-[11px] font-mono text-slate-600 mt-1">
                        Score {score}/100{w.gem_bouwjaar ? ` · bouwjaar ${w.gem_bouwjaar}` : ''}
                      </p>
                    </div>
                    {w.netcongestie_status && (
                      <span className={[
                        'text-xs font-sans px-2 py-1 rounded-md shrink-0',
                        w.netcongestie_status === 'ROOD' ? 'bg-red-950/50 text-red-400' :
                        w.netcongestie_status === 'ORANJE' ? 'bg-amber-950/50 text-amber-400' :
                        'bg-emerald-950/50 text-emerald-400'
                      ].join(' ')}>
                        {w.netcongestie_status}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href={regionalCheckHref}
                data-analytics-event="pseo_check_cta"
                data-analytics-label={`postcode-prefill:${prefix}`}
                className="w-full rounded-xl border border-white/15 px-6 py-3 text-center font-sans text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white sm:w-auto"
              >
                Start check in deze regio →
              </Link>
              <Link
                href="/check"
                data-analytics-event="pseo_check_cta"
                data-analytics-label={`postcode-generic:${prefix}`}
                className="text-sm text-slate-400 hover:text-amber-300 transition-colors"
              >
                Of ga direct naar de landelijke check
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
