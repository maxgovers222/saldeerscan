import { ImageResponse } from 'next/og'
import { BrandImageMark } from '@/components/design-system/BrandImageLockup'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <BrandImageMark size={180} iconSize={100} radius={40} />,
    { width: 180, height: 180 }
  )
}
