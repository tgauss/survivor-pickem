import { NextResponse } from 'next/server'
import { createInvite, getLeagueInvites } from '@/lib/data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')
  
  if (!leagueId) {
    return NextResponse.json(
      { error: 'League ID is required' },
      { status: 400 }
    )
  }

  const invites = getLeagueInvites(leagueId)
  return NextResponse.json({ invites })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leagueId } = body

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    const invite = createInvite(leagueId)
    if (!invite) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invite })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}