const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  ip: string,
  limit = 5,
  windowMs = 3_600_000,
  namespace = 'default',
): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = `${namespace}:${ip}`
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Apply rate limiting to a route handler.
 * Returns a 429 Response if the IP is over the limit, or null if allowed.
 * Usage:
 *   const limited = applyRateLimit(request)
 *   if (limited) return limited
 */
export function applyRateLimit(
  request: Request,
  limit = 5,
  windowMs = 3_600_000,
  namespace = new URL(request.url).pathname,
): { response: Response; rl: null } | { response: null; rl: ReturnType<typeof rateLimit> } {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = rateLimit(ip, limit, windowMs, namespace)

  if (!rl.allowed) {
    return {
      response: Response.json(
        { error: 'Te veel verzoeken. Probeer over een uur opnieuw.' },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Remaining': '0',
          },
        },
      ),
      rl: null,
    }
  }

  return { response: null, rl }
}
