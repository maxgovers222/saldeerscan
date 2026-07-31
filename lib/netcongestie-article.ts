export const NETCONGESTIE_ARTICLE_SLUG = 'netcongestie-problemen-nederland'

export const NETCONGESTIE_ARTICLE_SECTIONS = [
  {
    title: 'Wat is netcongestie?',
    paragraphs: [
      'Netcongestie is een structureel tekort aan transportcapaciteit op een deel van het elektriciteitsnet. Op bepaalde momenten willen gebruikers daar samen meer stroom afnemen of invoeden dan kabels, transformatoren en stations veilig kunnen vervoeren. Het gaat dus niet om een landelijk tekort aan elektriciteit, maar om te weinig transportruimte op een specifieke plek en in een specifieke richting.',
      'Afnamecongestie ontstaat door een hoge gelijktijdige vraag naar stroom. Invoedingscongestie ontstaat wanneer veel opwek tegelijk het net op wil. Een kleur op een regionale capaciteitskaart is een signaal over dat gebied. De kaart stelt niet vast wat er op uw bestaande woningaansluiting gebeurt.',
    ],
  },
  {
    title: 'Waardoor raakt het stroomnet vol?',
    paragraphs: [
      'De elektriciteitsvraag groeit door onder meer warmtepompen, elektrisch koken, laadpunten en de elektrificatie van bedrijven. Die apparaten vragen vaak rond dezelfde uren vermogen. Vooral de avondpiek tussen 16.00 en 21.00 uur telt zwaar mee.',
      'Aan de andere kant leveren zonnepanelen en windparken op gunstige momenten veel stroom tegelijk terug. In woonwijken kan daardoor lokaal de spanning oplopen. Verzwaring van kabels en stations helpt structureel, maar voorbereiding, vergunningen, ruimte en uitvoering kosten jaren.',
    ],
  },
  {
    title: 'Wat merkt een huishouden hiervan?',
    paragraphs: [
      'Een bestaande woning houdt niet automatisch op met stroom afnemen of terugleveren zodra een regio congestie meldt. Wel kunnen nieuwe aansluitingen of aangevraagde verzwaringen een langere doorlooptijd krijgen. Vraag daarom vóór de aanschaf van een zware warmtepomp, laadoplossing of andere installatie welke aansluiting nodig is en wat de actuele wachttijd bij uw netbeheerder is.',
      'Bij veel zonneproductie kan de lokale spanning te hoog worden. Een omvormer kan dan uit veiligheid tijdelijk uitschakelen. Controleer de storingscode en productiegrafiek, laat de installatie beoordelen en meld terugkerende spanningsproblemen bij de regionale netbeheerder. Een enkele regionale kleur bewijst niet dat dit op uw adres gebeurt.',
      'Netcongestie en het einde van salderen zijn verschillende onderwerpen. Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt per 1 januari 2027. Vanaf dan blijft een leveranciersafhankelijke vergoeding voor teruggeleverde stroom bestaan. Bereken de financiële gevolgen los van de regionale netstatus.',
    ],
  },
  {
    title: 'Wat kunt u nu zinvol doen?',
    paragraphs: [
      'Begin met de feitelijke situatie: uw aansluiting, uw kwartier- of uurprofiel, de foutmeldingen van uw omvormer en de plannen waarvoor u extra vermogen nodig denkt te hebben. Verplaats flexibel verbruik waar mogelijk uit de avondpiek en gebruik eigen zonnestroom bij voorkeur overdag.',
      'Koop niet uitsluitend op basis van een rode kaart een thuisbatterij. De uitkomst hangt af van opwek, verbruikspatroon, batterijprijs, energiecontract, terugleververgoeding en technische aansluiting. Laat die combinatie afzonderlijk doorrekenen.',
    ],
  },
] as const

export const NETCONGESTIE_DECISION_STEPS = [
  {
    question: 'Schakelt uw omvormer op zonnige momenten uit?',
    yes: 'Noteer tijdstippen en foutcodes, controleer de installatie met een installateur en meld herhaalde spanningsproblemen bij uw netbeheerder.',
    no: 'Ga door naar de vraag of u een nieuwe of zwaardere aansluiting nodig heeft.',
  },
  {
    question: 'Plant u een warmtepomp, laadpunt of andere installatie met meer aansluitvermogen?',
    yes: 'Laat eerst het gelijktijdige piekvermogen en de bestaande aansluiting beoordelen. Vraag daarna de actuele doorlooptijd voor een eventuele verzwaring op.',
    no: 'Behandel de regionale netkleur als context, niet als bewijs van een probleem op uw adres.',
  },
  {
    question: 'Wilt u vooral de opbrengst van zonnepanelen na 2027 verbeteren?',
    yes: 'Bereken eerst productie, direct eigen verbruik, contractkosten en terugleververgoeding. Vergelijk daarna pas slim sturen of opslag.',
    no: 'U hoeft op basis van netcongestie alleen geen product te kopen. Blijf actuele informatie van uw netbeheerder volgen.',
  },
] as const

export const NETCONGESTIE_SOURCES = [
  {
    label: 'Rijksoverheid — maatregelen tegen een vol elektriciteitsnet',
    href: 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/duurzame-energie/kabinet-neemt-maatregelen-tegen-vol-elektriciteitsnet-netcongestie',
  },
  {
    label: 'Netbeheer Nederland — landelijke capaciteitskaart',
    href: 'https://www.netbeheernederland.nl/artikelen/nieuws/nieuwe-versie-van-de-landelijke-capaciteitskaart',
  },
  {
    label: 'Netbeheer Nederland — verdeling van netcapaciteit in congestiegebieden',
    href: 'https://www.netbeheernederland.nl/artikelen/zo-werkt-het/zo-werkt-het-verdeling-van-netcapaciteit-congestiegebieden',
  },
  {
    label: 'Liander — waarom een omvormer bij hoge spanning uitschakelt',
    href: 'https://www.liander.nl/storingen-en-onderhoud/spanningsproblemen/omvormer-schakelt-uit',
  },
] as const

export const NETCONGESTIE_LOCAL_ANALYSES = [
  {
    label: 'Amsterdam Centrum',
    href: '/noord-holland/amsterdam/centrum',
    description: 'Dichte, oudere stadsbebouwing en lokale netinformatie.',
  },
  {
    label: 'Osdorp, Amsterdam',
    href: '/noord-holland/amsterdam/osdorp',
    description: 'Naoorlogse woningvoorraad met een eigen lokaal profiel.',
  },
  {
    label: 'Centrum Den Haag',
    href: '/zuid-holland/den-haag/centrum-den-haag',
    description: 'Binnenstedelijke woningdata en regionale netindicatie.',
  },
  {
    label: 'Utrecht Centrum',
    href: '/utrecht/utrecht/centrum',
    description: 'Lokale analyse voor een historisch en compact woongebied.',
  },
  {
    label: 'Leidsche Rijn, Utrecht',
    href: '/utrecht/utrecht/leidsche-rijn',
    description: 'Een groeigebied met een ander woning- en energieprofiel.',
  },
  {
    label: 'Born, Sittard-Geleen',
    href: '/limburg/sittard-geleen/born',
    description: 'Vergelijk de lokale situatie buiten de Randstad.',
  },
] as const

const hoofdtekst = NETCONGESTIE_ARTICLE_SECTIONS
  .map(section => `## ${section.title}\n\n${section.paragraphs.join('\n\n')}`)
  .join('\n\n')

export const NETCONGESTIE_ARTICLE = {
  id: 'editorial-netcongestie-problemen-nederland',
  slug: NETCONGESTIE_ARTICLE_SLUG,
  titel: 'Netcongestie in Nederland: wat merkt u thuis?',
  metaDescription:
    'Lees wat netcongestie is, wat huishoudens ervan merken en welke controle zinvol is. Met actuele bronnen, beslisboom en lokale analyses.',
  intro:
    'Netcongestie betekent dat een deel van het stroomnet op piekmomenten onvoldoende ruimte heeft om alle gevraagde of aangeboden elektriciteit te vervoeren. Voor huishoudens kan dat gevolgen hebben voor een nieuwe of zwaardere aansluiting en soms voor de werking van zonnepanelen. Een regionale waarschuwing is echter geen bewijs dat uw bestaande aansluiting of teruglevering individueel wordt beperkt.',
  hoofdtekst,
  faqItems: [
    {
      vraag: 'Betekent een rode netstatus dat ik geen zonnestroom kan terugleveren?',
      antwoord:
        'Nee. De regionale status is een indicatie van schaarse transportcapaciteit en geen meting van uw individuele aansluiting. Kijk bij klachten naar omvormerdata en vraag uw netbeheerder om adresgerichte informatie.',
    },
    {
      vraag: 'Moet ik door netcongestie een thuisbatterij kopen?',
      antwoord:
        'Nee. Een batterij is niet automatisch noodzakelijk. Rendement hangt af van uw opwek, verbruikspatroon, contract, terugleververgoeding, aanschafprijs en technische situatie.',
    },
    {
      vraag: 'Kan mijn omvormer door lokale netspanning uitschakelen?',
      antwoord:
        'Ja, bij een te hoge spanning kan een omvormer uit veiligheid tijdelijk uitschakelen. Controleer de foutcode, laat de installatie beoordelen en meld een terugkerend probleem bij uw netbeheerder.',
    },
    {
      vraag: 'Wanneer moet ik mijn netbeheerder benaderen?',
      antwoord:
        'Doe dat bij terugkerende spanningsproblemen en voordat u een nieuwe of zwaardere aansluiting aanvraagt. De netbeheerder kan de actuele situatie en procedure voor uw adres toelichten.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Netcongestie in Nederland: wat merkt u thuis?',
    description:
      'Praktische uitleg over netcongestie voor huishoudens, met beslisboom en actuele primaire bronnen.',
    mainEntityOfPage:
      'https://saldeerscan.nl/kennisbank/netcongestie-problemen-nederland',
    dateModified: '2026-07-31',
    inLanguage: 'nl-NL',
  },
  category: 'netcongestie' as const,
  relatedSlugs: [
    'einde-salderen-2027-uitleg',
    'thuisbatterij-saldering-alternatief',
    'omvormer-kiezen-zonnepanelen',
  ],
  status: 'published' as const,
  generatedAt: '2026-07-31T00:00:00.000Z',
}
