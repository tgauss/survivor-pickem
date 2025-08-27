import { NextRequest, NextResponse } from 'next/server'
import { listGames } from '@/lib/data'
import { enrichGames } from '@/lib/team-enricher'
import { getLeagueContext } from '../../../_lib/league'

export async function GET(
  request: NextRequest,
  { params }: { params: { weekNo: string } }
) {
  try {
    const weekNo = parseInt(params.weekNo)
    if (isNaN(weekNo)) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }

    // Resolve league from various sources
    const leagueContext = await getLeagueContext(request)
    
    if (!leagueContext) {
      return NextResponse.json(
        { error: 'League not found. Please specify leagueCode or leagueId' },
        { status: 400 }
      )
    }

    const games = await listGames(leagueContext.leagueId, weekNo)
    
    return NextResponse.json({ games: enrichGames(games) })
  } catch (error) {
    console.error('Get games error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}