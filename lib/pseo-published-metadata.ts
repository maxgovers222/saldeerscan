import type { Metadata } from 'next'
import type { PseoPageData } from './pseo'

/** Inputs are the approved display projection, never raw generated database copy. */
export function publishedLocationMetadata(page: PseoPageData): Metadata {
  const url = `https://saldeerscan.nl${page.slug}`
  return { title: page.titel, description: page.metaDescription, alternates: { canonical: url },
    robots: page.quality.indexable ? undefined : { index: false, follow: true },
    openGraph: { title: page.titel, description: page.metaDescription, url, locale: 'nl_NL', type: 'website',
      images: [{ url: `https://saldeerscan.nl/api/og?titel=${encodeURIComponent(page.titel)}`, width: 1200, height: 630 }] },
  }
}
