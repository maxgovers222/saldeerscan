import { createServer } from 'node:http'

const PORT = 54329
const generatedAt = '2026-07-14T12:00:00.000Z'

function page(overrides) {
  return {
    slug: '',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: null,
    straat: null,
    titel: null,
    meta_description: 'Lokale woningdata en de impact van het einde van salderen.',
    hoofdtekst: 'Woningen in deze buurt hebben een herkenbaar energieprofiel.\n\nDe woningdata laat zien waar verduurzaming het meeste oplevert.\n\nLokale netdruk maakt slim eigen verbruik steeds belangrijker.\n\nEen persoonlijke scan vertaalt deze wijkcijfers naar uw woning.',
    faq_items: [
      {
        vraag: 'Wat verandert er na 2027?',
        antwoord: 'Teruggeleverde zonnestroom wordt anders vergoed, waardoor eigen verbruik belangrijker wordt.',
      },
    ],
    json_ld: { '@context': 'https://schema.org', '@type': 'WebPage' },
    gem_bouwjaar: 1998,
    gem_health_score: 78,
    netcongestie_status: 'ORANJE',
    aantal_woningen: 2400,
    postcode_prefix: '3541',
    generated_at: generatedAt,
    status: 'published',
    ...overrides,
  }
}

const rows = [
  page({
    slug: '/utrecht/utrecht/leidsche-rijn',
    wijk: 'leidsche-rijn',
    titel: 'Zonnepanelen en thuisbatterij in Leidsche Rijn',
    aantal_woningen: 18_450,
  }),
  page({
    slug: '/utrecht/utrecht/oost',
    wijk: 'oost',
    titel: 'Zonnepanelen en thuisbatterij in Utrecht Oost',
    gem_bouwjaar: 1938,
    gem_health_score: 66,
    aantal_woningen: 9_820,
  }),
  page({
    slug: '/utrecht/utrecht/centrum',
    wijk: 'centrum',
    titel: 'Zonnepanelen en thuisbatterij in Utrecht Centrum',
    gem_bouwjaar: 1912,
    gem_health_score: 58,
    netcongestie_status: 'ROOD',
    aantal_woningen: 7_350,
  }),
  page({
    slug: '/utrecht/utrecht/oost/biltstraat',
    wijk: 'oost',
    straat: 'biltstraat',
    titel: 'Zonnepanelen en thuisbatterij aan de Biltstraat',
    gem_bouwjaar: 1928,
    gem_health_score: 64,
    aantal_woningen: 420,
  }),
  page({
    slug: '/utrecht/utrecht/oost/maliebaan',
    wijk: 'oost',
    straat: 'maliebaan',
    titel: 'Zonnepanelen en thuisbatterij aan de Maliebaan',
    gem_bouwjaar: 1910,
    gem_health_score: 61,
    aantal_woningen: 310,
  }),
  page({
    slug: '/utrecht/utrecht/leidsche-rijn/berlijnplein',
    wijk: 'leidsche-rijn',
    straat: 'berlijnplein',
    titel: 'Zonnepanelen en thuisbatterij aan het Berlijnplein',
    aantal_woningen: 280,
  }),
  page({
    slug: '/noord-holland/amsterdam/centrum',
    provincie: 'noord-holland',
    stad: 'amsterdam',
    wijk: 'centrum',
    titel: 'Zonnepanelen en thuisbatterij in Amsterdam Centrum',
    postcode_prefix: '1012',
    gem_bouwjaar: 1905,
    gem_health_score: 57,
    netcongestie_status: 'ROOD',
    aantal_woningen: 11_900,
  }),
  page({
    slug: '/limburg/sittard-geleen/born',
    provincie: 'limburg',
    stad: 'sittard-geleen',
    wijk: 'born',
    titel: 'Zonnepanelen en salderen in Born',
    gem_bouwjaar: 1975,
    gem_health_score: 55,
    netcongestie_status: 'GROEN',
    aantal_woningen: 4_100,
  }),
  page({
    slug: '/zuid-holland/den-haag/centrum-den-haag',
    provincie: 'zuid-holland',
    stad: 'den-haag',
    wijk: 'centrum-den-haag',
    titel: 'Zonnepanelen en salderen in Centrum Den Haag',
    gem_bouwjaar: 1890,
    gem_health_score: 46,
    netcongestie_status: 'ORANJE',
    aantal_woningen: 8_700,
  }),
  page({
    slug: '/noord-holland/amsterdam/osdorp',
    provincie: 'noord-holland',
    stad: 'amsterdam',
    wijk: 'osdorp',
    titel: 'Zonnepanelen en salderen in Osdorp',
    gem_bouwjaar: 1965,
    gem_health_score: 52,
    netcongestie_status: 'ROOD',
    aantal_woningen: 7_900,
  }),
]

function matches(row, field, expression) {
  const value = row[field]
  if (expression === 'is.null') return value === null
  if (expression === 'not.is.null') return value !== null
  if (expression.startsWith('eq.')) return String(value) === expression.slice(3)
  if (expression.startsWith('neq.')) return String(value) !== expression.slice(4)
  if (expression.startsWith('like.') || expression.startsWith('ilike.')) {
    const insensitive = expression.startsWith('ilike.')
    const pattern = expression.slice(insensitive ? 6 : 5)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replaceAll('%', '.*')
    return new RegExp(`^${pattern}$`, insensitive ? 'i' : '').test(String(value ?? ''))
  }
  return true
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`)
  if (url.pathname !== '/rest/v1/pseo_pages') {
    response.writeHead(404).end()
    return
  }

  let result = rows.filter(row => {
    for (const [field, expression] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset'].includes(field)) continue
      if (!matches(row, field, expression)) return false
    }
    return true
  })
  const limit = Number(url.searchParams.get('limit'))
  if (Number.isFinite(limit) && limit > 0) result = result.slice(0, limit)

  const wantsObject = request.headers.accept?.includes('application/vnd.pgrst.object+json')
  const body = wantsObject ? result[0] ?? null : result
  response.writeHead(wantsObject && !result[0] ? 406 : 200, {
    'Content-Type': 'application/json',
    'Content-Range': result.length ? `0-${result.length - 1}/${result.length}` : '*/0',
  })
  response.end(JSON.stringify(body))
})

server.listen(PORT, '127.0.0.1')

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
