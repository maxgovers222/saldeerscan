/**
 * Retired: Google's Indexing API only supports job postings and livestreams.
 * Keeping a 410 endpoint lets old scheduled callers stop without touching
 * Google credentials, content records or indexing state.
 */
export async function GET() {
  return Response.json({
    status: 'retired',
    reason: 'Google Indexing API does not support SaldeerScan articles or location pages.',
    sitemap: 'https://saldeerscan.nl/sitemap.xml',
  }, { status: 410 })
}
