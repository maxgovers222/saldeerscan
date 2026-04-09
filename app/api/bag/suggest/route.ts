export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return Response.json([])
  }

  const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${encodeURIComponent(q)}&fq=type:adres&rows=6`

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })

    if (!res.ok) return Response.json([])

    const data = await res.json() as {
      response?: { docs?: { weergavenaam?: string; id?: string }[] }
    }

    const docs = data.response?.docs ?? []
    const suggestions = docs
      .filter((d) => d.weergavenaam)
      .map((d) => ({ label: d.weergavenaam!, id: d.id ?? d.weergavenaam! }))

    return Response.json(suggestions)
  } catch {
    return Response.json([])
  }
}
