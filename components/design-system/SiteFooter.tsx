import Link from 'next/link'
import { BrandMark } from './BrandMark'
import { Container } from './Container'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-evergreen-950 py-10 text-white">
      <Container className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Naar de homepage">
            <BrandMark className="size-8 rounded-lg" />
            <span className="font-heading font-bold">SaldeerScan.nl</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
            Gratis energieanalyse voor Nederlandse woningeigenaren.
          </p>
          <a
            className="mt-2 inline-block text-sm text-white/60 transition hover:text-white"
            href="mailto:info@saldeerscan.nl"
            aria-label="E-mail klantenservice"
          >
            info@saldeerscan.nl
          </a>
        </div>
        <div className="sm:text-right">
          <nav aria-label="Voettekstnavigatie" className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/55 sm:justify-end">
            <Link href="/kennisbank" className="transition hover:text-white">Kennisbank</Link>
            <Link href="/nieuws" className="transition hover:text-white">Nieuws</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacyverklaring</Link>
            <Link href="/check" className="transition hover:text-white">Analyseer uw woning</Link>
          </nav>
          <p className="mt-5 text-xs text-white/30">© {new Date().getFullYear()} SaldeerScan.nl</p>
        </div>
      </Container>
    </footer>
  )
}
