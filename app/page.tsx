import { HomePage } from '@/components/home/HomePage'
import { HomeDiscovery } from '@/components/pseo/HomeDiscovery'

export default function Home() {
  return <HomePage discovery={<HomeDiscovery />} />
}
