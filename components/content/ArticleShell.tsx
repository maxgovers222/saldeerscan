import type { ReactNode } from 'react'
import Link from 'next/link'
import { Container } from '@/components/design-system/Container'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'

interface ArticleShellProps {
  kind: 'kennisbank' | 'nieuws'
  title: string
  intro?: string | null
  date?: string | null
  category?: string | null
  slug: string
  children: ReactNode
  aside?: ReactNode
}

export function ArticleShell({
  kind,
  title,
  intro,
  date,
  category,
  slug,
  children,
  aside,
}: ArticleShellProps) {
  const contextLabel = kind === 'kennisbank' ? 'Kennisbank' : 'Nieuws'
  const landingPath = `/${kind}/${slug}`

  return (
    <PageShell className="flex flex-col">
      <SiteHeader contextLabel={contextLabel} />
      <main id="main-content" className="flex-1">
        <Container className="py-3">
          <nav aria-label="Kruimelpad" className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Link href="/" className="transition hover:text-ink">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${kind}`} className="transition hover:text-ink">{contextLabel}</Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-xs truncate text-ink">{title}</span>
          </nav>
        </Container>
        <Container className="py-10 sm:py-14">
          <div className={aside ? 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start' : undefined}>
            <article className="min-w-0 rounded-3xl border border-ink/10 bg-paper p-5 shadow-sm sm:p-8 lg:p-10">
              <div className="mx-auto max-w-[72ch]">
                {(category || date) && (
                  <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
                    {category && <span className="rounded-full bg-trust/10 px-3 py-1 font-semibold text-trust-dark">{category}</span>}
                    {date && <span className="font-mono text-ink-muted">{date}</span>}
                  </div>
                )}
                <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">{title}</h1>
                {intro && <p className="mt-5 border-l-2 border-trust pl-4 text-lg leading-8 text-ink-muted">{intro}</p>}
                <div className="mt-8">{children}</div>
              </div>
            </article>
            {aside && <aside className="space-y-6 lg:sticky lg:top-6">{aside}</aside>}
          </div>
        </Container>
        <PseoConversionCard
          context={{ landingPath, pseoLevel: kind }}
          title="Wat betekent 2027 voor uw woning?"
          description="Bereken gratis uw persoonlijke besparing en rendement op basis van uw adres."
          placeholder="Vul uw adres in"
        />
      </main>
      <SiteFooter />
    </PageShell>
  )
}
