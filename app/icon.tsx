import { ImageResponse } from 'next/og'
import { BrandImageMark } from '@/components/design-system/BrandImageLockup'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <BrandImageMark size={32} iconSize={18} radius={10} />,
    { width: 32, height: 32 }
  )
}
