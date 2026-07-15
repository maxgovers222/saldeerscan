'use client'

import { useState, useRef, useCallback, useId } from 'react'
import type { MeterkastAnalyse, PlaatsingsAnalyse, OmvormerAnalyse } from './types'
import type { FunnelTracker } from '@/lib/analytics'
import { prepareVisionImage } from './prepare-vision-image'
import { funnelSecondaryButtonClass } from './ui/FunnelActions'
import { FunnelNotice } from './ui/FunnelNotice'

type VisionType = 'meterkast' | 'plaatsingslocatie' | 'omvormer'
type VisionResult = MeterkastAnalyse | PlaatsingsAnalyse | OmvormerAnalyse

interface PhotoUploadProps {
  visionType: VisionType
  onAnalysed: (result: VisionResult) => void
  title: string
  description: string
  trackFunnel: FunnelTracker
}

function ScanAnimation({ imageUrl, optimizing }: { imageUrl: string; optimizing?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-trust/30 bg-evergreen-950" role="status" aria-live="polite">
      <img src={imageUrl} alt="Preview" className="w-full max-h-48 object-cover opacity-80" />
      <div className="absolute inset-0 pointer-events-none">
        {!optimizing && (
          <div className="absolute left-0 right-0 h-0.5 bg-trust shadow-[0_0_8px_2px_rgba(0,184,117,0.5)]"
            style={{ animation: 'scan-line 1.5s linear infinite' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-trust/10 via-transparent to-trust/10" />
      </div>
      <div className="absolute bottom-2 left-2 right-2">
        <div className="flex items-center gap-1.5 rounded bg-evergreen-950/90 px-2 py-1">
          <div className="size-2 animate-pulse rounded-full bg-trust" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-trust">
            {optimizing ? 'Foto optimaliseren...' : 'Analyseren...'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function PhotoUpload({ visionType, onAnalysed, title, description, trackFunnel }: PhotoUploadProps) {
  const inputId = useId()
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [screeningError, setScreeningError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Alleen afbeeldingen zijn toegestaan (JPEG, PNG, WebP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Afbeelding is te groot (max 10 MB)')
      return
    }
    setError(null)
    setScreeningError(null)
    setOptimizing(true)
    setLoading(true)

    try {
      const dataUrl = await prepareVisionImage(file)
      setImageUrl(dataUrl)
      setOptimizing(false)

      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: visionType, imageBase64: dataUrl }),
      })
      if (res.status === 422) {
        const errData = await res.json() as { tip?: string; detail?: string }
        setScreeningError(errData.tip ?? errData.detail ?? `Upload een duidelijke foto van een ${visionType}`)
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(errData.error ?? 'De foto kon niet worden geanalyseerd. Probeer een andere foto.')
      }
      const data = await res.json() as { analyse: VisionResult }
      const scanType = {
        meterkast: 'Meterkast',
        plaatsingslocatie: 'Plaatsingslocatie',
        omvormer: 'Omvormer',
      } as const
      trackFunnel('technical_scan_completed', {
        scan_type: scanType[visionType],
        completion: 'photo',
      })
      onAnalysed(data.analyse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'De foto kon niet worden geanalyseerd. Probeer het opnieuw.')
    } finally {
      setLoading(false)
      setOptimizing(false)
    }
  }, [visionType, onAnalysed, trackFunnel])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleReset = () => {
    setImageUrl(null)
    setError(null)
    setScreeningError(null)
    setLoading(false)
    setOptimizing(false)
  }

  if (loading && imageUrl) return <ScanAnimation imageUrl={imageUrl} optimizing={optimizing} />
  if (loading && !imageUrl) {
    return (
      <div className="rounded-xl border border-trust/25 bg-trust/10 p-8 text-center" role="status" aria-live="polite">
        <span className="text-sm font-semibold text-trust-dark">Foto wordt voorbereid...</span>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          aria-describedby={`${inputId}-description ${inputId}-requirements`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={[
            'relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/40',
            isDragOver
              ? 'scale-[1.01] border-trust bg-trust/10'
              : 'border-ink/15 bg-mist hover:border-trust/50 hover:bg-trust/5',
          ].join(' ')}
        >
          <span className="grid size-12 place-items-center rounded-full bg-trust/10" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-trust-dark">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="text-center">
            <span className="block text-sm font-semibold text-ink">{title}</span>
            <span id={`${inputId}-description`} className="mt-1 block max-w-lg text-xs leading-5 text-ink-muted">{description}</span>
          </span>
          <span id={`${inputId}-requirements`} className="text-xs font-medium text-trust-dark">JPEG · PNG · WebP — max. 10 MB</span>
        </button>

        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          aria-label={`Selecteer foto: ${title}`}
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }}
          className="hidden"
        />

        {error && (
          <FunnelNotice variant="danger" role="alert" title="Uploaden lukt nog niet">
            {error}
          </FunnelNotice>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-mist">
        <img src={imageUrl} alt="Geüploade foto" className="w-full max-h-48 object-cover" />
        <button type="button" onClick={handleReset}
          className="absolute right-2 top-2 rounded-lg border border-white/20 bg-evergreen-950/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-evergreen-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-trust/45">
          Andere foto
        </button>
      </div>

      {screeningError && (
        <FunnelNotice variant="warning" role="alert" title="We kunnen deze foto nog niet goed beoordelen" className="space-y-3">
          <p>{screeningError}</p>
          <button type="button" onClick={handleReset} className={`w-full ${funnelSecondaryButtonClass}`}>
            Kies een andere foto
          </button>
        </FunnelNotice>
      )}

      {error && (
        <FunnelNotice variant="danger" role="alert" title="Analyseren lukt nog niet" className="space-y-3">
          <p>{error}</p>
          <button type="button" onClick={handleReset} className={`w-full ${funnelSecondaryButtonClass}`}>
            Probeer een andere foto
          </button>
        </FunnelNotice>
      )}
    </div>
  )
}
