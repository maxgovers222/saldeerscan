import { PseoPageShell } from './PseoPageShell'
import { PseoHero } from './PseoHero'
import { PseoConversionCard } from './PseoConversionCard'
import { PseoCardGrid } from './PseoCardGrid'
import { LocalSchema } from './LocalSchema'
import type { ConversionContext } from '@/lib/conversion-context'

export function LocationDirectoryPage({ name, path, context, breadcrumbs, links, kind }: {
  name: string; path: string; kind: 'steden' | 'wijken'
  context: ConversionContext
  breadcrumbs: Array<{ name: string; href?: string }>
  links: Array<{ title: string; href: string }>
}) {
  const description = `Locatiepagina’s in ${name}. Bekijk per pagina welke lokale feiten zijn gecontroleerd en gebruik uw eigen gegevens voor een persoonlijke berekening.`
  return <PseoPageShell headerContext={name}>
    <LocalSchema jsonLd={{ '@context': 'https://schema.org', '@type': 'CollectionPage', url: `https://saldeerscan.nl${path}`,
      name: `Zonnepanelen ${name}`, description, mainEntity: { '@type': 'ItemList', numberOfItems: links.length,
        itemListElement: links.map((link, i) => ({ '@type': 'ListItem', position: i + 1, name: link.title, url: `https://saldeerscan.nl${link.href}` })) } }} />
    <PseoHero breadcrumbs={breadcrumbs} eyebrow="Locatiepagina’s en uw eigen berekening" title={`Zonnepanelen ${name}`} summary={description}
      metrics={[{ label: `Pagina’s per ${kind === 'steden' ? 'stad' : 'wijk'}`, value: String(links.length) }, { label: 'Einde salderen', value: '1 jan 2027' }]} />
    <PseoConversionCard context={context} title={`Wat betekent 2027 voor uw woning in ${name}?`}
      description="Gebruik uw eigen productie, verbruik en contract. Een locatiegemiddelde bepaalt geen persoonlijk voordeel of technisch advies." placeholder="Uw volledige adres" />
    <section className="bg-paper px-6 py-12 sm:py-16"><div className="mx-auto max-w-5xl">
      <h2 className="font-heading text-2xl font-extrabold text-ink">Bekijk de {kind}</h2>
      <p className="mb-6 mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">Dit is een overzicht van beschikbare locatiepagina’s, geen officiële telling van alle {kind} in het gebied. Lokale gegevens worden per pagina gecontroleerd. Er wordt geen gemiddelde energiescore, netkleur of besparing aan deze lijst verbonden.</p>
      <PseoCardGrid items={links.map(link => ({ ...link, meta: 'Gegevens, bronnen en beperkingen', analyticsLabel: `directory:${link.href}` }))} />
      <a href="/methode" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-trust-dark underline underline-offset-4">Bekijk de berekening en voorbeelden</a>
    </div></section>
  </PseoPageShell>
}
