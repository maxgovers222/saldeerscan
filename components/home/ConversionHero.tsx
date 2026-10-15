import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { Container } from '@/components/design-system/Container'
import { DarkHeroShell } from '@/components/design-system/DarkHeroShell'
import { InsightPreview } from './InsightPreview'

export function ConversionHero() {
  return (
    <DarkHeroShell>
      <Container className="relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-24">
        <div>
          <p className="mb-4 text-sm font-semibold text-trust">
            Persoonlijk energieadvies voor 2027
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-[-.035em] sm:text-5xl lg:text-6xl">
            Wat kost stoppen met salderen u?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
            Vergelijk 2026 en 2027 met uw eigen productie, verbruik en
            energiecontract. Bekijk uw aannames en een mogelijke vervolgstap.
          </p>
          <div className="mt-8 max-w-xl">
            <AddressAutocomplete
              context={{ landingPath: '/', pseoLevel: 'home' }}
              placeholder="Uw postcode en huisnummer"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            <span>Gratis</span>
            <span>Geen account</span>
            <span>Alleen delen met toestemming</span>
          </div>
          <a href="/methode" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-trust underline underline-offset-4">Bekijk eerst een controleerbaar voorbeeld</a>
        </div>
        <InsightPreview />
      </Container>
    </DarkHeroShell>
  )
}
