import { expect, test } from '@playwright/test'
import { screenWithFallback, VisionScreeningError } from '@/lib/vision-screening'
import type { VisionType } from '@/lib/vision-input'

const accepted = { isCorrectType: true, confidence: 0.9, redenering: 'Onderwerp zichtbaar' }

for (const type of ['meterkast', 'plaatsingslocatie', 'omvormer'] as VisionType[]) {
  test(`${type} uses Claude screening after Google denies access`, async () => {
    let fallbackCalls = 0
    await screenWithFallback(type, async () => {
      throw new Error('403 PERMISSION_DENIED')
    }, async () => {
      fallbackCalls++
      return accepted
    })
    expect(fallbackCalls).toBe(1)
  })
}

test('successful primary screening does not invoke the fallback', async () => {
  await screenWithFallback('omvormer', async () => accepted, async () => {
    throw new Error('Fallback should not run')
  })
})

for (const result of [
  { ...accepted, isCorrectType: false },
  { ...accepted, confidence: 0.6 },
  { ...accepted, confidence: NaN },
]) {
  test(`primary rejection (${result.isCorrectType}, ${result.confidence}) stays a photo rejection`, async () => {
    let fallbackCalls = 0
    await expect(screenWithFallback('omvormer', async () => result, async () => {
      fallbackCalls++
      return accepted
    })).rejects.toBeInstanceOf(VisionScreeningError)
    expect(fallbackCalls).toBe(0)
  })
}

test('fallback rejects an unrelated photo rather than bypassing screening', async () => {
  await expect(screenWithFallback('omvormer', async () => {
    throw new Error('Provider timeout')
  }, async () => ({ ...accepted, isCorrectType: false }))).rejects.toBeInstanceOf(VisionScreeningError)
})

test('failure of both providers remains an operational error', async () => {
  const unavailable = new Error('Claude unavailable')
  await expect(screenWithFallback('omvormer', async () => {
    throw new Error('Google unavailable')
  }, async () => { throw unavailable })).rejects.toBe(unavailable)
})
