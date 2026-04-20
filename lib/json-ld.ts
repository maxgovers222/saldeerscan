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
