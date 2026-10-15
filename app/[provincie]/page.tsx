import { notFound } from 'next/navigation'
import { getStaddenByProvincie } from '@/lib/pseo'
import { ALL_PROVINCIE_SLUGS, buildHubMetadata, provincieDisplaySlug } from '@/lib/pseo-metadata'
import { formatLocationSlug } from '@/lib/pseo-content-quality'
import { LocationDirectoryPage } from '@/components/pseo/LocationDirectoryPage'

export const revalidate = 604800
type Params = { provincie: string }
export async function generateStaticParams() { return ALL_PROVINCIE_SLUGS.map(provincie => ({ provincie })) }
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { provincie } = await params
  const rows = await getStaddenByProvincie(provincie)
  return buildHubMetadata({ kind: 'provincie', provincie, indexable: rows.length > 0 })
}
export default async function ProvincePage({ params }: { params: Promise<Params> }) {
  const { provincie } = await params
  if (!ALL_PROVINCIE_SLUGS.includes(provincie)) notFound()
  const rows = await getStaddenByProvincie(provincie)
  if (!rows.length) notFound()
  const name = provincieDisplaySlug(provincie)
  return <LocationDirectoryPage name={name} path={`/${provincie}`} kind="steden"
    context={{ landingPath: `/${provincie}`, pseoLevel: 'provincie', provincie }}
    breadcrumbs={[{ name: 'Home', href: '/' }, { name }]}
    links={rows.map(row => ({ title: formatLocationSlug(row.stad), href: `/${provincie}/${row.stad}` }))} />
}
