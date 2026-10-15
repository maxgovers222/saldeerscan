// Pure article schema shared by rendering and offline editorial release preparation.
export function buildArticleSchema(params: {
  slug: string
  titel: string
  metaDescription: string
  publishedAt: string
  modifiedAt?: string
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
      dateModified: params.modifiedAt ?? params.publishedAt,
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
          url: `${baseUrl}/icon`,
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
