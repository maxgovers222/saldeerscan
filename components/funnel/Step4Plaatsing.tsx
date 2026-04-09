'use client'

import { type Dispatch } from 'react'
import type { FunnelState, FunnelAction, PlaatsingsAnalyse } from './types'
import { PhotoUpload } from './PhotoUpload'
import { StepHeader } from './StepHeader'

interface Step4PlaatsingProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
}

function PlaatsingResultaat({ analyse }: { analyse: PlaatsingsAnalyse }) {
  const scoreColor = analyse.geschiktheidScore >= 8 ? 'text-emerald-600' : analyse.geschiktheidScore >= 5 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest">Analyse compleet</span>
      </div>
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 ${analyse.nenCompliant ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <span className={`font-mono font-bold text-sm ${analyse.nenCompliant ? 'text-emerald-600' : 'text-red-600'}`}>
            {analyse.nenCompliant ? 'NEN Compliant ✓' : 'NEN Non-compliant ✗'}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center min-w-20">
          <div className="text-[10px] font-mono text-slate-400 mb-1">Score</div>
          <div className={`font-mono font-bold text-xl ${scoreColor}`}>{analyse.geschiktheidScore}/10</div>
        </div>
      </div>
      {analyse.risicoItems.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-red-600 uppercase tracking-widest mb-2">Risico items</div>
          <ul className="space-y-1">
            {analyse.risicoItems.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs font-mono text-red-600">
                <span className="text-red-500 shrink-0 mt-0.5">!</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analyse.aanbevelingen.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-amber-600 uppercase tracking-widest mb-2">Aanbevelingen</div>
          <ul className="space-y-1">
            {analyse.aanbevelingen.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs font-mono text-slate-500">
                <span className="text-amber-600 shrink-0 mt-0.5">›</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Step4Plaatsing({ state, dispatch }: Step4PlaatsingProps) {
  const analyse = state.plaatsingsAnalyse
  return (
    <div className="p-6 space-y-6">
      <StepHeader stap="// STAP 04 — PLAATSINGSLOCATIE" title="Locatie beoordeling" subtitle="NEN 2078:2023 brandveiligheidscheck voor batterijplaatsing" />
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">NEN 2078:2023 vereisten</div>
        <ul className="space-y-1">
          {['Min. 50 cm afstand tot brandbare materialen', 'Adequate ventilatie aanwezig', 'Geen waterleiding of gas in nabijheid', 'Stabiele temperatuur (geen directe zon)'].map((req, i) => (
            <li key={i} className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
              <span className="text-slate-300">○</span> {req}
            </li>
          ))}
        </ul>
      </div>
      {!analyse && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <span className="text-amber-500 text-base shrink-0 mt-0.5">💡</span>
          <div className="text-xs font-mono text-amber-800 leading-relaxed">
            <span className="font-bold">Tip:</span> Maak een overzichtsfoto van de ruimte (garage, bijkeuken). Zorg dat ventilatie en nabijgelegen leidingen zichtbaar zijn.
          </div>
        </div>
      )}
      {!analyse ? (
        <PhotoUpload visionType="plaatsingslocatie" onAnalysed={(r) => dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: r as PlaatsingsAnalyse })}
          title="Foto van plaatsingslocatie" description="Foto van de ruimte waar de batterij of omvormer geplaatst wordt (garage, meterkast, bijkeuken)" icon="🔍" />
      ) : (
        <div className="space-y-3">
          <PlaatsingResultaat analyse={analyse} />
          <button onClick={() => dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: null as unknown as PlaatsingsAnalyse })}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs py-2 px-4 rounded-lg transition-colors">
            Andere foto uploaden
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 3 })}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-sm py-3 px-4 rounded-full transition-colors">← Terug</button>
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 5 })}
          className="flex-[2] bg-[#00aa65] hover:opacity-90 text-white font-bold py-3 px-6 rounded-full transition-colors font-mono text-sm">
          {analyse ? 'Omvormer scannen →' : 'Overslaan →'}
        </button>
      </div>
    </div>
  )
}
