import type { HubBreadcrumbItem } from '@/lib/pseo-hubs'
import {
  buildBreadcrumbListLd as buildHubBreadcrumbListLd,
  buildHubCollectionLd as buildHubCollectionLdCore,
  absoluteUrl,
} from '@/lib/pseo-hubs'

/** Province / city hub CollectionPage + ItemList JSON-LD (delegates to hub schema helpers). */
export function buildHubCollectionLd(params: Parameters<typeof buildHubCollectionLdCore>[0]): ReturnType<
  typeof buildHubCollectionLdCore
> {
  return buildHubCollectionLdCore(params)
}

/** BreadcrumbList JSON-LD with absolute URLs (delegates to hub schema helpers). */
export function buildBreadcrumbListLd(items: HubBreadcrumbItem[]): Record<string, unknown> {
  return buildHubBreadcrumbListLd(items)
}

export function buildWijkWebPageGraph(params: {
  url: string
  name: string
  description: string
  breadcrumbItems?: HubBreadcrumbItem[]
}): Record<string, unknown> {
  const pageUrl = absoluteUrl(params.url)
  const graph: unknown[] = [
    {
      '@type': 'WebPage',
      '@id': pageUrl,
      name: params.name,
      description: params.description,
      url: pageUrl,
      inLanguage: 'nl-NL',
    },
  ]
  if (params.breadcrumbItems?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: params.breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.href),
      })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

/** Postcode-hub: CollectionPage + ItemList met alle gekoppelde wijk-URL's (geen FAQ). */
export function buildPostcodeHubGraphLd(params: {
  postcode: string
  wijken: Array<{ wijk: string; stad: string; provincie: string }>
}): Record<string, unknown> {
  const path = `/postcode/${params.postcode}`
  const pageUrl = absoluteUrl(path)
  const itemListElement = params.wijken.map((w, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: `${w.wijk.replace(/-/g, ' ')} (${w.stad.replace(/-/g, ' ')})`,
    url: absoluteUrl(`/${w.provincie}/${w.stad}/${w.wijk}`),
  }))
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        name: `Zonnepanelen postcode ${params.postcode}`,
        description: `Wijkanalyses en netcongestie voor postcodegebied ${params.postcode}.`,
        url: pageUrl,
        inLanguage: 'nl-NL',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: itemListElement.length,
          itemListElement,
        },
      },
    ],
  }
}

export function buildWebApplicationSchema(): Record<string, unknown> {
  const baseUrl = 'https://saldeerscan.nl'
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SaldeerScan — 2027 Saldeercheck',
    url: `${baseUrl}/check`,
    applicationCategory: 'UtilityApplication',
    browserRequirements: 'Requires JavaScript.',
    operatingSystem: 'Any',
    description:
      'Gratis AI-gestuurde salderings- en ROI-check voor Nederlandse woningen vóór 1 januari 2027.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SaldeerScan',
      url: baseUrl,
    },
  }
}

export function buildArticleSchema(params: {
  slug: string
  titel: string
  metaDescription: string
  publishedAt: string
  type: 'kennisbank' | 'nieuws'
  faqItems?: Array<{ vraag: string; antwoord: string }>
}): Record<string, unknown> {
  const baseUrl = 'https://saldeerscan.nl'
  const url = `${baseUrl}/${params.type}/${params.slug}`
  const schemaType = params.type === 'nieuws' ? 'NewsArticle' : 'Article'

  const graph: unknown[] = [
    {
      '@type': schemaType,
      '@id': url,
      headline: params.titel,
      description: params.metaDescription,
      url,
      datePublished: params.publishedAt,
      dateModified: params.publishedAt,
      inLanguage: 'nl-NL',
      author: {
        '@type': 'Organization',
        name: 'SaldeerScan',
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: 'SaldeerScan',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/icon.png`,
        },
      },
      about: {
        '@type': 'Thing',
        name: 'Salderingsregeling 2027',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        {
          '@type': 'ListItem',
          position: 2,
          name: params.type === 'kennisbank' ? 'Kennisbank' : 'Nieuws',
          item: `${baseUrl}/${params.type}`,
        },
        { '@type': 'ListItem', position: 3, name: params.titel, item: url },
      ],
    },
  ]

  if (params.faqItems && params.faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: params.faqItems.map(faq => ({
        '@type': 'Question',
        name: faq.vraag,
        acceptedAnswer: { '@type': 'Answer', text: faq.antwoord },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

// Pure schema builder — safe for server and build-time use
export function buildLocalBusinessSchema(params: {
  straat: string
  stad: string
  provincie: string
  postcode?: string
  faqItems?: Array<{ vraag: string; antwoord: string }>
}): Record<string, unknown> {
  const graph: unknown[] = [
    {
      '@type': 'LocalBusiness',
      '@id': `https://saldeerscan.nl/${params.provincie}/${params.stad}`,
      name: `SaldeerScan — ${params.straat}, ${params.stad}`,
      description: `Energieadvies en zonnepanelen planning voor woningen op ${params.straat} in ${params.stad}.`,
      url: 'https://saldeerscan.nl',
      telephone: '+31-800-ENERGIE',
      address: {
        '@type': 'PostalAddress',
        streetAddress: params.straat,
        addressLocality: params.stad,
        addressRegion: params.provincie,
        addressCountry: 'NL',
        ...(params.postcode ? { postalCode: params.postcode } : {}),
      },
      areaServed: {
        '@type': 'AdministrativeArea',
        name: params.stad,
      },
    },
  ]

  if (params.faqItems && params.faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: params.faqItems.map(faq => ({
        '@type': 'Question',
        name: faq.vraag,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.antwoord,
        },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
