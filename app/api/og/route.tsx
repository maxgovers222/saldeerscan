import { ImageResponse } from 'next/og'
import { BrandImageLockup } from '@/components/design-system/BrandImageLockup'
import { BRAND_COLORS } from '@/lib/brand-colors'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const titel = searchParams.get('titel') ?? 'SaldeerScan.nl'
  const score = searchParams.get('score')
  const status = searchParams.get('status')
  const type = searchParams.get('type') ?? 'wijk'

  const statusTheme =
    status === 'ROOD' ? { accent: BRAND_COLORS.danger, ink: BRAND_COLORS.dangerSurface } :
    status === 'ORANJE' ? { accent: BRAND_COLORS.warning, ink: BRAND_COLORS.warningSurface } :
    status === 'GROEN' ? { accent: BRAND_COLORS.trust, ink: BRAND_COLORS.onEvergreen } : null
  const statusLabel =
    status === 'ROOD' ? 'Vol stroomnet' :
    status === 'ORANJE' ? 'Druk stroomnet' :
    status === 'GROEN' ? 'Vrij stroomnet' : null

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
          {statusTheme && statusLabel && (
            <div style={{
              marginLeft: 'auto',
              padding: '6px 16px',
              borderRadius: '999px',
              border: `1px solid ${statusTheme.accent}80`,
              background: `${statusTheme.accent}26`,
              color: statusTheme.ink,
              fontSize: '16px',
            }}>
              {statusLabel}
            </div>
          )}
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
            {type === 'straat' ? 'Straat analyse' : 'Wijk analyse'} · 2027 Saldering
          </div>
          <div style={{
            color: BRAND_COLORS.onEvergreen,
            fontSize: titel.length > 50 ? '36px' : '44px',
            fontWeight: 'bold',
            lineHeight: '1.2',
            maxWidth: score ? '780px' : '100%',
          }}>
            {titel}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ color: BRAND_COLORS.onEvergreenMuted, fontSize: '18px' }}>
            Gratis zonnepanelen analyse · saldeerscan.nl
          </div>
          {score && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '12px 24px',
              border: `1px solid ${BRAND_COLORS.action}66`,
              borderRadius: '16px',
              background: `${BRAND_COLORS.action}18`,
            }}>
              <span style={{ color: BRAND_COLORS.action, fontSize: '42px', fontWeight: 'bold' }}>{score}</span>
              <span style={{ color: BRAND_COLORS.actionHover, fontSize: '13px' }}>/ 100</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
