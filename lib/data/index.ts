import { USE_SUPABASE } from '../config'

// Type exports
export type { 
  League, 
  Invite, 
  Entry, 
  Session,
  Pick,
  Game,
  Team,
  NotSubmittedEntry
} from './types'

// Lazy import to enable treeshaking
async function getAdapter() {
  // Always use Supabase in production or when explicitly configured
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (USE_SUPABASE || isProduction) {
    return await import('./adapters/supabase')
  } else {
    return await import('./adapters/local')
  }
}

// Leagues
export async function listLeagues() {
  const adapter = await getAdapter()
  return adapter.listLeagues()
}

export async function getLeagueByCode(leagueCode: string) {
  const adapter = await getAdapter()
  return adapter.getLeagueByCode(leagueCode)
}

export async function createLeague(params: {
  name: string
  season_year: number
  buy_in_cents: number
}) {
  const adapter = await getAdapter()
  return adapter.createLeague(params)
}

// Invites
export async function createInvite(leagueId: string) {
  const adapter = await getAdapter()
  return adapter.createInvite(leagueId)
}

export async function getInvite(token: string) {
  const adapter = await getAdapter()
  return adapter.getInvite(token)
}

export async function listInvites(leagueId: string) {
  const adapter = await getAdapter()
  return (adapter as any).listInvites ? (adapter as any).listInvites(leagueId) : []
}

export async function getLeagueInvites(leagueId: string) {
  const adapter = await getAdapter()
  return (adapter as any).getLeagueInvites ? (adapter as any).getLeagueInvites(leagueId) : []
}

// Entries & Sessions
export async function claimInvite(
  token: string,
  payload: {
    username: string
    displayName: string
    pin: string
  }
) {
  const adapter = await getAdapter()
  
  if (USE_SUPABASE) {
    // Supabase adapter expects { username, displayName, pin }
    return (adapter as any).claimInvite(token, payload)
  } else {
    // Local adapter expects ClaimPayload format
    const claimPayload = {
      username: payload.username,
      display_name: payload.displayName,
      real_name: payload.displayName, // Use displayName as fallback
      email: '', // Will be filled by adapter if needed
      phone: '', // Will be filled by adapter if needed
      pin: payload.pin
    }
    return (adapter as any).claimInvite(token, claimPayload)
  }
}

export async function login(username: string, pin: string) {
  const adapter = await getAdapter()
  return adapter.login(username, pin)
}

export async function getSession(sessionToken: string) {
  const adapter = await getAdapter()
  return adapter.getSession(sessionToken)
}

export async function logout(sessionToken: string) {
  const adapter = await getAdapter()
  return adapter.logout(sessionToken)
}

// New User-based Authentication Functions
export async function registerUser(userData: {
  username: string
  pin: string
  firstName: string
  lastName: string
  email: string
  phone: string
}) {
  const adapter = await getAdapter()
  return (adapter as any).registerUser(userData)
}

export async function loginUser(username: string, pin: string) {
  const adapter = await getAdapter()
  return (adapter as any).loginUser(username, pin)
}

export async function getUserSession(sessionToken: string) {
  const adapter = await getAdapter()
  return (adapter as any).getUserSession(sessionToken)
}

export async function claimLeagueInvite(userId: string, inviteToken: string, displayName: string) {
  const adapter = await getAdapter()
  return (adapter as any).claimLeagueInvite(userId, inviteToken, displayName)
}

export async function getUserLeagues(userId: string) {
  const adapter = await getAdapter()
  return (adapter as any).getUserLeagues(userId)
}

export async function createLeagueInvite(leagueId: string, createdByUserId: string, options: {
  maxUses?: number
  expiresAt?: string
} = {}) {
  const adapter = await getAdapter()
  return (adapter as any).createLeagueInvite(leagueId, createdByUserId, options)
}

export async function canUserManageLeague(userId: string, leagueId: string) {
  const adapter = await getAdapter()
  return (adapter as any).canUserManageLeague(userId, leagueId)
}

export async function setUserPaidStatus(managerId: string, leagueId: string, entryId: string, paid: boolean) {
  const adapter = await getAdapter()
  return (adapter as any).setUserPaidStatus(managerId, leagueId, entryId, paid)
}

export async function makeUserLeagueManager(adminUserId: string, leagueId: string, targetUserId: string, permissions: {
  can_invite: boolean
  can_manage_payments: boolean
  can_manage_entries: boolean
  can_manage_games: boolean
}) {
  const adapter = await getAdapter()
  return (adapter as any).makeUserLeagueManager(adminUserId, leagueId, targetUserId, permissions)
}

// Picks
export async function listGames(leagueId: string, weekNo: number) {
  const adapter = await getAdapter()
  return adapter.listGames(leagueId, weekNo)
}

export async function getUsedTeams(entryId: string) {
  const adapter = await getAdapter()
  return adapter.getUsedTeams(entryId)
}

export async function getPickForWeek(entryId: string, weekNo: number) {
  const adapter = await getAdapter()
  return adapter.getPickForWeek(entryId, weekNo)
}

export async function savePick(params: {
  entryId: string
  leagueId: string
  weekNo: number
  teamAbbr: string
}) {
  const adapter = await getAdapter()
  return adapter.savePick(params)
}

// Leaderboard
export async function getLeaderboard(leagueId: string, weekNo: number) {
  const adapter = await getAdapter()
  return adapter.getLeaderboard(leagueId, weekNo)
}

export async function getPot(leagueId: string) {
  const adapter = await getAdapter()
  return (adapter as any).getPot ? (adapter as any).getPot(leagueId) : 0
}

// Weeks
export async function getWeekState(leagueId: string, weekNo: number) {
  const adapter = await getAdapter()
  return adapter.getWeekState(leagueId, weekNo)
}

export async function revealIfReady(leagueId: string, weekNo: number) {
  const adapter = await getAdapter()
  return adapter.revealIfReady(leagueId, weekNo)
}

export async function forceRevealWeek(params: {
  leagueId: string
  weekNo: number
  reason: string
}) {
  const adapter = await getAdapter()
  return (adapter as any).forceRevealWeek(params)
}

// Admin
export async function markGameWinner(params: {
  gameId: string
  winnerAbbr: string
  leagueId: string
  weekNo: number
}) {
  const adapter = await getAdapter()
  return adapter.markGameWinner(params)
}

export async function scoreWeek(params: {
  leagueId: string
  weekNo: number
}) {
  const adapter = await getAdapter()
  
  if (USE_SUPABASE) {
    // Supabase adapter expects a params object
    return (adapter as any).scoreWeek(params)
  } else {
    // Local adapter expects separate parameters
    return (adapter as any).scoreWeek(params.leagueId, params.weekNo)
  }
}

export async function getNotSubmitted(params: {
  leagueId: string
  weekNo: number
}) {
  const adapter = await getAdapter()
  
  if (USE_SUPABASE) {
    // Supabase adapter expects a params object
    return (adapter as any).getNotSubmitted(params)
  } else {
    // Local adapter expects separate parameters
    return (adapter as any).getNotSubmitted(params.leagueId, params.weekNo)
  }
}

// Teams seeding
export async function seedTeamsFromStatic(staticTeams: Array<{
  teamId: number
  abbr: string
  city: string
  name: string
  logoUrl: string
}>) {
  const adapter = await getAdapter()
  return adapter.seedTeamsFromStatic(staticTeams)
}

// SportsDataIO Integration
export async function importScheduleFromSportsDataIO(
  seasonCode: string,
  games: Array<{
    gameId: string
    dateUTC: string
    homeAbbr: string
    awayAbbr: string
    neutralSite?: boolean
    week: number
  }>
) {
  const adapter = await getAdapter()
  return adapter.importScheduleFromSportsDataIO(seasonCode, games)
}

export async function syncResultsFromSportsDataIO(
  seasonCode: string,
  week: number,
  finalScores: Array<{
    gameId: string
    homeScore: number
    awayScore: number
  }>,
  basicScores?: Array<{
    gameId: string
    status: 'Scheduled' | 'InProgress' | 'Final'
    homeScore?: number
    awayScore?: number
  }>
) {
  const adapter = await getAdapter()
  return adapter.syncResultsFromSportsDataIO(seasonCode, week, finalScores, basicScores)
}