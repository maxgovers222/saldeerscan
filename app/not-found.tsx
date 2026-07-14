import Link from 'next/link'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'

export default function NotFound() {
  return (
    <PageShell className="flex flex-col">
      <SiteHeader />
      <main className="grid flex-1 place-items-center px-4 py-16">
        <div className="max-w-lg rounded-3xl border border-ink/10 bg-paper p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-trust-dark">404</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Deze pagina bestaat niet</h1>
          <p className="mt-3 leading-7 text-ink-muted">Ga terug naar de homepage, start uw gratis check of lees verder in de kennisbank.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="min-h-11 rounded-xl border border-ink/10 px-5 py-3 font-semibold text-ink">Home</Link>
            <Link href="/check" className="min-h-11 rounded-xl bg-action px-5 py-3 font-bold text-evergreen-950">Gratis check</Link>
            <Link href="/kennisbank" className="min-h-11 rounded-xl border border-ink/10 px-5 py-3 font-semibold text-ink">Kennisbank</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
