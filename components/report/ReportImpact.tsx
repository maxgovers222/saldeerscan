import type { NormalizedReport } from '@/lib/report-model'

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

export function ReportImpact({ report }: { report: NormalizedReport }) {
  const existing = report.qualification.heeftPanelen === true
  const scenarios = existing
    ? [
        {
          label: 'Huidige installatie (2026)',
          saving: report.scenarios.panelsNow.besparingJaarEur,
          investment: 0,
          paybackYears: null,
        },
        {
          label: 'Vanaf 2027 met batterij',
          saving: report.scenarios.withBattery.besparingJaarEur,
          investment: report.recommendation.investmentEur,
          paybackYears: report.recommendation.paybackYears,
        },
        {
          label: 'Vanaf 2027 zonder batterij',
          saving: report.scenarios.waitUntil2027.besparingJaarEur,
          investment: 0,
          paybackYears: null,
        },
      ]
    : [
        {
          label: 'Nu',
          saving: report.scenarios.panelsNow.besparingJaarEur,
          investment: report.scenarios.panelsNow.investeringEur,
          paybackYears: report.scenarios.panelsNow.terugverdientijdJaar,
        },
        {
          label: 'Met batterij',
          saving: report.scenarios.withBattery.besparingJaarEur,
          investment: report.scenarios.withBattery.investeringEur,
          paybackYears: report.scenarios.withBattery.terugverdientijdJaar,
        },
        {
          label: 'Wachten tot 2027',
          saving: report.scenarios.waitUntil2027.besparingJaarEur,
          investment: report.scenarios.waitUntil2027.investeringEur,
          paybackYears: report.scenarios.waitUntil2027.terugverdientijdJaar,
        },
      ]

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
        <h3 className="font-semibold text-ink">Einde salderen</h3>
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
        <div data-testid="report-scenario-scroll" className="mt-3 overflow-x-auto">
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
              {scenarios.map(scenario => (
                <tr key={scenario.label} className="border-b border-ink/10 last:border-0">
                  <th className="py-3 pr-3 font-semibold text-ink">{scenario.label}</th>
                  <td className="px-3 py-3 text-right font-mono text-ink">{euro(scenario.saving)}</td>
                  <td className="px-3 py-3 text-right font-mono text-ink">{euro(scenario.investment)}</td>
                  <td className="py-3 pl-3 text-right font-mono text-ink">
                    {scenario.paybackYears !== null && Number.isFinite(scenario.paybackYears)
                      ? `${scenario.paybackYears} jaar`
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
