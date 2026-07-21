import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Canoniek domein — www-redirect staat in Vercel; hier alleen pad-normalisatie en rapport-noindex. */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname.includes('[object') || pathname.includes('%5Bobject')) {
    return new NextResponse(null, { status: 410 })
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(url, 301)
  }

  if (pathname === '/check' && (searchParams.has('leadId') || searchParams.has('token'))) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|api/).*)'],
}
