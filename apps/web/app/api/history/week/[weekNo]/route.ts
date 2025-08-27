import { NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/data'

export async function GET(
  request: Request,
  { params }: { params: { weekNo: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    const weekNo = parseInt(params.weekNo)
    if (isNaN(weekNo)) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }

    const data = getLeaderboard(leagueId, weekNo)
    
    if (!data) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      )
    }

    // Transform data for history view
    const historyData = {
      weekNo: data.weekNo,
      phase: 'regular', // Could be enhanced to get from week data
      revealed: !data.concealed,
      rolledBack: false, // Could be enhanced to get from week data
      entries: data.entries.map(entry => ({
        ...entry,
        pick_team_abbr: entry.current_pick?.team_abbr,
        pick_result: (entry.current_pick as any)?.result || 'pending',
      })),
    }

    return NextResponse.json(historyData)
  } catch (error) {
    console.error('Get week history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}