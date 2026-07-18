import type { NormalizedReport } from '@/lib/report-model'
import { ReportAlert } from './ReportAlert'

function valueOrMissing(value: string | number | null): string {
  return value === null || value === '' ? 'Niet beschikbaar' : String(value)
}

export function ReportHomeAndGrid({ report }: { report: NormalizedReport }) {
  const statusClass = report.grid.status === 'ROOD'
    ? 'text-danger'
    : report.grid.status === 'ORANJE'
      ? 'text-warning'
      : 'text-trust-dark'

  return (
    <div className="space-y-4">
      {report.qualification.isEigenaar === false && (
        <ReportAlert title="U gaf aan huurder te zijn">
          Stem wijzigingen aan de woning eerst af met uw verhuurder of woningcorporatie.
        </ReportAlert>
      )}
      {report.grid.status === 'ROOD' && (
        <ReportAlert title="Netcongestie in uw regio" tone="danger">
          Dit is een regionale indicatie. Hoge netdruk kan gevolgen hebben voor nieuwe of
          zwaardere aansluitingen en lokale spanning, maar bewijst niet dat uw bestaande
          teruglevering actief wordt beperkt.
        </ReportAlert>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-xs uppercase tracking-wider">Woningtype</dt>
          <dd className="mt-1 font-semibold text-ink">{valueOrMissing(report.home.housingType)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Bouwjaar</dt>
          <dd className="mt-1 font-semibold text-ink">{valueOrMissing(report.home.buildYear)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Woonoppervlak</dt>
          <dd className="mt-1 font-semibold text-ink">
            {report.home.surfaceM2 === null ? 'Niet beschikbaar' : `${report.home.surfaceM2} m²`}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Dakoppervlak</dt>
          <dd className="mt-1 font-semibold text-ink">
            {report.home.roofSurfaceM2 === null ? 'Niet beschikbaar' : `${report.home.roofSurfaceM2} m²`}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Stroomnet</dt>
          <dd className={`mt-1 font-semibold ${statusClass}`}>{report.grid.status ?? 'Niet beschikbaar'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Netbeheerder</dt>
          <dd className="mt-1 font-semibold text-ink">{valueOrMissing(report.grid.operator)}</dd>
        </div>
      </dl>
      {report.grid.explanation && <p>{report.grid.explanation}</p>}
    </div>
  )
}
