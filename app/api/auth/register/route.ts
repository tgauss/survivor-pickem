import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/data'
import { createSessionCookie } from '@/lib/auth/sessions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, pin, firstName, lastName, email, phone } = body

    if (!username || !pin || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const result = await registerUser({
      username,
      pin,
      firstName,
      lastName,
      email,
      phone
    })

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    const { user, sessionToken } = result
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await createSessionCookie({
      sessionToken,
      expiresAt,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}