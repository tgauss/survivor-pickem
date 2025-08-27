import { NextResponse } from 'next/server'
import { getSchedulesBasic } from '../../../../../lib/services/sportsdataio'
import { importScheduleFromSportsDataIO } from '../../../../../lib/data/adapters/local'
import { z } from 'zod'

const RequestSchema = z.object({
  seasonYear: z.number().min(2020).max(2030)
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { seasonYear } = RequestSchema.parse(body)
    
    const regSeasonCode = `${seasonYear}REG`
    const postSeasonCode = `${seasonYear}POST`
    
    const [regGames, postGames] = await Promise.all([
      getSchedulesBasic(regSeasonCode),
      getSchedulesBasic(postSeasonCode)
    ])
    
    const allGames = [...regGames, ...postGames]
    
    // allGames is already transformed by getSchedulesBasic
    const transformedGames = allGames.map(game => ({
      gameId: game.gameId,
      dateUTC: game.dateUTC,
      homeAbbr: game.homeAbbr,
      awayAbbr: game.awayAbbr,
      neutralSite: game.neutralSite || false,
      week: game.week
    }))
    
    importScheduleFromSportsDataIO(regSeasonCode, transformedGames)
    
    return NextResponse.json({
      success: true,
      regularSeasonGames: regGames.length,
      postSeasonGames: postGames.length,
      totalGamesImported: transformedGames.length,
      message: `Successfully imported ${transformedGames.length} games for ${seasonYear} season`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    console.error('SportsDataIO schedule import error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import schedule from SportsDataIO',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}