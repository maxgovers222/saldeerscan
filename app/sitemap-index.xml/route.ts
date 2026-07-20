import { SITEMAP_IDS } from '@/lib/sitemap-config'

export const dynamic = 'force-static'

export async function GET() {
  const entries = SITEMAP_IDS.map(id =>
    `  <sitemap><loc>https://saldeerscan.nl/sitemap/${id}.xml</loc></sitemap>`
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
