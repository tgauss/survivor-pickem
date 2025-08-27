import { NextResponse } from 'next/server'
import { getScoresFinal, getScoresBasic } from '../../../../../lib/services/sportsdataio'
import { syncResultsFromSportsDataIO } from '../../../../../lib/data/adapters/local'
import { z } from 'zod'

const RequestSchema = z.object({
  seasonYear: z.number().min(2020).max(2030),
  week: z.number().min(1).max(22),
  phase: z.enum(['regular', 'wild_card', 'divisional', 'conference']).optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { seasonYear, week, phase } = RequestSchema.parse(body)
    
    let seasonCode: string
    let actualWeek: number
    
    if (phase && phase !== 'regular') {
      seasonCode = `${seasonYear}POST`
      switch (phase) {
        case 'wild_card':
          actualWeek = 1
          break
        case 'divisional':
          actualWeek = 2
          break
        case 'conference':
          actualWeek = 3
          break
        default:
          actualWeek = week
      }
    } else {
      seasonCode = `${seasonYear}REG`
      actualWeek = week
    }
    
    const [finalScores, basicScores] = await Promise.all([
      getScoresFinal(seasonCode, actualWeek),
      getScoresBasic(seasonCode, actualWeek)
    ])
    
    const transformedFinalScores = finalScores.map(score => ({
      gameId: score.GameKey,
      homeScore: score.HomeScore,
      awayScore: score.AwayScore
    }))
    
    const transformedBasicScores = basicScores.map(score => ({
      gameId: score.GameKey,
      status: score.Status as 'Scheduled' | 'InProgress' | 'Final',
      homeScore: score.HomeScore,
      awayScore: score.AwayScore
    }))
    
    const syncResult = syncResultsFromSportsDataIO(
      seasonCode,
      actualWeek,
      transformedFinalScores,
      transformedBasicScores
    )
    
    return NextResponse.json({
      success: true,
      seasonCode,
      week: actualWeek,
      phase,
      finalScoresCount: transformedFinalScores.length,
      basicScoresCount: transformedBasicScores.length,
      finalsProcessed: syncResult.finalsCount,
      gamesUpdated: syncResult.updatedCount,
      scoringTriggered: syncResult.scoringTriggered,
      allOutSurvive: syncResult.allOutSurvive,
      message: `Successfully synced results for ${seasonCode} week ${actualWeek}`
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
    
    console.error('SportsDataIO results sync error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync results from SportsDataIO',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}