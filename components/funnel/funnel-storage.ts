import type { FunnelState } from './types'
import { makeInitialState } from './funnel-state'

export const STORAGE_KEY = 'wep_funnel_state'
export const STORAGE_VERSION = 2
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

interface StoredFunnel {
  version: number
  savedAt: number
  state: FunnelState
}

export function encodeStoredFunnel(
  state: FunnelState,
  now = Date.now(),
): string {
  return JSON.stringify({
    version: STORAGE_VERSION,
    savedAt: now,
    state,
  } satisfies StoredFunnel)
}

export function decodeStoredFunnel(
  raw: string | null,
  now = Date.now(),
): FunnelState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const candidate = 'version' in parsed
      ? (() => {
          const envelope = parsed as Partial<StoredFunnel>
          if (
            envelope.version !== STORAGE_VERSION
            || typeof envelope.savedAt !== 'number'
            || now - envelope.savedAt > MAX_AGE_MS
            || !envelope.state
            || typeof envelope.state !== 'object'
          ) return null
          return envelope.state
        })()
      : parsed as Partial<FunnelState> & {
          utmParams?: {
            source?: string | null
            medium?: string | null
            campaign?: string | null
            landingPage?: string | null
          } | null
        }
    if (!candidate || ![1, 2, 3, 4, 5, 6].includes(candidate.step ?? 0)) {
      return null
    }
    const candidateState = candidate as Partial<FunnelState> & {
      step: FunnelState['step']
      utmParams?: {
        source?: string | null
        medium?: string | null
        campaign?: string | null
        landingPage?: string | null
      } | null
    }
    const legacyUtm = candidateState.utmParams ?? null
    const base = makeInitialState({
      adres: candidateState.adres,
      wijk: candidateState.wijk,
      stad: candidateState.stad,
    })
    const state: FunnelState = {
      ...base,
      ...candidateState,
      roiInput: candidateState.roiInput ?? null,
      reportModel: candidateState.reportModel ?? null,
      leadReportToken: candidateState.leadReportToken ?? null,
      funnelSessionId: candidateState.funnelSessionId ?? null,
      attribution: candidateState.attribution ?? {
        ...base.attribution,
        landingPath: legacyUtm?.landingPage ?? '/check',
        utmSource: legacyUtm?.source ?? null,
        utmMedium: legacyUtm?.medium ?? null,
        utmCampaign: legacyUtm?.campaign ?? null,
      },
    }
    return state.step === 1 && !state.bagData ? null : state
  } catch {
    return null
  }
}

export function loadStoredFunnel(): FunnelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const state = decodeStoredFunnel(raw)
    if (state && raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (!('version' in parsed)) saveStoredFunnel(state)
    }
    return state
  } catch {
    return null
  }
}

export function saveStoredFunnel(state: FunnelState): void {
  try {
    localStorage.setItem(STORAGE_KEY, encodeStoredFunnel(state))
  } catch {}
}

export function clearStoredFunnel(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
