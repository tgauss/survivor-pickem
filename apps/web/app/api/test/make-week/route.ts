import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Allow test endpoints in development for E2E testing
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Test-only endpoint' }, { status: 403 })
  }

  try {
    const { weekNo, games = 2 } = await request.json()
    
    if (!weekNo || weekNo < 1) {
      return NextResponse.json({ 
        error: 'Invalid weekNo' 
      }, { status: 400 })
    }

    const { createTestWeek } = await import('@/lib/data/adapters/local')
    const week = await createTestWeek(weekNo, games)
    
    return NextResponse.json({ 
      success: true,
      week: {
        weekNo: week.week_no,
        gamesCount: games,
        lastKickoffAt: week.last_kickoff_at
      },
      message: `Week ${weekNo} created with ${games} games`
    })
  } catch (error) {
    console.error('Test make-week error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create test week',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}