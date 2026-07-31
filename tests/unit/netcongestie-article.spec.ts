import { expect, test } from '@playwright/test'
import {
  NETCONGESTIE_ARTICLE,
  NETCONGESTIE_ARTICLE_SECTIONS,
  NETCONGESTIE_DECISION_STEPS,
  NETCONGESTIE_LOCAL_ANALYSES,
  NETCONGESTIE_SOURCES,
} from '@/lib/netcongestie-article'

test('netcongestie-artikel bevat het verplichte feiten- en besliskader', () => {
  const headings = NETCONGESTIE_ARTICLE_SECTIONS.map(section => section.title)
  expect(headings).toContain('Wat is netcongestie?')
  expect(headings).toContain('Waardoor raakt het stroomnet vol?')
  expect(headings).toContain('Wat merkt een huishouden hiervan?')
  expect(NETCONGESTIE_DECISION_STEPS).toHaveLength(3)
  expect(NETCONGESTIE_ARTICLE.hoofdtekst).toContain('31 december 2026')
  expect(NETCONGESTIE_ARTICLE.hoofdtekst).toContain('1 januari 2027')
})

test('netcongestie-artikel gebruikt zes unieke bestaande lokale routes', () => {
  expect(NETCONGESTIE_LOCAL_ANALYSES).toHaveLength(6)
  expect(new Set(NETCONGESTIE_LOCAL_ANALYSES.map(item => item.href)).size).toBe(6)
  for (const analysis of NETCONGESTIE_LOCAL_ANALYSES) {
    expect(analysis.href).toMatch(/^\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/)
  }
})

test('netcongestie-artikel verwijst naar primaire bronnen en bevat geen markdown-emphasis', () => {
  expect(NETCONGESTIE_SOURCES.length).toBeGreaterThanOrEqual(3)
  for (const source of NETCONGESTIE_SOURCES) {
    expect(new URL(source.href).hostname).toMatch(
      /^(www\.)?(rijksoverheid|netbeheernederland|liander)\.nl$/,
    )
  }
  expect(JSON.stringify({
    article: NETCONGESTIE_ARTICLE,
    sections: NETCONGESTIE_ARTICLE_SECTIONS,
    decisions: NETCONGESTIE_DECISION_STEPS,
  })).not.toContain('**')
})
