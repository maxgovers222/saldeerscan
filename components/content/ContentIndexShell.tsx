import type { ReactNode } from 'react'
import Link from 'next/link'
import { Container } from '@/components/design-system/Container'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'

export function ContentIndexShell({
  kind,
  title,
  intro,
  children,
}: {
  kind: 'kennisbank' | 'nieuws'
  title: string
  intro: string
  children: ReactNode
}) {
  const contextLabel = kind === 'kennisbank' ? 'Kennisbank' : 'Nieuws'

  return (
    <PageShell className="flex flex-col">
      <SiteHeader contextLabel={contextLabel} />
      <main id="main-content" className="flex-1">
        <Container className="py-3">
          <nav aria-label="Kruimelpad" className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/" className="transition hover:text-ink">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{contextLabel}</span>
          </nav>
        </Container>
        <Container className="pb-10 pt-12 sm:pb-12 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-trust-dark">
            {kind === 'kennisbank' ? 'Saldering stopt 1 jan 2027' : 'Wekelijks bijgewerkt'}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-muted">{intro}</p>
        </Container>
        {children}
      </main>
      <SiteFooter />
    </PageShell>
  )
}
