import { NextResponse } from 'next/server'

export async function GET() {
  // Create a test response
  const response = NextResponse.json({
    test: 'cookie-setting',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  })

  // Try to set a test cookie
  const expires = new Date(Date.now() + 60000) // 1 minute
  response.cookies.set('test_cookie', 'test_value_123', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/'
  })

  // Also set via header
  const cookieValue = `test_cookie_header=header_value_456; Path=/; Expires=${expires.toUTCString()}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  response.headers.append('Set-Cookie', cookieValue)

  return response
}