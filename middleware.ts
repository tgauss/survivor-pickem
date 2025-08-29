import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // REMOVED: Cookie setting logic that was destroying session cookies
  // League tracking is now handled client-side via localStorage
  
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
      // Try to get last league from localStorage via a cookie we DON'T set in middleware
      // This cookie should only be set by client-side code or API routes
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