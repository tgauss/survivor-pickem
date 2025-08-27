import { NextRequest, NextResponse } from 'next/server'
import { getPot } from '@/lib/data/adapters/local'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    const pot = getPot(leagueId)
    
    return NextResponse.json({ pot })
  } catch (error) {
    console.error('Get league pot error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}