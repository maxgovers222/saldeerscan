import type { NormalizedReport } from '@/lib/report-model'

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

export function ReportImpact({ report }: { report: NormalizedReport }) {
  const scenarios = [
    ['Nu', report.scenarios.panelsNow],
    ['Met batterij', report.scenarios.withBattery],
    ['Wachten tot 2027', report.scenarios.waitUntil2027],
  ] as const

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider">Per maand</p>
          <p className="mt-1 font-bold font-mono text-ink">{euro(report.impact.monthlyLossEur)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider">Over vijf jaar</p>
          <p className="mt-1 font-bold font-mono text-ink">{euro(report.impact.fiveYearLossEur)}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink">Afbouw saldering</h3>
        <div className="mt-3 space-y-2">
          {report.salderingTimeline.map(item => (
            <div key={item.year} className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
              <span className="font-mono text-xs">{item.year}</span>
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-action"
                  style={{ width: `${Math.max(item.compensationPct, 2)}%` }}
                />
              </div>
              <span className="text-right font-mono text-xs text-ink">{item.compensationPct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink">Scenariovergelijking</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 text-ink-muted">
                <th className="py-2 pr-3 font-semibold">Scenario</th>
                <th className="px-3 py-2 text-right font-semibold">Besparing/jaar</th>
                <th className="px-3 py-2 text-right font-semibold">Investering</th>
                <th className="py-2 pl-3 text-right font-semibold">Terugverdientijd</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(([label, scenario]) => (
                <tr key={label} className="border-b border-ink/10 last:border-0">
                  <th className="py-3 pr-3 font-semibold text-ink">{label}</th>
                  <td className="px-3 py-3 text-right font-mono text-ink">{euro(scenario.besparingJaarEur)}</td>
                  <td className="px-3 py-3 text-right font-mono text-ink">{euro(scenario.investeringEur)}</td>
                  <td className="py-3 pl-3 text-right font-mono text-ink">
                    {Number.isFinite(scenario.terugverdientijdJaar)
                      ? `${scenario.terugverdientijdJaar} jaar`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
