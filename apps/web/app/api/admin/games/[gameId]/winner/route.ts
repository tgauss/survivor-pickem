import { NextResponse } from 'next/server'
import { markGameWinner } from '@/lib/data'
import { readSessionCookie } from '@/lib/auth/sessions'

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
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
    const { leagueId, weekNo, winnerAbbr } = body

    if (!leagueId || weekNo === undefined || !winnerAbbr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = markGameWinner({
      leagueId,
      weekNo,
      gameId: params.gameId,
      winnerAbbr,
    })

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark game winner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}