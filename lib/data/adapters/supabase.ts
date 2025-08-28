import { createServerClient } from '../../supabase/server'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'
import type { 
  League, 
  Invite, 
  Entry, 
  User,
  Session,
  Pick,
  Game,
  Team,
  NotSubmittedEntry,
  LeaderboardData
} from '../types'

// Helper to get supabase client
const getClient = () => createServerClient()

// Helper to map team abbreviation to team_id
async function getTeamIdByAbbr(abbr: string): Promise<string | null> {
  const client = getClient()
  const { data } = await client
    .from('teams')
    .select('id')
    .eq('abbr', abbr)
    .single()
  
  return data?.id || null
}

// Helper to batch get team IDs
async function getTeamIdMap(abbrs: string[]): Promise<Map<string, string>> {
  const client = getClient()
  const { data } = await client
    .from('teams')
    .select('id, abbr')
    .in('abbr', abbrs)
  
  const map = new Map<string, string>()
  data?.forEach(team => map.set(team.abbr, team.id))
  return map
}

// Leagues
export async function listLeagues(): Promise<League[]> {
  const client = getClient()
  const { data, error } = await client
    .from('leagues')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function createLeague(params: {
  name: string
  season_year: number
  buy_in_cents: number
}): Promise<League> {
  const client = getClient()
  const { data, error } = await client
    .from('leagues')
    .insert({
      id: uuidv4(),
      ...params,
      league_code: `${params.season_year}-${params.name.toLowerCase().replace(/\s+/g, '-')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Invites
export async function createInvite(leagueId: string): Promise<Invite> {
  const client = getClient()
  const { data, error } = await client
    .from('invites')
    .insert({
      id: uuidv4(),
      league_id: leagueId,
      token: uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getInvite(token: string): Promise<Invite | null> {
  const client = getClient()
  const { data } = await client
    .from('invites')
    .select('*, league:leagues(*)')
    .eq('token', token)
    .single()
  
  return data
}

// Entries & Sessions
export async function claimInvite(
  token: string,
  payload: {
    username: string
    displayName: string
    pin: string
  }
): Promise<{ entry: Entry; sessionToken: string }> {
  const client = getClient()
  
  // Get invite
  const invite = await getInvite(token)
  if (!invite) throw new Error('Invalid invite')
  if (invite.claimed_by_user_id) throw new Error('Invite already claimed')
  
  // Check username uniqueness
  const { data: existing } = await client
    .from('entries')
    .select('id')
    .eq('league_id', invite.league_id)
    .eq('username', payload.username)
    .single()
  
  if (existing) throw new Error('Username already taken')
  
  // Create entry
  const entryId = uuidv4()
  const { data: entry, error: entryError } = await client
    .from('entries')
    .insert({
      id: entryId,
      league_id: invite.league_id,
      username: payload.username,
      display_name: payload.displayName,
      pin_hash: payload.pin, // In production, hash this
      strikes: 0,
      is_alive: true,
      is_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (entryError) throw entryError
  
  // Update invite
  await client
    .from('invites')
    .update({
      claimed_by_entry: entryId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', invite.id)
  
  // Create session
  const sessionToken = uuidv4()
  await client
    .from('sessions')
    .insert({
      id: uuidv4(),
      entry_id: entryId,
      token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  
  return { entry, sessionToken }
}

export async function login(
  username: string,
  pin: string
): Promise<{ entry: Entry; sessionToken: string } | null> {
  const client = getClient()
  
  // For testing, compare PIN directly (no hashing)
  const { data: entry } = await client
    .from('entries')
    .select('*')
    .eq('username', username)
    .eq('pin_hash', pin)
    .single()
  
  if (!entry) return null
  
  // Create session
  const sessionToken = uuidv4()
  await client
    .from('sessions')
    .insert({
      id: uuidv4(),
      entry_id: entry.id,
      token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  
  return { entry, sessionToken }
}

export async function getSession(sessionToken: string): Promise<Session | null> {
  const client = getClient()
  
  const { data } = await client
    .from('sessions')
    .select('*, entry:entries(*, league:leagues(*))')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  return data
}

// New User-based Authentication Functions
export async function registerUser(userData: {
  username: string
  pin: string
  firstName: string
  lastName: string
  email: string
  phone: string
}): Promise<{ user: User; sessionToken: string } | { error: string }> {
  const client = getClient()
  
  // Check if username already exists
  const { data: existingUser } = await client
    .from('users')
    .select('id')
    .eq('username', userData.username)
    .single()
  
  if (existingUser) {
    return { error: 'Username already taken' }
  }
  
  // Create user
  const userId = uuidv4()
  const { data: user, error } = await client
    .from('users')
    .insert({
      id: userId,
      username: userData.username,
      pin_hash: userData.pin, // Plain text for testing
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      role: 'player',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error || !user) {
    return { error: 'Failed to create user' }
  }
  
  // Create session
  const sessionToken = uuidv4()
  await client
    .from('sessions')
    .insert({
      id: uuidv4(),
      user_id: user.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    })
  
  return { user, sessionToken }
}

export async function loginUser(
  username: string,
  pin: string
): Promise<{ user: User; sessionToken: string } | null> {
  const client = getClient()
  
  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('pin_hash', pin)
    .single()
  
  if (!user) return null
  
  // Create session
  const sessionToken = uuidv4()
  await client
    .from('sessions')
    .insert({
      id: uuidv4(),
      user_id: user.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    })
  
  return { user, sessionToken }
}

export async function getUserSession(sessionToken: string): Promise<{ user: User; session: Session } | null> {
  const client = getClient()
  
  const { data } = await client
    .from('sessions')
    .select('*, user:users(*)')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (!data || !data.user) return null
  
  return {
    session: data,
    user: data.user
  }
}

export async function claimLeagueInvite(
  userId: string,
  inviteToken: string,
  displayName: string
): Promise<{ entry: Entry } | { error: string }> {
  const client = getClient()
  
  // Get invite
  const { data: invite } = await client
    .from('invites')
    .select('*, league:leagues(*)')
    .eq('token', inviteToken)
    .single()
  
  if (!invite) {
    return { error: 'Invalid invite code' }
  }
  
  // Check if invite is still valid
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: 'Invite code has expired' }
  }
  
  if (invite.max_uses && invite.current_uses >= invite.max_uses) {
    return { error: 'Invite code has reached maximum uses' }
  }
  
  // Check if user is already in this league
  const { data: existingEntry } = await client
    .from('entries')
    .select('id')
    .eq('league_id', invite.league_id)
    .eq('user_id', userId)
    .single()
  
  if (existingEntry) {
    return { error: 'You are already a member of this league' }
  }
  
  // Create entry
  const entryId = uuidv4()
  const { data: entry, error } = await client
    .from('entries')
    .insert({
      id: entryId,
      league_id: invite.league_id,
      user_id: userId,
      display_name: displayName,
      strikes: 0,
      eliminated: false,
      opted_in: true,
      paid: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error || !entry) {
    return { error: 'Failed to join league' }
  }
  
  // Update invite usage
  await client
    .from('invites')
    .update({
      current_uses: invite.current_uses + 1,
      claimed_at: new Date().toISOString()
    })
    .eq('id', invite.id)
  
  return { entry }
}

export async function getUserLeagues(userId: string): Promise<League[]> {
  const client = getClient()
  
  const { data: entries } = await client
    .from('entries')
    .select('league:leagues(*)')
    .eq('user_id', userId)
  
  if (!entries) return []
  
  return entries.map(entry => entry.league).filter(Boolean) as unknown as League[]
}

// League Management Functions
export async function createLeagueInvite(
  leagueId: string,
  createdByUserId: string,
  options: {
    maxUses?: number
    expiresAt?: string
  } = {}
): Promise<{ invite: Invite; inviteCode: string } | { error: string }> {
  const client = getClient()
  
  // Check if user has permission to create invites for this league
  const canManage = await canUserManageLeague(createdByUserId, leagueId)
  if (!canManage) {
    return { error: 'You do not have permission to create invites for this league' }
  }
  
  const inviteToken = Math.random().toString(36).substring(2, 12).toUpperCase()
  const inviteId = uuidv4()
  
  const { data: invite, error } = await client
    .from('invites')
    .insert({
      id: inviteId,
      league_id: leagueId,
      token: inviteToken,
      created_by_user_id: createdByUserId,
      max_uses: options.maxUses || null,
      current_uses: 0,
      expires_at: options.expiresAt || null,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error || !invite) {
    return { error: 'Failed to create invite' }
  }
  
  return { invite, inviteCode: inviteToken }
}

export async function canUserManageLeague(userId: string, leagueId: string): Promise<boolean> {
  const client = getClient()
  
  // Check if user is super admin
  const { data: user } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (user?.role === 'super_admin') return true
  
  // Check if user created the league
  const { data: league } = await client
    .from('leagues')
    .select('created_by_user_id')
    .eq('id', leagueId)
    .single()
  
  if (league?.created_by_user_id === userId) return true
  
  // Check if user is a league manager
  const { data: manager } = await client
    .from('league_managers')
    .select('id')
    .eq('user_id', userId)
    .eq('league_id', leagueId)
    .single()
  
  return !!manager
}

export async function setUserPaidStatus(
  managerId: string,
  leagueId: string,
  entryId: string,
  paid: boolean
): Promise<{ success: boolean } | { error: string }> {
  const client = getClient()
  
  // Check permissions
  const canManage = await canUserManageLeague(managerId, leagueId)
  if (!canManage) {
    return { error: 'You do not have permission to manage payments for this league' }
  }
  
  const { error } = await client
    .from('entries')
    .update({
      paid,
      paid_at: paid ? new Date().toISOString() : null
    })
    .eq('id', entryId)
    .eq('league_id', leagueId)
  
  if (error) {
    return { error: 'Failed to update payment status' }
  }
  
  return { success: true }
}

export async function makeUserLeagueManager(
  adminUserId: string,
  leagueId: string,
  targetUserId: string,
  permissions: {
    can_invite: boolean
    can_manage_payments: boolean
    can_manage_entries: boolean
    can_manage_games: boolean
  }
): Promise<{ success: boolean } | { error: string }> {
  const client = getClient()
  
  // Only super admins or league creators can assign managers
  const { data: admin } = await client
    .from('users')
    .select('role')
    .eq('id', adminUserId)
    .single()
  
  const { data: league } = await client
    .from('leagues')
    .select('created_by_user_id')
    .eq('id', leagueId)
    .single()
  
  const canAssignManager = admin?.role === 'super_admin' || league?.created_by_user_id === adminUserId
  
  if (!canAssignManager) {
    return { error: 'You do not have permission to assign league managers' }
  }
  
  // Update user role to league_manager if they're currently just a player
  await client
    .from('users')
    .update({ role: 'league_manager' })
    .eq('id', targetUserId)
    .eq('role', 'player')
  
  // Create or update league manager record
  const { error } = await client
    .from('league_managers')
    .upsert({
      id: uuidv4(),
      league_id: leagueId,
      user_id: targetUserId,
      permissions,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    return { error: 'Failed to assign league manager' }
  }
  
  return { success: true }
}

export async function logout(sessionToken: string): Promise<void> {
  const client = getClient()
  
  await client
    .from('sessions')
    .delete()
    .eq('token', sessionToken)
}

// Picks
export async function listGames(leagueId: string, weekNo: number): Promise<Game[]> {
  const client = getClient()
  
  // Get week
  const { data: week } = await client
    .from('weeks')
    .select('id')
    .eq('league_id', leagueId)
    .eq('week_no', weekNo)
    .single()
  
  if (!week) return []
  
  // Get games with teams
  const { data: games } = await client
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*),
      winner_team:teams!games_winner_team_id_fkey(*)
    `)
    .eq('week_id', week.id)
    .order('start_time', { ascending: true })
  
  return games || []
}

export async function getUsedTeams(entryId: string): Promise<string[]> {
  const client = getClient()
  
  const { data } = await client
    .from('picks')
    .select('team:teams(abbr)')
    .eq('entry_id', entryId)
  
  return data?.map((p: any) => p.team?.abbr).filter(Boolean) || []
}

export async function getPickForWeek(entryId: string, weekNo: number): Promise<Pick | null> {
  const client = getClient()
  
  // Get entry with league
  const { data: entry } = await client
    .from('entries')
    .select('*, league:leagues(*)')
    .eq('id', entryId)
    .single()
  
  if (!entry) return null
  
  // Get week
  const { data: week } = await client
    .from('weeks')
    .select('id')
    .eq('league_id', entry.league_id)
    .eq('week_no', weekNo)
    .single()
  
  if (!week) return null
  
  // Get pick with team
  const { data: pick } = await client
    .from('picks')
    .select('*, team:teams(*)')
    .eq('entry_id', entryId)
    .eq('week_id', week.id)
    .single()
  
  if (!pick) return null
  
  return {
    ...pick,
    week_no: weekNo,
    team_abbr: pick.team?.abbr
  }
}

export async function savePick(params: {
  entryId: string
  leagueId: string
  weekNo: number
  teamAbbr: string
}): Promise<Pick> {
  const client = getClient()
  
  // Check if already has pick (picks are final once submitted)
  const existing = await getPickForWeek(params.entryId, params.weekNo)
  if (existing) throw new Error('Pick already submitted for this week')
  
  // Check duplicate team
  const used = await getUsedTeams(params.entryId)
  if (used.includes(params.teamAbbr)) {
    throw new Error(`Already used ${params.teamAbbr} in a previous week`)
  }
  
  // Get week
  const { data: week } = await client
    .from('weeks')
    .select('id')
    .eq('league_id', params.leagueId)
    .eq('week_no', params.weekNo)
    .single()
  
  if (!week) throw new Error('Week not found')
  
  // Get team ID
  const teamId = await getTeamIdByAbbr(params.teamAbbr)
  if (!teamId) throw new Error('Team not found')
  
  // Create pick
  const { data: pick, error } = await client
    .from('picks')
    .insert({
      id: uuidv4(),
      entry_id: params.entryId,
      week_id: week.id,
      team_id: teamId,
      is_correct: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('*, team:teams(*)')
    .single()
  
  if (error) throw error
  
  return {
    ...pick,
    week_no: params.weekNo,
    team_abbr: pick.team?.abbr
  }
}

// Leaderboard
export async function getLeaderboard(leagueId: string, weekNo: number): Promise<LeaderboardData | null> {
  const client = getClient()
  
  // Get league
  const { data: league } = await client
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single()
  
  if (!league) return null
  
  // Get all entries for league
  const { data: entries } = await client
    .from('entries')
    .select('*')
    .eq('league_id', leagueId)
    .order('display_name')
  
  if (!entries) return null
  
  const aliveEntries = entries.filter(e => !e.eliminated)
  
  // Get current picks for week
  const { data: currentPicks } = await client
    .from('picks')
    .select('*, team:teams(abbr), week:weeks(week_no)')
    .eq('week_id', weekNo)
    .in('entry_id', entries.map(e => e.id))
  
  // Count submitted picks
  const submittedCount = currentPicks?.filter(p => p.submitted_at).length || 0
  const concealed = submittedCount < aliveEntries.length
  
  // Build distribution if not concealed
  const distribution = !concealed && currentPicks
    ? currentPicks.reduce((acc, pick) => {
        if (pick.team?.abbr) {
          acc[pick.team.abbr] = (acc[pick.team.abbr] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    : undefined
  
  // Add current pick info to entries
  const entriesWithPicks = entries.map(entry => {
    const currentPick = currentPicks?.find(p => p.entry_id === entry.id)
    return {
      ...entry,
      current_pick: currentPick 
        ? {
            team_abbr: !concealed ? currentPick.team?.abbr : undefined,
            submitted: !!currentPick.submitted_at
          }
        : { submitted: false }
    }
  })
  
  return {
    league,
    weekNo,
    submittedCount,
    aliveCount: aliveEntries.length,
    totalCount: entries.length,
    concealed,
    entries: entriesWithPicks,
    distribution
  }
}

// Weeks
export async function getWeekState(leagueId: string, weekNo: number) {
  const client = getClient()
  
  // Get week
  const { data: week } = await client
    .from('weeks')
    .select('*')
    .eq('league_id', leagueId)
    .eq('week_no', weekNo)
    .single()
  
  if (!week) {
    // Create week if doesn't exist
    const phase: 'regular' | 'wild_card' | 'divisional' | 'conference' | 'super_bowl' = weekNo === 0 ? 'regular' : 
                               weekNo === 1 ? 'wild_card' :
                               weekNo === 2 ? 'divisional' :
                               weekNo === 3 ? 'conference' : 'regular'
    
    const { data: newWeek } = await client
      .from('weeks')
      .insert({
        id: uuidv4(),
        league_id: leagueId,
        week_no: weekNo,
        phase,
        concealed: true,
        rolled_back: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    return newWeek
  }
  
  return week
}

export async function revealIfReady(leagueId: string, weekNo: number): Promise<boolean> {
  const client = getClient()
  
  // Get week
  const week = await getWeekState(leagueId, weekNo)
  if (!week || !week.concealed) return false
  
  // Check if all games are final
  const { data: games } = await client
    .from('games')
    .select('status')
    .eq('week_id', week.id)
  
  if (!games || games.some(g => g.status !== 'final')) return false
  
  // Reveal week
  await client
    .from('weeks')
    .update({
      concealed: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', week.id)
  
  return true
}

// Admin
export async function markGameWinner(params: {
  gameId: string
  winnerAbbr: string
  leagueId: string
  weekNo: number
}): Promise<void> {
  const client = getClient()
  
  // Get winner team ID
  const winnerTeamId = await getTeamIdByAbbr(params.winnerAbbr)
  if (!winnerTeamId) throw new Error('Winner team not found')
  
  // Update game
  await client
    .from('games')
    .update({
      winner_team_id: winnerTeamId,
      status: 'final',
      updated_at: new Date().toISOString()
    })
    .eq('id', params.gameId)
}

export async function scoreWeek(params: {
  leagueId: string
  weekNo: number
}): Promise<{ updated: string[]; appliedAllOutSurvive: boolean }> {
  const client = getClient()
  
  // Get week
  const week = await getWeekState(params.leagueId, params.weekNo)
  if (!week) throw new Error('Week not found')
  
  // Get all games for week
  const { data: games } = await client
    .from('games')
    .select('*, winner_team:teams!games_winner_team_id_fkey(*)')
    .eq('week_id', week.id)
  
  if (!games || games.some(g => !g.winner_team_id)) {
    throw new Error('Not all games have winners')
  }
  
  // Get all picks for week
  const { data: picks } = await client
    .from('picks')
    .select('*, entry:entries(*), team:teams(*)')
    .eq('week_id', week.id)
  
  if (!picks) return { updated: [], appliedAllOutSurvive: false }
  
  // Calculate correctness
  const updates: Array<{ id: string; is_correct: boolean }> = []
  let allLost = true
  
  for (const pick of picks) {
    const game = games.find(g => 
      g.home_team_id === pick.team_id || g.away_team_id === pick.team_id
    )
    
    if (game) {
      const isCorrect = game.winner_team_id === pick.team_id
      updates.push({ id: pick.id, is_correct: isCorrect })
      if (isCorrect) allLost = false
    }
  }
  
  // Apply all-out survive rule if everyone lost
  if (allLost) {
    // Don't mark anyone wrong
    return { updated: [], appliedAllOutSurvive: true }
  }
  
  // Update picks
  for (const update of updates) {
    await client
      .from('picks')
      .update({
        is_correct: update.is_correct,
        updated_at: new Date().toISOString()
      })
      .eq('id', update.id)
    
    // Update entry strikes if incorrect
    if (!update.is_correct) {
      const pick = picks.find(p => p.id === update.id)
      if (pick?.entry) {
        const newStrikes = pick.entry.strikes + 1
        await client
          .from('entries')
          .update({
            strikes: newStrikes,
            is_alive: newStrikes < 3,
            updated_at: new Date().toISOString()
          })
          .eq('id', pick.entry.id)
      }
    }
  }
  
  return { updated: updates.map(u => u.id), appliedAllOutSurvive: false }
}

export async function getNotSubmitted(params: {
  leagueId: string
  weekNo: number
}): Promise<NotSubmittedEntry[]> {
  const client = getClient()
  
  // Get week
  const week = await getWeekState(params.leagueId, params.weekNo)
  if (!week) return []
  
  // Get alive entries
  const { data: entries } = await client
    .from('entries')
    .select('*')
    .eq('league_id', params.leagueId)
    .eq('is_alive', true)
  
  if (!entries) return []
  
  // Get picks for this week
  const { data: picks } = await client
    .from('picks')
    .select('entry_id')
    .eq('week_id', week.id)
  
  const submittedEntryIds = new Set(picks?.map(p => p.entry_id) || [])
  
  return entries
    .filter(e => !submittedEntryIds.has(e.id))
    .map(e => ({
      entryId: e.id,
      displayName: e.display_name
    }))
}

// Additional admin functions from local adapter
export async function listInvites(leagueId: string): Promise<Invite[]> {
  const client = getClient()
  const { data } = await client
    .from('invites')
    .select('*, claimed_entry:entries(display_name)')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
  
  return data?.map(invite => ({
    ...invite,
    claimed_by_entry: invite.claimed_entry ? {
      display_name: invite.claimed_entry.display_name
    } : null
  })) || []
}

export async function forceRevealWeek(params: {
  leagueId: string
  weekNo: number
  reason: string
}): Promise<void> {
  const client = getClient()
  
  const week = await getWeekState(params.leagueId, params.weekNo)
  if (!week) throw new Error('Week not found')
  
  await client
    .from('weeks')
    .update({
      concealed: false,
      reveal_reason: params.reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', week.id)
}

// Teams seeding functions
export async function seedTeamsFromStatic(staticTeams: Array<{
  teamId: number
  abbr: string
  city: string
  name: string
  logoUrl: string
}>): Promise<void> {
  const client = getClient()
  
  // Upsert teams
  const teams = staticTeams.map(team => ({
    id: `static-${team.teamId}`,
    abbr: team.abbr,
    city: team.city,
    name: team.name,
    logo_url: team.logoUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
  
  await client
    .from('teams')
    .upsert(teams, {
      onConflict: 'abbr',
      ignoreDuplicates: false
    })
}

// SportsDataIO integration functions
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
): Promise<void> {
  const client = getClient()
  
  // Get all leagues for this season
  const seasonYear = parseInt(seasonCode.slice(0, 4))
  const { data: leagues } = await client
    .from('leagues')
    .select('id')
    .eq('season_year', seasonYear)
  
  if (!leagues || leagues.length === 0) return
  
  // Group games by week
  const gamesByWeek = games.reduce((acc, game) => {
    if (!acc[game.week]) acc[game.week] = []
    acc[game.week].push(game)
    return acc
  }, {} as Record<number, typeof games>)
  
  // Get team ID map
  const allAbbrs = [...new Set(games.flatMap(g => [g.homeAbbr, g.awayAbbr]))]
  const teamMap = await getTeamIdMap(allAbbrs)
  
  // Process each league
  for (const league of leagues) {
    for (const [weekNum, weekGames] of Object.entries(gamesByWeek)) {
      const weekNo = parseInt(weekNum)
      
      // Determine phase based on season type and week
      const isPlayoffs = seasonCode.includes('POST')
      const phase: 'regular' | 'wild_card' | 'divisional' | 'conference' | 'super_bowl' = !isPlayoffs ? 'regular' :
                                 weekNo === 1 ? 'wild_card' :
                                 weekNo === 2 ? 'divisional' :
                                 weekNo === 3 ? 'conference' : 'regular'
      
      // Skip Super Bowl (week 4 in playoffs)
      if (isPlayoffs && weekNo === 4) continue
      
      // Get or create week
      let week = await getWeekState(league.id, weekNo)
      if (!week) {
        const { data: newWeek } = await client
          .from('weeks')
          .insert({
            id: uuidv4(),
            league_id: league.id,
            week_no: weekNo,
            phase,
            concealed: true,
            rolled_back: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        week = newWeek
      }
      
      if (!week) continue
      
      // Upsert games
      const gamesToUpsert = weekGames.map(game => ({
        id: `${league.id}-${game.gameId}`,
        week_id: week.id,
        home_team_id: teamMap.get(game.homeAbbr) || null,
        away_team_id: teamMap.get(game.awayAbbr) || null,
        start_time: game.dateUTC,
        neutral_site: game.neutralSite || false,
        status: 'scheduled' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      await client
        .from('games')
        .upsert(gamesToUpsert, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
    }
  }
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
): Promise<{
  finalsCount: number
  updatedCount: number
  scoringTriggered: boolean
  allOutSurvive?: boolean
}> {
  const client = getClient()
  
  // Get all leagues for this season
  const seasonYear = parseInt(seasonCode.slice(0, 4))
  const { data: leagues } = await client
    .from('leagues')
    .select('id')
    .eq('season_year', seasonYear)
  
  if (!leagues || leagues.length === 0) {
    return { finalsCount: 0, updatedCount: 0, scoringTriggered: false }
  }
  
  let finalsCount = 0
  let updatedCount = 0
  let scoringTriggered = false
  let allOutSurvive = false
  
  for (const league of leagues) {
    // Get week
    const weekState = await getWeekState(league.id, week)
    if (!weekState) continue
    
    // Update final scores
    for (const score of finalScores) {
      const gameId = `${league.id}-${score.gameId}`
      
      // Get game to determine winner
      const { data: game } = await client
        .from('games')
        .select('home_team_id, away_team_id')
        .eq('id', gameId)
        .single()
      
      if (!game) continue
      
      const winnerTeamId = score.homeScore > score.awayScore ? 
                          game.home_team_id : game.away_team_id
      
      await client
        .from('games')
        .update({
          winner_team_id: winnerTeamId,
          home_score: score.homeScore,
          away_score: score.awayScore,
          status: 'final',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)
      
      finalsCount++
      updatedCount++
    }
    
    // Update basic scores (for in-progress games)
    if (basicScores) {
      for (const score of basicScores) {
        if (finalScores.some(f => f.gameId === score.gameId)) continue
        
        const gameId = `${league.id}-${score.gameId}`
        const status = score.status.toLowerCase() as 'scheduled' | 'in_progress' | 'final'
        
        await client
          .from('games')
          .update({
            home_score: score.homeScore || null,
            away_score: score.awayScore || null,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId)
        
        updatedCount++
      }
    }
    
    // Check if all games are final and trigger scoring
    const { data: allGames } = await client
      .from('games')
      .select('status')
      .eq('week_id', weekState.id)
    
    if (allGames && allGames.every(g => g.status === 'final')) {
      const result = await scoreWeek({ leagueId: league.id, weekNo: week })
      scoringTriggered = true
      allOutSurvive = result.appliedAllOutSurvive
    }
  }
  
  return { finalsCount, updatedCount, scoringTriggered, allOutSurvive }
}

// Pot calculation
export async function getPot(leagueId: string): Promise<{ 
  total: number
  paid_count: number 
  unpaid_count: number 
}> {
  const client = getClient()
  
  // Get all entries for the league
  const { data: entries } = await client
    .from('entries')
    .select('paid')
    .eq('league_id', leagueId)
  
  if (!entries) {
    return { total: 0, paid_count: 0, unpaid_count: 0 }
  }
  
  const paid_count = entries.filter(e => e.paid).length
  const unpaid_count = entries.filter(e => !e.paid).length
  const total = paid_count * 25 // $25 per entry
  
  return { total, paid_count, unpaid_count }
}

// League resolver
export async function getLeagueByCode(leagueCode: string): Promise<{ id: string; name: string; season_year: number; league_code: string } | null> {
  const client = getClient()
  
  const { data } = await client
    .from('leagues')
    .select('id, name, season_year, league_code')
    .eq('league_code', leagueCode)
    .single()
  
  if (data) {
    return data
  }
  
  // Fallback: search by generated code pattern
  const { data: allLeagues } = await client
    .from('leagues')
    .select('id, name, season_year, league_code')
  
  return allLeagues?.find(l => {
    const code = l.league_code || `${l.season_year}-${l.name.toLowerCase().replace(/\s+/g, '-')}`
    return code === leagueCode
  }) || null
}