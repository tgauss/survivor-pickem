import { NextRequest, NextResponse } from 'next/server'
import { savePick } from '@/lib/data'
import { readSessionCookie } from '@/lib/auth/sessions'
import { resolveLeagueFromBody } from '../_lib/league'

export async function POST(request: NextRequest) {
  try {
    const session = await readSessionCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { weekNo, teamAbbr } = body

    if (weekNo === undefined || !teamAbbr) {
      return NextResponse.json(
        { error: 'Missing required fields: weekNo, teamAbbr' },
        { status: 400 }
      )
    }

    // Resolve league from body
    const leagueContext = await resolveLeagueFromBody(body)
    
    if (!leagueContext) {
      return NextResponse.json(
        { error: 'League not found. Please specify leagueCode or leagueId' },
        { status: 400 }
      )
    }

    const result = await savePick({
      entryId: session.entry.id,
      leagueId: leagueContext.leagueId,
      weekNo,
      teamAbbr,
    })

    return NextResponse.json({ success: true, pick: result })
  } catch (error) {
    console.error('Save pick error:', error)
    
    // Handle specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}