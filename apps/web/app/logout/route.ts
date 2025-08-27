import { NextResponse } from 'next/server'
import { clearSessionCookie, readSessionCookie } from '@/lib/auth/sessions'
import { logout } from '@/lib/data'

export async function GET() {
  const session = await readSessionCookie()
  
  if (session) {
    logout(session.session.session_token)
  }
  
  await clearSessionCookie()
  
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}