'use client'

import { type Dispatch } from 'react'
import type { FunnelState, FunnelAction, OmvormerAnalyse } from './types'
import { PhotoUpload } from './PhotoUpload'
import { StepHeader } from './StepHeader'

interface Step5OmvormerProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
}

function OmvormerResultaat({ analyse }: { analyse: OmvormerAnalyse }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest">Analyse compleet</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Merk', value: analyse.merk ?? 'Onbekend' },
          { label: 'Model', value: analyse.model ?? '—' },
          { label: 'Vermogen', value: analyse.vermogenKw !== null ? `${analyse.vermogenKw} kW` : '—' },
          { label: 'Hybride klaar', value: analyse.hybrideKlaar ? 'Ja ✓' : 'Nee', color: analyse.hybrideKlaar ? 'text-emerald-600' : 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-md p-3">
            <div className="text-[10px] font-mono text-slate-400 mb-1">{item.label}</div>
            <div className={`font-mono font-semibold text-sm truncate ${'color' in item ? item.color : 'text-amber-600'}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {analyse.vervangenNodig && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">!</span>
          <div>
            <div className="font-mono font-bold text-red-600 text-sm">Vervanging aanbevolen</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">Omvormer is verouderd of niet compatibel met hybride systemen</div>
          </div>
        </div>
      )}

      {!analyse.hybrideKlaar && !analyse.vervangenNodig && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <div className="text-xs font-mono text-amber-700">
            <span className="text-amber-600 font-bold">Let op:</span> Niet hybride — extra omvormer of vervanging nodig voor batterij
          </div>
        </div>
      )}

      {analyse.opmerkingen.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Opmerkingen</div>
          <ul className="space-y-1">
            {analyse.opmerkingen.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs font-mono text-slate-500">
                <span className="text-amber-600 shrink-0 mt-0.5">›</span>{o}
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

  return (
    <div className="p-6 space-y-6">
      <StepHeader stap="// STAP 05 — OMVORMER SCAN" title="Omvormer compatibiliteit" subtitle="AI-identificatie van merk, model en hybride geschiktheid" />

      {!analyse && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <span className="text-amber-500 text-base shrink-0 mt-0.5">💡</span>
          <div className="text-xs font-mono text-amber-800 leading-relaxed">
            <span className="font-bold">Tip:</span> Foto van het label of display op de omvormer. Merk en model moeten leesbaar zijn — gebruik indien nodig de zaklamp van uw telefoon.
          </div>
        </div>
      )}
      {!analyse ? (
        <PhotoUpload
          visionType="omvormer"
          onAnalysed={(r) => dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: r as OmvormerAnalyse })}
          title="Foto van uw omvormer"
          description="Maak een foto van het label/sticker op de omvormer. Zorg dat merk en model leesbaar zijn."
          icon="🔌"
        />
      ) : (
        <div className="space-y-3">
          <OmvormerResultaat analyse={analyse} />
          <button
            onClick={() => dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: null as unknown as OmvormerAnalyse })}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs py-2 px-4 rounded-lg transition-colors"
          >
            Andere foto uploaden
          </button>
        </div>
      )}

      {!analyse && (
        <div className="text-xs font-mono text-slate-400 text-center">
          Nog geen zonnepanelen? U kunt deze stap overslaan.
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 4 })}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-sm py-3 px-4 rounded-full transition-colors">
          ← Terug
        </button>
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 6 })}
          className="flex-[2] bg-[#00aa65] hover:opacity-90 text-white font-bold py-3 px-6 rounded-full transition-colors font-mono text-sm">
          {analyse ? 'Aanvraag versturen →' : 'Overslaan →'}
        </button>
      </div>
    </div>
  )
}
