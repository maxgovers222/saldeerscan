interface StepHeaderProps {
  stap: string
  title: string
  subtitle: string
}

export function StepHeader({ stap, title, subtitle }: StepHeaderProps) {
  return (
    <div className="-mx-6 -mt-6 mb-6 px-6 pt-6 pb-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' }}>
      {/* Radial glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-30"
        style={{ background: '#f59e0b' }} />
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      <div className="relative">
        <p className="text-[10px] font-mono tracking-widest uppercase mb-1.5" style={{ color: '#f59e0b' }}>{stap}</p>
        <h2 className="text-xl font-extrabold text-white leading-tight" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{title}</h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{subtitle}</p>
      </div>
    </div>
  )
}
