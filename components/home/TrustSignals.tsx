const signals = [
  {
    title: 'Officiële woningdata',
    text: 'Bouwjaar en woningkenmerken uit het BAG-register.',
  },
  {
    title: 'U houdt controle',
    text: 'Geen gegevensdeling zonder expliciete toestemming.',
  },
  {
    title: 'Begrijpelijk advies',
    text: 'Eerst uw uitkomst, daarna de technische onderbouwing.',
  },
]

export function TrustSignals() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {signals.map(signal => (
        <li key={signal.title} className="rounded-2xl border border-ink/10 bg-paper p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-trust/10 text-trust-dark">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
              <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink">{signal.title}</h2>
          <p className="mt-2 leading-7 text-ink-muted">{signal.text}</p>
        </li>
      ))}
    </ul>
  )
}
