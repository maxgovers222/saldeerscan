// lib/rate-limit.ts — Upstash Redis sliding window met in-memory fallback voor lokale dev

const ratelimiterCache = new Map<string, unknown>()

function toUpstashWindow(windowMs: number): `${number} ${'s' | 'm' | 'h'}` {
  if (windowMs % 3_600_000 === 0) return `${Math.max(1, Math.round(windowMs / 3_600_000))} h`
  if (windowMs % 60_000 === 0) return `${Math.max(1, Math.round(windowMs / 60_000))} m`
  return `${Math.max(1, Math.round(windowMs / 1000))} s`
}

async function getUpstashLimiter(limit: number, windowMs: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  const cacheKey = `${limit}:${windowMs}`
  const existing = ratelimiterCache.get(cacheKey)
  if (existing) return existing as { limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }> }

  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const limiter = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(limit, toUpstashWindow(windowMs)),
  })
  ratelimiterCache.set(cacheKey, limiter)
  return limiter as { limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }> }
}

// In-memory fallback voor lokale dev (geen persistentie)
const memStore = new Map<string, { count: number; resetAt: number }>()

function memRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  if (memStore.size > 1000) {
    for (const [k, v] of memStore) { if (now > v.resetAt) memStore.delete(k) }
  }
  const entry = memStore.get(key)
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt }
  }
  entry.count++
  return { success: true, remaining: limit - entry.count, reset: entry.resetAt }
}

export async function applyRateLimit(
  request: Request,
  limit = 5,
  windowMs = 3_600_000,
  namespace = new URL(request.url).pathname,
): Promise<{ response: Response; rl: null } | { response: null; rl: { remaining: number; resetAt: number } }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const key = `${namespace}:${ip}`

  let result: { success: boolean; remaining: number; reset: number }

  const limiter = await getUpstashLimiter(limit, windowMs)
  if (limiter) {
    result = await limiter.limit(key)
  } else {
    result = memRateLimit(key, limit, windowMs)
  }

  if (!result.success) {
    return {
      response: Response.json(
        { error: 'Te veel verzoeken. Probeer over een uur opnieuw.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.round(windowMs / 1000))), 'X-RateLimit-Remaining': '0' } }
      ),
      rl: null,
    }
  }

  return { response: null, rl: { remaining: result.remaining, resetAt: result.reset } }
}
