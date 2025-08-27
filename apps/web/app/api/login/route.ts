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

    const result = login(username, pin)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    await createSessionCookie({
      sessionToken: result.session_token,
      expiresAt: result.expires_at,
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