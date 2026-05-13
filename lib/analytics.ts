/**
 * GA4 via gtag — gebruik data-analytics-event / data-analytics-label op klikbare elementen.
 * Veelgebruikte events: pseo_second_click, pseo_check_cta, pseo_hub_filter (reserveren voor filters).
 */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  if (typeof w.gtag !== 'function') return
  w.gtag('event', name, params ?? {})
}
