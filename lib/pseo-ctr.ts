type WijkCtrRoute = {
  provincie: string
  stad: string
  wijk: string
}

export type WijkCtrContextLink = {
  href: string
  label: string
}

export type WijkCtrDecision = {
  heading: string
  body: string
  links: WijkCtrContextLink[]
}

type WijkCtrLabels = {
  wijk: string
  stad: string
  decision: WijkCtrDecision
}

export type WijkCtrTemplate = WijkCtrLabels & {
  title: string
  h1: string
  description: string
  heroSummary: string
}

const WIJK_CTR_COHORT: Record<string, WijkCtrLabels> = {
  '/limburg/sittard-geleen/born': {
    wijk: 'Born',
    stad: 'Sittard-Geleen',
    decision: {
      heading: 'Eerst beslissen op woningniveau',
      body: 'Gebruik het wijkgemiddelde voor Born niet als eindantwoord. Controleer eerst de resterende levensduur van uw dak, schaduw en verbruik overdag; die combinatie bepaalt of plaatsen vóór 2027 logisch is en hoeveel panelen passen.',
      links: [
        { href: '/limburg/sittard-geleen', label: 'Wijken in Sittard-Geleen' },
        {
          href: '/limburg/sittard-geleen/limbrichterveld',
          label: 'Vergelijk Limbrichterveld',
        },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/zuid-holland/nissewaard/spijkenisse-oost': {
    wijk: 'Spijkenisse-Oost',
    stad: 'Nissewaard',
    decision: {
      heading: 'Kijk verder dan de jaaropbrengst',
      body: 'In Spijkenisse-Oost is de verhouding tussen opwek en verbruik overdag een nuttige beslisfactor. Leg het verwachte middagoverschot naast apparaten, boiler of laadmomenten die u kunt verschuiven voordat u voor een groter systeem kiest.',
      links: [
        { href: '/zuid-holland/nissewaard', label: 'Wijken in Nissewaard' },
        { href: '/zuid-holland/nissewaard/de-akkers', label: 'Vergelijk De Akkers' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/noord-brabant/heusden/drunen': {
    wijk: 'Drunen',
    stad: 'Heusden',
    decision: {
      heading: 'Dakwerk en panelen slim combineren',
      body: 'Is dakonderhoud in Drunen binnen enkele jaren te verwachten, vergelijk dan eerst de planning van dakwerk en zonnepanelen. Zo voorkomt u extra demontagekosten en beoordeelt u de offerte op de totale woningplanning, niet alleen op terugverdientijd.',
      links: [
        { href: '/noord-brabant/heusden', label: 'Wijken in Heusden' },
        { href: '/noord-brabant/heusden/vlijmen', label: 'Vergelijk Vlijmen' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/overijssel/enschede/twekkelerveld': {
    wijk: 'Twekkelerveld',
    stad: 'Enschede',
    decision: {
      heading: 'Begin bij dak en meterkast',
      body: 'Bij een oudere woning in Twekkelerveld verdient de technische basis aandacht vóór de opbrengstberekening. Laat dakconstructie, meterkast en beschikbare groepen controleren en bepaal daarna pas het passende aantal panelen.',
      links: [
        { href: '/overijssel/enschede', label: 'Wijken in Enschede' },
        {
          href: '/overijssel/enschede/boswinkel-stadsveld',
          label: 'Vergelijk Boswinkel-Stadsveld',
        },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/gelderland/nijkerk/hoevelaken': {
    wijk: 'Hoevelaken',
    stad: 'Nijkerk',
    decision: {
      heading: 'Kies op eigen verbruik, niet op piekvermogen',
      body: 'Vergelijk voor uw woning in Hoevelaken een zuidopstelling met een oost-westverdeling wanneer beide dakvlakken bruikbaar zijn. Een bredere opwek over de dag kan beter aansluiten op eigen verbruik dan alleen de hoogste middagpiek.',
      links: [
        { href: '/gelderland/nijkerk', label: 'Wijken in Nijkerk' },
        {
          href: '/gelderland/nijkerk/nijkerk-stad',
          label: 'Vergelijk Nijkerk-Stad',
        },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/gelderland/oldebroek/wezep': {
    wijk: 'Wezep',
    stad: 'Oldebroek',
    decision: {
      heading: 'Laat schaduw per dakvlak beoordelen',
      body: 'Bomen en bijgebouwen kunnen per adres in Wezep een ander schaduwbeeld geven. Vraag daarom om een berekening per dakvlak; een kleiner, vrij liggend systeem kan zinvoller zijn dan elk beschikbaar stuk dak benutten.',
      links: [
        { href: '/gelderland/oldebroek', label: 'Wijken in Oldebroek' },
        { href: '/gelderland/oldebroek/oldebroek', label: 'Vergelijk Oldebroek' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/friesland/de-friese-meren/lemmer': {
    wijk: 'Lemmer',
    stad: 'De Friese Meren',
    decision: {
      heading: 'Vraag door op montage en dakconditie',
      body: 'Bij een dak in de open, waterrijke omgeving van Lemmer telt niet alleen de paneelopbrengst. Laat de installateur uitleggen hoe dakconditie, bevestiging en windbelasting in het legplan zijn verwerkt.',
      links: [
        { href: '/friesland/de-friese-meren', label: 'Wijken in De Friese Meren' },
        { href: '/friesland/de-friese-meren/joure', label: 'Vergelijk Joure' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/zuid-holland/den-haag/centrum-den-haag': {
    wijk: 'Centrum Den Haag',
    stad: 'Den Haag',
    decision: {
      heading: 'Regel eerst de zeggenschap over het dak',
      body: 'Bij een appartement in Centrum Den Haag bepaalt de VvE vaak of en hoe het gezamenlijke dak kan worden gebruikt. Controleer bij een ouder of beschermd pand ook welke toestemming nodig kan zijn voordat u opbrengst en systeemgrootte vergelijkt.',
      links: [
        { href: '/zuid-holland/den-haag', label: 'Wijken in Den Haag' },
        { href: '/zuid-holland/den-haag/moerwijk', label: 'Vergelijk Moerwijk' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/utrecht/stichtse-vecht/breukelen': {
    wijk: 'Breukelen',
    stad: 'Stichtse Vecht',
    decision: {
      heading: 'Controleer dakstatus en eventuele regels',
      body: 'De woningtypen in Breukelen vragen om een adresgerichte beoordeling. Kijk bij een oudere straat eerst naar dakonderhoud en een mogelijke beschermde status; pas daarna zijn opbrengst, legplan en investering goed te vergelijken.',
      links: [
        { href: '/utrecht/stichtse-vecht', label: 'Wijken in Stichtse Vecht' },
        { href: '/utrecht/stichtse-vecht/maarssen', label: 'Vergelijk Maarssen' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/zuid-holland/westvoorne/rockanje': {
    wijk: 'Rockanje',
    stad: 'Westvoorne',
    decision: {
      heading: 'Neem de kustligging mee in de offerte',
      body: 'Vraag voor een woning in Rockanje om een dakspecifiek montageplan waarin windbelasting en materiaalkeuze worden toegelicht. Vergelijk naast panelen en omvormer ook bevestiging, dakdoorvoer en garantievoorwaarden.',
      links: [
        { href: '/zuid-holland/westvoorne', label: 'Wijken in Westvoorne' },
        { href: '/zuid-holland/westvoorne/oostvoorne', label: 'Vergelijk Oostvoorne' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/limburg/sittard-geleen/limbrichterveld': {
    wijk: 'Limbrichterveld',
    stad: 'Sittard-Geleen',
    decision: {
      heading: 'Stem het systeem af op later verbruik',
      body: 'Verwacht u in Limbrichterveld later een warmtepomp of elektrische auto, neem dat dan mee zonder toekomstig verbruik te overschatten. Vergelijk een passend basissysteem met uitbreidbaarheid in plaats van direct maximaal te leggen.',
      links: [
        { href: '/limburg/sittard-geleen', label: 'Wijken in Sittard-Geleen' },
        { href: '/limburg/sittard-geleen/born', label: 'Vergelijk Born' },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
  '/noord-holland/amsterdam/osdorp': {
    wijk: 'Osdorp',
    stad: 'Amsterdam',
    decision: {
      heading: 'Bepaal eerst of het dak individueel of gedeeld is',
      body: 'Voor een rijwoning in Osdorp is de route anders dan voor een appartement met VvE en gezamenlijk dak. Leg eerst eigendom en besluitvorming vast en vergelijk daarna opwek, eigen verbruik en de lokale netdruk.',
      links: [
        { href: '/noord-holland/amsterdam', label: 'Wijken in Amsterdam' },
        {
          href: '/noord-holland/amsterdam/slotermeer-zuidwest',
          label: 'Vergelijk Slotermeer-Zuidwest',
        },
        {
          href: '/kennisbank/einde-salderen-2027-uitleg',
          label: 'Uitleg einde salderen 2027',
        },
      ],
    },
  },
}

export const WIJK_CTR_COHORT_PATHS = Object.freeze(Object.keys(WIJK_CTR_COHORT))

export function getWijkCtrTemplate(route: WijkCtrRoute): WijkCtrTemplate | null {
  const path = `/${route.provincie}/${route.stad}/${route.wijk}`
  const labels = WIJK_CTR_COHORT[path]
  if (!labels) return null

  return {
    ...labels,
    title: `Zonnepanelen ${labels.wijk}, ${labels.stad} | salderen 2027`,
    h1: `Zonnepanelen en salderen in ${labels.wijk}: wat verandert in 2027?`,
    description: `Bekijk voor ${labels.wijk}, ${labels.stad} lokale woningdata, netdruk en wat stoppen met salderen in 2027 kan betekenen. Doe de gratis adrescheck.`,
    heroSummary: `Lokale woningdata en netdruk voor ${labels.wijk}, met aandacht voor het einde van salderen in 2027.`,
  }
}
