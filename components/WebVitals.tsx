'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from '@/lib/analytics'

const reportWebVitals: Parameters<typeof useReportWebVitals>[0] = metric => {
  trackEvent('web_vital', {
    metric_id: metric.id,
    metric_name: metric.name,
    metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
  })
}

export function WebVitals() {
  useReportWebVitals(reportWebVitals)
  return null
}
