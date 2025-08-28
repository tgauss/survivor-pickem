import { NextResponse } from 'next/server'

export async function GET() {
  // Create a test session token
  const testToken = 'test-session-' + Date.now()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
  
  const response = NextResponse.json({
    message: 'Attempting to set survivor_session cookie',
    token: testToken,
    expires: expires.toISOString()
  })
  
  // Set the survivor_session cookie exactly as login would
  response.cookies.set('survivor_session', testToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',
    expires,
    path: '/'
  })
  
  return response
}