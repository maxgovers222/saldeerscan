import { serializeJsonLd } from '@/lib/safe-json-ld'

export function LocalSchema({ jsonLd }: { jsonLd: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  )
}
