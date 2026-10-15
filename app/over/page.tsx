import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/design-system/Container'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'

export const metadata: Metadata = {
  title: 'Over SaldeerScan — maker, werkwijze en contact',
  description: 'SaldeerScan is een persoonlijk project van Max Govers. Lees waarom de check bestaat, hoe deze wordt gefinancierd en hoe u contact opneemt.',
  alternates: { canonical: 'https://saldeerscan.nl/over' },
}

export default function OverPage() {
  return (
    <PageShell>
      <SiteHeader contextLabel="Over SaldeerScan" />
      <main id="main-content" className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <p className="text-sm font-semibold text-trust-dark">Maker en werkwijze</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink">Waarom SaldeerScan bestaat</h1>
          <p className="mt-5 text-lg leading-8 text-ink-muted">
            SaldeerScan is een persoonlijk project van Max Govers. Ik bouw deze check om
            huishoudens met zonnepanelen inzicht te geven in wat het einde van salderen
            voor hun eigen situatie betekent.
          </p>
          <div className="mt-10 space-y-8 text-ink-muted">
            <section aria-labelledby="werkwijze">
              <h2 id="werkwijze" className="text-2xl font-bold text-ink">Een berekening die u kunt beoordelen</h2>
              <p className="mt-3 leading-7">
                De uitkomst gebruikt openbare woningdata, uw antwoorden en beschreven
                aannames. Controleer de invoer met uw jaarafrekening en omvormer-app.
                Uw contract en het moment waarop u stroom gebruikt bepalen mede de
                uitkomst. Een thuisbatterij hoeft daardoor niet de beste vervolgstap te zijn.
              </p>
              <Link href="/methode" className="mt-3 inline-flex min-h-11 items-center font-semibold text-trust-dark underline underline-offset-4">
                Bekijk de rekenmethode en bronnen
              </Link>
            </section>
            <section aria-labelledby="financiering">
              <h2 id="financiering" className="text-2xl font-bold text-ink">Hoe wordt de gratis check gefinancierd?</h2>
              <p className="mt-3 leading-7">
                De check is gratis. Bij een doorverwijzing naar een installateur kan
                SaldeerScan een vergoeding ontvangen. Uw gegevens worden alleen met
                een installateur gedeeld als u daar expliciet toestemming voor geeft.
                Een vergoeding is geen bewijs dat een investering voor u rendabel is;
                beoordeel daarvoor de berekening en een concrete offerte.
              </p>
            </section>
            <section aria-labelledby="contact">
              <h2 id="contact" className="text-2xl font-bold text-ink">Vragen of een fout gevonden?</h2>
              <p className="mt-3 leading-7">
                Ik hoor graag welke invoer, aanname of uitleg onduidelijk is. U kunt
                Max Govers bereiken via{' '}
                <a href="mailto:info@saldeerscan.nl" className="font-semibold text-trust-dark underline underline-offset-4">info@saldeerscan.nl</a>.
                Stuur bij een inhoudelijke correctie de pagina en, indien beschikbaar,
                een bron mee. Lees hoe uw gegevens worden gebruikt in de{' '}
                <Link href="/privacy" className="font-semibold text-trust-dark underline underline-offset-4">privacyverklaring</Link>.
              </p>
            </section>
          </div>
          <Link href="/check" className="mt-10 inline-flex min-h-12 items-center rounded-xl bg-trust px-6 py-3 font-bold text-evergreen-950">
            Bekijk mijn situatie
          </Link>
        </Container>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
