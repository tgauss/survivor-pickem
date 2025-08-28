import { NextRequest } from 'next/server'
import { getLeagueByCode } from '@/lib/data'

export interface LeagueContext {
  leagueId: string
  leagueCode: string
}

export async function getLeagueContext(req: NextRequest): Promise<LeagueContext | null> {
  // Check for leagueCode in query params
  const url = new URL(req.url)
  const leagueCodeParam = url.searchParams.get('leagueCode')
  
  if (leagueCodeParam) {
    const league = await getLeagueByCode(leagueCodeParam)
    if (league) {
      return {
        leagueId: league.id,
        leagueCode: league.league_code
      }
    }
  }

  // Check for leagueId in query params (legacy support)
  const leagueIdParam = url.searchParams.get('leagueId')
  
  if (leagueIdParam) {
    // For now, assume leagueId is valid
    // In production, you'd validate this against the database
    return {
      leagueId: leagueIdParam,
      leagueCode: leagueIdParam // Use ID as code for legacy
    }
  }

  // Check for league code in headers (from custom header)
  const leagueCodeHeader = req.headers.get('x-league-code')
  
  if (leagueCodeHeader) {
    const league = await getLeagueByCode(leagueCodeHeader)
    if (league) {
      return {
        leagueId: league.id,
        leagueCode: league.league_code
      }
    }
  }

  // Check for league code in cookies
  const cookies = req.headers.get('cookie') || ''
  const lastLeagueCode = cookies.split(';')
    .find(c => c.trim().startsWith('last_league_code='))
    ?.split('=')[1]

  if (lastLeagueCode) {
    const league = await getLeagueByCode(lastLeagueCode)
    if (league) {
      return {
        leagueId: league.id,
        leagueCode: league.league_code
      }
    }
  }

  return null
}

export async function resolveLeagueFromBody(body: any): Promise<LeagueContext | null> {
  // Check for leagueCode in body
  if (body.leagueCode) {
    const league = await getLeagueByCode(body.leagueCode)
    if (league) {
      return {
        leagueId: league.id,
        leagueCode: league.league_code
      }
    }
  }

  // Check for leagueId in body (legacy support)
  if (body.leagueId) {
    return {
      leagueId: body.leagueId,
      leagueCode: body.leagueId // Use ID as code for legacy
    }
  }

  return null
}