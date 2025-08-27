import { NextRequest, NextResponse } from 'next/server'
import { getWeekState } from '@/lib/data'
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

    const weekState = await getWeekState(leagueContext.leagueId, weekNo)
    
    return NextResponse.json({ weekState })
  } catch (error) {
    console.error('Get week state error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}