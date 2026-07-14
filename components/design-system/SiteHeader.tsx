import Link from 'next/link'
import { BrandMark } from './BrandMark'
import { Container } from './Container'
import { PrimaryAction } from './PrimaryAction'

export interface SiteHeaderProps {
  tone?: 'dark' | 'light'
  compact?: boolean
  contextLabel?: string
  ctaHref?: string
  ctaLabel?: string
  showPrimaryAction?: boolean
}

export function SiteHeader({
  tone = 'light',
  compact = false,
  contextLabel,
  ctaHref = '/check',
  ctaLabel = 'Gratis check',
  showPrimaryAction = true,
}: SiteHeaderProps) {
  const dark = tone === 'dark'

  return (
    <header className={dark ? 'border-b border-white/10 bg-evergreen-950 text-white' : 'border-b border-ink/10 bg-paper text-ink'}>
      <Container>
        <nav
          aria-label="Hoofdnavigatie"
          className={`flex items-center justify-between gap-3 ${compact ? 'min-h-14' : 'min-h-16'}`}
        >
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="SaldeerScan.nl">
            <BrandMark className={compact ? 'size-8 rounded-lg' : undefined} />
            <span className="min-w-0">
              <span className="block truncate font-heading text-base font-bold tracking-tight sm:text-lg">
                SaldeerScan<span className="text-trust">.nl</span>
              </span>
              {contextLabel && (
                <span className={dark ? 'block truncate text-xs text-white/55' : 'block truncate text-xs text-ink-muted'}>
                  {contextLabel}
                </span>
              )}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/kennisbank"
              className={dark ? 'hidden text-sm text-white/60 transition hover:text-white md:block' : 'hidden text-sm text-ink-muted transition hover:text-ink md:block'}
            >
              Kennisbank
            </Link>
            <Link
              href="/nieuws"
              className={dark ? 'hidden text-sm text-white/60 transition hover:text-white md:block' : 'hidden text-sm text-ink-muted transition hover:text-ink md:block'}
            >
              Nieuws
            </Link>
            {showPrimaryAction && (
              <PrimaryAction href={ctaHref} className={compact ? 'px-4 py-2' : undefined}>
                {ctaLabel}
              </PrimaryAction>
            )}
          </div>
        </nav>
      </Container>
    </header>
  )
}
