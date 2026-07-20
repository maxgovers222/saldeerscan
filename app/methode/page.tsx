import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/design-system/Container'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'
import { LEVERINGSTARIEF, TERUGLEVERTARIEF } from '@/lib/roi'

export const metadata: Metadata = {
  title: 'Methode en transparantie — SaldeerScan.nl',
  description:
    'Lees welke gegevens, aannames en formules SaldeerScan gebruikt en hoe de gratis woningscan wordt gefinancierd.',
  alternates: { canonical: 'https://saldeerscan.nl/methode' },
}

const rate = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

const inputs = [
  {
    title: 'Openbare woningdata',
    text: 'Via BAG gebruiken we onder meer woonoppervlak, bouwjaar, woningtype en adrescoördinaten. Het dakoppervlak is een afgeleide schatting en geen dakmeting.',
  },
  {
    title: 'Uw eigen invoer',
    text: 'Werkelijk jaarverbruik, aantal panelen, dakrichting, huishoudgrootte en uw antwoorden in de funnel kunnen standaardaannames vervangen.',
  },
  {
    title: 'Regionale netindicatie',
    text: 'De netcongestiekleur is een regionale indicatie. Zij bewijst niet dat teruglevering op uw aansluiting actief wordt beperkt en vervangt geen informatie van de netbeheerder.',
  },
]

const exclusions = [
  'Een technische dakinspectie, constructieberekening of meterkastkeuring.',
  'Een offerte, gegarandeerde opbrengst of gegarandeerde terugverdientijd.',
  'Uw exacte uurlijkse opwek- en verbruiksprofiel, tenzij u dat later met een adviseur deelt.',
  'Toekomstige leverancierstarieven, terugleverkosten, financieringskosten en onderhoud die nog niet bekend zijn.',
  'De individuele beschikbaarheid van capaciteit voor een nieuwe of zwaardere netaansluiting.',
]

export default function MethodePage() {
  return (
    <PageShell className="flex flex-col">
      <SiteHeader contextLabel="Methode" />
      <main id="main-content" className="flex-1">
        <section className="border-b border-white/10 bg-evergreen-950 py-14 text-white sm:py-20">
          <Container className="max-w-4xl">
            <p className="text-sm font-semibold text-action">Methode en transparantie</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Zo komt uw SaldeerScan tot stand
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              De scan is een indicatie op basis van openbare woningdata, uw invoer en
              controleerbare aannames. Op deze pagina leggen we uit wat de uitkomst wel en
              niet betekent.
            </p>
          </Container>
        </section>

        <Container className="max-w-4xl space-y-10 py-10 sm:py-16">
          <section aria-labelledby="inputs-heading">
            <h2 id="inputs-heading" className="text-2xl font-bold text-ink">Welke gegevens gebruiken we?</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {inputs.map(item => (
                <article key={item.title} className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
                  <h3 className="font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="law-heading" className="rounded-3xl border border-trust/25 bg-trust/10 p-6 sm:p-8">
            <h2 id="law-heading" className="text-2xl font-bold text-ink">Wettelijke basis</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              Salderen blijft 100% mogelijk tot en met 31 december 2026. Per 1 januari
              2027 stopt de regeling in één keer. Er is dus geen actuele gefaseerde afbouw
              in 2025 of 2026. Na 2027 blijft voor teruggeleverde stroom een
              leveranciersafhankelijke vergoeding bestaan.
            </p>
            <a
              href="https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-trust-dark underline underline-offset-4"
            >
              Bekijk de actuele uitleg van de Rijksoverheid
            </a>
          </section>

          <section aria-labelledby="calculation-heading">
            <h2 id="calculation-heading" className="text-2xl font-bold text-ink">Hoofdformules en aannames</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-ink-muted">
              <div className="rounded-2xl border border-ink/10 bg-paper p-5">
                <h3 className="font-semibold text-ink">Verbruik en productie</h3>
                <p className="mt-1">
                  Als u geen werkelijk jaarverbruik opgeeft, schatten we dit op basis van
                  woonoppervlak en bouwjaar. Productie is het geraamde aantal panelen maal
                  een gemiddelde jaaropbrengst, met een factor voor de opgegeven dakrichting.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-5">
                <h3 className="font-semibold text-ink">Waarde in 2026</h3>
                <p className="mt-1">
                  Direct gebruikte zonnestroom vermenigvuldigen we met het indicatieve
                  leveringstarief. Teruglevering kan in 2026 jaarlijks worden gesaldeerd tot
                  maximaal de resterende netafname. Een productieoverschot krijgt de
                  aangenomen terugleververgoeding.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-5">
                <h3 className="font-semibold text-ink">Waarde vanaf 2027</h3>
                <p className="mt-1">
                  Vanaf 2027 bestaat de raming uit direct eigen gebruik tegen het
                  leveringstarief plus teruggeleverde stroom tegen een indicatieve
                  terugleververgoeding. De standaardtarieven in het model zijn momenteel{' '}
                  <strong className="text-ink">{rate.format(LEVERINGSTARIEF)}/kWh</strong> en{' '}
                  <strong className="text-ink">{rate.format(TERUGLEVERTARIEF)}/kWh</strong>.
                  Het extra batterijvoordeel vergelijken we met dezelfde 2027-situatie
                  zonder batterij, zodat het einde van salderen niet als batterijwinst
                  wordt meegeteld. Werkelijke tarieven en terugleverkosten verschillen
                  per leverancier.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="limits-heading">
            <h2 id="limits-heading" className="text-2xl font-bold text-ink">Wat nemen we niet mee?</h2>
            <ul className="mt-5 space-y-3">
              {exclusions.map(item => (
                <li key={item} className="flex gap-3 rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm leading-6 text-ink-muted">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-trust" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="range-heading" className="rounded-3xl border border-warning/25 bg-warning/10 p-6 sm:p-8">
            <h2 id="range-heading" className="text-2xl font-bold text-ink">Indicatie, geen garantie</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              De uitkomst is een beslisondersteunende bandbreedte. Afwijkingen in
              dakligging, schaduw, installatieprijs, energiecontract en gebruikspatroon
              kunnen de werkelijke uitkomst merkbaar veranderen. Laat de configuratie
              daarom valideren met een locatiecontrole en actuele offerte.
            </p>
          </section>

          <section aria-labelledby="business-heading" className="rounded-3xl bg-evergreen-950 p-6 text-white sm:p-8">
            <h2 id="business-heading" className="text-2xl font-bold">Hoe verdienen wij?</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/70">
              De scan is gratis. Als u in de funnel expliciet toestemming geeft, kan
              SaldeerScan uw aanvraag doorzetten naar een installateur in uw regio. Daar
              kunnen wij een leadvergoeding voor ontvangen. Zonder die toestemming delen
              of verkopen wij uw contact- en scandata niet aan installateurs.
            </p>
            <Link
              href="/privacy"
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-action underline underline-offset-4"
            >
              Lees de privacyverklaring
            </Link>
          </section>

          <section aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="text-2xl font-bold text-ink">Belangrijkste bronnen</h2>
            <div className="mt-4 flex flex-col items-start gap-2 text-sm">
              <a
                href="https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 py-2 font-semibold text-trust-dark underline underline-offset-4"
              >
                Rijksoverheid — salderingsregeling
              </a>
              <a
                href="https://www.liander.nl/over-ons/nieuws/2026/nieuwe-regels-voor-de-verdeling-van-schaarse-netcapaciteit-vanaf-1-juli"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 py-2 font-semibold text-trust-dark underline underline-offset-4"
              >
                Liander — verdeling van schaarse netcapaciteit
              </a>
              <a
                href="https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 py-2 font-semibold text-trust-dark underline underline-offset-4"
              >
                RVO — actuele ISDE-maatregelen voor woningeigenaren
              </a>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
