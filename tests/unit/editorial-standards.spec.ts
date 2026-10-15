import { expect, test } from '@playwright/test'
import {
  ENERGY_EDITORIAL_GUARDRAILS,
  sanitizeGeneratedEnergyCopy,
  sanitizeStructuredEnergyCopy,
} from '@/lib/editorial-standards'

test('replaces an obsolete saldering paragraph with the enacted rule', () => {
  const result = sanitizeGeneratedEnergyCopy(
    'De afbouw van de salderingsregeling start in 2025. In 2026 mag u nog 28% salderen.',
  )

  expect(result).toContain('100% mogelijk tot en met 31 december 2026')
  expect(result).toContain('stopt in één keer per 1 januari 2027')
  expect(result).not.toContain('28%')
})

test('removes deterministic netcongestion and battery claims', () => {
  const result = sanitizeGeneratedEnergyCopy(
    'Teruglevering wordt al gereguleerd. Een thuisbatterij is daarom essentieel.',
  )

  expect(result).toContain('regionale kleur is een indicatie')
  expect(result).toContain('niet automatisch noodzakelijk')
  expect(result).not.toContain('**')
})

test('correction copy is plain text without markdown emphasis', () => {
  const result = sanitizeGeneratedEnergyCopy(
    'De afbouw van de salderingsregeling start in 2025. In 2026 mag u nog 28% salderen.',
  )

  expect(result).toMatch(/^Actuele stand:/)
  expect(result).not.toContain('**')
})

test('repairs the observed claim that saldering was already reduced in 2026', () => {
  const result = sanitizeGeneratedEnergyCopy('De salderingsregeling is al aanzienlijk afgebouwd in 2026.\n\nBewaar uw garantievoorwaarden.')
  expect(result).not.toContain('al aanzienlijk afgebouwd')
  expect(result).toContain('100% mogelijk tot en met 31 december 2026')
  expect(result).toContain('Bewaar uw garantievoorwaarden.')
})

test('repairs denial of the compensation floor while keeping gross compensation separate from fees', () => {
  const result = sanitizeGeneratedEnergyCopy('Er is geen wettelijk vastgelegd of gegarandeerd tarief meer.')
  expect(result).toContain('50% van het kale leveringstarief')
  expect(result).toContain('Terugleverkosten zijn een afzonderlijke contractpost')
  expect(result).not.toContain('geen wettelijk vastgelegd')
})

test('corrects unsafe ISDE copy in structured content without changing its shape', () => {
  const result = sanitizeStructuredEnergyCopy({
    name: 'FAQ',
    acceptedAnswer: {
      text: 'ISDE betaalt de dakcheck en groepenkast voor zonnepanelen.',
    },
  })

  expect(result).toEqual({
    name: 'FAQ',
    acceptedAnswer: {
      text: 'ISDE geldt alleen voor officieel aangewezen woningmaatregelen',
    },
  })
  expect(ENERGY_EDITORIAL_GUARDRAILS).toContain('100% mogelijk')
})
