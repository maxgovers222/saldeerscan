import type { ReactNode } from 'react'
import type { NormalizedReport } from '@/lib/report-model'

function TechnicalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-mist px-4 py-3">
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function ReportTechnical({ report }: { report: NormalizedReport }) {
  const { meterkast, plaatsing, omvormer } = report.technical
  const hasMeterkast = meterkast && typeof meterkast.geschikt === 'boolean'
  const hasPlaatsing = plaatsing && typeof plaatsing.geschiktheidScore === 'number'
  const hasOmvormer = omvormer && typeof omvormer.hybrideKlaar === 'boolean'

  return (
    <div className="space-y-3">
      <TechnicalBlock title="Meterkastscan">
        {hasMeterkast ? (
          <p>
            {meterkast.merk ?? 'Merk onbekend'} · {meterkast.drieFase ? '3-fasen' : '1-fase'} ·{' '}
            {meterkast.vrijeGroepen} vrije groepen · {meterkast.geschikt ? 'Geschikt' : 'Aanpassing aanbevolen'}
          </p>
        ) : <p>Niet toegevoegd</p>}
      </TechnicalBlock>
      <TechnicalBlock title="Plaatsingsscan">
        {hasPlaatsing ? (
          <p>
            Geschiktheid {plaatsing.geschiktheidScore}/100 ·{' '}
            {plaatsing.nenCompliant ? 'NEN-conform' : 'NEN-controle aanbevolen'}
          </p>
        ) : <p>Niet toegevoegd</p>}
      </TechnicalBlock>
      <TechnicalBlock title="Omvormerscan">
        {hasOmvormer ? (
          <p>
            {[omvormer.merk, omvormer.model].filter(Boolean).join(' ') || 'Model onbekend'} ·{' '}
            {omvormer.hybrideKlaar ? 'Hybride-klaar' : 'Niet hybride-klaar'}
          </p>
        ) : <p>Niet toegevoegd</p>}
      </TechnicalBlock>
    </div>
  )
}
