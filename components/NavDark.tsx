import Link from 'next/link'

const G = '#f59e0b'

export function NavDark() {
  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(2,6,23,0.95)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: G }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            SaldeerScan<span style={{ color: G }}>.nl</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/kennisbank" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
            Kennisbank
          </Link>
          <Link href="/nieuws" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
            Nieuws
          </Link>
          <Link
            href="/check"
            className="text-sm px-4 py-2 rounded-lg font-semibold text-slate-950"
            style={{ background: G, boxShadow: '0 0 20px rgba(245,158,11,0.35)' }}
          >
            Gratis check
          </Link>
        </div>
      </div>
    </nav>
  )
}

export function FooterDark() {
  return (
    <footer className="py-10 px-6 border-t" style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: G }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-heading)' }}>SaldeerScan.nl</span>
        </div>
        <div className="flex flex-wrap gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/kennisbank" className="hover:text-white/60 transition-colors">Kennisbank</Link>
          <Link href="/nieuws" className="hover:text-white/60 transition-colors">Nieuws</Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacyverklaring</Link>
          <Link href="/check" className="hover:text-white/60 transition-colors">Analyseer uw woning</Link>
        </div>
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>© {new Date().getFullYear()} SaldeerScan.nl</p>
      </div>
    </footer>
  )
}
