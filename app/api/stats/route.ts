import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const revalidate = 300 // cache 5 minuten

export async function GET() {
  const [countResult, latestResult] = await Promise.all([
    supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('leads').select('created_at').order('created_at', { ascending: false }).limit(1).single(),
  ])

  const count = countResult.count ?? 0

  let minGeleden: number | null = null
  if (latestResult.data?.created_at) {
    minGeleden = Math.floor((Date.now() - new Date(latestResult.data.created_at).getTime()) / 60_000)
  }

  return NextResponse.json({ count, minGeleden }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  })
}
