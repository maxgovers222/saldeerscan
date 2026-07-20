import type { NormalizedReport } from '@/lib/report-model'

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

export function ReportRecommendation({ report }: { report: NormalizedReport }) {
  const recommendation = report.recommendation
  const existing = report.qualification.heeftPanelen === true

  return (
    <div className="space-y-4">
      <p>{recommendation.explanation}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-xs uppercase tracking-wider">Configuratie</dt>
          <dd className="mt-1 font-semibold text-ink">
            {existing
              ? `Huidige installatie: ${recommendation.existingPanelCount ?? 'onbekend'} panelen`
              : `${recommendation.panelCount} zonnepanelen`}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Batterij</dt>
          <dd className="mt-1 font-semibold text-ink">
            {recommendation.batteryCapacityKwh === null
              ? 'Niet geadviseerd'
              : `${recommendation.batteryCapacityKwh} kWh`}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Investering</dt>
          <dd className="mt-1 font-semibold font-mono text-ink">{euro(recommendation.investmentEur)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Opbrengst</dt>
          <dd className="mt-1 font-semibold font-mono text-ink">
            {recommendation.productionKwh.toLocaleString('nl-NL')} kWh/jaar
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Verbruik</dt>
          <dd className="mt-1 font-semibold font-mono text-ink">
            {recommendation.consumptionKwh.toLocaleString('nl-NL')} kWh/jaar
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Eigen gebruik</dt>
          <dd className="mt-1 font-semibold font-mono text-ink">{recommendation.ownUsePct}%</dd>
        </div>
      </dl>
      {existing && recommendation.batteryCapacityKwh !== null && recommendation.extraAnnualSavingEur !== null && (
        <p className="rounded-xl bg-trust/10 px-4 py-3 text-trust-dark">
          Opslagvoordeel: <strong>{euro(recommendation.extraAnnualSavingEur)} per jaar</strong>.
        </p>
      )}
      {recommendation.isdeAmountEur > 0 && (
        <p className="rounded-xl bg-action/10 px-4 py-3 text-ink">
          Indicatieve ISDE-bijdrage: <strong>{euro(recommendation.isdeAmountEur)}</strong>.
        </p>
      )}
    </div>
  )
}
