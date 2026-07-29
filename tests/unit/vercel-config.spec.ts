import { expect, test } from '@playwright/test'
import vercelConfig from '../../vercel.json'

test('Google Indexing API cron is niet ingepland', () => {
  expect(vercelConfig.crons.map(cron => cron.path)).not.toContain('/api/indexing/cron')
})
