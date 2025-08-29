import { listLeagues } from './data'

export interface LeagueInfo {
  id: string
  name: string
  season_year: number
  league_code: string
}

// Cache for league lookups
const leagueCache = new Map<string, LeagueInfo>()

export async function getLeagueByCode(leagueCode: string): Promise<LeagueInfo | null> {
  // Check cache first
  if (leagueCache.has(leagueCode)) {
    return leagueCache.get(leagueCode)!
  }

  // Fetch all leagues and find by code
  const leagues = await listLeagues()
  
  // Generate league codes if not present (e.g., "2024-bears" from name and year)
  const league = leagues.find((l: any) => {
    const code = l.league_code || `${l.season_year}-${l.name.toLowerCase().replace(/\s+/g, '-')}`
    return code === leagueCode
  })

  if (!league) {
    return null
  }

  const leagueInfo: LeagueInfo = {
    id: league.id,
    name: league.name,
    season_year: league.season_year,
    league_code: league.league_code || `${league.season_year}-${league.name.toLowerCase().replace(/\s+/g, '-')}`
  }

  // Cache the result
  leagueCache.set(leagueCode, leagueInfo)
  
  return leagueInfo
}

export async function requireLeague(params: { leagueCode?: string }): Promise<LeagueInfo> {
  if (!params.leagueCode) {
    throw new Error('League code is required')
  }

  const league = await getLeagueByCode(params.leagueCode)
  
  if (!league) {
    throw new Error(`League not found: ${params.leagueCode}`)
  }

  return league
}

export async function getAllLeagueCodes(): Promise<string[]> {
  const leagues = await listLeagues()
  return leagues.map((l: any) => 
    l.league_code || `${l.season_year}-${l.name.toLowerCase().replace(/\s+/g, '-')}`
  )
}

export function clearLeagueCache() {
  leagueCache.clear()
}