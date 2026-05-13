import Link from 'next/link'
import { getTopStadden, getTopWijken } from '@/lib/pseo'
import { toDisplaySlug } from '@/lib/pseo-hubs'

export async function HomeDiscovery() {
  const [steden, wijken] = await Promise.all([
    getTopStadden(6),
    getTopWijken(8),
  ])

  if (steden.length === 0 && wijken.length === 0) return null

  return (
    <section className="py-10 px-6 border-b border-white/10" style={{ background: '#0f172a' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          {motionGridHeader()}
          <Link
            href="/postcode/1012"
            data-analytics-event="pseo_second_click"
            data-analytics-label="home:postcode-hub"
            className="inline-flex items-center justify-center rounded-full border border-amber-500/30 px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
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
                  className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm font-semibold text-white hover:border-amber-500/30 hover:text-amber-300 transition-colors"
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
      </div>
    </section>
  )
}

function motionGridHeader() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-2">
        Regionale hubs
      </p>
      <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
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
          className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 hover:border-amber-500/30 transition-colors"
        >
          <p className="text-sm font-semibold text-white hover:text-amber-300 transition-colors">
            {toDisplaySlug(wijk)}
          </p>
          <p className="text-xs text-white/40 mt-1">{toDisplaySlug(stad)}</p>
        </Link>
      ))}
    </div>
  )
}
