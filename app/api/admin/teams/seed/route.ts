import { NextResponse } from 'next/server'
import { getTeamsArray } from '@/lib/teams'
import { seedTeamsFromStatic } from '@/lib/data'
import { USE_SUPABASE } from '@/lib/config'

export async function POST() {
  try {
    const teams = getTeamsArray()
    
    // Seed teams using the appropriate adapter
    await seedTeamsFromStatic(teams)
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${teams.length} teams from static data`,
      teamsSeeded: teams.length,
      adapter: USE_SUPABASE ? 'supabase' : 'local'
    })
  } catch (error) {
    console.error('Teams seed error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed teams from static data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}