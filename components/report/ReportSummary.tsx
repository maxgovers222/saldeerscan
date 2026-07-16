import type { NormalizedReport } from '@/lib/report-model'
import { ReportMetric } from './ReportMetric'

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

export function ReportSummary({ report }: { report: NormalizedReport }) {
  const existing = report.qualification.heeftPanelen === true
  const existingCount = report.recommendation.existingPanelCount
  const extraSaving = report.recommendation.extraAnnualSavingEur

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-action/35 bg-action/10 p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">
          Mogelijk verlies vanaf 2027
        </p>
        <p
          data-testid="report-annual-loss"
          className="mt-2 text-4xl font-black font-mono tracking-tight text-warning sm:text-5xl"
        >
          −{euro(report.impact.annualLossEur)} per jaar
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
          {report.impact.explanation}
        </p>
      </div>

      <div
        data-testid="report-supporting-metrics"
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        <ReportMetric
          label="Mogelijke besparing"
          value={`${euro(report.summary.annualSavingEur)}/jaar`}
          tone="positive"
        />
        <ReportMetric
          label="Terugverdientijd"
          value={report.summary.paybackYears === null ? 'Nader te bepalen' : `${report.summary.paybackYears} jaar`}
        />
        <div className="col-span-2 lg:col-span-1">
          <ReportMetric
            label="Woning-score"
            value={report.summary.healthScore === null ? 'Niet beschikbaar' : `${report.summary.healthScore}/100`}
            detail={report.summary.healthLabel ?? undefined}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-trust/25 bg-trust/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-trust-dark">Ons advies</p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          {report.recommendation.primarySolution}
        </h2>
        {existing ? (
          <div className="mt-2 space-y-1 text-sm leading-6 text-ink-muted">
            <p>
              <strong className="text-ink">{existingCount ?? 'Onbekend aantal'} bestaande panelen</strong>
              {' '}blijven onderdeel van uw installatie.
            </p>
            {extraSaving !== null && (
              <p><strong className="text-ink">{euro(extraSaving)} per jaar extra</strong> door opslag en slimmer verbruik.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Een configuratie met <strong className="text-ink">{report.recommendation.panelCount} panelen</strong>
            {report.recommendation.batteryCapacityKwh
              ? <> en een <strong className="text-ink">{report.recommendation.batteryCapacityKwh} kWh batterij</strong></>
              : null}.
          </p>
        )}
      </div>
    </section>
  )
}
