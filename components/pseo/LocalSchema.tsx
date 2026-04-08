export function LocalSchema({ jsonLd }: { jsonLd: Record<string, unknown> }) {
  const safe = JSON.stringify(jsonLd).replace(/<\/script>/gi, '<\\/script>')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
