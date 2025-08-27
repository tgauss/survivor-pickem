import { cookies } from 'next/headers'
import { getSession } from '@/lib/data'
import type { Session, Entry } from '@/lib/data/types'

const COOKIE_NAME = 'survivor_session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function createSessionCookie(sessionData: { sessionToken: string; expiresAt: string }) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionData.sessionToken, {
    ...COOKIE_OPTIONS,
    expires: new Date(sessionData.expiresAt),
  })
}

export async function readSessionCookie(): Promise<{ entry: Entry; session: Session } | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value
  
  if (!sessionToken) return null
  
  const result = await getSession(sessionToken)
  
  // Handle different return types from getSession
  if (!result) return null
  if ('entry' in result && 'session' in result) {
    return result
  }
  // If it's just a Session object, we can't use it without the entry
  return null
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })
}