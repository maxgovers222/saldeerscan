import type { PseoPageData } from '@/lib/pseo'
import { formatLocationSlug } from '@/lib/pseo-content-quality'
import { SALDERING_SOURCE } from '@/lib/pseo-publication'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { PseoPageShell } from './PseoPageShell'
import { PseoHero } from './PseoHero'
import { PseoConversionCard } from './PseoConversionCard'
import { PseoCardGrid } from './PseoCardGrid'
import { LocalSchema } from './LocalSchema'

export function LocationEvidencePage({ page, related = [] }: {
  page: PseoPageData
  related?: Array<{ href: string; title: string }>
}) {
  const name = page.evidence?.scope.name ?? formatLocationSlug(page.straat ?? page.wijk)
  const city = formatLocationSlug(page.stad)
  const province = formatLocationSlug(page.provincie)
  const evidence = page.evidence
  const breadcrumbs = [
    { name: 'Home', href: '/' }, { name: province, href: `/${page.provincie}` },
    { name: city, href: `/${page.provincie}/${page.stad}` },
    ...(page.straat && page.quality.reason !== 'missing-parent' ? [{ name: formatLocationSlug(page.wijk), href: `/${page.provincie}/${page.stad}/${page.wijk}` }] : []),
    { name },
  ]
  return <PseoPageShell headerContext={`${name}, ${city}`}>
    <LocalSchema jsonLd={page.jsonLd} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name,
        item: `https://saldeerscan.nl${'href' in item ? item.href : page.slug}` })),
    }) }} />
    <PseoHero breadcrumbs={breadcrumbs} eyebrow={evidence ? `CBS-${evidence.scope.kind} · peildatum 1 januari 2025` : 'Uw situatie na salderen'}
      title={`Zonnepanelen in ${name}`}
      summary={evidence ? `Woningcijfers voor ${evidence.scope.name} (${evidence.scope.code}), gemeente ${evidence.scope.municipality}. Controleer hieronder voor welk gebied deze cijfers gelden.`
        : `De lokale kenmerken van ${name} worden nog gecontroleerd. Gebruik uw eigen woning- en contractgegevens voor een persoonlijke berekening.`}
      metrics={evidence ? [
        { label: 'Woningen in CBS-gebied', value: evidence.sourceFields.Woningvoorraad_35.toLocaleString('nl-NL') },
        { label: 'Eengezinswoningen', value: `${evidence.sourceFields.PercentageEengezinswoning_40}%` },
        { label: 'Peiljaar', value: '2025' },
      ] : [{ label: 'Einde salderen', value: '1 jan 2027' }, { label: 'Berekening', value: 'Uw eigen cijfers' }]} />
    <PseoConversionCard context={{ landingPath: page.slug, pseoLevel: page.straat ? 'straat' : 'wijk', provincie: page.provincie, stad: page.stad, wijk: page.wijk, straat: page.straat ?? undefined }}
      title={`Wat betekent 2027 voor uw woning in ${name}?`}
      description="Vergelijk uw eigen productie, verbruik en energiecontract. Het gratis rapport vraagt geen telefoonnummer; advies kiest u apart."
      placeholder={`Uw adres in ${city}`} />
    <section className="bg-paper px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {evidence && <div className="rounded-2xl border border-trust/20 bg-trust/5 p-6 sm:p-8" data-testid="reviewed-location-facts">
          <h2 className="font-heading text-2xl font-extrabold text-ink">De cijfers en hun gebied</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{evidence.scope.limit}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['CBS-regiocode', evidence.scope.code],
              ['Woningvoorraad', evidence.sourceFields.Woningvoorraad_35.toLocaleString('nl-NL')],
              ['Eengezinswoningen', `${evidence.sourceFields.PercentageEengezinswoning_40}%`],
              ['Meergezinswoningen', `${evidence.sourceFields.PercentageMeergezinswoning_45}%`],
              ['Koopwoningen', `${evidence.sourceFields.Koopwoningen_47}%`],
              ['Bouwjaar afgelopen tien jaar', `${evidence.sourceFields.BouwjaarAfgelopenTienJaar_52}%`],
            ].map(([label, value]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-1 font-semibold text-ink">{value}</dd></div>)}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-ink-muted">CBS Kerncijfers wijken en buurten 2025, peildatum 1 januari 2025. Geraadpleegd op 15 oktober 2026. Een bouwjaarklasse is geen gemiddeld bouwjaar. Deze cijfers bepalen geen energiescore, dakgeschiktheid of persoonlijk rendement.</p>
        </div>}
        <div className="space-y-5" data-testid="location-reviewed-body">
          <h2 className="font-heading text-2xl font-extrabold text-ink">Uw woning en het einde van salderen</h2>
          {page.hoofdtekst.split(/\n\s*\n/).filter(Boolean).map((text, i) => <p key={i} className="text-sm leading-relaxed text-ink-muted">{text}</p>)}
        </div>
        <div className="rounded-2xl border border-ink/10 p-6">
          <h2 className="font-heading text-lg font-bold text-ink">Bronnen en controle</h2>
          {page.reviewedAt && <p className="mt-2 text-xs text-ink-muted">Lokale tekst gecontroleerd op 15 oktober 2026.</p>}
          <ul className="mt-3 space-y-3 text-sm text-trust-dark">
            {evidence && <>
              <li><a className="underline underline-offset-4" href={evidence.sourceUrl} rel="noreferrer" target="_blank">CBS-gegevens voor {evidence.scope.code}</a></li>
              <li><a className="underline underline-offset-4" href="https://www.cbs.nl/-/media/_pdf/2026/14/toelichting-variabelen-kwb-2025.pdf" rel="noreferrer" target="_blank">CBS — definities en peildatum</a></li>
            </>}
            <li><a className="underline underline-offset-4" href={SALDERING_SOURCE} rel="noreferrer" target="_blank">Rijksoverheid — einde salderen en terugleververgoeding</a></li>
            <li><a className="underline underline-offset-4" href="/methode">Onze berekening en controleerbare voorbeelden</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="font-heading text-2xl font-extrabold text-ink">Veelgestelde vragen</h2>
          {page.faqItems.map(faq => <details key={faq.vraag} className="rounded-xl border border-ink/10 p-5"><summary className="cursor-pointer font-semibold text-ink">{faq.vraag}</summary><p className="mt-3 text-sm leading-relaxed text-ink-muted">{faq.antwoord}</p></details>)}
        </div>
      </div>
    </section>
    {related.length > 0 && <section className="border-t border-ink/10 bg-mist px-6 py-10"><div className="mx-auto max-w-4xl">
      <h2 className="mb-5 font-heading text-xl font-bold text-ink">Andere locatiepagina’s</h2>
      <PseoCardGrid items={related.map(item => ({ ...item, meta: 'Bekijk de gegevens en hun beperkingen', analyticsLabel: `location-related:${item.href}` }))} />
    </div></section>}
  </PseoPageShell>
}
