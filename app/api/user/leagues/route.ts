import { NextResponse } from 'next/server'
import { readUserSessionCookie } from '@/lib/auth/sessions'
import { getUserLeagues } from '@/lib/data'

export async function GET() {
  try {
    const sessionData = await readUserSessionCookie()
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const leagues = await getUserLeagues(sessionData.user.id)
    
    return NextResponse.json({
      leagues: leagues || []
    })
  } catch (error) {
    console.error('Get user leagues error:', error)
    // Fallback to empty array instead of error
    return NextResponse.json({
      leagues: []
    })
  }
}