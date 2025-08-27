import { z } from 'zod'
import { SPORTSDATA } from '@/lib/config'

// Zod schemas for API responses
const TimeframeSchema = z.object({
  Season: z.number(),
  SeasonType: z.number(),
  Week: z.number().optional(),
})

const ScheduleSchema = z.object({
  GameKey: z.string(),
  Date: z.string(),
  HomeTeam: z.string(),
  AwayTeam: z.string(),
  NeutralVenue: z.boolean().optional(),
  Season: z.number(),
  Week: z.number(),
  SeasonType: z.number(),
})

const ScoreBasicSchema = z.object({
  GameKey: z.string(),
  Status: z.enum(['Scheduled', 'InProgress', 'Final', 'F/OT', 'Postponed', 'Canceled']),
  HomeScore: z.number().optional(),
  AwayScore: z.number().optional(),
})

const ScoreFinalSchema = z.object({
  GameKey: z.string(),
  HomeScore: z.number(),
  AwayScore: z.number(),
})

// Type definitions
export interface CurrentTimeframe {
  seasonCode: string
  seasonYear: number
  week: number
  phase: 'regular' | 'post'
}

export interface ScheduleGame {
  gameId: string
  dateUTC: string
  homeAbbr: string
  awayAbbr: string
  neutralSite?: boolean
  seasonCode: string
  week: number
}

export interface ScoreBasic {
  gameId: string
  status: 'Scheduled' | 'InProgress' | 'Final'
  homeScore?: number
  awayScore?: number
}

export interface ScoreFinal {
  gameId: string
  homeScore: number
  awayScore: number
}

// Helper functions
export function makeSeasonCode(year: number, kind: 'REG' | 'POST'): string {
  return `${year}${kind}`
}

export function phaseFromSeasonCode(seasonCode: string): 'regular' | 'post' {
  return seasonCode.endsWith('POST') ? 'post' : 'regular'
}

// HTTP client with retry logic
async function fetchJson(path: string, opts?: { query?: Record<string, string | number> }): Promise<any> {
  if (!SPORTSDATA.enabled) {
    // Return mock data when disabled
    return getMockData(path)
  }

  const url = new URL(path, SPORTSDATA.baseUrl)
  
  // Add query parameters
  if (opts?.query) {
    Object.entries(opts.query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
  }

  // Add API key
  const headers: HeadersInit = {}
  if (SPORTSDATA.useQueryKey) {
    url.searchParams.set('key', SPORTSDATA.apiKey)
  } else {
    headers['Ocp-Apim-Subscription-Key'] = SPORTSDATA.apiKey
  }

  // Retry logic for 429/5xx errors
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url.toString(), { headers })
      
      if (response.ok) {
        return await response.json()
      }
      
      if (response.status === 429 || response.status >= 500) {
        // Wait with exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      lastError = error as Error
      if (attempt === 2) break
      
      // Wait before retry
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Failed to fetch data')
}

// Mock data loader
async function getMockData(path: string): Promise<any> {
  // Load mock data from fixtures
  try {
    if (path.includes('/scores/json/Timeframes/current')) {
      const { default: data } = await import('./__mocks__/sportsdataio/timeframe.json')
      return data
    }
    if (path.includes('/scores/json/SchedulesBasic/')) {
      const { default: data } = await import('./__mocks__/sportsdataio/schedules.json')
      return data
    }
    if (path.includes('/scores/json/ScoresBasic/')) {
      const { default: data } = await import('./__mocks__/sportsdataio/scores-basic.json')
      return data
    }
    if (path.includes('/scores/json/ScoresByWeekFinal/')) {
      const { default: data } = await import('./__mocks__/sportsdataio/scores-final.json')
      return data
    }
  } catch {
    // Return empty array if mock file doesn't exist
  }
  
  return []
}

// API functions
export async function getCurrentTimeframe(): Promise<CurrentTimeframe> {
  const data = await fetchJson('/scores/json/Timeframes/current')
  const timeframe = TimeframeSchema.parse(data)
  
  const seasonType = timeframe.SeasonType === 1 ? 'REG' : 'POST'
  const seasonCode = makeSeasonCode(timeframe.Season, seasonType)
  
  return {
    seasonCode,
    seasonYear: timeframe.Season,
    week: timeframe.Week || 1,
    phase: phaseFromSeasonCode(seasonCode),
  }
}

export async function getSchedulesBasic(seasonCode: string): Promise<ScheduleGame[]> {
  const data = await fetchJson(`/scores/json/SchedulesBasic/${seasonCode}`)
  const schedules = z.array(ScheduleSchema).parse(data)
  
  return schedules.map(game => ({
    gameId: game.GameKey,
    dateUTC: game.Date,
    homeAbbr: game.HomeTeam,
    awayAbbr: game.AwayTeam,
    neutralSite: game.NeutralVenue,
    seasonCode,
    week: game.Week,
  }))
}

export async function getScoresBasic(seasonCode: string, week: number): Promise<ScoreBasic[]> {
  const data = await fetchJson(`/scores/json/ScoresBasic/${seasonCode}/${week}`)
  const scores = z.array(ScoreBasicSchema).parse(data)
  
  return scores.map(score => ({
    gameId: score.GameKey,
    status: score.Status === 'F/OT' ? 'Final' : (score.Status as 'Scheduled' | 'InProgress' | 'Final'),
    homeScore: score.HomeScore,
    awayScore: score.AwayScore,
  }))
}

export async function getScoresFinal(seasonCode: string, week: number): Promise<ScoreFinal[]> {
  const data = await fetchJson(`/scores/json/ScoresByWeekFinal/${seasonCode}/${week}`)
  const scores = z.array(ScoreFinalSchema).parse(data)
  
  return scores.map(score => ({
    gameId: score.GameKey,
    homeScore: score.HomeScore,
    awayScore: score.AwayScore,
  }))
}