import { NextResponse } from 'next/server'
import { getPickForWeek } from '@/lib/data'
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
    const weekNo = searchParams.get('weekNo')
    
    if (!leagueId || !weekNo) {
      return NextResponse.json(
        { error: 'League ID and week number are required' },
        { status: 400 }
      )
    }

    const pick = getPickForWeek(session.entry.id, parseInt(weekNo))
    
    return NextResponse.json({ pick })
  } catch (error) {
    console.error('Get pick error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}