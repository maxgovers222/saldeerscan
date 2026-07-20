import { test, expect } from '@playwright/test'
import {
  alignPseoSavingsCopy,
  buildWijkSeoDescription,
  buildWijkSeoTitle,
  computeBesparing,
  computeVerliesFromBesparing,
  resolveWijkScore,
} from '@/lib/pseo-variation'

test('buildWijkSeoTitle gebruikt dezelfde besparing als de wijkpagina', () => {
  const score = resolveWijkScore(1998, 78)
  const besparing = computeBesparing(1998, score)
  const verlies = computeVerliesFromBesparing(besparing)

  const title = buildWijkSeoTitle('Leidsche Rijn', besparing, verlies)

  expect(title).toContain(`€${besparing.toLocaleString('nl-NL')}`)
  expect(title).toContain(`€${verlies.toLocaleString('nl-NL')}`)
})

test('buildWijkSeoDescription noemt besparing en verlies consistent', () => {
  const score = resolveWijkScore(1998, 78)
  const besparing = computeBesparing(1998, score)
  const verlies = computeVerliesFromBesparing(besparing)

  const description = buildWijkSeoDescription('Leidsche Rijn', besparing, verlies)

  expect(description).toContain(`€${besparing.toLocaleString('nl-NL')}`)
  expect(description).toContain(`€${verlies.toLocaleString('nl-NL')}`)
})

test('alignPseoSavingsCopy vervangt AI-bandbreedtes door berekend bedrag', () => {
  const score = resolveWijkScore(1998, 78)
  const besparing = computeBesparing(1998, score)

  const aligned = alignPseoSavingsCopy(
    'Woningen in deze wijk kunnen €700–€1.100 per jaar besparen met zonnepanelen.',
    besparing,
  )

  expect(aligned).toBe(
    `Woningen in deze wijk kunnen €${besparing.toLocaleString('nl-NL')} per jaar besparen met zonnepanelen.`,
  )
  expect(aligned).not.toContain('€700')
})
