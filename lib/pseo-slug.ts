/** CBS-wijknamen mogen cijfers bevatten (bv. wijk-00, wijk02-kunrade). */
const WIJK_SLUG_REGEX = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/

/** Gedeelde slug-validatie voor wijk-URL's (sitemap, hubs, stad-pagina's). */
export function parsePublishedWijkSlug(
  slug: string,
): { provincie: string; stad: string; wijk: string } | null {
  const parts = slug.split('/').filter(Boolean)
  if (parts.length !== 3) return null
  const [provincie, stad, wijk] = parts
  if (!provincie || !stad || !wijk || !WIJK_SLUG_REGEX.test(wijk)) return null
  return { provincie, stad, wijk }
}
