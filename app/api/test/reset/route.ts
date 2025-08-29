import { NextResponse } from 'next/server'
import { setFixedNow } from '@/lib/timectl'

export async function POST() {
  // Allow test endpoints in development for E2E testing
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      error: 'Test-only endpoint',
      env: process.env.NODE_ENV 
    }, { status: 403 })
  }

  try {
    // Clear fixed time
    setFixedNow(null)
    
    // Clear the cached adapter to force fresh instance
    const dataModule = await import('@/lib/data')
    if ((dataModule as any).clearCachedAdapter) {
      (dataModule as any).clearCachedAdapter()
    }
    
    // Reset local adapter with deterministic seed data
    const { seedTestData } = await import('@/lib/data/adapters/local')
    const leagueCode = await seedTestData()
    
    return NextResponse.json({ 
      success: true,
      leagueCode,
      message: 'Local adapter reset with test data'
    })
  } catch (error) {
    console.error('Test reset error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reset test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}