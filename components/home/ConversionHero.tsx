import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { Container } from '@/components/design-system/Container'
import { DarkHeroShell } from '@/components/design-system/DarkHeroShell'
import { InsightPreview } from './InsightPreview'
import { SocialProofTicker } from './SocialProofTicker'

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
            Vul uw adres in. U ziet direct uw verwachte verlies,
            woningfit en beste vervolgstap.
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
          <div className="mt-5"><SocialProofTicker /></div>
        </div>
        <InsightPreview />
      </Container>
    </DarkHeroShell>
  )
}
