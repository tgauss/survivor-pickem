import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Parse league code from pathname if present
  const leagueMatch = pathname.match(/^\/l\/([^\/]+)/)
  const leagueCode = leagueMatch?.[1]
  
  // Set last_league_code cookie if we have a league code
  if (leagueCode) {
    const response = NextResponse.next()
    response.cookies.set('last_league_code', leagueCode, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return response
  }
  
  // Handle legacy redirects
  const legacyRoutes = [
    { pattern: /^\/$/,            replacement: '/l/{league}' },
    { pattern: /^\/week\/(\d+)$/, replacement: '/l/{league}/week/$1' },
    { pattern: /^\/me$/,          replacement: '/l/{league}/me' },
    { pattern: /^\/history$/,     replacement: '/l/{league}/history' },
    { pattern: /^\/profile$/,     replacement: '/l/{league}/profile' },
    { pattern: /^\/admin$/,       replacement: '/l/{league}/admin' },
    { pattern: /^\/claim\/(.+)$/, replacement: '/l/{league}/claim/$1' },
  ]
  
  for (const route of legacyRoutes) {
    const match = pathname.match(route.pattern)
    if (match) {
      // Get last league code from cookie
      const lastLeagueCode = request.cookies.get('last_league_code')?.value
      
      if (lastLeagueCode) {
        // Redirect to league-scoped route
        let redirectPath = route.replacement.replace('{league}', lastLeagueCode)
        
        // Replace any captured groups
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            redirectPath = redirectPath.replace(`$${i}`, match[i])
          }
        }
        
        const url = new URL(redirectPath, request.url)
        return NextResponse.redirect(url)
      } else {
        // No last league, redirect to league picker
        const url = new URL('/leagues', request.url)
        return NextResponse.redirect(url)
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - leagues (league picker page)
     * - login (login page)
     * - logout (logout page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|leagues|login|logout).*)',
  ],
}