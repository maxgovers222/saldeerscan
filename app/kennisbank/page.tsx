import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentIndexShell } from '@/components/content/ContentIndexShell'
import { Container } from '@/components/design-system/Container'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { getAllPublishedKennisbank } from '@/lib/kennisbank'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Kennisbank Zonnepanelen & Saldering 2027 | SaldeerScan',
  description: 'Alles over zonnepanelen, saldering en de wijzigingen per 1 januari 2027. Uitgebreide artikelen voor Nederlandse huiseigenaren.',
  alternates: { canonical: 'https://saldeerscan.nl/kennisbank' },
  openGraph: {
    title: 'Kennisbank Zonnepanelen & Saldering 2027',
    description: 'Alles over zonnepanelen, saldering en de wijzigingen per 1 januari 2027.',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://saldeerscan.nl/kennisbank',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  saldering: 'Saldering',
  zonnepanelen: 'Zonnepanelen',
  netcongestie: 'Netcongestie',
  subsidie: 'Subsidie',
  algemeen: 'Algemeen',
}

export default async function KennisbankOverzicht() {
  const articles = await getAllPublishedKennisbank()

  return (
    <ContentIndexShell
      kind="kennisbank"
      title="Kennisbank"
      intro="Uitgebreide artikelen over zonnepanelen, saldering en energiebesparing. Alles wat u moet weten over de wijzigingen per 1 januari 2027."
    >
      <Container className="pb-16">
        {articles.length === 0 ? (
          <p className="rounded-3xl border border-ink/10 bg-paper px-6 py-16 text-center text-ink-muted">
            Artikelen worden binnenkort gepubliceerd.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/kennisbank/${article.slug}`}
                className="group rounded-3xl border border-ink/10 bg-paper p-6 shadow-sm transition hover:border-trust/40 hover:shadow-md"
              >
                <span className="inline-flex rounded-full bg-trust/10 px-3 py-1 text-xs font-semibold text-trust-dark">
                  {CATEGORY_LABELS[article.category] ?? article.category}
                </span>
                <h2 className="mt-4 text-lg font-semibold leading-snug text-ink transition group-hover:text-trust-dark">
                  {article.titel}
                </h2>
                {article.intro && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-muted">
                    {article.intro.slice(0, 140)}{article.intro.length > 140 ? '…' : ''}
                  </p>
                )}
                <span className="mt-5 block text-sm font-semibold text-trust-dark">Lees artikel →</span>
              </Link>
            ))}
          </div>
        )}
      </Container>
      <PseoConversionCard
        context={{ landingPath: '/kennisbank', pseoLevel: 'kennisbank' }}
        title="Wat betekent 2027 voor uw woning?"
        description="Bereken gratis uw persoonlijke besparing en rendement met onze adresanalyse."
        placeholder="Vul uw adres in"
      />
    </ContentIndexShell>
  )
}
