import {
  buildReportModel,
  type ReportSource,
} from '@/lib/report-model'

export const reportSourceNoPanels = {
  leadId: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-07-10T10:00:00.000Z',
  adres: 'Prinsengracht 263, Amsterdam',
  wijk: 'Jordaan',
  stad: 'Amsterdam',
  bagData: {
    bouwjaar: 1940,
    oppervlakte: 110,
    woningtype: 'Woning',
    postcode: '1016GV',
    huisnummer: 263,
    dakOppervlakte: 55,
    lat: 52.3752,
    lon: 4.8839,
  },
  netcongestie: {
    status: 'ROOD',
    netbeheerder: 'Liander',
    uitleg: 'Het stroomnet is vol.',
    terugleveringBeperkt: false,
  },
  healthScore: {
    score: 63,
    label: 'Goed',
    kleur: 'geel',
    breakdown: {
      bouwjaar: 10,
      energielabel: 20,
      dakpotentieel: 20,
      netcongestie: 5,
    },
    aanbevelingen: ['Onderzoek een thuisbatterij'],
  },
  roiResult: {
    geschatVerbruikKwh: 3600,
    aantalPanelen: 10,
    productieKwh: 4550,
    eigenGebruikPct: 30,
    scenarioNu: {
      naam: 'Nu installeren',
      beschrijving: 'Zonnepanelen in 2026',
      besparingJaarEur: 820,
      investeringEur: 3500,
      terugverdientijdJaar: 4.3,
    },
    scenarioMetBatterij: {
      naam: 'Panelen + batterij',
      beschrijving: 'Zonnepanelen en thuisbatterij',
      besparingJaarEur: 1180,
      investeringEur: 7500,
      terugverdientijdJaar: 6.4,
    },
    scenarioWachten: {
      naam: 'Wachten',
      beschrijving: 'Na einde saldering',
      besparingJaarEur: 420,
      investeringEur: 3500,
      terugverdientijdJaar: 8.3,
    },
    shockEffect2027: {
      jaarlijksVerlies: 400,
      cumulatiefVerlies5Jaar: 2000,
      maandelijksVerlies: 33,
      boodschap: 'Zonder actie verliest u €400 per jaar.',
    },
    aanbeveling: 'beide',
    aanbevelingTekst: 'Panelen en een batterij verdienen nader onderzoek.',
    isdeSchatting: {
      bedragEur: 0,
      apparaatType: 'Geen ISDE voor zonnepanelen of thuisbatterij',
      vermogenKwp: 4,
    },
  },
  qualification: {
    isEigenaar: true,
    heeftPanelen: false,
    huidigePanelenAantal: null,
  },
  technical: {
    meterkast: null,
    plaatsing: null,
    omvormer: null,
  },
  delivery: {
    emailStatus: 'sent',
  },
} satisfies ReportSource

export const reportSourceExistingPanels = {
  ...reportSourceNoPanels,
  leadId: '22222222-2222-4222-8222-222222222222',
  qualification: {
    isEigenaar: true,
    heeftPanelen: true,
    huidigePanelenAantal: 10,
  },
} satisfies ReportSource

export const expectedReportFixture = buildReportModel(reportSourceNoPanels)!
export const expectedExistingPanelsReportFixture =
  buildReportModel(reportSourceExistingPanels)!
