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
    text: 'Totaal jaarverbruik, jaarproductie, direct eigen gebruik, contracttarieven, terugleverkosten en batterijofferte kunnen de rekenvoorbeelden vervangen. Een lege invoer gebruikt een zichtbaar vermelde schatting.',
  },
  {
    title: 'Actuele netsituatie onbekend',
    text: 'Er is geen geverifieerde actuele capaciteitsbron aangesloten. We leiden geen netkleur, netbeheerder of terugleverbeperking af uit een postcode en gebruiken oude postcode-heuristieken niet als actueel feit. Controleer de aansluiting bij uw netbeheerder.',
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
              leveranciersafhankelijke vergoeding bestaan. Tot 1 januari 2030 geldt
              volgens de Rijksoverheid een minimumvergoeding van 50% van het kale
              leveringstarief, zonder belastingen. Terugleverkosten staan daar los van;
              controleer beide bedragen in uw eigen contract.
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
                  Een opgegeven jaarproductie uit uw omvormer vervangt die dakschatting volledig.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-5">
                <h3 className="font-semibold text-ink">Waarde in 2026</h3>
                <p className="mt-1">
                  Direct gebruikte zonnestroom vermenigvuldigen we met het indicatieve
                  leveringstarief. Teruglevering kan in 2026 jaarlijks worden gesaldeerd tot
                  maximaal de resterende netafname. Een productieoverschot krijgt de
                  aangenomen terugleververgoeding.
                  De ingevulde jaarlijkse en kWh-afhankelijke terugleverkosten trekken we afzonderlijk af. Dit toont een volledig referentiejaar, geen resterende opbrengst na een aankoop in oktober.
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
                  Dit zijn rekenvoorbeelden, geen actuele leverancierstarieven. Het kale tarief is standaard €0,18/kWh en de terugleverkosten standaard €0. U kunt alle bedragen vervangen. Kosten trekken we apart af, alleen bij teruglevering.
                  Het extra batterijvoordeel vergelijken we met dezelfde 2027-situatie
                  zonder batterij, zodat het einde van salderen niet als batterijwinst
                  wordt meegeteld. Werkelijke tarieven en terugleverkosten verschillen
                  per leverancier.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-5">
                <h3 className="font-semibold text-ink">Batterij als apart investeringsscenario</h3>
                <p className="mt-1">Extra gebruik is begrensd op beschikbare zonnestroom, resterend verbruik en maximaal één volledige capaciteitscyclus per dag. Standaard gebruiken we 90% rendement, 10 kWh en €4.000 investering. De extra terugverdientijd is de batterijprijs gedeeld door het extra jaarlijkse voordeel in 2027. Alleen een positieve totale jaarwaarde én positief extra voordeel met eenvoudige terugverdientijd tot 10 jaar geeft een batterij als optie; dit is een gekozen beoordelingsgrens, geen levensduur- of rendementsbelofte. Kwartierprofielen, degradatie, onderhoud, rente en vervanging ontbreken. Een vaste kostenstaffel blijft hetzelfde jaarbedrag in het batterijscenario; pas die handmatig aan als uw contractstaffel wijzigt.</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-5">
                <h3 className="font-semibold text-ink">Indicatieve modelscore</h3>
                <p className="mt-1">De modelscore is een eenvoudige heuristiek, geen officieel energielabel, technische keuring of bewezen rendementsmaat. Bouwjaar geeft maximaal 30 punten, een energielabel maximaal 30 en geschat dakoppervlak maximaal 20. De niet-geverifieerde netsituatie krijgt een vaste neutrale rekenwaarde van 10 punten; dat is geen oordeel over netcapaciteit. Zonder de onderliggende woninggegevens tonen we geen opgeslagen score.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="examples-heading">
            <h2 id="examples-heading" className="text-2xl font-bold text-ink">Een voorbeeld dat u kunt narekenen</h2>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-paper p-5 text-sm leading-7 text-ink-muted">
              <p>Dit fictieve huishouden verbruikt en produceert elk 4.000 kWh per jaar en gebruikt 25% van de zonnestroom direct. Levering: €0,30/kWh inclusief belasting, kaal €0,20/kWh, bruto terugleververgoeding €0,10/kWh. Kosten: in 2026 €200 per jaar plus €0,01 per teruggeleverde kWh; in 2027 €100 plus €0,02. Dit zijn rekenwaarden, geen leverancierstarieven.</p>
              <p className="mt-3">Zonder batterij is de 2027-jaarwaarde 1.000 × €0,30 + 3.000 × €0,10 − €100 − 3.000 × €0,02 = <strong>€440</strong>. Een batterijscenario met 10 kWh, 90% rendement en 70% eigen gebruik komt op <strong>€820</strong>, inclusief 200 kWh opslagverlies. Het extra voordeel is €380. Bij €5.000 investering is de eenvoudige extra terugverdientijd 13,2 jaar: dit model adviseert dan geen batterij.</p>
              <p className="mt-3">Het volledige 2026-referentiejaar komt op €970. Het verschil met 2027 is €530, maar dat is niet hetzelfde als het batterijvoordeel van €380. Onderhoud, degradatie, rente en kwartierdata kunnen de vergelijking verder veranderen.</p>
              <Link href="/check" className="mt-4 inline-flex min-h-11 items-center font-semibold text-trust-dark underline">Bereken uw eigen 2027-situatie</Link>
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
