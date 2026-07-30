'use client'

import { useState, useEffect, type Dispatch } from 'react'
import { useRouter } from 'next/navigation'
import type { FunnelState, FunnelAction } from './types'
import { PDFDownloadButton } from './PDFDownloadButton'
import { ResultsDashboard } from './ResultsDashboard'
import { FunnelActions, funnelPrimaryButtonClass, funnelSecondaryButtonClass } from './ui/FunnelActions'
import { FunnelCard } from './ui/FunnelCard'
import { FunnelChoiceCard } from './ui/FunnelChoiceCard'
import { FunnelField } from './ui/FunnelField'
import { FunnelNotice } from './ui/FunnelNotice'
import { FunnelStageShell } from './ui/FunnelStageShell'
import { FunnelTrustLine } from './ui/FunnelTrustLine'
import type { NormalizedReport, ReportEmailStatus } from '@/lib/report-model'
import {
  leadQualitySegment,
  type FunnelEventExtra,
  type FunnelTracker,
} from '@/lib/analytics'
import { extractProvincie } from '@/lib/postcode-provincie'

function extractStad(adres?: string): string {
  if (!adres) return 'Nederland'
  // Split on commas only — preserves multi-word cities like "Den Haag", "'s-Hertogenbosch"
  const parts = adres.split(',').map(s => s.trim()).filter(Boolean)
  const last = parts[parts.length - 1] || 'Nederland'
  // "3077PL Rotterdam" → "Rotterdam"
  const withoutPostcode = last.replace(/^\d{4}\s*[A-Za-z]{0,2}\s*/, '').trim()
  return withoutPostcode || last
}

interface Step6LeadCaptureProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  trackFunnel: FunnelTracker
}

const COUNTRIES = [
  { code: '+31', label: 'NL', name: 'Nederland',  regex: /^0?[1-9]\d{7,8}$/ },
  { code: '+32', label: 'BE', name: 'België',      regex: /^0?[1-9]\d{7,8}$/ },
  { code: '+49', label: 'DE', name: 'Duitsland',   regex: /^0?[1-9]\d{8,11}$/ },
  { code: '+352', label: 'LU', name: 'Luxemburg',  regex: /^[0-9]\d{5,8}$/ },
] as const

type CountryCode = typeof COUNTRIES[number]['code']

interface LeadFormData {
  naam: string
  email: string
  telefoon: string
  countryCode: CountryCode
  gdprConsent: boolean
  isEigenaar: boolean | null
  heeftPanelen: boolean | null
  huidigePanelenAantal: string
}

function normalizePhone(raw: string, code: CountryCode): string {
  const digits = raw.replace(/[\s\-().]/g, '')
  const stripped = digits.startsWith('0') ? digits.slice(1) : digits
  return `${code}${stripped}`
}

function validatePhone(raw: string, code: CountryCode): boolean {
  const digits = raw.replace(/[\s\-().]/g, '')
  const country = COUNTRIES.find(c => c.code === code)
  return country ? country.regex.test(digits) : digits.length >= 7
}

function SuccessState({ state }: { state: FunnelState }) {
  if (!state.reportModel) return null

  return (
    <div className="min-w-0 overflow-hidden bg-paper">
      <ResultsDashboard report={state.reportModel} />
      <div className="border-t border-ink/10 bg-paper px-4 pb-8 pt-3 sm:px-8">
        <div className="mx-auto max-w-md">
          <PDFDownloadButton report={state.reportModel} />
        </div>
      </div>
    </div>
  )
}

const inputBase = [
  'w-full min-w-0 rounded-xl border bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-muted/60 sm:text-sm',
  'transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/35',
  'disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-muted',
].join(' ')

export function Step6LeadCapture({ state, dispatch, trackFunnel }: Step6LeadCaptureProps) {
  const router = useRouter()
  const step2PanelenComplete =
    state.heeft_panelen !== null
    && (state.heeft_panelen === false
      || (typeof state.huidige_panelen_aantal === 'number' && state.huidige_panelen_aantal > 0))

  const [editPanelen, setEditPanelen] = useState(false)
  const panelenAntwoordLocked = step2PanelenComplete && !editPanelen

  const [form, setForm] = useState<LeadFormData>({
    naam: '',
    email: '',
    telefoon: '',
    countryCode: '+31',
    gdprConsent: false,
    isEigenaar: state.is_eigenaar,
    heeftPanelen: state.heeft_panelen,
    huidigePanelenAantal: state.huidige_panelen_aantal ? String(state.huidige_panelen_aantal) : '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData | 'submit', string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [watGebeurtOpen, setWatGebeurtOpen] = useState(false)
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false)

  useEffect(() => {
    if (editPanelen) return
    setForm(f => ({
      ...f,
      isEigenaar: state.is_eigenaar,
      heeftPanelen: state.heeft_panelen ?? f.heeftPanelen,
      huidigePanelenAantal: state.huidige_panelen_aantal ? String(state.huidige_panelen_aantal) : '',
    }))
  }, [state.is_eigenaar, state.heeft_panelen, state.huidige_panelen_aantal, editPanelen])

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const syncReportDetails = () => setReportDetailsOpen(desktopQuery.matches)
    syncReportDetails()
    desktopQuery.addEventListener('change', syncReportDetails)
    return () => desktopQuery.removeEventListener('change', syncReportDetails)
  }, [])

  function validate(): boolean {
    const e: typeof errors = {}
    const validationFailures: NonNullable<FunnelEventExtra['validation_type']>[] = []
    const naamParts = form.naam.trim().split(/\s+/)
    if (!form.naam.trim()) {
      e.naam = 'Naam is verplicht'
      validationFailures.push('full_name_required')
    } else if (naamParts.length < 2) {
      e.naam = 'Voer uw voor- en achternaam in'
      validationFailures.push('full_name_format')
    }
    const emailNorm = form.email.trim().toLowerCase()
    if (!emailNorm) {
      e.email = 'E-mailadres is verplicht'
      validationFailures.push('email_required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNorm)) {
      e.email = 'Voer een geldig e-mailadres in'
      validationFailures.push('email_format')
    }
    if (!form.telefoon.trim()) {
      e.telefoon = 'Telefoonnummer is verplicht'
      validationFailures.push('phone_required')
    } else if (!validatePhone(form.telefoon, form.countryCode)) {
      e.telefoon = 'Ongeldig telefoonnummer voor het geselecteerde land'
      validationFailures.push('phone_format')
    }
    const hp = panelenAntwoordLocked ? state.heeft_panelen : form.heeftPanelen
    if (hp === true) {
      const aantal = panelenAntwoordLocked
        ? state.huidige_panelen_aantal
        : Number(form.huidigePanelenAantal)
      if (aantal === null || aantal === undefined || !Number.isInteger(aantal) || aantal <= 0 || aantal > 200) {
        e.huidigePanelenAantal = 'Voer een geldig aantal panelen in (1-200)'
        validationFailures.push('panel_count')
      }
    }
    if (!form.gdprConsent) {
      e.gdprConsent = 'U moet akkoord gaan met de privacyverklaring om door te gaan.'
      validationFailures.push('privacy_consent')
    }
    setErrors(e)
    for (const validationType of new Set(validationFailures)) {
      trackFunnel('funnel_validation_failed', { validation_type: validationType })
    }
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setSubmitError(null)
    setErrors({})
    try {
      const heeftPayload = panelenAntwoordLocked ? state.heeft_panelen : form.heeftPanelen
      const huidigePayload = heeftPayload === true
        ? (panelenAntwoordLocked ? state.huidige_panelen_aantal : Number(form.huidigePanelenAantal || 0))
        : null
      const segment = leadQualitySegment({
        isEigenaar: form.isEigenaar,
        heeftPanelen: heeftPayload,
      })
      trackFunnel('lead_submit_started', { lead_quality_segment: segment })

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: form.naam.trim(), email: form.email.trim().toLowerCase(), telefoon: normalizePhone(form.telefoon, form.countryCode),
          adres: state.adres, postcode: state.bagData?.postcode,
          huisnummer: state.bagData?.huisnummer ? String(state.bagData.huisnummer) : null,
          wijk: state.wijk || null,
          stad: state.stad || (state.bagData ? extractStad(state.adres) : null),
          provincie: state.netcongestie?.postcodePrefix
            ? extractProvincie(state.netcongestie.postcodePrefix)
            : state.bagData?.postcode
              ? extractProvincie(state.bagData.postcode.substring(0, 4))
              : null,
          lat: state.bagData?.lat, lon: state.bagData?.lon, bagData: state.bagData,
          roiInput: state.roiInput,
          healthScore: state.healthScore?.score, netcongestieStatus: state.netcongestie?.status,
          roiResult: state.roiResult, meterkastAnalyse: state.meterkastAnalyse,
          plaatsingsAnalyse: state.plaatsingsAnalyse, omvormerAnalyse: state.omvormerAnalyse,
          isdeSchatting: state.roiResult?.isdeSchatting, gdprConsent: form.gdprConsent,
          isEigenaar: form.isEigenaar, heeftPanelen: heeftPayload,
          huidigePanelenAantal: huidigePayload,
          dakrichting: state.dakrichting,
          verbruik_bron: state.verbruik_bron,
          huishouden_grootte: state.huishouden_grootte,
          utmSource: state.attribution.utmSource,
          utmMedium: state.attribution.utmMedium,
          utmCampaign: state.attribution.utmCampaign,
          landingPage: state.attribution.landingPath,
        }),
      })
      if (!res.ok) {
        trackFunnel('lead_submit_failed', { failure_type: `http_${res.status}` })
        const err = await res.json().catch(() => ({}))
        setErrors({ submit: (err as { error?: string }).error ?? 'Er is een fout opgetreden. Probeer opnieuw.' })
        return
      }
      const data = await res.json() as {
        leadId: string
        reportToken?: string | null
        emailStatus?: ReportEmailStatus
        report?: NormalizedReport
      }
      if (!data.report || data.report.version !== 1) {
        throw new Error('Rapport kon niet betrouwbaar worden opgebouwd. Probeer het later opnieuw.')
      }
      trackFunnel('lead_submit_succeeded', {
        lead_quality_segment: segment,
        email_status: data.emailStatus ?? data.report.delivery.emailStatus,
      })
      dispatch({ type: 'SET_REPORT_MODEL', report: data.report })
      if (typeof data.reportToken === 'string' && data.reportToken.length > 0) {
        dispatch({ type: 'SET_LEAD_REPORT_TOKEN', token: data.reportToken })
      } else {
        dispatch({ type: 'SET_LEAD_REPORT_TOKEN', token: null })
      }
      dispatch({ type: 'SET_LEAD_ID', leadId: data.leadId })
      const reportQs =
        typeof data.reportToken === 'string' && data.reportToken.length > 0
          ? `?leadId=${encodeURIComponent(data.leadId)}&token=${encodeURIComponent(data.reportToken)}`
          : `?leadId=${encodeURIComponent(data.leadId)}`
      router.replace(`/check${reportQs}`, { scroll: false })
      setSubmitted(true)
    } catch (err) {
      trackFunnel('lead_submit_failed', { failure_type: 'network' })
      setSubmitError(err instanceof Error ? err.message : 'Indienen mislukt. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return <SuccessState state={state} />

  const regio = state.wijk || (state.bagData ? state.adres.split(',').pop()?.trim() : null) || 'uw regio'

  return (
    <FunnelStageShell
      eyebrow="Stadium 4 van 4 · Ontvang uw rapport"
      title="Ontvang uw gratis PDF-rapport"
      description="Vul uw contactgegevens in om uw persoonlijke rapport direct te openen. De e-mailbezorgstatus wordt apart bevestigd."
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <details
          open={reportDetailsOpen}
          onToggle={(event) => setReportDetailsOpen(event.currentTarget.open)}
          data-testid="stage4-report-details"
          className="order-2 min-w-0 lg:order-1"
        >
          <summary className="cursor-pointer rounded-xl border border-ink/10 bg-mist px-4 py-3 text-sm font-semibold text-trust-dark focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/35 lg:hidden">
            Rapportsamenvatting bekijken
          </summary>
          <div className="mt-4 space-y-4 lg:mt-0">
            <FunnelCard surface="trust" className="overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-trust-dark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Dit staat in uw PDF-rapport
            </div>

            {state.roiResult && (
              <div className="mt-4 rounded-xl border border-trust/20 bg-paper p-4">
                <p className="text-xs text-ink-muted">Berekende besparingsindicatie</p>
                <p className="mt-1 font-heading text-2xl font-bold text-ink">
                  €{state.roiResult.scenarioNu.besparingJaarEur.toLocaleString('nl-NL')}
                  <span className="ml-1 text-sm font-semibold text-ink-muted">per jaar</span>
                </p>
              </div>
            )}

            <ul className="mt-4 space-y-2.5">
              {[
                { label: 'ROI-berekening', value: state.roiResult ? `€${state.roiResult.scenarioNu.besparingJaarEur.toLocaleString('nl-NL')}/jaar` : '—', done: !!state.roiResult },
                { label: 'ISDE panelen/batterij', value: 'Niet van toepassing', done: true },
                { label: 'Netcongestie analyse', value: state.netcongestie?.status ?? '—', done: !!state.netcongestie },
                { label: 'Installateur advies', value: 'Na uw aanvraag', done: true },
                { label: '2027 urgentie tijdlijn', value: 'Inbegrepen', done: true },
              ].map(({ label, value, done }) => (
                <li key={label} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-xs">
                  <span className="flex min-w-0 items-start gap-2 text-ink-muted">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className={done ? 'mt-0.5 shrink-0 text-trust-dark' : 'mt-0.5 shrink-0 text-ink-muted/35'}
                      aria-hidden="true"
                    >
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {label}
                  </span>
                  <span className="max-w-32 text-right font-semibold text-ink">{value}</span>
                </li>
              ))}
            </ul>

            {(state.adres || state.healthScore) && (
              <dl className="mt-4 grid gap-3 border-t border-trust/20 pt-4 sm:grid-cols-2">
                {state.adres && (
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-xs text-ink-muted">Adres</dt>
                    <dd className="truncate text-sm font-semibold text-ink">{state.adres}</dd>
                  </div>
                )}
                {state.healthScore && (
                  <div>
                    <dt className="text-xs text-ink-muted">Score</dt>
                    <dd className="text-sm font-bold text-trust-dark">{state.healthScore.score}/100</dd>
                  </div>
                )}
              </dl>
            )}
            </FunnelCard>

            <FunnelCard className="py-4">
              <FunnelTrustLine items={['Beveiligd', 'Lokale installateurs', 'Vrijblijvend']} />
              <p className="mt-3 text-center text-xs text-ink-muted">
                SSL- en AVG-bewust verwerkt, zonder koopplicht. Uw aanvraag wordt gekoppeld aan gecertificeerde installateurs in {regio}.
              </p>
            </FunnelCard>
          </div>
        </details>

        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <FunnelCard className="order-2 lg:order-1">
            <h3 className="font-heading text-lg font-bold text-ink">Controleer uw situatie</h3>
            <p className="mt-1 text-sm text-ink-muted">Uw eerdere antwoorden staan alvast klaar voor het rapport.</p>

            <div className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-sm font-semibold text-ink">Bent u eigenaar van de woning?</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([true, false] as const).map((val) => (
                    <FunnelChoiceCard
                      key={String(val)}
                      selected={form.isEigenaar === val}
                      onClick={() => {
                        setForm(f => ({ ...f, isEigenaar: val }))
                        dispatch({ type: 'SET_IS_EIGENAAR', is_eigenaar: val })
                      }}
                    >
                      {val ? 'Ja, eigenaar' : 'Nee, huurder'}
                    </FunnelChoiceCard>
                  ))}
                </div>
              </fieldset>

              {panelenAntwoordLocked ? (
                <div className="rounded-xl border border-ink/10 bg-mist p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Zonnepanelen (stap 2)</p>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    {state.heeft_panelen
                      ? <>U gaf aan <strong>wél panelen</strong> te hebben — <strong>{state.huidige_panelen_aantal}</strong> stuks.</>
                      : <>U gaf aan <strong>nog geen panelen</strong> te hebben.</>}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPanelen(true)
                      setForm(f => ({
                        ...f,
                        heeftPanelen: state.heeft_panelen,
                        huidigePanelenAantal: state.huidige_panelen_aantal ? String(state.huidige_panelen_aantal) : '',
                      }))
                    }}
                    className="mt-2 rounded-md text-sm font-semibold text-trust-dark underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/35"
                  >
                    Wijzigen (wordt ook opgeslagen in uw rapport)
                  </button>
                </div>
              ) : (
                <fieldset>
                  <legend className="text-sm font-semibold text-ink">Heeft u al zonnepanelen?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {([false, true] as const).map((val) => (
                      <FunnelChoiceCard
                        key={String(val)}
                        selected={form.heeftPanelen === val}
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            heeftPanelen: val,
                            huidigePanelenAantal: val ? f.huidigePanelenAantal : '',
                          }))
                          dispatch({ type: 'SET_HEEFT_PANELEN', heeft_panelen: val })
                          if (!val) dispatch({ type: 'SET_HUIDIGE_PANELEN_AANTAL', huidige_panelen_aantal: null })
                          setErrors(er => ({ ...er, huidigePanelenAantal: undefined }))
                        }}
                      >
                        {val ? 'Ja, ik heb panelen' : 'Nee, nog geen panelen'}
                      </FunnelChoiceCard>
                    ))}
                  </div>
                  {form.heeftPanelen === true && (
                    <FunnelField
                      className="mt-3"
                      htmlFor="huidige-panelen-aantal"
                      label="Hoeveel panelen liggen er nu?"
                      error={errors.huidigePanelenAantal}
                    >
                      <input
                        id="huidige-panelen-aantal"
                        type="number"
                        min={1}
                        max={200}
                        inputMode="numeric"
                        value={form.huidigePanelenAantal}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '')
                          setForm(f => ({ ...f, huidigePanelenAantal: value }))
                          const parsed = value ? Number(value) : null
                          dispatch({ type: 'SET_HUIDIGE_PANELEN_AANTAL', huidige_panelen_aantal: parsed && parsed > 0 ? parsed : null })
                          setErrors(er => ({ ...er, huidigePanelenAantal: undefined }))
                        }}
                        placeholder="Bijv. 10"
                        aria-invalid={!!errors.huidigePanelenAantal}
                        className={[inputBase, errors.huidigePanelenAantal ? 'border-danger' : 'border-ink/15'].join(' ')}
                      />
                    </FunnelField>
                  )}
                </fieldset>
              )}

              <fieldset>
                <legend className="text-sm font-semibold text-ink">
                  Hoeveel personen wonen hier? <span className="font-normal text-ink-muted">(optioneel)</span>
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([
                    { val: 1 as const, label: '1 persoon' },
                    { val: 2 as const, label: '2 personen' },
                    { val: 3 as const, label: '3+ personen' },
                  ]).map(({ val, label }) => (
                    <FunnelChoiceCard
                      key={val}
                      selected={state.huishouden_grootte === val}
                      onClick={() => dispatch({ type: 'SET_HUISHOUDEN', grootte: state.huishouden_grootte === val ? null : val })}
                      className="px-2"
                    >
                      {label}
                    </FunnelChoiceCard>
                  ))}
                </div>
              </fieldset>
            </div>
          </FunnelCard>

          <FunnelCard surface="mist" className="order-3 p-0 sm:p-0 lg:order-2">
            <button
              type="button"
              onClick={() => setWatGebeurtOpen(o => !o)}
              aria-expanded={watGebeurtOpen}
              aria-controls="lead-next-steps"
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-trust-dark focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/35"
            >
              <span>Wat gebeurt er na uw aanvraag?</span>
              <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true" className={`shrink-0 transition-transform ${watGebeurtOpen ? 'rotate-180' : ''}`}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {watGebeurtOpen && (
              <ol id="lead-next-steps" className="space-y-3 border-t border-ink/10 px-4 py-4">
                {[
                  'Uw aanvraag wordt doorgestuurd naar gecertificeerde installateurs in uw regio',
                  'Een adviseur neemt naar aanleiding van uw aanvraag contact met u op',
                  'U ontvangt een vrijblijvende offerte op maat — geen verplichtingen',
                ].map((tekst, i) => (
                  <li key={tekst} className="flex gap-3 text-sm leading-5 text-ink-muted">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-trust/15 text-xs font-bold text-trust-dark">{i + 1}</span>
                    <span>{tekst}</span>
                  </li>
                ))}
              </ol>
            )}
          </FunnelCard>

          <form onSubmit={handleSubmit} className="order-1 space-y-4 lg:order-3" noValidate>
            <FunnelCard>
              <h3 className="font-heading text-lg font-bold text-ink">Waar mogen we uw rapport klaarzetten?</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted">Alle velden hieronder zijn nodig om uw aanvraag veilig te verwerken.</p>

              <div className="mt-5 space-y-4">
                <FunnelField htmlFor="lead-naam" label="Voor- en achternaam *" error={errors.naam}>
                  <input
                    id="lead-naam"
                    type="text"
                    value={form.naam}
                    autoComplete="name"
                    onChange={(e) => { setForm(f => ({ ...f, naam: e.target.value })); setErrors(er => ({ ...er, naam: undefined })) }}
                    placeholder="Jan de Vries"
                    disabled={loading}
                    aria-invalid={!!errors.naam}
                    className={[inputBase, errors.naam ? 'border-danger' : 'border-ink/15'].join(' ')}
                  />
                </FunnelField>

                <FunnelField htmlFor="lead-email" label="E-mailadres *" error={errors.email}>
                  <input
                    id="lead-email"
                    type="email"
                    value={form.email}
                    autoComplete="email"
                    onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })) }}
                    placeholder="jan@voorbeeld.nl"
                    disabled={loading}
                    aria-invalid={!!errors.email}
                    className={[inputBase, errors.email ? 'border-danger' : 'border-ink/15'].join(' ')}
                  />
                </FunnelField>

                <FunnelField
                  htmlFor="lead-telefoon"
                  label="Telefoonnummer *"
                  hint={form.telefoon && validatePhone(form.telefoon, form.countryCode) ? 'Nummer is geldig' : undefined}
                  error={errors.telefoon}
                >
                  <div className={[
                    'flex min-w-0 overflow-hidden rounded-xl border bg-paper transition-shadow focus-within:ring-3 focus-within:ring-trust/35',
                    errors.telefoon ? 'border-danger' : 'border-ink/15',
                  ].join(' ')}>
                    <select
                      value={form.countryCode}
                      onChange={(e) => { setForm(f => ({ ...f, countryCode: e.target.value as CountryCode, telefoon: '' })); setErrors(er => ({ ...er, telefoon: undefined })) }}
                      disabled={loading}
                      className="shrink-0 border-r border-ink/10 bg-mist px-3 py-3 text-base text-ink focus-visible:outline-none sm:text-sm"
                      aria-label="Landcode"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                      ))}
                    </select>
                    <input
                      id="lead-telefoon"
                      type="tel"
                      value={form.telefoon}
                      autoComplete="tel"
                      onChange={(e) => { setForm(f => ({ ...f, telefoon: e.target.value })); setErrors(er => ({ ...er, telefoon: undefined })) }}
                      placeholder={form.countryCode === '+31' ? '06 12345678' : form.countryCode === '+32' ? '0478 123456' : '015 12345678'}
                      disabled={loading}
                      aria-invalid={!!errors.telefoon}
                      className="min-w-0 flex-1 bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-muted/60 focus-visible:outline-none sm:text-sm"
                    />
                  </div>
                  {!errors.telefoon && form.telefoon && validatePhone(form.telefoon, form.countryCode) && (
                    <p className="text-xs text-trust-dark">Geldig nummer — wordt opgeslagen als {normalizePhone(form.telefoon, form.countryCode)}</p>
                  )}
                </FunnelField>

                <FunnelNotice title="Waarom vragen we dit?">
                  Uw e-mailadres is nodig voor de rapportlink. Met uw telefoonnummer kan een gecertificeerde energie-expert uw aanvraag en advies valideren.
                </FunnelNotice>

                <div className="space-y-2 rounded-xl border border-trust/25 bg-trust/8 p-4">
                  <label className="group flex cursor-pointer items-start gap-3" htmlFor="lead-gdpr">
                    <span className="relative mt-0.5 shrink-0">
                      <input
                        id="lead-gdpr"
                        type="checkbox"
                        checked={form.gdprConsent}
                        onChange={(e) => { setForm(f => ({ ...f, gdprConsent: e.target.checked })); setErrors(er => ({ ...er, gdprConsent: undefined })) }}
                        className="peer sr-only"
                        disabled={loading}
                      />
                      <span className={[
                        'flex size-5 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-trust/40',
                        form.gdprConsent
                          ? 'border-trust bg-trust'
                          : errors.gdprConsent
                            ? 'border-danger bg-paper'
                            : 'border-ink/25 bg-paper group-hover:border-trust',
                      ].join(' ')}>
                        {form.gdprConsent && (
                          <svg className="size-full text-evergreen-950" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M3 8l3 3 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="text-xs leading-relaxed text-ink-muted">
                      Ja, stuur mij het gratis PDF-rapport. Ik geef toestemming om mijn scandata te laten valideren door een gecertificeerde energie-expert van SaldeerScan.nl in mijn regio.{' '}
                      <a href="/privacy" className="font-semibold text-trust-dark underline underline-offset-2 hover:text-evergreen-900" target="_blank" rel="noopener noreferrer">Privacyverklaring →</a>
                    </span>
                  </label>
                  {errors.gdprConsent && <p className="pl-8 text-xs text-danger" role="alert">{errors.gdprConsent}</p>}
                </div>
              </div>
            </FunnelCard>

            {(errors.submit || submitError) && (
              <FunnelNotice variant="danger">
                {errors.submit ?? submitError}
              </FunnelNotice>
            )}

            <FunnelActions
              sticky
              secondary={(
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', step: 5 })}
                  disabled={loading}
                  className={funnelSecondaryButtonClass}
                >
                  ← Terug
                </button>
              )}
              primary={(
                <button type="submit" disabled={loading} className={`w-full ${funnelPrimaryButtonClass}`}>
                  {loading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-evergreen-950 border-t-transparent" aria-hidden="true" />
                      Indienen...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      Stuur mij het gratis PDF-rapport
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              )}
            />

            <p data-testid="stage4-cta-trustcopy" className="text-center text-xs font-semibold leading-5 text-trust-dark">
              Rapport opent direct · e-mailkopie · gratis en vrijblijvend
            </p>
            <FunnelTrustLine items={['Vrijblijvend advies', 'Geen verplichtingen', 'Gratis']} />
            <p className="text-center text-xs leading-5 text-ink-muted">
              Uw data wordt beveiligd verwerkt en gevalideerd door een gecertificeerde expert in {regio} voor een definitieve 2027-check.
            </p>
          </form>
        </div>
      </div>
    </FunnelStageShell>
  )
}
