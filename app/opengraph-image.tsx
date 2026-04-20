import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020617',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Amber glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.08)',
          filter: 'blur(80px)',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#00aa65',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            SaldeerScan<span style={{ color: '#00aa65' }}>.nl</span>
          </span>
        </div>

        {/* Heading */}
        <div style={{
          color: 'white',
          fontSize: 62,
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.05,
          marginBottom: 24,
          letterSpacing: '-1.5px',
        }}>
          Gratis 2027 Saldeercheck
        </div>

        {/* Subtitle */}
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 26,
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: 800,
        }}>
          Wat kost u de salderingsafschaffing? Ontdek het in 3 minuten.
        </div>

        {/* Deadline badge */}
        <div style={{
          marginTop: 40,
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 100,
          padding: '10px 28px',
          color: '#fca5a5',
          fontSize: 18,
          fontWeight: 600,
        }}>
          Deadline: 1 januari 2027
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: 36,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 16,
          display: 'flex',
          gap: 24,
        }}>
          <span>Gratis</span>
          <span>·</span>
          <span>AVG-compliant</span>
          <span>·</span>
          <span>BAG-data</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
