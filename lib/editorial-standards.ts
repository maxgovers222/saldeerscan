export const ENERGY_EDITORIAL_GUARDRAILS = `
Feitenkader dat nooit mag worden tegengesproken:
- Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027.
- Er is geen actuele gefaseerde afbouw in 2025 of 2026. Het oude percentageschema is verworpen.
- Na 1 januari 2027 blijft een leveranciersafhankelijke vergoeding voor teruggeleverde stroom bestaan. Noem geen gegarandeerd tarief.
- Een regionale netcongestiestatus is een indicatie. Die bewijst niet dat teruglevering op een bestaande woningaansluiting actief wordt beperkt en maakt een thuisbatterij niet automatisch noodzakelijk.
- ISDE voor woningeigenaren geldt alleen voor officieel aangewezen maatregelen. Zonnepanelen, thuisbatterijen, een dakcheck en een groepenkastinspectie krijgen geen ISDE.
- Presenteer aannames, bandbreedtes en toekomstverwachtingen als indicatief. Verzin geen boetes, verplichte omvormeraansturing, contractvoorwaarden of subsidierechten.
`.trim()

const CURRENT_LAW_COPY =
  'Actuele stand: salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Het eerder voorgestelde afbouwschema is verworpen.'

const NETCONGESTION_COPY =
  'Nuance bij netcongestie: de regionale kleur is een indicatie. Hoge netdruk kan gevolgen hebben voor nieuwe of zwaardere aansluitingen en kan lokaal spanningsproblemen geven, maar bewijst niet dat teruglevering op een bestaande woningaansluiting actief wordt beperkt. Een batterij is niet automatisch noodzakelijk en vraagt altijd een individuele rendementsberekening.'

const ISDE_COPY =
  'ISDE: zonnepanelen, thuisbatterijen, een dakcheck en een groepenkastinspectie vallen niet onder de landelijke ISDE. Controleer voor isolatie, een (hybride) warmtepomp, zonneboiler en andere aangewezen maatregelen de actuele voorwaarden bij RVO.'

const LEGACY_LAW_PATTERN =
  /(2026.{0,35}28\s*%|28\s*%.{0,35}2026|2025.{0,35}64\s*%|64\s*%.{0,35}2025|salder\w*.{0,100}(stapsgewijs|geleidelijk|gefaseerd)|(stapsgewijs|geleidelijk|gefaseerd).{0,100}salder|afbouw.{0,50}(start|vanaf).{0,25}2025|vanaf.{0,25}2027.{0,60}afgebouwd|salder\w*.{0,60}naar verwachting.{0,35}2027)/i

const UNSAFE_NET_PATTERN =
  /(teruglever\w*.{0,60}(actief gereguleerd|al gereguleerd|onbeperkt|wordt beperkt|al beperkt|beperkingen opleggen)|batterij.{0,45}(essentieel|noodzakelijk|geen luxe|noodzaak))/i

const UNSAFE_ISDE_PATTERN =
  /ISDE.{0,80}(dakcheck|dakinspectie|groepenkast|zonnepanelen|thuisbatterij|batterij)|(dakcheck|dakinspectie|groepenkast|zonnepanelen|thuisbatterij|batterij).{0,80}ISDE/i

function replacementFor(block: string, short: boolean): string | null {
  if (LEGACY_LAW_PATTERN.test(block)) {
    return short
      ? '100% salderen tot en met 2026; einde per 1 januari 2027'
      : CURRENT_LAW_COPY
  }

  if (UNSAFE_NET_PATTERN.test(block)) {
    return short
      ? 'Regionale netdruk is een indicatie, geen individuele terugleverbeperking'
      : NETCONGESTION_COPY
  }

  if (
    UNSAFE_ISDE_PATTERN.test(block)
    && !/(geen|niet).{0,35}ISDE|ISDE.{0,35}(geen|niet)/i.test(block)
  ) {
    return short
      ? 'ISDE geldt alleen voor officieel aangewezen woningmaatregelen'
      : ISDE_COPY
  }

  return null
}

export function sanitizeGeneratedEnergyCopy(
  value: string | null,
  mode: 'short' | 'body' = 'body',
): string | null {
  if (value === null) return null
  if (mode === 'short') return replacementFor(value, true) ?? value

  const seen = new Set<string>()
  return value
    .split(/(\n{2,})/)
    .map((block) => {
      if (/^\n+$/.test(block)) return block
      const replacement = replacementFor(block, false)
      if (!replacement) return block
      if (seen.has(replacement)) return ''
      seen.add(replacement)
      return replacement
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function sanitizeStructuredEnergyCopy(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeGeneratedEnergyCopy(value, 'short')
  if (Array.isArray(value)) return value.map(sanitizeStructuredEnergyCopy)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeStructuredEnergyCopy(entry)]),
    )
  }
  return value
}

export const LIANDER_ARTICLE_SLUG =
  'liander-netcongestie-particulieren-nieuwe-regels-impact'

export const LIANDER_ARTICLE_CORRECTION = {
  titel: 'Nieuwe Liander-regels: wat verandert er voor huishoudens?',
  metaDescription:
    'Liander past vanaf 1 juli 2026 nieuwe regels toe voor schaarse netcapaciteit. Lees wat dit wel en niet betekent voor huishoudens.',
  intro:
    'Vanaf 1 juli 2026 verdeelt Liander schaarse netcapaciteit volgens een nieuw prioriteringskader van de ACM. Voor huishoudens gaat het vooral om wachttijden bij een aanvraag voor een nieuwe of zwaardere aansluiting. De regels betekenen niet dat bestaande huishoudens automatisch een boete, verplichte omvormeraansturing of een dynamisch teruglevercontract krijgen.',
  hoofdtekst: `## Wat verandert er per 1 juli 2026?

Liander gaat klein- en grootverbruikers vanaf 1 juli 2026 op één gezamenlijke wachtlijst plaatsen wanneer in een gebied onvoldoende netcapaciteit beschikbaar is. Aanvragen worden niet alleen op volgorde van binnenkomst behandeld. Projecten met een aantoonbare maatschappelijke functie kunnen volgens het prioriteringskader van de Autoriteit Consument & Markt voorrang krijgen.

De wijziging creëert geen extra transportcapaciteit. Daardoor kan iemand die eerder op de wachtlijst stond later aan de beurt zijn wanneer een hoger geprioriteerde aanvraag wordt toegevoegd. De feitelijke wachttijd verschilt per gebied en per type aanvraag.

## Welke huishoudens kunnen dit merken?

Een reguliere woningaansluiting tot en met 3x35 ampère valt binnen de categorie basisbehoeften. Toch kan een huishouden langer wachten op een nieuwe aansluiting of op een verzwaring wanneer aanvragen met een hogere maatschappelijke prioriteit voorgaan. Denk bijvoorbeeld aan een nieuwbouwwoning die nog moet worden aangesloten of een bestaande woning waarvoor meer aansluitcapaciteit wordt aangevraagd.

De regel wijzigt niet automatisch de capaciteit van een bestaande aansluiting. Volgens Liander kan binnen een bestaande aansluiting bovendien vaak meer mogelijk zijn dan bewoners denken. Laat een installateur daarom eerst het werkelijke vermogen, het gelijktijdige verbruik en de bestaande aansluiting beoordelen voordat u een verzwaring aanvraagt.

## Wat volgt niet uit deze regels?

Het prioriteringskader voert op zichzelf geen boetes voor particuliere zonnepaneelbezitters in. Het verplicht huishoudens ook niet om hun omvormer op afstand te laten aansturen en schrijft geen dynamisch teruglevercontract voor. Evenmin betekent een rode regionale netcongestie-indicatie automatisch dat teruglevering op iedere bestaande woningaansluiting actief wordt beperkt.

Lokale spanningsproblemen en wachttijden zijn wel reële aandachtspunten, maar vragen om actuele informatie per adres en aansluiting. Een regionale kleur of kaart is daarvoor een eerste indicatie, geen individuele technische vaststelling.

## Wat kunt u zelf controleren?

Controleer bij Liander de actuele capaciteitssituatie en vraag bij een nieuwe of zwaardere aansluiting naar de verwachte wachttijd. Bespreek met een erkende installateur of de bestaande aansluiting voldoende ruimte heeft voor de geplande warmtepomp, laadpaal, zonnepanelen of batterij. Spreiding en slimme aansturing van verbruik kunnen soms helpen om binnen het bestaande aansluitvermogen te blijven, maar het effect verschilt per woning.

Een thuisbatterij is niet automatisch noodzakelijk omdat een gebied rood kleurt. De financiële waarde hangt onder meer af van uw opwek, verbruiksprofiel, batterijprijs, energiecontract en terugleververgoeding. Laat die businesscase afzonderlijk doorrekenen.

## Salderen is een afzonderlijk onderwerp

De regels voor netcapaciteit veranderen de wettelijke einddatum van salderen niet. Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt per 1 januari 2027 in één keer. Vanaf 2027 blijft voor teruggeleverde stroom een leveranciersafhankelijke vergoeding bestaan.

## Bronnen en actualiteit

Deze uitleg volgt de publicaties van Liander over het nieuwe prioriteringskader en over langere wachttijden voor nieuwe en zwaardere aansluitingen. Capaciteit, wachttijden en voorwaarden kunnen per gebied veranderen. Controleer daarom altijd de actuele informatie bij Liander en laat technische haalbaarheid op uw eigen adres vaststellen.`,
  faqItems: [
    {
      vraag: 'Krijg ik door de nieuwe regels automatisch een boete voor teruglevering?',
      antwoord:
        'Nee. Het Liander-bericht gaat over de prioritering van schaarse netcapaciteit bij nieuwe en zwaardere aansluitingen en introduceert geen automatische boete voor particuliere teruglevering.',
    },
    {
      vraag: 'Wordt mijn bestaande aansluiting door de nieuwe regels kleiner?',
      antwoord:
        'Niet automatisch. De regels bepalen de volgorde op wachtlijsten. Laat voor plannen met een hoog vermogen beoordelen wat binnen uw bestaande aansluiting mogelijk is.',
    },
    {
      vraag: 'Maakt een rode netstatus een thuisbatterij noodzakelijk?',
      antwoord:
        'Nee. De status is een regionale indicatie. Of een batterij technisch en financieel passend is, hangt af van uw individuele aansluiting, verbruik, opwek en tarieven.',
    },
  ],
} as const
