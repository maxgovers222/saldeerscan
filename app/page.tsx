import type { Metadata } from 'next'
import { HomePage } from '@/components/home/HomePage'
import { HomeDiscovery } from '@/components/pseo/HomeDiscovery'

export const metadata: Metadata = {
  alternates: { canonical: 'https://saldeerscan.nl' },
}

export default function Home() {
  return <HomePage discovery={<HomeDiscovery />} />
}
