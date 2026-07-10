import { expect, test } from '@playwright/test'
import { parseVisionInput, VisionInputError } from '@/lib/vision-input'

const jpeg = Buffer.from('valid-test-image'.repeat(20)).toString('base64')

test('accepts supported data URLs', () => {
  expect(parseVisionInput({
    type: 'meterkast',
    imageBase64: `data:image/jpeg;base64,${jpeg}`,
  })).toMatchObject({
    type: 'meterkast',
    mimeType: 'image/jpeg',
  })
})

test('rejects SVG and malformed base64', () => {
  expect(() => parseVisionInput({
    type: 'meterkast',
    imageBase64: `data:image/svg+xml;base64,${jpeg}`,
  })).toThrow(VisionInputError)
  expect(() => parseVisionInput({
    type: 'meterkast',
    imageBase64: 'data:image/jpeg;base64,%%%not-base64%%%',
  })).toThrow(VisionInputError)
})

test('rejects more than 3 MiB decoded', () => {
  const oversized = Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64')
  expect(() => parseVisionInput({
    type: 'omvormer',
    imageBase64: `data:image/webp;base64,${oversized}`,
  })).toThrow(/3 MiB/)
})
