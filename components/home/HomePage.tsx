import type { ReactNode } from 'react'
import { ContentSection } from '@/components/design-system/ContentSection'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'
import { ConversionHero } from './ConversionHero'
import { TrustSignals } from './TrustSignals'

export function HomePage({ discovery }: { discovery: ReactNode }) {
  return (
    <PageShell>
      <SiteHeader tone="dark" />
      <main id="main-content">
        <ConversionHero />
        <ContentSection className="bg-paper">
          <TrustSignals />
        </ContentSection>
        {discovery}
        <ContentSection
          eyebrow="Zo werkt het"
          title="Van adres naar een begrijpelijke vervolgstap"
          intro="Controleer uw woninggegevens, vergelijk uw jaarcijfers en bekijk de aannames achter de uitkomst."
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Gegevens controleren', 'Uw woning, productie, verbruik en energiecontract.'],
              ['2', 'Impact berekenen', 'Dezelfde woning in 2026 en 2027, met een apart batterijscenario.'],
              ['3', 'Rapport ontvangen', 'Websamenvatting, e-mail en volledige PDF.'],
            ].map(([number, title, text]) => (
              <li key={number} className="rounded-2xl border border-ink/10 bg-paper p-6">
                <span className="font-mono text-sm text-trust-dark">{number}</span>
                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-ink-muted">{text}</p>
              </li>
            ))}
          </ol>
        </ContentSection>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
