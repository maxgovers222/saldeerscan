import { expect, test } from '@playwright/test'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'

test('retries the same inverter photo after a service error and saves the analysis', async ({ page }) => {
  await seedFunnelAtInternalStep(page, 5, { omvormerAnalyse: null })
  const uploads: string[] = []
  await page.route('**/api/vision', async (route) => {
    const body = route.request().postDataJSON()
    expect(body.type).toBe('omvormer')
    uploads.push(body.imageBase64)
    if (uploads.length === 1) {
      await route.fulfill({ status: 500, json: { error: 'Vision analyse tijdelijk niet beschikbaar' } })
    } else {
      await route.fulfill({ json: { type: 'omvormer', analyse: {
        merk: 'SolarEdge', model: 'SE3000H', vermogenKw: 3,
        hybrideKlaar: false, vervangenNodig: false, opmerkingen: [],
        confidence: 0.9, needsHumanReview: true,
      } } })
    }
  })
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  // A real PNG exercises browser decoding and JPEG preparation before upload.
  const sharp = (await import('sharp')).default
  const image = await sharp({ create: {
    width: 200, height: 200, channels: 3, background: '#dedede',
  } }).png().toBuffer()
  await page.getByLabel('Selecteer foto: Foto van uw omvormer').setInputFiles({
    name: 'omvormer.png', mimeType: 'image/png', buffer: image,
  })
  await expect(page.getByText('Analyseren lukt nog niet')).toBeVisible()
  await page.getByRole('button', { name: 'Opnieuw analyseren', exact: true }).click()
  await expect(page.getByText('Omvormercheck afgerond')).toBeVisible()
  await expect(page.getByText('SE3000H', { exact: true })).toBeVisible()
  expect(uploads).toHaveLength(2)
  expect(uploads[1]).toBe(uploads[0])
})
