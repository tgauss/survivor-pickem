import { NextResponse } from 'next/server'
import { login } from '@/lib/data'
import { createSessionCookie } from '@/lib/auth/sessions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, pin } = body

    if (!username || !pin) {
      return NextResponse.json(
        { error: 'Username and PIN are required' },
        { status: 400 }
      )
    }

    const result = await login(username, pin)

    if (!result || 'error' in result) {
      return NextResponse.json(
        { error: result ? result.error : 'Login failed' },
        { status: 401 }
      )
    }

    const sessionToken = 'sessionToken' in result ? result.sessionToken : result.session_token
    const expiresAt = 'expires_at' in result 
      ? result.expires_at 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await createSessionCookie({
      sessionToken,
      expiresAt,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}