export function InsightPreview() {
  return (
    <aside
      aria-label="Voorbeeld van uw inzicht"
      className="rounded-3xl border border-white/10 bg-evergreen-900 p-5 shadow-2xl shadow-black/20 sm:p-7"
    >
      <p className="text-sm font-semibold text-trust">Voorbeeld van uw inzicht</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
          <dt className="text-sm text-white/55">Mogelijk verlies vanaf 2027</dt>
          <dd className="mt-2 font-mono text-3xl font-bold text-action">− € 420/jaar</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-sm text-white/55">Mogelijke jaarlijkse besparing</dt>
          <dd className="mt-2 font-mono text-xl font-bold text-white">€ 680/jaar</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-sm text-white/55">Voorbeeldscore</dt>
          <dd className="mt-2 font-mono text-xl font-bold text-white">74/100</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-white/50">
        Persoonlijke waarden volgen na uw adrescheck
      </p>
    </aside>
  )
}
