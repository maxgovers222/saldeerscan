'use client'

import { type Dispatch } from 'react'
import type { FunnelState, FunnelAction, MeterkastAnalyse } from './types'
import { PhotoUpload } from './PhotoUpload'
import { StepHeader } from './StepHeader'

interface Step3MeterkastProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
}

function MeterkastResultaat({ analyse }: { analyse: MeterkastAnalyse }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest">Analyse compleet</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Merk', value: analyse.merk ?? 'Onbekend', color: 'text-amber-600' },
          { label: '3-fase', value: analyse.drieFase ? 'Ja ✓' : 'Nee ✗', color: analyse.drieFase ? 'text-emerald-600' : 'text-red-600' },
          { label: 'Vrije groepen', value: String(analyse.vrijeGroepen), color: 'text-amber-600' },
          { label: 'Max vermogen', value: analyse.maxVermogenKw !== null ? `${analyse.maxVermogenKw} kW` : '—', color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-md p-3">
            <div className="text-[10px] font-mono text-slate-400 mb-1">{item.label}</div>
            <div className={`font-mono font-semibold text-sm ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${analyse.geschikt ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
        <span className="text-2xl">{analyse.geschikt ? '✓' : '✗'}</span>
        <div>
          <div className={`font-mono font-bold text-sm ${analyse.geschikt ? 'text-emerald-600' : 'text-red-600'}`}>
            {analyse.geschikt ? 'Geschikt voor installatie' : 'Niet direct geschikt'}
          </div>
          {!analyse.geschikt && <div className="text-xs text-slate-500 font-mono mt-0.5">Installateur advies nodig</div>}
        </div>
      </div>
      {analyse.opmerkingen.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Opmerkingen</div>
          <ul className="space-y-1">
            {analyse.opmerkingen.map((o, i) => (
              <li key={i} className="text-xs font-mono text-slate-500 flex items-start gap-1.5">
                <span className="text-amber-600 shrink-0 mt-0.5">›</span>{o}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Step3Meterkast({ state, dispatch }: Step3MeterkastProps) {
  const analyse = state.meterkastAnalyse
  return (
    <div className="p-6 space-y-6">
      <StepHeader stap="// STAP 03 — METERKAST SCAN" title="Meterkast analyse" subtitle="AI-scan bepaalt geschiktheid voor zonnepanelen & batterij" />
      {!analyse && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <span className="text-amber-500 text-base shrink-0 mt-0.5">💡</span>
          <div className="text-xs font-mono text-amber-800 leading-relaxed">
            <span className="font-bold">Tip:</span> Open de kast volledig, sta ~1 meter ervoor en zorg voor verlichting. Alle groepen moeten zichtbaar zijn.
          </div>
        </div>
      )}
      {!analyse ? (
        <PhotoUpload visionType="meterkast" onAnalysed={(r) => dispatch({ type: 'SET_METERKAST', meterkastAnalyse: r as MeterkastAnalyse })}
          title="Foto van uw meterkast" description="Maak een foto van de open meterkastkast, inclusief alle groepen zichtbaar" icon="⚡" />
      ) : (
        <div className="space-y-3">
          <MeterkastResultaat analyse={analyse} />
          <button onClick={() => dispatch({ type: 'SET_METERKAST', meterkastAnalyse: null as unknown as MeterkastAnalyse })}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs py-2 px-4 rounded-lg transition-colors">
            Andere foto uploaden
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 2 })}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-sm py-3 px-4 rounded-full transition-colors">← Terug</button>
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 4 })}
          className="flex-[2] bg-[#00aa65] hover:opacity-90 text-white font-bold py-3 px-6 rounded-full transition-colors font-mono text-sm">
          {analyse ? 'Plaatsing scannen →' : 'Overslaan →'}
        </button>
      </div>
    </div>
  )
}
