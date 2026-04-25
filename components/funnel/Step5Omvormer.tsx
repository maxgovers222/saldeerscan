'use client'

import { useState, type Dispatch } from 'react'
import type { FunnelState, FunnelAction, OmvormerAnalyse } from './types'
import { PhotoUpload } from './PhotoUpload'
import { StepHeader } from './StepHeader'

function FallbackOmvormer({ onComplete }: { onComplete: (data: OmvormerAnalyse) => void }) {
  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 space-y-4">
      <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Heeft u al zonnepanelen/omvormer?</div>
      <div className="flex gap-2">
        {([
          { label: 'Ja, ik heb al panelen', heeft: true },
          { label: 'Nee, nog niet', heeft: false },
        ]).map(({ label, heeft }) => (
          <button key={label} type="button"
            onClick={() => onComplete({
              merk: null,
              model: null,
              vermogenKw: null,
              hybrideKlaar: false,
              vervangenNodig: heeft,
              opmerkingen: heeft
                ? ['Handmatig ingevuld — installateur inspecteert omvormer']
                : ['Geen omvormer aanwezig — nieuwe installatie'],
            })}
            className="flex-1 py-3 rounded-xl text-xs font-mono border bg-slate-800/50 text-white/60 border-white/10 hover:border-amber-500/40 hover:text-amber-400 transition-colors">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface Step5OmvormerProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
}

const amberBtnCls = 'bg-amber-500 text-slate-950 font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:opacity-90 active:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100'

function OmvormerResultaat({ analyse }: { analyse: OmvormerAnalyse }) {
  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Analyse compleet</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-white/10 rounded-md p-3">
          <div className="text-[10px] font-mono text-white/40 mb-1">Merk</div>
          <div className="font-mono font-semibold text-sm truncate text-amber-400">{analyse.merk ?? 'Onbekend'}</div>
        </div>
        <div className="bg-slate-900/60 border border-white/10 rounded-md p-3">
          <div className="text-[10px] font-mono text-white/40 mb-1">Model</div>
          <div className="font-mono font-semibold text-sm truncate text-amber-400">{analyse.model ?? '—'}</div>
        </div>
        <div className="bg-slate-900/60 border border-white/10 rounded-md p-3">
          <div className="text-[10px] font-mono text-white/40 mb-1">Vermogen</div>
          <div className="font-mono font-semibold text-sm truncate text-amber-400">{analyse.vermogenKw !== null ? `${analyse.vermogenKw} kW` : '—'}</div>
        </div>
        <div className="bg-slate-900/60 border border-white/10 rounded-md p-3">
          <div className="text-[10px] font-mono text-white/40 mb-1">Hybride klaar</div>
          <div className={`font-mono font-semibold text-sm flex items-center gap-1 ${analyse.hybrideKlaar ? 'text-emerald-400' : 'text-red-400'}`}>
            {analyse.hybrideKlaar ? (
              <><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Ja</>
            ) : (
              <>Nee</>
            )}
          </div>
        </div>
      </div>

      {analyse.vervangenNodig && (
        <div className="bg-red-950/40 border border-red-700/50 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-red-400 text-lg shrink-0">!</span>
          <div>
            <div className="font-mono font-bold text-red-400 text-sm">Vervanging aanbevolen</div>
            <div className="text-xs text-white/40 font-mono mt-0.5">Omvormer is verouderd of niet compatibel met hybride systemen</div>
          </div>
        </div>
      )}

      {!analyse.hybrideKlaar && !analyse.vervangenNodig && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg px-4 py-3">
          <div className="text-xs font-mono text-amber-300">
            <span className="text-amber-400 font-bold">Let op:</span> Niet hybride — extra omvormer of vervanging nodig voor batterij
          </div>
        </div>
      )}

      {analyse.opmerkingen.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Opmerkingen</div>
          <ul className="space-y-1">
            {analyse.opmerkingen.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs font-mono text-white/50">
                <span className="text-amber-400 shrink-0 mt-0.5">›</span>{o}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Step5Omvormer({ state, dispatch }: Step5OmvormerProps) {
  const analyse = state.omvormerAnalyse
  const [showFallback, setShowFallback] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <StepHeader stap="Stap 5 — Omvormer scan" title="Omvormer compatibiliteit" subtitle="AI-identificatie van merk, model en hybride geschiktheid" />

      {!analyse && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-amber-400 shrink-0 mt-0.5">
            <circle cx="8" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M6.5 11h3M7 12.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <div className="text-xs text-amber-300 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
            <span className="font-bold">Tip:</span> Foto van het label of display op de omvormer. Merk en model moeten leesbaar zijn — gebruik indien nodig de zaklamp van uw telefoon.
          </div>
        </div>
      )}
      {!analyse && !showFallback && (
        <PhotoUpload
          visionType="omvormer"
          onAnalysed={(r) => dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: r as OmvormerAnalyse })}
          title="Foto van uw omvormer"
          description="Maak een foto van het label/sticker op de omvormer. Zorg dat merk en model leesbaar zijn."
        />
      )}
      {!analyse && !showFallback && (
        <button
          type="button"
          onClick={() => setShowFallback(true)}
          className="w-full py-2.5 text-xs font-mono border border-amber-500/30 text-amber-400/70 rounded-xl hover:border-amber-500/60 hover:text-amber-400 transition-colors"
        >
          Geen foto? Vul handmatig in
        </button>
      )}
      {!analyse && showFallback && (
        <FallbackOmvormer
          onComplete={(data) => {
            dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: data })
            dispatch({ type: 'SET_STEP', step: 6 })
          }}
        />
      )}
      {analyse && (
        <div className="space-y-3">
          <OmvormerResultaat analyse={analyse} />
          <button
            onClick={() => { dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: null }); setShowFallback(false) }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs py-2 px-4 rounded-lg transition-colors"
          >
            Andere foto uploaden
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 4 })}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm py-3 px-4 rounded-full transition-colors">
          ← Terug
        </button>
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 6 })}
          className={`flex-[2] text-sm py-3 px-6 ${amberBtnCls}`}>
          {analyse ? 'Aanvraag versturen →' : 'Overslaan →'}
        </button>
      </div>
    </div>
  )
}
