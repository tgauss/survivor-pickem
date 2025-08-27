import { NextResponse } from 'next/server'
import { getUsedTeams } from '@/lib/data'
import { readSessionCookie } from '@/lib/auth/sessions'

export async function GET(request: Request) {
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

    const usedTeams = getUsedTeams(session.entry.id)
    
    return NextResponse.json({ usedTeams })
  } catch (error) {
    console.error('Get used teams error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}