/** @jsxImportSource react */

import { Path, Svg, View } from '@react-pdf/renderer'
import { BRAND_COLORS, BRAND_MARK_GEOMETRY } from '@/lib/brand-colors'

export function PdfBrandMark({ size = 24 }: { size?: number }) {
  const glyphSize = Math.round(size * 0.58)

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: BRAND_COLORS.trust,
        borderRadius: Math.round(size * 0.28),
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      <Svg
        viewBox={BRAND_MARK_GEOMETRY.viewBox}
        height={glyphSize}
        width={glyphSize}
      >
        <Path
          d={BRAND_MARK_GEOMETRY.outerPath}
          fill={BRAND_COLORS.onEvergreen}
          fillOpacity={BRAND_MARK_GEOMETRY.outerFillOpacity}
          stroke={BRAND_COLORS.onEvergreen}
          strokeWidth={BRAND_MARK_GEOMETRY.outerStrokeWidth}
          strokeLinejoin="round"
        />
        <Path
          d={BRAND_MARK_GEOMETRY.innerPath}
          fill={BRAND_COLORS.onEvergreen}
        />
      </Svg>
    </View>
  )
}
