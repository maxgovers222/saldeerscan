import { ImageResponse } from 'next/og'
import { BrandImageLockup } from '@/components/design-system/BrandImageLockup'
import { BRAND_COLORS } from '@/lib/brand-colors'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(135deg, ${BRAND_COLORS.evergreen950} 0%, ${BRAND_COLORS.evergreen900} 72%, ${BRAND_COLORS.trustDark} 160%)`,
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
          <BrandImageLockup />
          <div style={{
            background: `${BRAND_COLORS.action}20`,
            border: `1px solid ${BRAND_COLORS.action}66`,
            borderRadius: 100, padding: '8px 20px',
            color: BRAND_COLORS.actionHover, fontSize: 16, fontWeight: 600,
          }}>
            Saldering stopt 1 jan 2027
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: BRAND_COLORS.trust, fontSize: 18, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Gratis energieanalyse
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', color: BRAND_COLORS.onEvergreen, fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px' }}>
            <span>Wat kost het einde</span>
            <span>van salderen u?</span>
          </div>
          <div style={{ color: BRAND_COLORS.onEvergreenMuted, fontSize: 24, lineHeight: 1.4, maxWidth: 700 }}>
            BAG-data, AI-analyse en een persoonlijk energieplan voor uw woning. In 2 minuten.
          </div>
        </div>

        {/* Bottom: CTA + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{
            background: BRAND_COLORS.action, color: BRAND_COLORS.evergreen950,
            borderRadius: 12, padding: '16px 32px',
            fontSize: 20, fontWeight: 700,
          }}>
            Start gratis saldeercheck
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Gratis', 'AVG-compliant', 'BAG-data'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: BRAND_COLORS.onEvergreenMuted, fontSize: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND_COLORS.trust }} />
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
