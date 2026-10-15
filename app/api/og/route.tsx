import { ImageResponse } from 'next/og'
import { BrandImageLockup } from '@/components/design-system/BrandImageLockup'
import { BRAND_COLORS } from '@/lib/brand-colors'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const titel = searchParams.get('titel') ?? 'SaldeerScan.nl'
  const type = searchParams.get('type') ?? 'wijk'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: `linear-gradient(135deg, ${BRAND_COLORS.evergreen950} 0%, ${BRAND_COLORS.evergreen900} 72%, ${BRAND_COLORS.trustDark} 160%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BrandImageLockup fontSize={20} markSize={36} />

        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            color: BRAND_COLORS.trust,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '3px',
          }}>
            {type === 'straat' ? 'Straatgegevens' : 'Wijkgegevens'} · salderen stopt in 2027
          </div>
          <div style={{
            color: BRAND_COLORS.onEvergreen,
            fontSize: titel.length > 50 ? '36px' : '44px',
            fontWeight: 'bold',
            lineHeight: '1.2',
            maxWidth: '100%',
          }}>
            {titel}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ color: BRAND_COLORS.onEvergreenMuted, fontSize: '18px' }}>
            Gratis zonnepanelencheck · saldeerscan.nl
          </div>

        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
