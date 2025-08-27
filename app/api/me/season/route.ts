import { NextRequest, NextResponse } from 'next/server'
import { getMySeason } from '@/lib/data/adapters/local'
import { readSessionCookie } from '@/lib/auth/sessions'

export async function GET(request: NextRequest) {
  try {
    const session = await readSessionCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }
    
    // Verify user is in this league
    if (session.entry.league_id !== leagueId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    const season = getMySeason(session.entry.id)
    
    return NextResponse.json({ season })
  } catch (error) {
    console.error('Get my season error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}