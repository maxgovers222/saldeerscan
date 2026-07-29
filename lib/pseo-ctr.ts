type WijkCtrRoute = {
  provincie: string
  stad: string
  wijk: string
}

type WijkCtrLabels = {
  wijk: string
  stad: string
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
  },
  '/zuid-holland/nissewaard/spijkenisse-oost': {
    wijk: 'Spijkenisse-Oost',
    stad: 'Nissewaard',
  },
  '/noord-brabant/heusden/drunen': {
    wijk: 'Drunen',
    stad: 'Heusden',
  },
  '/overijssel/enschede/twekkelerveld': {
    wijk: 'Twekkelerveld',
    stad: 'Enschede',
  },
  '/gelderland/nijkerk/hoevelaken': {
    wijk: 'Hoevelaken',
    stad: 'Nijkerk',
  },
  '/gelderland/oldebroek/wezep': {
    wijk: 'Wezep',
    stad: 'Oldebroek',
  },
  '/friesland/de-friese-meren/lemmer': {
    wijk: 'Lemmer',
    stad: 'De Friese Meren',
  },
  '/zuid-holland/den-haag/centrum-den-haag': {
    wijk: 'Centrum Den Haag',
    stad: 'Den Haag',
  },
  '/utrecht/stichtse-vecht/breukelen': {
    wijk: 'Breukelen',
    stad: 'Stichtse Vecht',
  },
  '/zuid-holland/westvoorne/rockanje': {
    wijk: 'Rockanje',
    stad: 'Westvoorne',
  },
  '/limburg/sittard-geleen/limbrichterveld': {
    wijk: 'Limbrichterveld',
    stad: 'Sittard-Geleen',
  },
  '/noord-holland/amsterdam/osdorp': {
    wijk: 'Osdorp',
    stad: 'Amsterdam',
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
