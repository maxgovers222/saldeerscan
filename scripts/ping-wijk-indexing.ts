// Retained as an explicit failure for existing manual or scheduled callers.
// No credentials are loaded and no network requests are made.
console.error(
  'Retired: Google Indexing API only supports job postings and livestreams. ' +
  'Use the sitemap and Search Console for SaldeerScan pages. ' +
  'Read-only content audit: npx tsx scripts/audit-reach-content.ts',
)
process.exitCode = 1
