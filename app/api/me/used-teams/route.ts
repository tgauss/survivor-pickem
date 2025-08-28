import { NextResponse } from 'next/server'
import { getUsedTeams, getLeagueByCode } from '@/lib/data'
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
    
    if (!finalLeagueId) {
      return NextResponse.json(
        { error: 'League ID or code is required' },
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

    const usedTeams = await getUsedTeams(entry.id)
    
    return NextResponse.json({ usedTeams })
  } catch (error) {
    console.error('Get used teams error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}