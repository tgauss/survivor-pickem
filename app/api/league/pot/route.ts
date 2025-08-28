import { NextRequest, NextResponse } from 'next/server'
import { getPot, getLeagueByCode } from '@/lib/data'

export async function GET(request: NextRequest) {
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

    const potData = await getPot(finalLeagueId)
    
    return NextResponse.json({ pot: potData.total, ...potData })
  } catch (error) {
    console.error('Get league pot error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}