import { notFound } from 'next/navigation'
import { getTopStadden, getWijkenByStad } from '@/lib/pseo'
import { buildHubMetadata, provincieDisplaySlug } from '@/lib/pseo-metadata'
import { formatLocationSlug } from '@/lib/pseo-content-quality'
import { LocationDirectoryPage } from '@/components/pseo/LocationDirectoryPage'

export const revalidate = 604800
type Params = { provincie: string; stad: string }
export async function generateStaticParams() { return (await getTopStadden(0)).map(({ provincie, stad }) => ({ provincie, stad })) }
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const p = await params
  const rows = await getWijkenByStad(p.provincie, p.stad)
  return buildHubMetadata({ kind: 'stad', ...p, indexable: rows.length > 0 })
}
export default async function CityPage({ params }: { params: Promise<Params> }) {
  const p = await params
  const rows = await getWijkenByStad(p.provincie, p.stad)
  if (!rows.length) notFound()
  const name = formatLocationSlug(p.stad)
  return <LocationDirectoryPage name={name} path={`/${p.provincie}/${p.stad}`} kind="wijken"
    context={{ landingPath: `/${p.provincie}/${p.stad}`, pseoLevel: 'stad', ...p }}
    breadcrumbs={[{ name: 'Home', href: '/' }, { name: provincieDisplaySlug(p.provincie), href: `/${p.provincie}` }, { name }]}
    links={rows.map(row => ({ title: formatLocationSlug(row.wijk), href: `/${p.provincie}/${p.stad}/${row.wijk}` }))} />
}
