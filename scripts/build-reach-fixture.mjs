/** Isolated, offline-content production build. Never reads production content. */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const port = 54337
const url = `http://127.0.0.1:${port}`
const fixture = spawn(process.execPath, ['tests/e2e/fixtures/pseo-mock-server.mjs'], {
  cwd: root, env: { ...process.env, PSEO_MOCK_PORT: String(port) },
  stdio: 'inherit', windowsHide: true,
})
let fixtureExit = null
fixture.on('exit', code => { fixtureExit = code ?? 1 })
let build
try {
  let ready = false
  for (let attempt = 0; attempt < 30; attempt++) {
    if (fixtureExit !== null) throw new Error(`Fixture exited (${fixtureExit}); build cancelled`)
    try {
      const response = await fetch(`${url}/rest/v1/pseo_pages?status=eq.published`, { signal: AbortSignal.timeout(1000) })
      const rows = await response.json()
      const news = await (await fetch(`${url}/rest/v1/nieuws_articles?status=eq.published`, { signal: AbortSignal.timeout(1000) })).json()
      const knowledge = await (await fetch(`${url}/rest/v1/kennisbank_articles?status=eq.published`, { signal: AbortSignal.timeout(1000) })).json()
      if (!response.ok || !Array.isArray(rows) || rows.length !== 24 || !Array.isArray(news) || news.length !== 19 || !Array.isArray(knowledge) || knowledge.length !== 12) throw new Error('Unexpected fixture inventory')
      console.log(`Verified local content fixture: ${rows.length} locations, ${news.length} news, ${knowledge.length} knowledge articles`)
      ready = true
      break
    } catch { await new Promise(resolve => setTimeout(resolve, 100)) }
  }
  if (!ready || fixtureExit !== null) throw new Error('Content fixture unavailable; build cancelled')
  build = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    cwd: root, windowsHide: true, stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DIST_DIR: 'tmp/reach-recovery/next-build',
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'playwright-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'playwright-service-role',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: '', CRON_SECRET: 'reach-fixture-secret',
      SENTRY_AUTH_TOKEN: '', SENTRY_DSN: '', NEXT_PUBLIC_SENTRY_DSN: '',
      RESEND_API_KEY: '', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '',
      GOOGLE_AI_API_KEY: 'fixture-not-an-api-key',
    },
  })
  fixture.on('exit', () => { if (build.exitCode === null) build.kill() })
  const code = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('exit', code => resolve(code ?? 1))
  })
  process.exitCode = code
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Fixture build failed')
  process.exitCode = 1
} finally {
  fixture.kill()
}
