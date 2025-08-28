import { NextResponse } from 'next/server'
import { getPickForWeek, getLeagueByCode } from '@/lib/data'
import { readUserSessionCookie } from '@/lib/auth/sessions'

export async function GET(request: Request) {
  try {
    const sessionData = await readUserSessionCookie()
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    const leagueCode = searchParams.get('leagueCode')
    const weekNo = searchParams.get('weekNo')
    
    let finalLeagueId = leagueId
    
    // If leagueCode provided instead of leagueId, resolve it
    if (leagueCode && !leagueId) {
      const league = await getLeagueByCode(leagueCode)
      if (!league) {
        return NextResponse.json(
          { error: 'League not found' },
          { status: 404 }
        )
      }
      finalLeagueId = league.id
    }
    
    if (!finalLeagueId || !weekNo) {
      return NextResponse.json(
        { error: 'League ID/code and week number are required' },
        { status: 400 }
      )
    }

    // Find user's entry in this league
    const { data: entry } = await import('@/lib/supabase/server').then(m => m.createServerClient())
      .then(client => client
        .from('entries')
        .select('id')
        .eq('user_id', sessionData.user.id)
        .eq('league_id', finalLeagueId)
        .single()
      )

    if (!entry) {
      return NextResponse.json(
        { error: 'You are not a member of this league' },
        { status: 403 }
      )
    }

    const pick = await getPickForWeek(entry.id, parseInt(weekNo))
    
    return NextResponse.json({ pick })
  } catch (error) {
    console.error('Get pick error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}