import { NextResponse } from 'next/server'
import { loginUser } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, pin } = body

    console.log('Login attempt for username:', username)

    if (!username || !pin) {
      console.log('Missing username or PIN')
      return NextResponse.json(
        { error: 'Username and PIN are required' },
        { status: 400 }
      )
    }

    let result
    try {
      result = await loginUser(username, pin)
      console.log('Login result:', result ? 'Success' : 'Failed')
    } catch (loginError) {
      console.error('Login error in loginUser function:', loginError)
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    if (!result) {
      console.log('Login failed - invalid credentials')
      return NextResponse.json(
        { error: 'Invalid username or PIN' },
        { status: 401 }
      )
    }

    const { user, sessionToken } = result
    
    if (!sessionToken) {
      console.error('No session token returned from loginUser')
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }
    
    console.log('User logged in:', user.username, 'Session token:', sessionToken?.substring(0, 10) + '...')
    
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

    // Set the cookie in the response
    response.cookies.set('survivor_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })
    
    // Log for debugging
    console.log('Setting session cookie:', {
      token: sessionToken.substring(0, 10) + '...',
      expires: expiresAt.toISOString(),
      env: process.env.NODE_ENV
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}