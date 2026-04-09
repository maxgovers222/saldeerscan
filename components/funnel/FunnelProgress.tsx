'use client'

interface FunnelProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
}

const STEPS = [
  { label: 'Adres', num: 1 },
  { label: 'Besparing', num: 2 },
  { label: 'Meterkast', num: 3 },
  { label: 'Plaatsing', num: 4 },
  { label: 'Omvormer', num: 5 },
  { label: 'Aanvraag', num: 6 },
] as const

const GREEN = '#00aa65'
const GREEN_DARK = '#0e352e'

export function FunnelProgress({ currentStep }: FunnelProgressProps) {
  return (
    <div className="w-full">
      <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: '#d1fae5' }}>
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${((currentStep - 1) / 5) * 100}%`, background: `linear-gradient(90deg, ${GREEN_DARK}, ${GREEN})` }}
        />
      </div>

      <div className="flex justify-between">
        {STEPS.map(({ label, num }) => {
          const isCompleted = num < currentStep
          const isActive = num === currentStep

          return (
            <div key={num} className="flex flex-col items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  isCompleted ? { background: GREEN, color: 'white', boxShadow: `0 0 0 2px white, 0 0 0 3px ${GREEN}40` }
                  : isActive ? { background: GREEN_DARK, color: 'white', boxShadow: `0 0 0 2px white, 0 0 0 3px ${GREEN_DARK}30` }
                  : { background: 'white', color: '#94a3b8', border: '1px solid #e2e8f0' }
                }
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : <span>{num}</span>}
              </div>
              <span className="text-[10px] font-mono hidden sm:block transition-colors duration-300"
                style={{ color: isActive ? GREEN_DARK : isCompleted ? GREEN : '#94a3b8', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 text-center sm:hidden">
        <span className="text-xs font-mono" style={{ color: GREEN_DARK }}>
          Stap {currentStep}/6 — {STEPS[currentStep - 1].label}
        </span>
      </div>
    </div>
  )
}
