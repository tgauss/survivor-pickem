import { NextRequest, NextResponse } from 'next/server'
import { listMessages, postMessage } from '@/lib/data/adapters/local'
import { readSessionCookie } from '@/lib/auth/sessions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    const weekNo = searchParams.get('weekNo')
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }
    
    if (!weekNo) {
      return NextResponse.json(
        { error: 'Week number is required' },
        { status: 400 }
      )
    }
    
    const weekNumber = parseInt(weekNo)
    if (isNaN(weekNumber)) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }
    
    const messages = listMessages(leagueId, weekNumber)
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await readSessionCookie()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { leagueId, weekNo, body, is_spoiler } = await request.json()
    
    if (!leagueId || weekNo === undefined || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const message = postMessage({
      leagueId,
      weekNo,
      entryId: session.entry.id,
      body,
      is_spoiler,
    })
    
    return NextResponse.json({ message })
  } catch (error) {
    console.error('Post message error:', error)
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