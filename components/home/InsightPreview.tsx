export function InsightPreview() {
  return <aside aria-label="Fictief rekenvoorbeeld" className="rounded-3xl border border-white/10 bg-evergreen-900 p-5 shadow-2xl shadow-black/20 sm:p-7">
    <p className="text-sm font-semibold text-trust">Fictief rekenvoorbeeld · bestaande zonnepanelen</p>
    <dl className="mt-6 grid gap-3 sm:grid-cols-2">
      {[
        ['Jaarwaarde in 2026', '€ 970'],
        ['Dezelfde woning in 2027', '€ 440'],
        ['Verschil per jaar', '− € 530'],
        ['Extra jaarvoordeel met batterij', '€ 380'],
      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><dt className="text-sm text-white/65">{label}</dt><dd className="mt-2 font-mono text-xl font-bold text-white">{value}</dd></div>)}
    </dl>
    <p className="mt-5 text-sm leading-6 text-white/65">Een batterij van € 5.000 verdient zich in dit voorbeeld in 13,2 jaar terug. Dit model adviseert dan geen batterij. Het verloren salderingsvoordeel is niet hetzelfde als het batterijvoordeel.</p>
    <p className="mt-3 text-xs leading-5 text-white/60">4.000 kWh productie en verbruik, 25% direct eigen gebruik. Fictieve tarieven en terugleverkosten; geen verwachting voor uw woning.</p>
    <a href="/methode" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-trust underline underline-offset-4">Controleer alle aannames en de berekening</a>
  </aside>
}
