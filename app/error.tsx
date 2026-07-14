'use client'

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4 text-ink">
      <div className="max-w-md rounded-3xl border border-ink/10 bg-paper p-8 text-center">
        <h1 className="text-3xl font-bold">Deze pagina kon niet worden geladen</h1>
        <p className="mt-3 leading-7 text-ink-muted">Uw gegevens zijn niet aangepast. Probeer de pagina opnieuw.</p>
        <button type="button" onClick={unstable_retry} className="mt-6 min-h-11 rounded-xl bg-action px-5 font-bold text-evergreen-950">
          Opnieuw proberen
        </button>
      </div>
    </main>
  )
}
