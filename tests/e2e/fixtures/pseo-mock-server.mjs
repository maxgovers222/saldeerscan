import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const PORT = Number(process.env.PSEO_MOCK_PORT ?? 54329)
const generatedAt = '2026-07-14T12:00:00.000Z'

function displaySlug(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\bijssel/g, 'IJssel')
    .replace(/\b[a-zà-ÿ]/gi, letter => letter.toLocaleUpperCase('nl-NL'))
}

function safeBody(location, record) {
  const woningen = record.aantal_woningen.toLocaleString('nl-NL')
  return [
    `Het gecontroleerde locatie-record voor ${location} vermeldt gemiddeld bouwjaar ${record.gem_bouwjaar}, locatiescore ${record.gem_health_score}, postcodeprefix ${record.postcode_prefix} en een telling van ${woningen} woningen. Deze geregistreerde waarden zeggen alleen iets over dit gebied als geheel. De gegevens beschrijven geen individueel dak, huishouden, energiecontract of aansluiting. Gebruik de pagina voor lokale oriëntatie en controleer kenmerken die per adres verschillen altijd opnieuw voordat u een technische of financiële keuze maakt.`,
    `Voor ${location} worden het gemiddelde bouwjaar, de geregistreerde energiescore, de regionale netindicatie en de beschikbare woningtelling als afzonderlijke bronvelden getoond. Deze velden zijn geen garantie voor de staat van een specifieke woning. Een installateur moet onder meer het dakvlak, schaduw, constructie, meterkast en bestaande aansluiting op het adres beoordelen.`,
    `Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Vanaf 2027 blijft een leveranciersafhankelijke vergoeding voor teruggeleverde stroom bestaan. Contractvoorwaarden verschillen per leverancier en kunnen later wijzigen; deze locatiepagina voorspelt daarom geen persoonlijke financiële uitkomst.`,
    `De regionale netindicatie voor ${location} is uitsluitend een gebiedssignaal. Een kleur is geen technische vaststelling voor een individuele woningaansluiting en zegt evenmin dat een batterij nodig is. Controleer de actuele situatie bij de netbeheerder wanneer u een nieuwe of zwaardere aansluiting overweegt of lokale spanningsproblemen ervaart.`,
    `De bruikbare vervolgstap voor een woning in ${location} is een adresgerichte controle met actuele gegevens. Vergelijk daarbij het eigen jaar- en uurverbruik, de beschikbare dakruimte, offertes, installatiekeuzes en energiecontracten. Zo blijven geregistreerde locatiegemiddelden gescheiden van conclusies die alleen met gegevens van de individuele woning kunnen worden onderbouwd.`,
  ].join('\n\n')
}

function sourceEvidence(record) {
  const routeKey = record.slug.replaceAll('/', '-').replace(/^-/, '')
  const identity = {
    provincie: record.provincie,
    stad: record.stad,
    wijk: record.wijk,
    ...(record.straat ? { straat: record.straat } : {}),
  }
  return [
    {
      sourceId: `cbs-2023-${routeKey}`,
      sourceUrl: `https://opendata.cbs.nl/${routeKey}`,
      retrievedAt: generatedAt,
      geography: record.slug,
      values: {
        ...identity,
        aantal_woningen: record.aantal_woningen,
      },
    },
    {
      sourceId: `pdok-bag-${routeKey}`,
      sourceUrl: `https://service.pdok.nl/${routeKey}`,
      retrievedAt: generatedAt,
      geography: record.slug,
      values: {
        gem_bouwjaar: record.gem_bouwjaar,
        postcode_prefix: record.postcode_prefix,
      },
    },
    {
      sourceId: `saldeerscan-score-v1-${routeKey}`,
      sourceUrl: 'https://saldeerscan.nl/methode',
      retrievedAt: generatedAt,
      geography: record.slug,
      values: {
        gem_health_score: record.gem_health_score,
        netcongestie_status: record.netcongestie_status,
      },
    },
  ]
}

function safeFaq(location) {
  return [
    {
      vraag: `Wat zeggen de geregistreerde gegevens over ${location}?`,
      antwoord: `Ze beschrijven gemiddelden voor ${location}. Controleer bouwkundige, technische en contractuele kenmerken altijd voor het individuele adres.`,
    },
    {
      vraag: 'Wat is de wettelijk vastgelegde einddatum?',
      antwoord: 'Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Daarna blijft een leveranciersafhankelijke terugleververgoeding bestaan.',
    },
    {
      vraag: 'Wat betekent een regionale netindicatie voor mijn woning?',
      antwoord: 'De kleur is een gebiedssignaal en geen bewijs van een beperking op uw aansluiting. Controleer actuele adresinformatie bij de netbeheerder.',
    },
  ]
}

function page(options = {}) {
  const { repeatSafeNetQualification = false, ...overrides } = options
  const record = {
    slug: '',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: null,
    straat: null,
    titel: null,
    meta_description: null,
    hoofdtekst: null,
    faq_items: null,
    json_ld: null,
    gem_bouwjaar: 1998,
    gem_health_score: 78,
    netcongestie_status: 'ORANJE',
    aantal_woningen: 2400,
    postcode_prefix: '3541',
    generated_at: generatedAt,
    status: 'published',
    ...overrides,
  }
  const locationSlug = record.straat ?? record.wijk ?? 'buurt'
  const location = displaySlug(locationSlug)
  if (!Object.hasOwn(overrides, 'titel')) {
    record.titel = `Zonnepanelen in ${location} — geregistreerde locatiegegevens`
  }
  if (!Object.hasOwn(overrides, 'meta_description')) {
    record.meta_description = `Gecontroleerde locatiegegevens voor ${location}, met routegebonden bronvelden en duidelijke grenzen van gebiedsgemiddelden.`
  }
  if (!Object.hasOwn(overrides, 'hoofdtekst')) {
    const body = safeBody(location, record)
    record.hoofdtekst = repeatSafeNetQualification
      ? body.split('\n\n').map((paragraph, index) =>
          index < 2
            ? `${paragraph} De regionale kleur bewijst niet dat teruglevering op een individuele woningaansluiting actief wordt beperkt.`
            : paragraph,
        ).join('\n\n')
      : body
  }
  if (!Object.hasOwn(overrides, 'faq_items')) record.faq_items = safeFaq(location)
  if (!Object.hasOwn(overrides, 'json_ld')) {
    record.json_ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Geregistreerde locatiegegevens voor ${location}`,
    }
  }
  if (!Object.hasOwn(overrides, 'source_evidence')) {
    record.source_evidence = sourceEvidence(record)
  }
  return record
}

const rows = [
  page({
    slug: '/utrecht/utrecht/leidsche-rijn',
    wijk: 'leidsche-rijn',
    repeatSafeNetQualification: true,
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
  page({
    slug: '/noord-holland/haarlemmermeer/hoofddorp',
    provincie: 'noord-holland',
    stad: 'haarlemmermeer',
    wijk: 'hoofddorp',
    titel: 'Hoofddorp zonnepanelen: winst en zekerheid voor 2027',
    meta_description: 'Oude ongecontroleerde voorbeeldtekst voor Hoofddorp met financiële en technische claims die nooit indexeerbaar mag zijn.',
    hoofdtekst: `Hoofddorp staat volgens deze oude tekst voor een uitzonderlijke energiekans. Na 1 januari 2027 zal de salderingsregeling geleidelijk worden afgebouwd. Daarom zou iedere eigenaar in Hoofddorp nu direct moeten handelen om een vermeend voordeel veilig te stellen. Deze formulering spreekt de wettelijke einddatum tegen en is bewust als afkeurrecord opgenomen.

Volgens dezelfde ongecontroleerde tekst kost een groepenkast-upgrade in Hoofddorp doorgaans €300–€600 en zijn daken uit 1985 in de meeste gevallen geschikt voor minimaal 10 zonnepanelen. Deze lokale technische conclusies volgen niet uit de opgeslagen gebiedsvelden en mogen niet op de uiteindelijke pagina verschijnen.

De oude tekst beweert daarnaast dat het stroomnet in Hoofddorp door Liander/Enexis wordt beheerd, steeds voller raakt en binnenkort beperkingen op teruglevering veroorzaakt. Een thuisbatterij wordt daarbij sterk aanbevolen. Een regionale kleur kan zulke conclusies voor een bestaande woningaansluiting niet dragen.

Ook noemt het afkeurrecord een jaarlijkse besparing van €500 tot €900 en een vaste terugverdientijd van 7 tot 10 jaar. Zonder verbruik, dakvlak, offerte en energiecontract zijn deze bedragen niet onderbouwd. De kwaliteitsgate moet de volledige gegenereerde tekst vervangen door een veilige, aantoonbare fallback.

Hoofddorp blijft in dit record meerdere keren genoemd zodat de afkeur niet door een toevallig lage locatiespecificiteit ontstaat. Het record heeft geldige bronvelden, een geldig generatiemoment en voldoende tekst; uitsluitend de verboden inhoud en onveilige structured data moeten de indexeerbaarheid blokkeren.`,
    faq_items: [
      {
        vraag: 'Wordt salderen in Hoofddorp vanaf 2027 geleidelijk afgebouwd?',
        antwoord: 'Volgens deze bewust foute fixturetekst wel; dit antwoord moet door de kwaliteitsgate worden verwijderd.',
      },
      {
        vraag: 'Is een batterij noodzakelijk door het volle net in Hoofddorp?',
        antwoord: 'Deze bewust onveilige fixture noemt een batterij noodzakelijk zonder bewijs op adresniveau.',
      },
      {
        vraag: 'Wat kost een groepenkast in Hoofddorp?',
        antwoord: 'De ongecontroleerde fixture claimt €300–€600 zonder lokale bron.',
      },
    ],
    json_ld: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      description: 'Na 1 januari 2027 wordt salderen geleidelijk afgebouwd; een batterij is noodzakelijk en bespaart €900.',
    },
    gem_bouwjaar: 1985,
    gem_health_score: 70,
    netcongestie_status: 'ORANJE',
    aantal_woningen: 31_987,
    postcode_prefix: '2132',
  }),
  page({
    slug: '/noord-holland/haarlemmermeer/hoofddorp/teststraat',
    provincie: 'noord-holland',
    stad: 'haarlemmermeer',
    wijk: 'hoofddorp',
    straat: 'teststraat',
    gem_bouwjaar: 1991,
    gem_health_score: 63,
    netcongestie_status: 'ORANJE',
    aantal_woningen: 120,
    postcode_prefix: '2132',
  }),
  page({
    slug: '/zuid-holland/rotterdam/ijsselmonde',
    provincie: 'zuid-holland',
    stad: 'rotterdam',
    wijk: 'ijsselmonde',
    titel: 'IJsselmonde zonnepanelen: maximaal voordeel voor 2027',
    meta_description: 'Oude ongecontroleerde voorbeeldtekst voor IJsselmonde met strijdige salderingsclaims en niet-onderbouwde bedragen.',
    hoofdtekst: `De oude analyse voor IJsselmonde presenteert 2027 als een geleidelijke overgang. Vanaf 1 januari 2027 wordt de salderingsregeling volgens deze bewust foute tekst stapsgewijs afgebouwd. Die bewering is strijdig met het wettelijke einde in één keer en moet de kwaliteitsgate laten falen.

Voor IJsselmonde noemt het afkeurrecord een jaarlijkse besparing tussen de €350 en €700. Een andere kop in dezelfde bron noemt €960 per jaar. De bedragen zijn onderling tegenstrijdig en missen gegevens over verbruik, dak, installatie, tarieven en contractvoorwaarden.

De fixture beweert verder dat het elektriciteitsnet in IJsselmonde overbelast is en dat teruglevering al wordt beperkt. Een thuisbatterij zou daarom essentieel zijn. De opgeslagen regionale kleur bewijst geen van deze uitspraken voor een individuele aansluiting en kan geen technisch of financieel productadvies dragen.

Ook stelt de oude tekst dat woningen uit 1972 over het algemeen geschikt zijn voor zonnepanelen en dat een subsidie extra technische kosten kan dekken. Zulke conclusies zijn niet afkomstig uit aantoonbare adresdata. De uiteindelijke pagina mag deze gegenereerde alinea's daarom niet tonen.

IJsselmonde staat bewust herhaald in dit voldoende lange afkeurrecord. Bouwjaar, score, woningtelling, postcode en generatiedatum zijn geldig. Daarmee bewijst de test dat verboden claims, bedragen en structured data op zichzelf tot een veilige fallback, noindex en uitsluiting uit de sitemap leiden.`,
    faq_items: [
      {
        vraag: 'Wordt salderen in IJsselmonde stapsgewijs afgebouwd?',
        antwoord: 'Deze bewust onjuiste fixture zegt van wel en moet daarom worden afgevangen.',
      },
      {
        vraag: 'Is een thuisbatterij essentieel in IJsselmonde?',
        antwoord: 'De ongecontroleerde bron noemt de batterij essentieel vanwege een vermeend overbelast net.',
      },
      {
        vraag: 'Hoeveel bespaar ik in IJsselmonde?',
        antwoord: 'De afgekeurde bron noemt zowel €350–€700 als €960 zonder individuele onderbouwing.',
      },
    ],
    json_ld: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      description: 'In IJsselmonde wordt salderen stapsgewijs afgebouwd en is een batterij essentieel voor €960 voordeel.',
    },
    gem_bouwjaar: 1972,
    gem_health_score: 65,
    netcongestie_status: 'ROOD',
    aantal_woningen: 25_696,
    postcode_prefix: '3078',
  }),
]

const recoveryRows = JSON.parse(readFileSync(new URL('../../fixtures/recovery-location-rows.json', import.meta.url), 'utf8'))
const recoverySlugs = new Set(recoveryRows.map(row => row.slug))
const locationRows = process.env.PSEO_MOCK_CORPUS_FILE
  ? JSON.parse(readFileSync(process.env.PSEO_MOCK_CORPUS_FILE, 'utf8')).snapshot.pseo_pages
  : [...rows.filter(row => !recoverySlugs.has(row.slug)), ...recoveryRows]

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

// Synthetic legacy articles exercise replacements across body, summaries and schema.
const newsRows = [
  {
    slug: 'energielabel-c-woningwaarde-zonnepanelen',
    titel: 'Energielabel C Verplicht: Impact op Woningwaarde',
    hoofdtekst: 'Er is geen wettelijk vastgelegd of gegarandeerd tarief meer.',
    published_at: '2026-08-01T00:00:00Z',
  },
  {
    slug: 'garantie-zonnepanelen-bescherm-investering-na-saldering',
    titel: 'Garantie Zonnepanelen 2026',
    hoofdtekst: 'De salderingsregeling is al aanzienlijk afgebouwd in 2026.',
    published_at: '2026-07-15T00:00:00Z',
  },
].map((row, index) => ({
  id: `00000000-0000-0000-0000-00000000000${index + 1}`,
  status: 'published', meta_description: row.hoofdtekst,
  intro: row.hoofdtekst, faq_items: [],
  json_ld: { '@type': 'NewsArticle', headline: row.titel, description: row.hoofdtekst },
  generated_at: generatedAt, ...row,
}))
const additionalNewsRows = JSON.parse(readFileSync(new URL('../../fixtures/recovery-news-rows.json', import.meta.url), 'utf8'))
const articleRows = [...newsRows, ...additionalNewsRows]
const knowledgeRows = JSON.parse(readFileSync(new URL('../../fixtures/recovery-knowledge-rows.json', import.meta.url), 'utf8'))

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`)
  const tableRows = url.pathname === '/rest/v1/pseo_pages' ? locationRows
    : url.pathname === '/rest/v1/nieuws_articles' ? articleRows
    : url.pathname === '/rest/v1/kennisbank_articles' ? knowledgeRows : null
  if (!tableRows || request.method !== 'GET') {
    response.writeHead(404).end()
    return
  }

  let result = tableRows.filter(row => {
    for (const [field, expression] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset'].includes(field)) continue
      if (!matches(row, field, expression)) return false
    }
    return true
  })
  const order = url.searchParams.get('order')
  if (order?.startsWith('slug.')) result.sort((a, b) => a.slug.localeCompare(b.slug))
  const offset = Number(url.searchParams.get('offset') ?? 0)
  if (offset > 0) result = result.slice(offset)
  const limit = Number(url.searchParams.get('limit'))
  if (Number.isFinite(limit) && limit > 0) result = result.slice(0, limit)
  const selection = url.searchParams.get('select')
  if (selection && selection !== '*') {
    const keys = selection.split(',')
    result = result.map(row => Object.fromEntries(keys.map(key => [key, row[key] ?? null])))
  }

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
