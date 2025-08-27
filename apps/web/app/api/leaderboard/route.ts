import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/data'
import { getLeagueContext } from '../_lib/league'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekNo = searchParams.get('weekNo')
    
    if (!weekNo) {
      return NextResponse.json(
        { error: 'Week number is required' },
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

    const data = await getLeaderboard(leagueContext.leagueId, parseInt(weekNo))
    
    if (!data) {
      return NextResponse.json(
        { error: 'League or week not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}