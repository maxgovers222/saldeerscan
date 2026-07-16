import type {
  FunnelAttribution,
  VisualFunnelStage,
} from '@/components/funnel/types'

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

export type FunnelEventName =
  | 'funnel_session_started'
  | 'funnel_stage_viewed'
  | 'funnel_stage_completed'
  | 'funnel_validation_failed'
  | 'bag_match_succeeded'
  | 'bag_match_failed'
  | 'technical_scan_completed'
  | 'technical_scan_skipped'
  | 'technical_module_skipped'
  | 'lead_submit_started'
  | 'lead_submit_succeeded'
  | 'lead_submit_failed'
  | 'funnel_abandoned'

export interface FunnelEventExtra {
  completed_stage?: VisualFunnelStage
  stage_duration_ms?: number
  reason?: 'not_found' | 'api_error'
  postcode_prefix?: string
  scan_type?: 'Meterkast' | 'Plaatsingslocatie' | 'Omvormer'
  completion?: 'photo' | 'manual'
  lead_quality_segment?: string
  email_status?: 'pending' | 'sent' | 'failed' | 'not_configured' | 'skipped'
  failure_type?: `http_${number}` | 'network'
  validation_type?:
    | 'full_name_required'
    | 'full_name_format'
    | 'email_required'
    | 'email_format'
    | 'phone_required'
    | 'phone_format'
    | 'panel_count'
    | 'privacy_consent'
    | 'photo_format_unsupported'
    | 'photo_too_large'
    | 'photo_screening_rejected'
}

export type FunnelTracker = (
  event: FunnelEventName,
  extra?: FunnelEventExtra,
) => void

export function buildFunnelEventParams(input: {
  sessionId: string
  attribution: FunnelAttribution
  stage?: VisualFunnelStage
  extra?: FunnelEventExtra
}): Record<string, string | number | boolean> {
  const attribution = input.attribution
  return {
    funnel_session_id: input.sessionId,
    landing_path: attribution.landingPath,
    pseo_level: attribution.pseoLevel,
    ...(attribution.provincie ? { provincie: attribution.provincie } : {}),
    ...(attribution.stad ? { stad: attribution.stad } : {}),
    ...(attribution.wijk ? { wijk: attribution.wijk } : {}),
    ...(attribution.straat ? { straat: attribution.straat } : {}),
    ...(attribution.postcode ? { postcode: attribution.postcode } : {}),
    ...(attribution.utmSource ? { utm_source: attribution.utmSource } : {}),
    ...(attribution.utmMedium ? { utm_medium: attribution.utmMedium } : {}),
    ...(attribution.utmCampaign ? { utm_campaign: attribution.utmCampaign } : {}),
    ...(input.stage ? { funnel_stage: input.stage } : {}),
    ...input.extra,
  }
}

export function leadQualitySegment(input: {
  isEigenaar: boolean | null
  heeftPanelen: boolean | null
}): string {
  if (input.isEigenaar === null || input.heeftPanelen === null) return 'unknown'
  return `${input.isEigenaar ? 'owner' : 'tenant'}_${input.heeftPanelen ? 'existing_solar' : 'no_solar'}`
}
