import { expect, test } from '@playwright/test'
import {
  getWijkCtrTemplate,
  WIJK_CTR_COHORT_PATHS,
} from '@/lib/pseo-ctr'

const expectedPaths = [
  '/limburg/sittard-geleen/born',
  '/zuid-holland/nissewaard/spijkenisse-oost',
  '/noord-brabant/heusden/drunen',
  '/overijssel/enschede/twekkelerveld',
  '/gelderland/nijkerk/hoevelaken',
  '/gelderland/oldebroek/wezep',
  '/friesland/de-friese-meren/lemmer',
  '/zuid-holland/den-haag/centrum-den-haag',
  '/utrecht/stichtse-vecht/breukelen',
  '/zuid-holland/westvoorne/rockanje',
  '/limburg/sittard-geleen/limbrichterveld',
  '/noord-holland/amsterdam/osdorp',
] as const

function routeFromPath(path: string) {
  const [provincie, stad, wijk] = path.split('/').filter(Boolean)
  return { provincie, stad, wijk }
}

test('CTR-template is beperkt tot exact het opportunity-cohort', () => {
  expect(WIJK_CTR_COHORT_PATHS).toEqual(expectedPaths)
  expect(
    getWijkCtrTemplate({
      provincie: 'utrecht',
      stad: 'utrecht',
      wijk: 'leidsche-rijn',
    }),
  ).toBeNull()
})

test('cohorttitles en snippets bevatten de vereiste lokale 2027-context', () => {
  for (const path of expectedPaths) {
    const template = getWijkCtrTemplate(routeFromPath(path))
    expect(template).not.toBeNull()

    expect(template!.title).toContain('Zonnepanelen')
    expect(template!.title).toContain(template!.wijk)
    expect(template!.title).toContain(template!.stad)
    expect(template!.title).toContain('2027')
    expect(template!.title.length).toBeLessThanOrEqual(60)

    expect(template!.h1).toContain('Zonnepanelen')
    expect(template!.h1).toContain('salderen')
    expect(template!.h1).toContain(template!.wijk)
    expect(template!.description).toContain(template!.wijk)
    expect(template!.description).toContain(template!.stad)
    expect(template!.description).toContain('gratis adrescheck')
    expect(template!.description.length).toBeLessThanOrEqual(165)
  }
})
