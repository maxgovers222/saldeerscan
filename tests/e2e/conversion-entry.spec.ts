import { expect, test } from '@playwright/test'

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
]

const phaseRoutes = [
  '/',
  '/utrecht',
  '/utrecht/utrecht',
  '/utrecht/utrecht/leidsche-rijn',
  '/utrecht/utrecht/oost/biltstraat',
  '/postcode/1012',
]

test.describe('Customer-first conversion entry', () => {
  test('homepage leads with the customer question and one primary action', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', {
      level: 1,
      name: 'Wat kost stoppen met salderen u?',
    })).toBeVisible()
    await expect(page.getByText('Officiële woningdata')).toBeVisible()
    await expect(page.getByText('U houdt controle')).toBeVisible()
    await expect(page.getByText('Begrijpelijk advies')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bekijk mijn inzicht' })).toBeVisible()
  })

  for (const viewport of viewports) {
    test(`homepage heeft geen horizontale overflow op ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      const sizes = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }))
      expect(sizes.documentWidth).toBeLessThanOrEqual(sizes.viewportWidth)
    })
  }

  test('wijkadres bewaart organische landingscontext', async ({ page }) => {
    await page.route('**/api/bag/suggest**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'adres-1', label: 'Teststraat 1, 3543 AB Utrecht' },
        ]),
      })
    })

    await page.goto('/utrecht/utrecht/leidsche-rijn')
    const input = page.getByRole('combobox', { name: 'Uw adres' })
    await input.fill('Teststraat')
    await page.getByRole('option', { name: 'Teststraat 1, 3543 AB Utrecht' }).click()
    await page.getByRole('button', { name: 'Bekijk mijn inzicht' }).click()

    await expect(page).toHaveURL(/\/check\?/)
    const url = new URL(page.url())
    expect(url.searchParams.get('wijk')).toBe('leidsche-rijn')
    expect(url.searchParams.get('stad')).toBe('utrecht')
    expect(url.searchParams.get('provincie')).toBe('utrecht')
    expect(url.searchParams.get('pseo_level')).toBe('wijk')
    expect(url.searchParams.get('landing_path')).toBe('/utrecht/utrecht/leidsche-rijn')
  })

  test('adrescombobox werkt met toetsenbord', async ({ page }) => {
    await page.route('**/api/bag/suggest**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a', label: 'Teststraat 1, Utrecht' },
        { id: 'b', label: 'Teststraat 2, Utrecht' },
      ]),
    }))
    await page.goto('/')
    const input = page.getByRole('combobox', { name: 'Uw adres' })
    await input.fill('Teststraat')
    await expect(page.getByRole('option')).toHaveCount(2)
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(input).toHaveValue('Teststraat 1, Utrecht')
  })

  test('checkpagina bevestigt de lokale landingscontext', async ({ page }) => {
    await page.goto(
      '/check?landing_path=%2Futrecht%2Futrecht%2Fleidsche-rijn'
        + '&pseo_level=wijk&provincie=utrecht&stad=utrecht&wijk=leidsche-rijn',
    )
    await expect(page.getByTestId('landing-context')).toContainText(
      'Leidsche Rijn, Utrecht',
    )
    await expect(page.getByText('We nemen deze regio mee in uw check.')).toBeVisible()
  })

  test('shared header has one labelled primary navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'SaldeerScan.nl' })).toBeVisible()
  })

  for (const route of phaseRoutes) {
    for (const viewport of viewports) {
      test(`${route} blijft device-safe op ${viewport.width}px`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.setViewportSize(viewport)
        const response = await page.goto(route)
        expect(response?.status()).not.toBe(404)

        const initial = await page.evaluate(() => {
          const visibleAmberActions = Array.from(document.querySelectorAll('a, button'))
            .filter(element => {
              const rect = element.getBoundingClientRect()
              const style = getComputedStyle(element)
              return rect.width > 0
                && rect.height > 0
                && rect.top < innerHeight
                && rect.bottom > 0
                && style.visibility !== 'hidden'
                && (!(element instanceof HTMLButtonElement) || !element.disabled)
                && (element.classList.contains('bg-action')
                  || element.classList.contains('bg-amber-500'))
            })
            .map(element => element.textContent?.trim() ?? '')
          const infiniteAnimations = Array.from(document.querySelectorAll('*'))
            .filter(element => getComputedStyle(element).animationIterationCount === 'infinite')
            .length
          return {
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
            visibleAmberActions,
            infiniteAnimations,
          }
        })

        expect(initial.documentWidth).toBeLessThanOrEqual(initial.viewportWidth)
        expect(initial.visibleAmberActions).toHaveLength(1)
        expect(initial.infiniteAnimations).toBe(0)

        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%'
        })
        const zoomed = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        }))
        expect(zoomed.documentWidth).toBeLessThanOrEqual(zoomed.viewportWidth)
      })
    }
  }

  test('focus en adresdropdown blijven zichtbaar op mobiel', async ({ page }) => {
    await page.route('**/api/bag/suggest**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a', label: 'Teststraat 1, Utrecht' },
        { id: 'b', label: 'Teststraat 2, Utrecht' },
      ]),
    }))
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as Element)
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
    })
    expect(focus.outlineStyle).not.toBe('none')
    expect(focus.outlineWidth).not.toBe('0px')

    const input = page.getByRole('combobox', { name: 'Uw adres' })
    await input.fill('Teststraat')
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    const bounds = await listbox.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360)
  })
})
