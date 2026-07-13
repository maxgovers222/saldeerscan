import Link from 'next/link'
import { getTopStadden, getTopWijken } from '@/lib/pseo'
import { toDisplaySlug } from '@/lib/pseo-hubs'
import { Container } from '@/components/design-system/Container'

export async function HomeDiscovery() {
  const [steden, wijken] = await Promise.all([
    getTopStadden(6),
    getTopWijken(8),
  ])

  if (steden.length === 0 && wijken.length === 0) return null

  return (
    <section className="border-y border-white/10 bg-evergreen-900 py-12 text-white sm:py-16">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          {motionGridHeader()}
          <Link
            href="/postcode/1012"
            data-analytics-event="pseo_second_click"
            data-analytics-label="home:postcode-hub"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/65 transition-colors hover:border-white/30 hover:text-white"
          >
            Zoek op postcode →
          </Link>
        </div>

        {steden.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3">Steden</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {steden.map(({ provincie, stad }) => (
                <Link
                  key={`${provincie}/${stad}`}
                  href={`/${provincie}/${stad}`}
                  data-analytics-event="pseo_second_click"
                  data-analytics-label={`home:stad:${stad}`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-trust/40 hover:text-trust"
                >
                  {toDisplaySlug(stad)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {wijken.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3">Wijken</p>
            {motionGridWijken(wijken)}
          </div>
        )}
      </Container>
    </section>
  )
}

function motionGridHeader() {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-trust">
        Regionale hubs
      </p>
      <h2 className="font-heading text-2xl font-bold text-white">
        Populaire steden en wijken
      </h2>
      <p className="text-sm text-white/50 mt-2 max-w-2xl">
        Spring direct naar een stad- of wijk-analyse, of zoek via uw postcode.
      </p>
    </div>
  )
}

function motionGridWijken(wijken: Awaited<ReturnType<typeof getTopWijken>>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {wijken.map(({ provincie, stad, wijk }) => (
        <Link
          key={`${provincie}/${stad}/${wijk}`}
          href={`/${provincie}/${stad}/${wijk}`}
          data-analytics-event="pseo_second_click"
          data-analytics-label={`home:wijk:${wijk}`}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-trust/40"
        >
          <p className="text-sm font-semibold text-white transition-colors hover:text-trust">
            {toDisplaySlug(wijk)}
          </p>
          <p className="text-xs text-white/40 mt-1">{toDisplaySlug(stad)}</p>
        </Link>
      ))}
    </div>
  )
}
