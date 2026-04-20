import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacyverklaring — SaldeerScan.nl',
  description: 'Hoe SaldeerScan.nl omgaat met uw persoonsgegevens conform de AVG.',
  alternates: { canonical: 'https://saldeerscan.nl/privacy' },
}

const N1 = '#020617'
const G = '#00aa65'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-20" style={{ background: N1 }}>
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: G }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-[#0e352e] tracking-tight text-lg" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              SaldeerScan<span style={{ color: G }}>.nl</span>
            </span>
          </a>
          <a href="/check" className="text-sm font-bold px-5 py-2.5 rounded-full bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 transition-all">
            Gratis analyseren
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-12 pb-20">
        <p className="text-xs text-white/30 mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
          <a href="/" className="hover:text-white/60 transition-colors">Home</a>
          {' · '}
          <span className="text-white/50">Privacyverklaring</span>
        </p>

        <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
          Privacyverklaring
        </h1>
        <p className="text-sm text-white/40 mb-10" style={{ fontFamily: 'var(--font-sans)' }}>
          Laatste update: april 2026
        </p>

        <div className="space-y-8 text-white/70" style={{ fontFamily: 'var(--font-sans)' }}>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>1. Wie zijn wij?</h2>
            <p className="text-sm leading-relaxed">
              SaldeerScan.nl is een online platform dat Nederlandse woningeigenaren helpt de impact van de salderingsafschaffing per 1 januari 2027 inzichtelijk te maken. Wij verwerken persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>2. Welke gegevens verzamelen wij?</h2>
            <p className="text-sm leading-relaxed mb-3">Bij het aanvragen van uw gratis PDF-rapport verzamelen wij:</p>
            <ul className="text-sm leading-relaxed space-y-1.5 pl-4">
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Naam</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>E-mailadres</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Telefoonnummer</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Adresgegevens (voor de energieanalyse)</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Foto's van meterkast, plaatsingslocatie en omvormer (indien geüpload)</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Berekende energiegegevens (ROI, besparing, score)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>3. Waarvoor gebruiken wij uw gegevens?</h2>
            <ul className="text-sm leading-relaxed space-y-1.5 pl-4">
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Het opstellen en versturen van uw persoonlijke energierapport</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Doorverwijzing naar een gecertificeerde installateur in uw regio (alleen met uw expliciete toestemming)</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Verbetering van onze dienstverlening</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>4. Grondslag voor verwerking</h2>
            <p className="text-sm leading-relaxed">
              Wij verwerken uw gegevens uitsluitend op basis van uw uitdrukkelijke toestemming (art. 6 lid 1 sub a AVG), die u geeft bij het invullen van het aanvraagformulier. U kunt uw toestemming te allen tijde intrekken.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>5. Delen met derden</h2>
            <p className="text-sm leading-relaxed">
              Uw gegevens worden uitsluitend gedeeld met installateurs in ons netwerk indien u hier expliciet toestemming voor heeft gegeven. Wij verkopen uw gegevens nooit aan derden. Voor de technische verwerking maken wij gebruik van Supabase (dataopslag) en Resend (e-mail).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>6. Bewaartermijn</h2>
            <p className="text-sm leading-relaxed">
              Uw gegevens worden bewaard zolang nodig voor de uitvoering van onze dienstverlening, met een maximum van 2 jaar na uw aanvraag, tenzij een langere bewaartermijn wettelijk verplicht is.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>7. Uw rechten</h2>
            <p className="text-sm leading-relaxed mb-3">Op grond van de AVG heeft u de volgende rechten:</p>
            <ul className="text-sm leading-relaxed space-y-1.5 pl-4">
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Recht op inzage van uw persoonsgegevens</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Recht op correctie van onjuiste gegevens</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Recht op verwijdering ("recht om vergeten te worden")</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Recht op beperking van de verwerking</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Recht op overdraagbaarheid van gegevens</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">—</span>Recht om bezwaar te maken tegen verwerking</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              Voor het uitoefenen van uw rechten kunt u contact met ons opnemen via <a href="mailto:privacy@saldeerscan.nl" className="text-amber-400 hover:text-amber-300 underline">privacy@saldeerscan.nl</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>8. Beveiliging</h2>
            <p className="text-sm leading-relaxed">
              Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beveiligen tegen ongeautoriseerde toegang, verlies of misbruik.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>9. Klachten</h2>
            <p className="text-sm leading-relaxed">
              Heeft u een klacht over de verwerking van uw persoonsgegevens? Dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens via{' '}
              <a href="https://www.autoriteitpersoonsgegevens.nl" className="text-amber-400 hover:text-amber-300 underline" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="py-8 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-sans)' }}>
            <a href="/privacy" className="text-white/40">Privacyverklaring</a>
            <a href="/check" className="hover:text-white/50 transition-colors">Analyseer uw woning</a>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-sans)' }}>© {new Date().getFullYear()} SaldeerScan.nl</p>
        </div>
      </footer>
    </div>
  )
}
