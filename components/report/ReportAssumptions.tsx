import type { NormalizedReport } from '@/lib/report-model'

export function ReportAssumptions({ report }: { report: NormalizedReport }) {
  return <div className="space-y-3 text-sm leading-6 text-ink-muted">
    {report.calculation ? <>
      <p>Extra jaarwaarde batterij: €{report.calculation.batteryExtraAnnualEur.toLocaleString('nl-NL')}. Investering: €{report.calculation.batteryInvestmentEur.toLocaleString('nl-NL')}. Extra eenvoudige terugverdientijd: {report.calculation.batteryPaybackYears === null ? 'geen positieve terugverdienwaarde' : `${report.calculation.batteryPaybackYears} jaar`}.</p>
      <ul className="list-disc space-y-2 pl-5">{report.calculation.assumptions.map(line => <li key={line}>{line}</li>)}</ul>
    </> : <p>Dit oudere rapport bevat geen opgeslagen contractinvoer. De oorspronkelijke cijfers gebruiken indicatieve tarieven en huishoudschattingen. Maak een nieuwe scan om uw eigen waarden toe te voegen.</p>}
    <a href="https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen" target="_blank" rel="noopener noreferrer" className="font-semibold underline">ACM: salderen, vergoeding en terugleverkosten</a>
  </div>
}
