import {
  BRAND_COLORS,
  BRAND_MARK_GEOMETRY,
  BRAND_WORDMARK,
} from '@/lib/brand-colors'

export function BrandImageMark({
  size,
  iconSize,
  radius,
}: {
  size: number
  iconSize: number
  radius: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: BRAND_COLORS.trust,
        color: BRAND_COLORS.onEvergreen,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={BRAND_MARK_GEOMETRY.viewBox}
        fill="none"
      >
        <path
          d={BRAND_MARK_GEOMETRY.outerPath}
          fill="currentColor"
          fillOpacity={BRAND_MARK_GEOMETRY.outerFillOpacity}
          stroke="currentColor"
          strokeWidth={BRAND_MARK_GEOMETRY.outerStrokeWidth}
          strokeLinejoin="round"
        />
        <path d={BRAND_MARK_GEOMETRY.innerPath} fill="currentColor" />
      </svg>
    </div>
  )
}

export function BrandImageLockup({
  fontSize = 28,
  markSize = 48,
}: {
  fontSize?: number
  markSize?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <BrandImageMark
        size={markSize}
        iconSize={Math.round(markSize * 0.5)}
        radius={Math.round(markSize * 0.3)}
      />
      <div
        style={{
          display: 'flex',
          color: BRAND_COLORS.onEvergreen,
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        {BRAND_WORDMARK.name}
        <span style={{ color: BRAND_COLORS.trust }}>{BRAND_WORDMARK.suffix}</span>
      </div>
    </div>
  )
}
