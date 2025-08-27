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
  
  return getSession(sessionToken)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })
}