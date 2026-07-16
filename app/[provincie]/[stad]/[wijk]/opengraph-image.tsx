import { ImageResponse } from 'next/og'
import { BrandImageLockup } from '@/components/design-system/BrandImageLockup'
import { BRAND_COLORS } from '@/lib/brand-colors'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function toDisplay(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default async function OGImage({ params }: { params: Promise<{ provincie: string; stad: string; wijk: string }> }) {
  const { wijk, stad } = await params
  const wijkDisplay = toDisplay(wijk)
  const stadDisplay = toDisplay(stad)

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
        }}
      >
        {/* Top: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandImageLockup />
          <div style={{
            background: `${BRAND_COLORS.action}20`,
            border: `1px solid ${BRAND_COLORS.action}66`,
            borderRadius: 100, padding: '8px 20px',
            color: BRAND_COLORS.actionHover, fontSize: 16, fontWeight: 600, fontFamily: 'sans-serif',
          }}>
            Saldering stopt 1 jan 2027
          </div>
        </div>

        {/* Middle: wijk naam */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: BRAND_COLORS.trust, fontSize: 16, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Wijk energie-analyse 2027
          </div>
          <div style={{ color: BRAND_COLORS.onEvergreen, fontSize: 76, fontWeight: 800, lineHeight: 1, letterSpacing: '-2px', fontFamily: 'sans-serif' }}>
            {wijkDisplay}
          </div>
          <div style={{ color: BRAND_COLORS.onEvergreenMuted, fontSize: 32, fontWeight: 500, fontFamily: 'sans-serif' }}>
            {stadDisplay}
          </div>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            background: BRAND_COLORS.action, color: BRAND_COLORS.evergreen950,
            borderRadius: 12, padding: '16px 32px',
            fontSize: 20, fontWeight: 700, fontFamily: 'sans-serif',
          }}>
            Gratis saldeercheck starten
          </div>
          <div style={{ color: BRAND_COLORS.onEvergreenMuted, fontSize: 16, fontFamily: 'sans-serif' }}>
            saldeerscan.nl
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
