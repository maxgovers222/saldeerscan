import { expect, test } from '@playwright/test'
import {
  assessPseoDatabaseRow,
  assessPseoContentQuality,
  formatLocationSlug,
  type PseoQualityCandidate,
  type PseoQualityReason,
} from '@/lib/pseo-content-quality'
import { serializeJsonLd } from '@/lib/safe-json-ld'

const SAFE_BODY = [
  'IJsselmonde is in dit gegevensrecord gekoppeld aan Rotterdam en wordt hier uitsluitend op wijkniveau beschreven. Het record vermeldt bouwjaar 1972, locatiescore 65, postcodeprefix 3078 en een telling van 25.696 woningen. Deze waarden zijn kenmerken van het record, niet van iedere afzonderlijke woning. Voor een besluit over een adres zijn daarom aanvullende woninggegevens nodig.',
  'De locatiegegevens voor IJsselmonde geven context voor een eerste oriëntatie. Dakvorm, schaduw, installatie, energiecontract en het verbruik over de dag verschillen per adres. Deze pagina trekt daarom geen conclusie over een individueel dak, een aansluiting of een passende installatie en verwijst voor zulke vragen naar een adresgerichte controle.',
  'Salderen blijft honderd procent mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Vanaf die datum blijft een leveranciersafhankelijke vergoeding voor teruggeleverde stroom bestaan. De precieze uitkomst verschilt per leverancier en contract, zodat een locatiegemiddelde geen persoonlijk financieel resultaat kan voorspellen.',
  'De opgeslagen regionale netindicatie voor IJsselmonde is alleen context bij het record. Actuele capaciteit en technische omstandigheden moeten voor het eigen adres bij de netbeheerder en een deskundige worden gecontroleerd. De wijkpagina gebruikt de regionale indicatie daarom niet als individueel technisch oordeel of als automatisch productadvies.',
  'Voor IJsselmonde zijn herkomst, peildatum en geografisch niveau van gegevens belangrijk. Een gemiddelde kan verschillen verbergen tussen straten, woningtypen en adressen. De pagina blijft bij controleerbare recordkenmerken en maakt duidelijk waar persoonlijke invoer nodig is, zodat bezoekers een wijkgemiddelde niet verwarren met een vaststaand kenmerk van hun woning.',
].join('\n\n')

function safeCandidate(
  overrides: Partial<PseoQualityCandidate> = {},
): PseoQualityCandidate {
  return {
    level: 'wijk',
    slug: '/zuid-holland/rotterdam/ijsselmonde',
    provincie: 'zuid-holland',
    stad: 'rotterdam',
    wijk: 'ijsselmonde',
    straat: null,
    titel: 'Lokale woninggegevens voor IJsselmonde',
    metaDescription:
      'Controleerbare wijkgegevens voor IJsselmonde, met routegebonden bronvelden en duidelijke grenzen van locatiegemiddelden.',
    hoofdtekst: SAFE_BODY,
    faqItems: [
      {
        vraag: 'Wat beschrijft dit record voor IJsselmonde?',
        antwoord:
          'Het beschrijft geregistreerde wijkkenmerken. De gegevens vormen geen individueel oordeel over een woning of installatie.',
      },
      {
        vraag: 'Wat is de wettelijk vastgelegde einddatum?',
        antwoord:
          'Salderen blijft honderd procent mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027.',
      },
      {
        vraag: 'Waarom is een adresgerichte controle nodig?',
        antwoord:
          'Dak, verbruik, installatie en contract verschillen per woning en kunnen niet uit een wijkgemiddelde worden afgeleid.',
      },
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Lokale woninggegevens voor IJsselmonde',
      description: 'Controleerbare wijkgegevens met duidelijke grenzen aan locatiegemiddelden.',
    },
    gemBouwjaar: 1972,
    gemHealthScore: 65,
    netcongestieStatus: 'ROOD',
    aantalWoningen: 25_696,
    postcodePrefix: '3078',
    generatedAt: '2026-08-17T08:00:00.000Z',
    sourceEvidence: [
      {
        sourceId: 'cbs-wijk-2023-ijsselmonde',
        sourceUrl: 'https://opendata.cbs.nl/ijsselmonde',
        retrievedAt: '2026-08-17T07:00:00.000Z',
        geography: '/zuid-holland/rotterdam/ijsselmonde',
        values: {
          provincie: 'zuid-holland',
          stad: 'rotterdam',
          wijk: 'ijsselmonde',
          aantal_woningen: 25_696,
        },
      },
      {
        sourceId: 'pdok-bag-ijsselmonde-2026',
        sourceUrl: 'https://service.pdok.nl/ijsselmonde',
        retrievedAt: '2026-08-17T07:05:00.000Z',
        geography: '/zuid-holland/rotterdam/ijsselmonde',
        values: {
          gem_bouwjaar: 1972,
          postcode_prefix: '3078',
        },
      },
      {
        sourceId: 'saldeerscan-score-v1-ijsselmonde',
        sourceUrl: 'https://saldeerscan.nl/methode',
        retrievedAt: '2026-08-17T07:10:00.000Z',
        geography: '/zuid-holland/rotterdam/ijsselmonde',
        values: {
          gem_health_score: 65,
          netcongestie_status: 'ROOD',
        },
      },
    ],
    ...overrides,
  }
}

test('approves a sufficiently specific candidate without unsafe generated claims', () => {
  const result = assessPseoContentQuality(safeCandidate())

  expect(result.indexable).toBe(true)
  expect(result.displayGeneratedContent).toBe(true)
  expect(result.hasSufficientEvidence).toBe(true)
  expect(result.wordCount).toBeGreaterThanOrEqual(180)
  expect(result.reasons).toEqual([])
})

test('rejects the exact Hoofddorp gradual phase-out claim', () => {
  const result = assessPseoContentQuality(safeCandidate({
    slug: '/noord-holland/haarlemmermeer/hoofddorp',
    provincie: 'noord-holland',
    stad: 'haarlemmermeer',
    wijk: 'hoofddorp',
    titel: 'Lokale woninggegevens voor Hoofddorp',
    metaDescription:
      'Controleerbare wijkgegevens voor Hoofddorp, met de grenzen van gemiddelden en de actuele stopdatum van salderen.',
    hoofdtekst: SAFE_BODY.replaceAll('IJsselmonde', 'Hoofddorp')
      + '\n\nNa 1 januari 2027 zal dit systeem geleidelijk worden afgebouwd.',
  }))

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('obsolete-saldering-claim')
})

test('rejects the exact IJsselmonde stepwise phase-out claim', () => {
  const result = assessPseoContentQuality(safeCandidate({
    hoofdtekst: `${SAFE_BODY}\n\nVanaf 1 januari 2027 wordt de salderingsregeling stapsgewijs afgebouwd.`,
  }))

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('obsolete-saldering-claim')
})

test('rejects corrupted and unsubstantiated euro amounts in generated copy', () => {
  const result = assessPseoContentQuality(safeCandidate({
    hoofdtekst: `${SAFE_BODY}\n\nEen groepenkast-upgrade kost hier €1.034, terwijl de jaarlijkse besparing tussen €350 en €700 ligt.`,
  }))

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('unsupported-financial-claim')
})

test('rejects unsafe FAQ copy and unsafe JSON-LD independently of the safe body', () => {
  const candidate = safeCandidate()
  const result = assessPseoContentQuality({
    ...candidate,
    faqItems: candidate.faqItems.map((faq, index) => index === 0
      ? {
          ...faq,
          antwoord:
            'Door het volle elektriciteitsnet is een thuisbatterij in IJsselmonde noodzakelijk.',
        }
      : faq),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: 'Wat verandert er in 2027?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vanaf 1 januari 2027 wordt de salderingsregeling stapsgewijs afgebouwd.',
        },
      }],
    },
  })

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('unsupported-net-claim')
  expect(result.reasons).toContain('unsafe-structured-data')
})

test('rejects the non-canonical fryslan province and a mismatching route', () => {
  const result = assessPseoContentQuality(safeCandidate({
    slug: '/friesland/leeuwarden/ijsselmonde',
    provincie: 'fryslan',
    stad: 'leeuwarden',
  }))

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('invalid-province')
  expect(result.reasons).toContain('route-record-mismatch')
})

test('rejects a candidate without the minimum location evidence', () => {
  const result = assessPseoContentQuality(safeCandidate({
    gemBouwjaar: null,
    gemHealthScore: null,
    aantalWoningen: null,
    postcodePrefix: null,
  }))

  expect(result.indexable).toBe(false)
  expect(result.hasSufficientEvidence).toBe(false)
  expect(result.reasons).toEqual([
    'missing-source-evidence',
    'insufficient-local-specificity',
  ])
})

test('returns all reasons in a stable policy order', () => {
  const candidate = safeCandidate({
    slug: '/friesland/rotterdam/ijsselmonde',
    provincie: 'fryslan',
    titel: 'Kort',
    metaDescription: 'Kort',
    hoofdtekst:
      'Na 1 januari 2027 wordt de salderingsregeling geleidelijk afgebouwd. Een thuisbatterij is noodzakelijk. Woningen zijn in de meeste gevallen geschikt voor minimaal 10 zonnepanelen. De investering kost €1.034.',
    faqItems: [],
    jsonLd: {
      description:
        'Een thuisbatterij is noodzakelijk en de salderingsregeling wordt stapsgewijs afgebouwd.',
    },
    gemBouwjaar: null,
    gemHealthScore: null,
    aantalWoningen: null,
    postcodePrefix: null,
    generatedAt: 'geen-datum',
  })
  const expected: PseoQualityReason[] = [
    'invalid-province',
    'route-record-mismatch',
    'missing-source-evidence',
    'invalid-generated-at',
    'thin-generated-content',
    'insufficient-local-specificity',
    'obsolete-saldering-claim',
    'unsupported-financial-claim',
    'unsupported-net-claim',
    'unsupported-local-claim',
    'unsafe-structured-data',
  ]

  expect(assessPseoContentQuality(candidate).reasons).toEqual(expected)
  expect(assessPseoContentQuality(candidate).reasons).toEqual(expected)
})

test('does not classify explicit safety qualifications as unsafe net claims', () => {
  const result = assessPseoContentQuality(safeCandidate({
    hoofdtekst: `${SAFE_BODY}\n\nDe regionale kleur bewijst niet dat teruglevering op een individuele woningaansluiting actief wordt beperkt. Een thuisbatterij is niet automatisch noodzakelijk en vraagt een individuele beoordeling.`,
  }))

  expect(result.reasons).not.toContain('unsupported-net-claim')
  expect(result.indexable).toBe(true)
})

test('does not let a safe qualification hide an unsafe clause after a delimiter', () => {
  const cases = [
    'De kleur bewijst niet dat teruglevering wordt beperkt, maar teruglevering wordt hier wel actief gereguleerd.',
    'De kleur bewijst niet dat teruglevering wordt beperkt maar teruglevering wordt hier wel actief gereguleerd.',
    'De kleur bewijst niet dat teruglevering wordt beperkt en teruglevering wordt hier actief gereguleerd.',
    'De kleur bewijst niet dat teruglevering wordt beperkt en wordt hier actief gereguleerd.',
    'Een thuisbatterij is niet automatisch noodzakelijk, maar een thuisbatterij is hier wel essentieel.',
    'Een thuisbatterij is niet automatisch noodzakelijk maar een thuisbatterij is hier wel essentieel.',
    'Een thuisbatterij is niet automatisch noodzakelijk en een thuisbatterij is hier essentieel.',
    'Een thuisbatterij is niet automatisch noodzakelijk en is in IJsselmonde essentieel.',
    'De salderingsregeling wordt niet geleidelijk afgebouwd; vanaf 1 januari 2027 wordt de salderingsregeling stapsgewijs afgebouwd.',
    'De salderingsregeling wordt niet geleidelijk afgebouwd maar vanaf 1 januari 2027 wordt de salderingsregeling stapsgewijs afgebouwd.',
    'De salderingsregeling wordt niet geleidelijk afgebouwd en vanaf 1 januari 2027 wordt de salderingsregeling stapsgewijs afgebouwd.',
    'De salderingsregeling wordt niet geleidelijk afgebouwd en wordt vanaf 1 januari 2027 stapsgewijs afgebouwd.',
  ]

  for (const extra of cases) {
    const result = assessPseoContentQuality(safeCandidate({
      hoofdtekst: `${SAFE_BODY}\n\n${extra}`,
    }))
    expect(result.indexable, extra).toBe(false)
  }
})

test('requires a validated postcode prefix even when the other wijk fields exist', () => {
  const result = assessPseoContentQuality(safeCandidate({ postcodePrefix: null }))

  expect(result.hasSufficientEvidence).toBe(false)
  expect(result.reasons).toContain('missing-source-evidence')
})

test('rejects plausible local fields without persisted route-bound provenance', () => {
  const result = assessPseoContentQuality(safeCandidate({ sourceEvidence: [] }))

  expect(result.hasSufficientEvidence).toBe(false)
  expect(result.reasons).toContain('missing-source-evidence')
})

test('requires recent evidence from independent external source families', () => {
  const candidate = safeCandidate()
  const duplicateSource = candidate.sourceEvidence.map((evidence, index) => ({
    ...evidence,
    sourceId: `pdok-duplicate-${index}`,
    sourceUrl: 'https://service.pdok.nl/niet-bestaand',
  }))
  expect(assessPseoContentQuality({
    ...candidate,
    sourceEvidence: duplicateSource,
  }).reasons).toContain('missing-source-evidence')

  expect(assessPseoContentQuality({
    ...candidate,
    sourceEvidence: candidate.sourceEvidence.map((evidence, index) => index === 0
      ? { ...evidence, retrievedAt: '2099-01-01T00:00:00.000Z' }
      : evidence),
  }).reasons).toContain('missing-source-evidence')

  expect(assessPseoContentQuality({
    ...candidate,
    generatedAt: '2099-01-01T01:00:00.000Z',
    sourceEvidence: candidate.sourceEvidence.map(evidence => ({
      ...evidence,
      retrievedAt: '2099-01-01T00:00:00.000Z',
    })),
  }).reasons).toContain('missing-source-evidence')

  expect(assessPseoContentQuality({
    ...candidate,
    generatedAt: '2020-08-17T08:00:00.000Z',
    sourceEvidence: candidate.sourceEvidence.map(evidence => ({
      ...evidence,
      retrievedAt: '2020-08-17T07:00:00.000Z',
    })),
  }).reasons).toContain('missing-source-evidence')
})

test('rejects reversed net, operator and ISDE claim variants from the live corpus', () => {
  const cases = [
    'Voor IJsselmonde worden dreigende beperkingen op teruglevering verwacht.',
    'In IJsselmonde zijn beperkingen op teruglevering al actief.',
    'De netdruk heeft directe gevolgen voor teruglevering in IJsselmonde.',
    'Liander beheert het stroomnet in IJsselmonde.',
    'ISDE kan extra kosten voor een dakcheck en groepenkast dekken in IJsselmonde.',
    'Een thuisbatterij is in IJsselmonde een noodzaak.',
    'De groepenkast in IJsselmonde heeft een upgrade nodig.',
    'De daken in IJsselmonde zijn meestal geschikt voor zonnepanelen.',
    'Door netcongestie is teruglevering in IJsselmonde onmogelijk.',
    'Het stroomnet in IJsselmonde valt onder Liander.',
    'Een upgrade is nodig voor de groepenkast in IJsselmonde.',
    'Essentieel is een thuisbatterij in IJsselmonde.',
    'Alle daken in IJsselmonde zijn geschikt voor zonnepanelen.',
    'Voor woningen in IJsselmonde adviseren we daarom een thuisbatterij.',
    'De dakvlakken in IJsselmonde lenen zich uitstekend voor zonnepanelen.',
    'Zonnepanelen passen goed op de daken in IJsselmonde.',
    'Een accu is in IJsselmonde de verstandigste keuze.',
    'Thuisopslag is in IJsselmonde de beste oplossing.',
    'Op vrijwel elk dak in IJsselmonde kunnen zonder problemen zonnepanelen worden geplaatst.',
    'Een opslagsysteem is in IJsselmonde de logische stap.',
  ]

  for (const extra of cases) {
    const result = assessPseoContentQuality(safeCandidate({
      hoofdtekst: `${SAFE_BODY}\n\n${extra}`,
    }))
    expect(result.indexable, extra).toBe(false)
  }
})

test('rejects financial amounts and payback periods without a euro symbol', () => {
  const cases = [
    'De jaarlijkse besparing in IJsselmonde ligt tussen 350 en 700 euro.',
    'De investering in IJsselmonde bedraagt EUR 1034.',
    'U verdient de installatie in IJsselmonde binnen zeven jaar terug.',
    'De terugverdientijd in IJsselmonde is zeven jaar.',
    'De investering in IJsselmonde bedraagt duizend euro.',
    'De investering in IJsselmonde bedraagt vijftienhonderd euro.',
  ]

  for (const extra of cases) {
    const result = assessPseoContentQuality(safeCandidate({
      hoofdtekst: `${SAFE_BODY}\n\n${extra}`,
    }))
    expect(result.reasons, extra).toContain('unsupported-financial-claim')
  }
})

test('rejects a semantic rewrite of gradual saldering phase-out', () => {
  const result = assessPseoContentQuality(safeCandidate({
    hoofdtekst: `${SAFE_BODY}\n\nVanaf 1 januari 2027 neemt de mogelijkheid tot salderen jaarlijks af.`,
  }))

  expect(result.reasons).toContain('obsolete-saldering-claim')
})

test('rejects every saldering formulation outside the approved current-law copy', () => {
  const cases = [
    'Vanaf 1 januari 2027 kunt u ieder jaar minder salderen.',
    'Vanaf 1 januari 2027 neemt de mogelijkheid tot salderen jaarlijks af.',
    'Vanaf 1 januari 2027 blijft 64% van de salderingsregeling over.',
    'Vanaf 2027 wordt de regeling elk jaar verder beperkt.',
    'Vanaf die datum blijft nog slechts de helft over.',
    'Daarna mag jaarlijks een kleiner deel worden verrekend.',
    'Vanaf 2027 saldeert u ieder jaar minder.',
    'Vanaf 2027 wordt nog maar de helft gesaldeerd.',
    'Er is geen wettelijke stopdatum van salderen.',
    'De wettelijke stopdatum van salderen is onjuist.',
    'Het is onjuist dat salderen blijft honderd procent mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027.',
  ]

  for (const extra of cases) {
    const result = assessPseoContentQuality(safeCandidate({
      hoofdtekst: `${SAFE_BODY}\n\n${extra}`,
    }))
    expect(result.reasons, extra).toContain('obsolete-saldering-claim')
  }

  const misleadingMetadata = assessPseoContentQuality(safeCandidate({
    metaDescription: 'Uitleg over de stop van salderen per 1 januari 2027 klopt niet. Controleerbare wijkgegevens voor IJsselmonde.',
  }))
  expect(misleadingMetadata.reasons).toContain('obsolete-saldering-claim')
})

test('rejects repetitive body padding and trivial FAQ answers', () => {
  const repeated = 'IJsselmonde gebruikt geregistreerde locatiegegevens 1972 65 3078 25.696 alleen als context voor het gebied en niet als individueel woningadvies.'
  const result = assessPseoContentQuality(safeCandidate({
    hoofdtekst: Array.from({ length: 40 }, () => repeated).join(' '),
    faqItems: [
      { vraag: 'Wat betekent dit voor IJsselmonde?', antwoord: 'Een.' },
      { vraag: 'Welke gegevens zijn gecontroleerd?', antwoord: 'Twee.' },
      { vraag: 'Waarom blijft adrescontrole nodig?', antwoord: 'Drie.' },
    ],
  }))

  expect(result.reasons).toContain('thin-generated-content')

  const numberWords = ['één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht']
  const nearDuplicateParagraphs = numberWords.map((number, index) =>
    `Variant ${number}: IJsselmonde gebruikt de geregistreerde waarden 1972, 65, 3078 en 25.696 alleen als lokale context; deze herhaalde formulering levert geen nieuw inzicht voor een woning. ${index % 2 === 1 ? '\n\n' : ''}`,
  ).join(' ')
  const nearDuplicateResult = assessPseoContentQuality(safeCandidate({
    hoofdtekst: `${nearDuplicateParagraphs}\n\nSalderen blijft honderd procent mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027.`,
    faqItems: [
      { vraag: 'Wat betekent dit eerste lokale gegeven?', antwoord: 'Dit antwoord herhaalt alleen dezelfde algemene woorden zonder aanvullende controleerbare lokale inhoud voor een adres.' },
      { vraag: 'Wat betekent dit tweede lokale gegeven?', antwoord: 'Dit antwoord herhaalt alleen dezelfde algemene woorden zonder aanvullende controleerbare lokale inhoud voor een adres.' },
      { vraag: 'Waarom blijft een adrescontrole nodig?', antwoord: 'Een individuele woning vraagt actuele kenmerken die niet uit een locatiegemiddelde kunnen worden afgeleid.' },
    ],
  }))

  expect(nearDuplicateResult.reasons).toContain('thin-generated-content')
})

test('rejects a direct claim that local net congestion prevents feed-in', () => {
  const result = assessPseoContentQuality(safeCandidate({
    hoofdtekst: `${SAFE_BODY}\n\nDoor netcongestie kunt u in IJsselmonde geen stroom terugleveren.`,
  }))

  expect(result.reasons).toContain('unsupported-net-claim')
})

test('fails closed instead of throwing for malformed FAQ and JSON-LD database values', () => {
  const candidate = safeCandidate()
  const result = assessPseoDatabaseRow({
    slug: candidate.slug,
    provincie: candidate.provincie,
    stad: candidate.stad,
    wijk: candidate.wijk,
    straat: candidate.straat,
    titel: candidate.titel,
    meta_description: candidate.metaDescription,
    hoofdtekst: candidate.hoofdtekst,
    faq_items: {},
    json_ld: 'geen-object',
    gem_bouwjaar: candidate.gemBouwjaar,
    gem_health_score: candidate.gemHealthScore,
    netcongestie_status: candidate.netcongestieStatus,
    aantal_woningen: candidate.aantalWoningen,
    postcode_prefix: candidate.postcodePrefix,
    generated_at: candidate.generatedAt,
    source_evidence: candidate.sourceEvidence,
  })

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('thin-generated-content')
  expect(result.reasons).toContain('unsafe-structured-data')
})

test('fails closed for malformed nested JSON-LD graph nodes', () => {
  const candidate = safeCandidate()
  const result = assessPseoDatabaseRow({
    slug: candidate.slug,
    provincie: candidate.provincie,
    stad: candidate.stad,
    wijk: candidate.wijk,
    straat: candidate.straat,
    titel: candidate.titel,
    meta_description: candidate.metaDescription,
    hoofdtekst: candidate.hoofdtekst,
    faq_items: candidate.faqItems,
    json_ld: { '@context': 'https://schema.org', '@graph': [null] },
    gem_bouwjaar: candidate.gemBouwjaar,
    gem_health_score: candidate.gemHealthScore,
    netcongestie_status: candidate.netcongestieStatus,
    aantal_woningen: candidate.aantalWoningen,
    postcode_prefix: candidate.postcodePrefix,
    generated_at: candidate.generatedAt,
    source_evidence: candidate.sourceEvidence,
  })

  expect(result.indexable).toBe(false)
  expect(result.reasons).toContain('unsafe-structured-data')

  const deeplyNested = assessPseoContentQuality(safeCandidate({
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'WebPage', '@graph': [null] }],
    },
  }))
  expect(deeplyNested.indexable).toBe(false)
  expect(deeplyNested.reasons).toContain('unsafe-structured-data')
})

test('serializes JSON-LD without allowing a script end tag to break out', () => {
  const value = { description: '</script ><img id="pwn">\u2028volgende regel' }
  const serialized = serializeJsonLd(value)

  expect(serialized).not.toContain('<')
  expect(serialized).toContain('\\u003c/script >')
  expect(JSON.parse(serialized)).toEqual(value)
})

test('preserves the Dutch IJ digraph in location display names', () => {
  expect(formatLocationSlug('ijsselmonde')).toBe('IJsselmonde')
  expect(formatLocationSlug('oud-ijsselmonde')).toBe('Oud IJsselmonde')
})
