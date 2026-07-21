import type { NormalizedReport } from '@/lib/report-model'
import { ReportAlert } from './ReportAlert'

export function ReportHomeAndGrid({ report }: { report: NormalizedReport }) {
  const statusClass = report.grid.status === 'ROOD'
    ? 'text-danger'
    : report.grid.status === 'ORANJE'
      ? 'text-warning'
      : 'text-trust-dark'
  const details: Array<{ label: string; value: string; valueClass?: string }> = []
  if (report.home.housingType) details.push({ label: 'Woningtype', value: report.home.housingType })
  if (report.home.buildYear !== null) details.push({ label: 'Bouwjaar', value: String(report.home.buildYear) })
  if (report.home.surfaceM2 !== null) details.push({ label: 'Woonoppervlak', value: `${report.home.surfaceM2} m²` })
  if (report.home.roofSurfaceM2 !== null) details.push({ label: 'Dakoppervlak', value: `${report.home.roofSurfaceM2} m²` })
  if (report.grid.status) details.push({ label: 'Stroomnet', value: report.grid.status, valueClass: statusClass })
  if (report.grid.operator) details.push({ label: 'Netbeheerder', value: report.grid.operator })

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
        {details.map(detail => (
          <div key={detail.label}>
            <dt className="text-xs uppercase tracking-wider">{detail.label}</dt>
            <dd className={`mt-1 font-semibold ${detail.valueClass ?? 'text-ink'}`}>
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>
      {details.length === 0 && (
        <p>Er zijn geen aanvullende woning- of stroomnetgegevens beschikbaar.</p>
      )}
      {report.grid.explanation && <p>{report.grid.explanation}</p>}
    </div>
  )
}
