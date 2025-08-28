import { NextResponse } from 'next/server'
import { readUserSessionCookie } from '@/lib/auth/sessions'

export async function GET() {
  try {
    const session = await readUserSessionCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: session.user,
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}