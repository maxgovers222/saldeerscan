import { visualStageForStep } from './funnel-state'

interface FunnelProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
}

const STAGES = [
  {
    label: 'Uw woning',
    description: 'Adres en woninggegevens',
  },
  {
    label: 'Uw situatie',
    description: 'Verbruik en besparing',
  },
  {
    label: 'Verfijn uw advies',
    description: 'Optionele technische checks',
  },
  {
    label: 'Ontvang uw rapport',
    description: 'Persoonlijk resultaat',
  },
] as const

export function FunnelProgress({ currentStep }: FunnelProgressProps) {
  const currentStage = visualStageForStep(currentStep)
  const active = STAGES[currentStage - 1]

  return (
    <div
      className="w-full"
      data-testid="funnel-stage-progress"
      role="progressbar"
      aria-valuenow={currentStage}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label={`Stadium ${currentStage} van 4: ${active.label}`}
    >
      <div className="mb-4 flex items-end justify-between gap-4 sm:hidden">
        <div>
          <p className="text-xs font-semibold text-trust">Stadium {currentStage} van 4</p>
          <p className="mt-1 font-heading text-lg font-bold text-white">{active.label}</p>
          <p className="mt-0.5 text-sm text-white/65">{active.description}</p>
        </div>
        <span className="shrink-0 font-mono text-sm font-bold text-trust">
          {Math.round((currentStage / 4) * 100)}%
        </span>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2" aria-hidden="true">
        {STAGES.map((stage, index) => {
          const stageNumber = index + 1
          const completed = stageNumber < currentStage
          const activeStage = stageNumber === currentStage

          return (
            <div key={stage.label} className="min-w-0">
              <div
                className={[
                  'h-1.5 rounded-full transition-colors duration-300',
                  completed || activeStage ? 'bg-trust' : 'bg-white/15',
                ].join(' ')}
              />
              <div className="mt-3 hidden sm:block">
                <p className={[
                  'text-xs font-semibold transition-colors',
                  activeStage ? 'text-trust' : completed ? 'text-white/80' : 'text-white/65',
                ].join(' ')}>
                  {stageNumber}. {stage.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/65">{stage.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
