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

  if (!hasMeterkast && !hasPlaatsing && !hasOmvormer) {
    return (
      <TechnicalBlock title="Geen fotoscans toegevoegd">
        <p>
          Dit rapport gebruikt de beschikbare woning-, stroomnet- en rekengegevens.
          Technische geschiktheid wordt altijd op locatie gevalideerd.
        </p>
      </TechnicalBlock>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {hasMeterkast && (
        <TechnicalBlock title="Meterkastscan">
          <p>
            {meterkast.merk ?? 'Merk onbekend'} · {meterkast.drieFase ? '3-fasen' : '1-fase'} ·{' '}
            {meterkast.vrijeGroepen} vrije groepen · {meterkast.geschikt ? 'Geschikt' : 'Aanpassing aanbevolen'}
          </p>
        </TechnicalBlock>
      )}
      {hasPlaatsing && (
        <TechnicalBlock title="Plaatsingsscan">
          <p>
            Foto-indicatie {plaatsing.geschiktheidScore}/10 ·{' '}
            {plaatsing.nenCompliant ? 'geen directe aandachtspunten zichtbaar' : 'controle op locatie aanbevolen'}
          </p>
        </TechnicalBlock>
      )}
      {hasOmvormer && (
        <TechnicalBlock title="Omvormerscan">
          <p>
            {[omvormer.merk, omvormer.model].filter(Boolean).join(' ') || 'Model onbekend'} ·{' '}
            {omvormer.hybrideKlaar ? 'Hybride-klaar' : 'Niet hybride-klaar'}
          </p>
        </TechnicalBlock>
      )}
    </div>
  )
}
