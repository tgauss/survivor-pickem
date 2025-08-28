import { NextResponse } from 'next/server'
import { scoreWeek, getLeagueByCode } from '@/lib/data'
import { readUserSessionCookie } from '@/lib/auth/sessions'

export async function POST(
  request: Request,
  { params }: { params: { weekNo: string } }
) {
  try {
    const session = await readUserSessionCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leagueId, leagueCode } = body

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
    if (isNaN(weekNo)) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }

    const result = await scoreWeek({ leagueId: finalLeagueId, weekNo })

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Score week error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}