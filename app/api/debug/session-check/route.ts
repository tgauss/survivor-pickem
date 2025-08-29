import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    // Check cookies from headers directly
    const cookieHeader = request.headers.get('cookie')
    
    // Check cookies from Next.js cookies() function
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const sessionCookie = cookieStore.get('survivor_session')
    
    // Parse cookies from header manually
    const parsedCookies: Record<string, string> = {}
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          parsedCookies[name] = value
        }
      })
    }
    
    return NextResponse.json({
      cookieHeader,
      nextJsCookies: allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 10) + '...' })),
      sessionCookie: sessionCookie ? sessionCookie.value.substring(0, 10) + '...' : null,
      parsedCookies: Object.keys(parsedCookies).reduce((acc, key) => {
        acc[key] = parsedCookies[key]?.substring(0, 10) + '...'
        return acc
      }, {} as Record<string, string>),
      hasSurvivorSession: !!sessionCookie,
      cookieNames: allCookies.map(c => c.name)
    })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 })
  }
}