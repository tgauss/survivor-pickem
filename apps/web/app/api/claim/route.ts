import { NextResponse } from 'next/server'
import { claimInvite } from '@/lib/data'
import { createSessionCookie } from '@/lib/auth/sessions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, username, display_name, real_name, email, phone, pin } = body

    if (!token || !username || !display_name || !real_name || !email || !phone || !pin) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const result = claimInvite(token, {
      username,
      display_name,
      real_name,
      email,
      phone,
      pin,
    })

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    await createSessionCookie({
      sessionToken: result.session.session_token,
      expiresAt: result.session.expires_at,
    })

    return NextResponse.json({
      success: true,
      entry: result.entry,
    })
  } catch (error) {
    console.error('Claim error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}