import { Metadata } from 'next'
import { Container } from '@/components/design-system/Container'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'

export const metadata: Metadata = {
  title: 'Privacyverklaring — SaldeerScan.nl',
  description: 'Hoe SaldeerScan.nl omgaat met uw persoonsgegevens conform de AVG.',
  alternates: { canonical: 'https://saldeerscan.nl/privacy' },
}

export default function PrivacyPage() {
  return (
    <PageShell className="flex flex-col">
      <SiteHeader contextLabel="Privacyverklaring" />
      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <Container className="max-w-3xl">
          <article className="rounded-3xl border border-ink/10 bg-paper p-6 shadow-sm sm:p-10">
        <p className="mb-6 text-xs text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          <a href="/" className="transition-colors hover:text-ink">Home</a>
          {' · '}
          <span className="text-ink">Privacyverklaring</span>
        </p>

        <h1 className="mb-2 text-3xl font-black text-ink" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
          Privacyverklaring
        </h1>
        <p className="mb-10 text-sm text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          Laatste update: juli 2026
        </p>

        <div className="space-y-8 text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>1. Wie zijn wij?</h2>
            <p className="text-sm leading-relaxed">
              SaldeerScan.nl is een online platform dat Nederlandse woningeigenaren helpt de impact van de salderingsafschaffing per 1 januari 2027 inzichtelijk te maken. Wij verwerken persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG).
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Het platform wordt vanuit Nederland beheerd en is bereikbaar via <a href="mailto:info@saldeerscan.nl" className="text-trust-dark underline hover:text-trust">info@saldeerscan.nl</a>. Aanvullende handelsregistergegevens worden hier gepubliceerd zodra deze beschikbaar zijn.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>2. Welke gegevens verzamelen wij?</h2>
            <p className="text-sm leading-relaxed mb-3">Bij het aanvragen van uw gratis PDF-rapport verzamelen wij:</p>
            <ul className="text-sm leading-relaxed space-y-1.5 pl-4">
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Naam</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>E-mailadres</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Telefoonnummer</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Adresgegevens (voor de energieanalyse)</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Foto's van meterkast, plaatsingslocatie en omvormer (indien geüpload)</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Berekende energiegegevens (ROI, besparing, score)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>3. Waarvoor gebruiken wij uw gegevens?</h2>
            <ul className="text-sm leading-relaxed space-y-1.5 pl-4">
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Het opstellen en versturen van uw persoonlijke energierapport</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Doorverwijzing naar een gecertificeerde installateur in uw regio (alleen met uw expliciete toestemming)</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Verbetering van onze dienstverlening</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>4. Grondslag voor verwerking</h2>
            <p className="text-sm leading-relaxed">
              Wij verwerken uw gegevens uitsluitend op basis van uw uitdrukkelijke toestemming (art. 6 lid 1 sub a AVG), die u geeft bij het invullen van het aanvraagformulier. U kunt uw toestemming te allen tijde intrekken.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>5. Delen met derden</h2>
            <p className="text-sm leading-relaxed">
              Uw gegevens worden uitsluitend gedeeld met installateurs in ons netwerk indien u hier expliciet toestemming voor heeft gegeven. Wij verkopen uw gegevens nooit aan derden. Voor de technische verwerking maken wij gebruik van Supabase (dataopslag) en Resend (e-mail).
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Bij een doorverwijzing kunnen wij een leadvergoeding van de installateur ontvangen. Lees meer over onze werkwijze op de pagina <a href="/methode" className="text-trust-dark underline hover:text-trust">Methode en transparantie</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>6. Bewaartermijn</h2>
            <p className="text-sm leading-relaxed">
              Uw gegevens worden bewaard zolang nodig voor de uitvoering van onze dienstverlening, met een maximum van 2 jaar na uw aanvraag, tenzij een langere bewaartermijn wettelijk verplicht is.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>7. Uw rechten</h2>
            <p className="text-sm leading-relaxed mb-3">Op grond van de AVG heeft u de volgende rechten:</p>
            <ul className="text-sm leading-relaxed space-y-1.5 pl-4">
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Recht op inzage van uw persoonsgegevens</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Recht op correctie van onjuiste gegevens</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Recht op verwijdering ("recht om vergeten te worden")</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Recht op beperking van de verwerking</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Recht op overdraagbaarheid van gegevens</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-trust-dark">—</span>Recht om bezwaar te maken tegen verwerking</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              Voor het uitoefenen van uw rechten kunt u contact met ons opnemen via <a href="mailto:privacy@saldeerscan.nl" className="text-trust-dark underline hover:text-trust">privacy@saldeerscan.nl</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>8. Beveiliging</h2>
            <p className="text-sm leading-relaxed">
              Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beveiligen tegen ongeautoriseerde toegang, verlies of misbruik.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>9. Klachten</h2>
            <p className="text-sm leading-relaxed">
              Heeft u een klacht over de verwerking van uw persoonsgegevens? Dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens via{' '}
              <a href="https://www.autoriteitpersoonsgegevens.nl" className="text-trust-dark underline hover:text-trust" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a>.
            </p>
          </section>

        </div>
          </article>
        </Container>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
