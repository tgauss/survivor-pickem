import { NextResponse } from 'next/server'
import { getNotSubmitted } from '@/lib/data'

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

    const notSubmitted = getNotSubmitted({ leagueId, weekNo })
    
    return NextResponse.json({ notSubmitted })
  } catch (error) {
    console.error('Get not submitted error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}