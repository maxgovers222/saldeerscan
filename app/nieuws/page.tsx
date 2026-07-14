import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentIndexShell } from '@/components/content/ContentIndexShell'
import { Container } from '@/components/design-system/Container'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { getAllPublishedNieuws } from '@/lib/nieuws'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Nieuws Zonnepanelen & Saldering 2027 | SaldeerScan',
  description: 'Actueel nieuws over zonnepanelen, saldering en de energietransitie in Nederland. Wekelijkse updates voor woningeigenaren.',
  alternates: { canonical: 'https://saldeerscan.nl/nieuws' },
  openGraph: {
    title: 'Nieuws Zonnepanelen & Saldering 2027',
    description: 'Actueel nieuws over zonnepanelen en saldering in Nederland.',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://saldeerscan.nl/nieuws',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NieuwsOverzicht() {
  const articles = await getAllPublishedNieuws()

  return (
    <ContentIndexShell
      kind="nieuws"
      title="Nieuws"
      intro="Actuele berichten over zonnepanelen, netcongestie en de salderingswijzigingen. Blijf op de hoogte van alles rondom 1 januari 2027."
    >
      <Container className="pb-16">
        {articles.length === 0 ? (
          <p className="rounded-3xl border border-ink/10 bg-paper px-6 py-16 text-center text-ink-muted">
            Eerste nieuwsartikelen worden binnenkort gepubliceerd.
          </p>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/nieuws/${article.slug}`}
                className="group flex flex-col gap-4 rounded-3xl border border-ink/10 bg-paper p-6 shadow-sm transition hover:border-trust/40 hover:shadow-md md:flex-row md:items-start"
              >
                {article.publishedAt && (
                  <time className="shrink-0 whitespace-nowrap font-mono text-sm text-ink-muted" dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                  </time>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-snug text-ink transition group-hover:text-trust-dark">
                    {article.titel}
                  </h2>
                  {article.intro && <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">{article.intro}</p>}
                </div>
                <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-trust-dark">Lees meer →</span>
              </Link>
            ))}
          </div>
        )}
      </Container>
      <PseoConversionCard
        context={{ landingPath: '/nieuws', pseoLevel: 'nieuws' }}
        title="Persoonlijk advies voor uw woning"
        description="Bereken gratis wat de 2027-wijzigingen betekenen voor uw specifieke situatie."
        placeholder="Vul uw adres in"
      />
    </ContentIndexShell>
  )
}
