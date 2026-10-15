import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getPseoPage, getTopPseoPages, getStratenByWijk } from '@/lib/pseo'
import { publishedLocationMetadata } from '@/lib/pseo-published-metadata'
import { formatLocationSlug } from '@/lib/pseo-content-quality'
import { LocationEvidencePage } from '@/components/pseo/LocationEvidencePage'

const getPage = cache(getPseoPage)
export const revalidate = 604800
type Params = { provincie: string; stad: string; wijk: string; straat: string }
export async function generateStaticParams() {
  return (await getTopPseoPages(0)).map(row => ({ provincie: row.provincie, stad: row.stad, wijk: row.wijk, straat: row.straat! }))
}
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const page = await getPage(await params)
  return page ? publishedLocationMetadata(page) : { title: 'Pagina niet gevonden' }
}
export default async function StreetPage({ params }: { params: Promise<Params> }) {
  const p = await params
  const page = await getPage(p)
  if (!page) notFound()
  const related = (await getStratenByWijk(p.provincie, p.stad, p.wijk, p.straat)).map(row => ({
    href: `/${row.provincie}/${row.stad}/${row.wijk}/${row.straat}`, title: formatLocationSlug(row.straat!),
  }))
  return <LocationEvidencePage page={page} related={related} />
}
