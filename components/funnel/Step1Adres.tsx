'use client'

import { useState, useEffect, useRef, useCallback, type Dispatch } from 'react'
import type { FunnelState, FunnelAction } from './types'
import type { FunnelTracker } from '@/lib/analytics'
import { AnalysisLoading } from './AnalysisLoading'
import { funnelPrimaryButtonClass } from './ui/FunnelActions'
import { FunnelCard } from './ui/FunnelCard'
import { FunnelNotice } from './ui/FunnelNotice'
import { FunnelStageShell } from './ui/FunnelStageShell'

interface Step1AdresProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  trackFunnel: FunnelTracker
}

function HealthScoreGauge({ score, label }: { score: number; label: string }) {
  const colorClass =
    score >= 75 ? 'text-trust-dark' :
    score >= 55 ? 'text-warning' :
    score >= 35 ? 'text-warning' :
    'text-danger'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-2xl font-mono font-bold ${colorClass}`}>{score}/100</span>
      <span className={`text-xs font-mono ${colorClass}`}>{label}</span>
    </div>
  )
}

function NetcongentieBadge({ status, netbeheerder }: { status: 'ROOD' | 'ORANJE' | 'GROEN'; netbeheerder: string }) {
  const config = {
    ROOD: {
      label: `Hoge regionale netdruk (${netbeheerder || 'netbeheerder'})`,
      subtext: 'Indicatie: dit kan gevolgen hebben voor nieuwe of zwaardere aansluitingen en lokale spanning. Het is geen bewijs dat uw teruglevering actief wordt beperkt.',
      textClass: 'text-danger', bgClass: 'bg-danger/8 border-danger/25', dotClass: 'bg-danger',
    },
    ORANJE: {
      label: `Regionale netdruk (${netbeheerder || 'netbeheerder'})`,
      subtext: 'Controleer de actuele situatie bij de netbeheerder als u een nieuwe of zwaardere aansluiting nodig heeft.',
      textClass: 'text-warning', bgClass: 'bg-action/10 border-warning/25', dotClass: 'bg-warning',
    },
    GROEN: {
      label: `Lagere regionale netdruk (${netbeheerder || 'netbeheerder'})`,
      subtext: 'Dit is een indicatie en geen garantie voor onbeperkte teruglevering of toekomstige aansluitcapaciteit.',
      textClass: 'text-trust-dark', bgClass: 'bg-trust/10 border-trust/25', dotClass: 'bg-trust',
    },
  }
  const c = config[status]
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${c.bgClass}`}>
      <span className={`w-2 h-2 rounded-full ${c.dotClass} shrink-0 mt-1`} />
      <div>
        <div className={`text-xs font-mono font-semibold ${c.textClass}`}>{c.label}</div>
        {c.subtext && <div className="mt-0.5 text-xs leading-relaxed text-ink-muted">{c.subtext}</div>}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-ink/8" />
      <div className="h-4 w-1/2 rounded bg-ink/8" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded bg-ink/8" />)}
      </div>
    </div>
  )
}

function DataCard({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-mist p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">{label}</div>
      <div className="font-mono text-lg font-bold leading-none text-ink">
        {value !== null && value !== undefined ? (
          <>{value}{unit && <span className="ml-1 text-xs text-ink-muted">{unit}</span>}</>
        ) : <span className="text-ink-muted/50">—</span>}
      </div>
    </div>
  )
}

interface Suggestion { label: string; id: string }

function AddressAutocomplete({ value, onChange, onSelect, isSelected, disabled }: {
  value: string; onChange: (v: string) => void; onSelect: (label: string) => void
  isSelected: boolean; disabled: boolean
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/bag/suggest?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data: Suggestion[] = (await res.json() as Suggestion[]).slice(0, 8)
        setSuggestions(data)
        setOpen(data.length > 0)
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChange(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchSuggestions(v), 250)
  }

  function handleSelect(s: Suggestion) {
    onSelect(s.label)
    setSuggestions([])
    setOpen(false)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text" value={value} onChange={handleChange}
          role="combobox"
          aria-label="Uw adres"
          aria-autocomplete="list"
          aria-expanded={open}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Bijv. Prinsengracht 123, Amsterdam"
          disabled={disabled} autoComplete="off"
          className={[
            'w-full min-w-0 rounded-xl border bg-white px-4 py-3.5 pr-10 font-sans text-base text-ink shadow-sm placeholder:text-ink-muted/65 transition',
            'focus:border-trust focus:outline-none focus-visible:ring-3 focus-visible:ring-trust/35 sm:text-sm',
            isSelected ? 'border-trust' : 'border-ink/15',
          ].join(' ')}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && <div className="size-3.5 animate-spin rounded-full border-2 border-trust border-t-transparent" />}
          {isSelected && !loading && (
            <div className="flex size-4 items-center justify-center rounded-full bg-trust" data-testid="address-selected">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-2xl"
          data-testid="address-suggestions"
        >
          {suggestions.map((s) => (
            <button key={s.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              className="w-full border-b border-ink/5 px-4 py-3 text-left text-sm text-ink transition-colors last:border-0 hover:bg-trust/10">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mr-2 inline-block shrink-0 text-trust-dark">
                <path d="M8 1.5a4.5 4.5 0 014.5 4.5C12.5 10 8 14.5 8 14.5S3.5 10 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
              </svg>{s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Step1Adres({ state, dispatch, trackFunnel }: Step1AdresProps) {
  const [inputValue, setInputValue] = useState(state.adres || '')
  const [selectedAdres, setSelectedAdres] = useState<string | null>(state.adres || null)
  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const addressEntryStarted = useRef(Boolean(state.adres))

  const hasResults = state.bagData !== null

  useEffect(() => {
    if (state.adres && state.adres.length >= 5 && !state.bagData) doSearch(state.adres)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!inputValue.trim() || !state.funnelSessionId || addressEntryStarted.current) return
    addressEntryStarted.current = true
    trackFunnel('address_entry_start')
  }, [inputValue, state.funnelSessionId, trackFunnel])

  async function doSearch(adres: string) {
    setLocalLoading(true)
    setLocalError(null)
    let failureTracked = false
    try {
      const bagRes = await fetch(`/api/bag?adres=${encodeURIComponent(adres)}`)
      if (!bagRes.ok) {
        trackFunnel('bag_match_failed', {
          reason: bagRes.status === 404 ? 'not_found' : 'api_error',
        })
        failureTracked = true
        const errData = await bagRes.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || 'Adres niet gevonden in BAG')
      }
      const bagData = await bagRes.json()
      trackFunnel('bag_match_succeeded', {
        postcode_prefix: typeof bagData.postcode === 'string'
          ? bagData.postcode.replace(/\s/g, '').slice(0, 4)
          : '',
      })
      dispatch({ type: 'SET_ADRES', adres })
      dispatch({ type: 'SET_BAG_DATA', bagData: {
        bouwjaar: bagData.bouwjaar, oppervlakte: bagData.oppervlakte,
        woningtype: bagData.woningtype, postcode: bagData.postcode,
        huisnummer: bagData.huisnummer ?? null,
        dakOppervlakte: bagData.dakOppervlakte, lat: bagData.lat, lon: bagData.lon,
      }})

      const promises: Promise<void>[] = []
      if (bagData.postcode) {
        promises.push(
          fetch(`/api/netcongestie?postcode=${encodeURIComponent(bagData.postcode)}`)
            .then(async (r) => {
              if (r.ok) {
                const nc = await r.json()
                dispatch({ type: 'SET_NETCONGESTIE', netcongestie: nc })
                if (bagData.oppervlakte && bagData.bouwjaar && bagData.dakOppervlakte) {
                  const roiRes = await fetch('/api/roi', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oppervlakte: bagData.oppervlakte, bouwjaar: bagData.bouwjaar, dakOppervlakte: bagData.dakOppervlakte, netcongestieStatus: nc.status }),
                  })
                  if (roiRes.ok) {
                    const roiData = await roiRes.json()
                    dispatch({ type: 'SET_ROI', roiResult: roiData.roi })
                    dispatch({ type: 'SET_HEALTH_SCORE', healthScore: roiData.health })
                  }
                }
              }
            }).catch(() => {})
        )
      } else if (bagData.oppervlakte && bagData.bouwjaar && bagData.dakOppervlakte) {
        promises.push(
          fetch('/api/roi', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oppervlakte: bagData.oppervlakte, bouwjaar: bagData.bouwjaar, dakOppervlakte: bagData.dakOppervlakte }),
          }).then(async (r) => {
            if (r.ok) { const d = await r.json(); dispatch({ type: 'SET_ROI', roiResult: d.roi }); dispatch({ type: 'SET_HEALTH_SCORE', healthScore: d.health }) }
          }).catch(() => {})
        )
      }
      await Promise.all(promises)
    } catch (err) {
      if (!failureTracked) {
        trackFunnel('bag_match_failed', { reason: 'api_error' })
      }
      setLocalError(err instanceof Error ? err.message : 'Onbekende fout bij ophalen adresgegevens')
    } finally {
      setLocalLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAdres) return
    trackFunnel('address_entry_submit')
    await doSearch(selectedAdres)
  }

  function handleInputChange(v: string) {
    setInputValue(v)
    if (selectedAdres && v !== selectedAdres) setSelectedAdres(null)
  }

  return (
    <FunnelStageShell
      eyebrow="Stadium 1 van 4 · Uw woning"
      title="Voer uw adres in"
      description="We controleren uw woninggegevens en het lokale stroomnet. Dit duurt meestal minder dan een minuut."
    >

      <form onSubmit={handleSubmit} className="space-y-3">
        <AddressAutocomplete
          value={inputValue} onChange={handleInputChange}
          onSelect={(label) => { setInputValue(label); setSelectedAdres(label); setLocalError(null) }}
          isSelected={!!selectedAdres} disabled={localLoading}
        />

        {!selectedAdres && inputValue.length >= 3 && (
          <p className="text-xs text-ink-muted">
            Selecteer een adres uit de suggesties om door te gaan.
          </p>
        )}

        {localError && (
          <FunnelNotice variant="danger">{localError}</FunnelNotice>
        )}

        <button type="submit" disabled={!selectedAdres || localLoading}
          className={`w-full ${funnelPrimaryButtonClass}`}>
          {localLoading ? 'Analyseren...' : 'Adres Analyseren'}
        </button>
      </form>

      {localLoading && <AnalysisLoading wijk={state.wijk || undefined} />}

      {hasResults && !localLoading && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-trust-dark">Uw woning is gevonden</p>

          <FunnelCard surface="trust">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-trust-dark">Geanalyseerd adres</div>
            <div className="break-words text-sm font-semibold text-ink">{state.adres}</div>
            {state.bagData?.postcode && <div className="mt-0.5 font-mono text-xs text-ink-muted">{state.bagData.postcode}</div>}
          </FunnelCard>

          <div className="grid grid-cols-2 gap-3">
            <DataCard label="Bouwjaar" value={state.bagData?.bouwjaar ?? null} />
            <DataCard label="Oppervlakte" value={state.bagData?.oppervlakte ?? null} unit="m²" />
            <DataCard label="Woningtype" value={state.bagData?.woningtype ?? null} />
            <DataCard label="Dakoppervlak" value={state.bagData?.dakOppervlakte ?? null} unit="m²" />
          </div>

          {state.bagData?.woningtype &&
            !['Woning', 'woning', 'residential', 'Appartement', 'appartement'].includes(state.bagData.woningtype) && (
            <FunnelNotice variant="warning" title="Mogelijk geen woonadres">
              Dit lijkt een kantoor- of bedrijfspand. Onze berekeningen zijn primair voor woningen; de uitkomsten kunnen afwijken.
            </FunnelNotice>
          )}

          {state.netcongestie && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Lokaal stroomnet</div>
              <NetcongentieBadge status={state.netcongestie.status} netbeheerder={state.netcongestie.netbeheerder} />
            </div>
          )}

          {state.healthScore && (
            <FunnelCard surface="mist">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Energiepotentieel</div>
              <div className="flex items-center justify-between">
                <HealthScoreGauge score={state.healthScore.score} label={state.healthScore.label} />
                <div className="flex-1 ml-4 space-y-1">
                  {state.healthScore.aanbevelingen.slice(0, 2).map((a, i) => (
                    <p key={i} className="text-xs leading-relaxed text-ink-muted">
                      <span className="mr-1 text-trust-dark">✓</span>{a}
                    </p>
                  ))}
                </div>
              </div>
            </FunnelCard>
          )}

          <button onClick={() => dispatch({ type: 'SET_STEP', step: 2 })}
            className={`w-full ${funnelPrimaryButtonClass}`}>
            Bereken mijn 2027-impact <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </FunnelStageShell>
  )
}
