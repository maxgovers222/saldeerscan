import { notFound } from 'next/navigation'
import { getLegacyPostcodePrefixes } from '@/lib/pseo'
import { buildPostcodeMetadata } from '@/lib/pseo-metadata'
import { PseoPageShell } from '@/components/pseo/PseoPageShell'
import { PseoHero } from '@/components/pseo/PseoHero'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { LocalSchema } from '@/components/pseo/LocalSchema'

export const revalidate = 604800
type Props = { params: Promise<{ code: string }> }
function cleanCode(code: string) { return code.toUpperCase().replace(/\s/g, '') }
export async function generateMetadata({ params }: Props) {
  const code = cleanCode((await params).code)
  const known = (await getLegacyPostcodePrefixes()).includes(code.slice(0, 4))
  return buildPostcodeMetadata(code, undefined, known)
}
export default async function PostcodePage({ params }: Props) {
  const code = cleanCode((await params).code)
  if (!/^[1-9]\d{3}(?:[A-Z]{2})?$/.test(code)) notFound()
  const prefix = code.slice(0, 4)
  return <PseoPageShell headerContext={`Postcode ${prefix}`}>
    <LocalSchema jsonLd={{ '@context': 'https://schema.org', '@type': 'WebPage', name: `Zonnepanelen postcode ${prefix}`,
      url: `https://saldeerscan.nl/postcode/${prefix}`, description: 'Bereken uw eigen situatie met woning- en contractgegevens.' }} />
    <PseoHero breadcrumbs={[{ name: 'Home', href: '/' }, { name: `Postcode ${prefix}` }]} eyebrow="Uw eigen gegevens zijn bepalend"
      title={`Zonnepanelen postcode ${prefix}`} summary="Een postcode bepaalt geen opbrengst, energiescore, netcapaciteit of passend batterijadvies." />
    <PseoConversionCard context={{ landingPath: `/postcode/${prefix}`, pseoLevel: 'postcode', postcode: prefix }}
      title="Bereken wat het einde van salderen voor u betekent"
      description="Gebruik uw eigen productie, verbruik, direct eigen gebruik en energiecontract. Het gratis rapport vraagt geen telefoonnummer."
      placeholder={`Uw volledige adres bij postcode ${prefix}`} />
    <section className="bg-paper px-6 py-12"><div className="mx-auto max-w-3xl space-y-5 text-sm leading-relaxed text-ink-muted">
      <h2 className="font-heading text-2xl font-extrabold text-ink">Wat kunt u hier controleren?</h2>
      <p>Vergelijk dezelfde woning in 2026 en 2027 met uw eigen jaarcijfers. Bekijk daarna afzonderlijk het extra jaarvoordeel en de investering van een batterij. De uitkomst kan ook ongunstig zijn.</p>
      <p>Eerdere postcodekoppelingen met wijken zijn nog niet met gebiedsbronnen gecontroleerd. Daarom tonen we hier geen veronderstelde wijkgrens, woninggemiddelde of netkleur.</p>
      <p>Salderen stopt op 1 januari 2027. Voor teruglevering blijft een vergoeding bestaan; controleer de bruto vergoeding en de afzonderlijke terugleverkosten in uw eigen contract.</p>
      <a href="/methode" className="inline-flex min-h-11 items-center font-semibold text-trust-dark underline underline-offset-4">Bekijk onze berekening en voorbeelden</a>
    </div></section>
  </PseoPageShell>
}
