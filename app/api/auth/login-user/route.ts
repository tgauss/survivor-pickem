import { NextResponse } from 'next/server'
import { loginUser } from '@/lib/data'

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

    const result = await loginUser(username, pin)

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid username or PIN' },
        { status: 401 }
      )
    }

    const { user, sessionToken } = result
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Create the response
    const response = NextResponse.json({
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

    // Set the cookie in the response - simplified for production compatibility
    response.cookies.set('survivor_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })
    
    // Also try setting as a direct header for debugging
    const cookieValue = `survivor_session=${sessionToken}; Path=/; Expires=${expiresAt.toUTCString()}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    response.headers.set('Set-Cookie', cookieValue)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}