import { NextResponse } from 'next/server'
import { revealIfReady } from '@/lib/data'
import { readSessionCookie } from '@/lib/auth/sessions'

export async function POST(
  request: Request,
  { params }: { params: { weekNo: string } }
) {
  try {
    const session = await readSessionCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leagueId, force = false, reason } = body

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    if (force && !reason) {
      return NextResponse.json(
        { error: 'Reason is required for forced reveal' },
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

    const result = revealIfReady(
      leagueId,
      weekNo,
      force,
      reason,
      session.entry.id
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reveal week error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}