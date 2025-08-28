import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const sessionCookie = cookieStore.get('survivor_session')
  
  return NextResponse.json({
    hasSessionCookie: !!sessionCookie,
    sessionCookieValue: sessionCookie?.value ? `${sessionCookie.value.substring(0, 10)}...` : 'none',
    allCookieNames: allCookies.map(c => c.name),
    cookieCount: allCookies.length,
    headers: {
      cookie: cookieStore.toString()
    }
  })
}