import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getWijkPage, getTopWijken, getWijkenByStad } from '@/lib/pseo'
import { publishedLocationMetadata } from '@/lib/pseo-published-metadata'
import { formatLocationSlug } from '@/lib/pseo-content-quality'
import { LocationEvidencePage } from '@/components/pseo/LocationEvidencePage'

const getPage = cache(getWijkPage)
export const revalidate = 604800
type Params = { provincie: string; stad: string; wijk: string }
export async function generateStaticParams() { return getTopWijken(0) }
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const page = await getPage(await params)
  return page ? publishedLocationMetadata(page) : { title: 'Pagina niet gevonden' }
}
export default async function WijkPage({ params }: { params: Promise<Params> }) {
  const p = await params
  const page = await getPage(p)
  if (!page) notFound()
  const related = (await getWijkenByStad(p.provincie, p.stad)).filter(row => row.wijk !== p.wijk).slice(0, 6)
    .map(row => ({ href: `/${p.provincie}/${p.stad}/${row.wijk}`, title: formatLocationSlug(row.wijk) }))
  return <LocationEvidencePage page={page} related={related} />
}
