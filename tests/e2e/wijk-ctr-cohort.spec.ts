import { expect, test } from '@playwright/test'

const smokePages = [
  {
    path: '/limburg/sittard-geleen/born',
    wijk: 'Born',
    stad: 'Sittard-Geleen',
  },
  {
    path: '/zuid-holland/den-haag/centrum-den-haag',
    wijk: 'Centrum Den Haag',
    stad: 'Den Haag',
  },
  {
    path: '/noord-holland/amsterdam/osdorp',
    wijk: 'Osdorp',
    stad: 'Amsterdam',
  },
] as const

for (const cohortPage of smokePages) {
  test(`${cohortPage.path} heeft de cohortsnippet, lokale H1 en beslischeck`, async ({ page }) => {
    const response = await page.goto(cohortPage.path)
    expect(response?.status()).toBe(200)

    await expect(page).toHaveTitle(
      `Zonnepanelen ${cohortPage.wijk}, ${cohortPage.stad} | salderen 2027`,
    )
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      new RegExp(
        `${cohortPage.wijk}.*${cohortPage.stad}.*salderen.*2027.*gratis adrescheck`,
        'i',
      ),
    )
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      `Zonnepanelen en salderen in ${cohortPage.wijk}: wat verandert in 2027?`,
    )

    const decision = page.getByTestId('wijk-ctr-decision')
    await expect(decision).toBeVisible()
    await expect(decision.locator('a[href^="/"]')).toHaveCount(3)
  })
}

test('wijk buiten het cohort behoudt de bestaande H1 en krijgt geen beslischeck', async ({ page }) => {
  await page.goto('/utrecht/utrecht/leidsche-rijn')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Leidsche Rijn')
  await expect(page.getByTestId('wijk-ctr-decision')).toHaveCount(0)
})
