import { NextResponse } from 'next/server'
import { getNotSubmitted, getLeagueByCode } from '@/lib/data'

export async function GET(
  request: Request,
  { params }: { params: { weekNo: string } }
) {
  try {
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

    const weekNo = parseInt(params.weekNo)
    if (isNaN(weekNo) || weekNo < 1) {
      return NextResponse.json(
        { error: 'Invalid week number - must be >= 1' },
        { status: 400 }
      )
    }

    const notSubmitted = await getNotSubmitted({ leagueId: finalLeagueId, weekNo })
    
    return NextResponse.json({ notSubmitted })
  } catch (error) {
    console.error('Get not submitted error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}