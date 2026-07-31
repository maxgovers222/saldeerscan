import { expect, test } from '@playwright/test'

const articlePath = '/kennisbank/netcongestie-problemen-nederland'

test('netcongestie-artikel is bruikbaar, canoniek en linkt zes lokale analyses', async ({ page }) => {
  const response = await page.goto(articlePath)
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Netcongestie in Nederland: wat merkt u thuis?',
  })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://saldeerscan.nl${articlePath}`,
  )
  await expect(page.getByRole('heading', { name: 'Wat is netcongestie?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Beslisboom voor uw woning' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bronnen en actualiteit' })).toBeVisible()

  const localLinks = page.getByTestId('netcongestie-local-analysis')
  await expect(localLinks).toHaveCount(6)
  const hrefs = await localLinks.evaluateAll(links =>
    links.map(link => link.getAttribute('href')),
  )
  expect(new Set(hrefs).size).toBe(6)
  for (const href of hrefs) {
    expect(href).toMatch(/^\/[^?]+\/[^?]+\/[^?]+$/)
    const localResponse = await page.request.get(href!)
    expect(localResponse.status(), `${href} moet een bestaande lokale analyse zijn`).toBe(200)
  }

  await expect(page.getByRole('link', {
    name: /Rijksoverheid — maatregelen tegen een vol elektriciteitsnet/,
  })).toBeVisible()
})
