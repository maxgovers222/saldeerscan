import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1c1208 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          position: 'relative',
        }}
      >
        {/* Top: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
              SaldeerScan<span style={{ color: '#f59e0b' }}>.nl</span>
            </span>
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 100, padding: '8px 20px',
            color: '#fbbf24', fontSize: 16, fontWeight: 600,
          }}>
            Saldering stopt 1 jan 2027
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Gratis energieanalyse
          </div>
          <div style={{ color: 'white', fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px' }}>
            Wat kost het einde
            <br />van salderen u?
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24, lineHeight: 1.4, maxWidth: 700 }}>
            BAG-data, AI-analyse en een persoonlijk energieplan voor uw woning. In 2 minuten.
          </div>
        </div>

        {/* Bottom: CTA + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{
            background: '#f59e0b', color: '#0c0a00',
            borderRadius: 12, padding: '16px 32px',
            fontSize: 20, fontWeight: 700,
          }}>
            Start gratis saldeercheck
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Gratis', 'AVG-compliant', 'BAG-data'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
