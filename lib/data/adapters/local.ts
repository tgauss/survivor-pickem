// @ts-nocheck
import crypto from 'crypto'
import { now } from '@/lib/timectl'
import type { 
  League, 
  Entry, 
  Invite, 
  Session, 
  LeaderboardData, 
  ClaimPayload,
  LoginAttempt,
  Week,
  Team,
  Game,
  Pick,
  WeekState,
  SavePickParams,
  MarkGameWinnerParams,
  ScoreWeekResult,
  RevealResult,
  NotSubmittedEntry,
  AdminViewEvent,
  Message,
  PostMessageParams,
  ReactToMessageParams,
  SeasonEntry
} from '../types'

const leagues: League[] = []
const entries: Entry[] = []
const invites: Invite[] = []
const sessions: Session[] = []
const loginAttempts: Map<string, LoginAttempt> = new Map()
const weeks: Week[] = []
const games: Game[] = []
const picks: Pick[] = []
const adminViewEvents: AdminViewEvent[] = []
const messages: Message[] = []
const teams: Team[] = [
  { id: 'buf', abbr: 'BUF', city: 'Buffalo', name: 'Bills', logo_url: null },
  { id: 'mia', abbr: 'MIA', city: 'Miami', name: 'Dolphins', logo_url: null },
  { id: 'ne', abbr: 'NE', city: 'New England', name: 'Patriots', logo_url: null },
  { id: 'nyj', abbr: 'NYJ', city: 'New York', name: 'Jets', logo_url: null },
]

let seeded = false

export function resetState(): void {
  seeded = false
  leagues.length = 0
  entries.length = 0
  invites.length = 0
  sessions.length = 0
  loginAttempts.clear()
  weeks.length = 0
  games.length = 0
  picks.length = 0
  adminViewEvents.length = 0
  messages.length = 0
}

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function seedWeekZero(): void {
  if (seeded) return
  seeded = true

  const leagueId = 'league-1'
  leagues.push({
    id: leagueId,
    name: 'Test League 2024',
    season_year: 2024,
    buy_in_cents: 10000,
    created_by_user_id: 'user-1',
    league_code: 'test-league-2024',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  weeks.push(
    {
      id: 'week-0',
      season_year: 2024,
      week_no: 0,
      phase: 'regular' as const,
      last_kickoff_at: new Date(now() + 2 * 60 * 60 * 1000).toISOString(),
      revealed_at: null,
    },
    {
      id: 'week-1',
      season_year: 2024,
      week_no: 1,
      phase: 'regular' as const,
      last_kickoff_at: new Date(now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      revealed_at: null,
    }
  )

  // Seed games for week 0
  const week0 = weeks.find(w => w.week_no === 0)!
  games.push(
    {
      id: 'game-1',
      week_id: week0.id,
      home_team: teams.find(t => t.abbr === 'BUF')!,
      away_team: teams.find(t => t.abbr === 'MIA')!,
      kickoff_at: new Date(now() + 1 * 60 * 60 * 1000).toISOString(),
      neutral_site: false,
      status: 'scheduled' as const,
      winner_team: null,
    },
    {
      id: 'game-2',
      week_id: week0.id,
      home_team: teams.find(t => t.abbr === 'NE')!,
      away_team: teams.find(t => t.abbr === 'NYJ')!,
      kickoff_at: new Date(now() + 2 * 60 * 60 * 1000).toISOString(),
      neutral_site: false,
      status: 'scheduled' as const,
      winner_team: null,
    }
  )

  const entryData = [
    {
      id: 'entry-1',
      username: 'jsmith',
      display_name: 'Johnny Football',
      real_name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0100',
      pin_hash: hashPin('1234'),
      avatar_url: null,
      strikes: 0,
      eliminated: false,
      opted_in: true,
      paid: true,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      current_pick: { team_abbr: undefined, submitted: false },
    },
    {
      id: 'entry-2',
      username: 'sarahc',
      display_name: 'Sarah the Great',
      real_name: 'Sarah Connor',
      email: 'sarah@example.com',
      phone: '555-0101',
      pin_hash: hashPin('5678'),
      avatar_url: null,
      strikes: 1,
      eliminated: false,
      opted_in: true,
      paid: true,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      current_pick: { team_abbr: undefined, submitted: false },
    },
    {
      id: 'entry-3',
      username: 'mikej',
      display_name: 'Iron Mike',
      real_name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '555-0102',
      pin_hash: hashPin('9999'),
      avatar_url: null,
      strikes: 2,
      eliminated: true,
      opted_in: true,
      paid: false,
      paid_at: null,
      created_at: new Date().toISOString(),
      current_pick: { team_abbr: undefined, submitted: false },
    },
  ]

  entryData.forEach(data => {
    entries.push({
      ...data,
      league_id: leagueId,
      user_id: data.id, // Temporary fix for build
    } as any) // Temporary fix for build
  })
}

export async function listLeagues() {
  return leagues.map(l => ({
    id: l.id,
    league_code: l.league_code,
    name: l.name,
    season_year: l.season_year,
  } as any))
}

export function createLeague(params: {
  name: string
  season_year: number
  buy_in_cents: number
}): League {
  const league: League = {
    id: generateId(),
    name: params.name,
    season_year: params.season_year,
    buy_in_cents: params.buy_in_cents,
    created_at: new Date().toISOString(),
    league_code: `${params.season_year}-${params.name.toLowerCase().replace(/\s+/g, '-')}`,
  }
  leagues.push(league)
  return league
}

export function createInvite(leagueId: string): Invite | null {
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return null

  const invite: Invite = {
    id: generateId(),
    league_id: leagueId,
    token: generateToken(),
    claimed_by_entry: null,
    created_at: new Date().toISOString(),
    claimed_at: null,
  }
  invites.push(invite)
  return invite
}

export function getInvite(token: string): Invite | null {
  return invites.find(i => i.token === token && !i.claimed_by_entry) || null
}

export function claimInvite(token: string, payload: ClaimPayload): { entry: Entry; session: Session } | { error: string } {
  const invite = getInvite(token)
  if (!invite) {
    return { error: 'Invalid or already claimed invite' }
  }

  const leagueEntries = entries.filter(e => e.league_id === invite.league_id)
  
  if (leagueEntries.some(e => e.username.toLowerCase() === payload.username.toLowerCase())) {
    return { error: 'Username already taken in this league' }
  }
  
  if (leagueEntries.some(e => e.display_name.toLowerCase() === payload.display_name.toLowerCase())) {
    return { error: 'Display name already taken in this league' }
  }

  const entry: Entry = {
    id: generateId(),
    league_id: invite.league_id,
    username: payload.username,
    display_name: payload.display_name,
    real_name: payload.real_name,
    email: payload.email,
    phone: payload.phone,
    pin_hash: hashPin(payload.pin),
    avatar_url: payload.avatar_url || null,
    strikes: 0,
    eliminated: false,
    opted_in: true,
    paid: false,
    paid_at: null,
    created_at: new Date().toISOString(),
  }
  entries.push(entry)

  invite.claimed_by_entry = entry.id
  invite.claimed_at = new Date().toISOString()

  const session = createSession(entry.id)
  return { entry, session }
}

export function login(username: string, pin: string): Session | { error: string } {
  const lockoutKey = username.toLowerCase()
  const attempt = loginAttempts.get(lockoutKey)
  
  if (attempt && attempt.locked_until && attempt.locked_until > new Date()) {
    const minutesLeft = Math.ceil((attempt.locked_until.getTime() - now()) / 60000)
    return { error: `Account locked. Try again in ${minutesLeft} minutes.` }
  }

  const entry = entries.find(e => 
    e.username.toLowerCase() === username.toLowerCase() && 
    e.pin_hash === hashPin(pin)
  )

  if (!entry) {
    const currentAttempt = attempt || { username: lockoutKey, attempts: 0, locked_until: null }
    currentAttempt.attempts++
    
    if (currentAttempt.attempts >= 5) {
      currentAttempt.locked_until = new Date(now() + 10 * 60 * 1000)
      loginAttempts.set(lockoutKey, currentAttempt)
      return { error: 'Too many failed attempts. Account locked for 10 minutes.' }
    }
    
    loginAttempts.set(lockoutKey, currentAttempt)
    return { error: `Invalid username or PIN. ${5 - currentAttempt.attempts} attempts remaining.` }
  }

  loginAttempts.delete(lockoutKey)
  return createSession(entry.id)
}

function createSession(entryId: string): Session {
  const session: Session = {
    id: generateId(),
    entry_id: entryId,
    session_token: generateToken(),
    expires_at: new Date(now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  }
  sessions.push(session)
  return session
}

export function getSession(sessionToken: string): { entry: Entry; session: Session } | null {
  const session = sessions.find(s => 
    s.session_token === sessionToken && 
    new Date(s.expires_at) > new Date()
  )
  
  if (!session) return null
  
  const entry = entries.find(e => e.id === session.entry_id)
  if (!entry) return null
  
  return { entry, session }
}

export function logout(sessionToken: string): boolean {
  const index = sessions.findIndex(s => s.session_token === sessionToken)
  if (index === -1) return false
  
  sessions.splice(index, 1)
  return true
}

export function getLeaderboard(leagueId: string, weekNo: number): LeaderboardData | null {
  seedWeekZero()

  const league = leagues.find(l => l.id === leagueId)
  if (!league) return null

  const leagueEntries = entries.filter(e => e.league_id === leagueId)
  const aliveEntries = leagueEntries.filter(e => !e.eliminated)
  const submittedCount = leagueEntries.filter(e => !e.eliminated && e.current_pick?.submitted).length

  const concealed = submittedCount < aliveEntries.length

  const distribution = !concealed
    ? leagueEntries.reduce((acc, entry) => {
        if (entry.current_pick?.team_abbr) {
          acc[entry.current_pick.team_abbr] = (acc[entry.current_pick.team_abbr] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    : undefined

  return {
    league,
    weekNo,
    submittedCount,
    aliveCount: aliveEntries.length,
    totalCount: leagueEntries.length,
    concealed,
    entries: leagueEntries.map(e => ({
      ...e,
      current_pick: concealed && !e.eliminated ? { submitted: e.current_pick?.submitted || false } : e.current_pick,
    })),
    distribution,
  }
}

export function getPot(leagueId: string): number {
  seedWeekZero()

  const league = leagues.find(l => l.id === leagueId)
  if (!league) return 0

  const optedInCount = entries.filter(
    e => e.league_id === leagueId && e.opted_in
  ).length

  return (league.buy_in_cents * optedInCount) / 100
}

export function getAllLeagues(): League[] {
  seedWeekZero()
  return leagues
}

export function getLeagueInvites(leagueId: string, limit = 10): Invite[] {
  return invites
    .filter(i => i.league_id === leagueId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

export function listGames(leagueId: string, weekNo: number): Game[] {
  seedWeekZero()
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return []
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return []
  
  return games.filter(g => g.week_id === week.id)
}

export function getUsedTeams(entryId: string): string[] {
  const entryPicks = picks.filter(p => p.entry_id === entryId && p.team_abbr)
  return entryPicks.map(p => p.team_abbr!).filter(Boolean)
}

export function getPickForWeek(entryId: string, weekNo: number): { team_abbr?: string; submitted: boolean } | null {
  const league = leagues.find(l => entries.some(e => e.id === entryId && e.league_id === l.id))
  if (!league) return null
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return null
  
  const pick = picks.find(p => p.entry_id === entryId && p.week_id === week.id)
  if (!pick) return { submitted: false }
  
  return {
    team_abbr: pick.team_abbr || undefined,
    submitted: pick.submitted_at !== null,
  }
}

export function savePick(params: SavePickParams): { ok: true } | { error: string } {
  seedWeekZero()
  
  const { entryId, leagueId, weekNo, teamAbbr } = params
  
  const entry = entries.find(e => e.id === entryId && e.league_id === leagueId)
  if (!entry) return { error: 'Entry not found' }
  
  if (entry.eliminated) return { error: 'Cannot make picks when eliminated' }
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return { error: 'League not found' }
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return { error: 'Week not found' }
  
  // Check if week is still open
  if (now() >= Date.parse(week.last_kickoff_at)) {
    return { error: 'Pick deadline has passed' }
  }
  
  // Check for existing pick
  const existingPick = picks.find(p => p.entry_id === entryId && p.week_id === week.id)
  if (existingPick && existingPick.submitted_at) {
    return { error: 'Pick already submitted and locked for this week' }
  }
  
  // Validate team is in this week's games
  const weekGames = games.filter(g => g.week_id === week.id)
  const validTeamAbbrs = weekGames.flatMap(g => [g.home_team.abbr, g.away_team.abbr])
  if (!validTeamAbbrs.includes(teamAbbr)) {
    return { error: 'Team is not playing in this week' }
  }
  
  const team = teams.find(t => t.abbr === teamAbbr)
  const game = weekGames.find(g => 
    g.home_team.abbr === teamAbbr || g.away_team.abbr === teamAbbr
  )
  
  if (!team || !game) return { error: 'Team or game not found' }
  
  // Create or update pick
  if (existingPick) {
    existingPick.team_id = team.id
    existingPick.team_abbr = team.abbr
    existingPick.game_id = game.id
    existingPick.submitted_at = new Date().toISOString()
    existingPick.locked = true
  } else {
    picks.push({
      id: generateId(),
      entry_id: entryId,
      week_id: week.id,
      game_id: game.id,
      team_id: team.id,
      team_abbr: team.abbr,
      submitted_at: new Date().toISOString(),
      locked: true,
      result: 'pending',
    })
  }
  
  return { ok: true }
}

export function getWeekState(leagueId: string, weekNo: number): WeekState {
  seedWeekZero()
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) {
    return {
      concealed: false,
      submittedCount: 0,
      aliveCount: 0,
      lastKickoffAt: new Date().toISOString(),
    }
  }
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) {
    return {
      concealed: false,
      submittedCount: 0,
      aliveCount: 0,
      lastKickoffAt: new Date().toISOString(),
    }
  }
  
  const leagueEntries = entries.filter(e => e.league_id === leagueId)
  const aliveEntries = leagueEntries.filter(e => !e.eliminated)
  const submittedPicks = picks.filter(p => 
    p.week_id === week.id && 
    p.submitted_at !== null &&
    aliveEntries.some(e => e.id === p.entry_id)
  )
  
  const concealed = submittedPicks.length < aliveEntries.length && 
                   new Date() < new Date(week.last_kickoff_at)
  
  return {
    concealed,
    submittedCount: submittedPicks.length,
    aliveCount: aliveEntries.length,
    lastKickoffAt: week.last_kickoff_at,
  }
}

export function markGameWinner(params: MarkGameWinnerParams): { ok: true } | { error: string } {
  seedWeekZero()
  
  const { leagueId, weekNo, gameId, winnerAbbr } = params
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return { error: 'League not found' }
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return { error: 'Week not found' }
  
  const game = games.find(g => g.id === gameId && g.week_id === week.id)
  if (!game) return { error: 'Game not found' }
  
  const winnerTeam = teams.find(t => t.abbr === winnerAbbr)
  if (!winnerTeam) return { error: 'Winner team not found' }
  
  // Validate winner is playing in this game
  if (game.home_team.abbr !== winnerAbbr && game.away_team.abbr !== winnerAbbr) {
    return { error: 'Winner team is not playing in this game' }
  }
  
  // Update game
  game.status = 'final'
  game.winner_team = winnerTeam
  
  return { ok: true }
}

export function scoreWeek(leagueId: string, weekNo: number): ScoreWeekResult | { error: string } {
  seedWeekZero()
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return { error: 'League not found' }
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return { error: 'Week not found' }
  
  const leagueEntries = entries.filter(e => e.league_id === leagueId)
  const aliveEntries = leagueEntries.filter(e => !e.eliminated)
  
  const updated: ScoreWeekResult['updated'] = []
  let allLost = true
  
  // Score each alive entry
  for (const entry of aliveEntries) {
    const pick = picks.find(p => p.entry_id === entry.id && p.week_id === week.id)
    
    let pickResult: 'win' | 'loss' | 'tie' | 'pending' = 'pending'
    
    if (!pick || !pick.submitted_at || !pick.team_abbr) {
      // No pick = loss
      pickResult = 'loss'
    } else {
      // Check if team was used before (duplicate)
      const usedTeams = getUsedTeams(entry.id)
      const priorWeekUsage = picks.filter(p => 
        p.entry_id === entry.id && 
        p.team_abbr === pick.team_abbr &&
        p.week_id !== week.id &&
        p.submitted_at
      )
      
      if (priorWeekUsage.length > 0) {
        pickResult = 'loss'
      } else {
        // Check game result
        const game = games.find(g => 
          g.week_id === week.id &&
          (g.home_team.abbr === pick.team_abbr || g.away_team.abbr === pick.team_abbr)
        )
        
        if (!game) {
          pickResult = 'loss'
        } else if (game.status !== 'final' || !game.winner_team) {
          pickResult = 'pending'
        } else if (game.winner_team.abbr === pick.team_abbr) {
          pickResult = 'win'
          allLost = false
        } else {
          pickResult = 'loss'
        }
      }
    }
    
    // Update pick result
    if (pick) {
      pick.result = pickResult
    }
    
    // Calculate new strikes
    let newStrikes = entry.strikes
    let eliminated = entry.eliminated
    
    if (pickResult === 'loss') {
      newStrikes += 1
      if (newStrikes >= 2) {
        eliminated = true
      }
    } else if (pickResult === 'win') {
      allLost = false
    }
    
    updated.push({
      entryId: entry.id,
      strikes: newStrikes,
      eliminated,
      pickResult,
    })
  }
  
  // Apply all-out survive rule
  if (allLost && aliveEntries.length > 0) {
    // Roll back the week - no strikes applied
    week.rolled_back = true
    
    // Reset all picks to pending
    for (const entry of aliveEntries) {
      const pick = picks.find(p => p.entry_id === entry.id && p.week_id === week.id)
      if (pick) {
        pick.result = 'pending'
      }
    }
    
    // Return original strikes/elimination status
    return {
      ok: true,
      appliedAllOutSurvive: true,
      updated: updated.map(u => ({
        ...u,
        strikes: entries.find(e => e.id === u.entryId)!.strikes,
        eliminated: entries.find(e => e.id === u.entryId)!.eliminated,
        pickResult: 'pending' as const,
      })),
    }
  }
  
  // Apply the updates to entries
  for (const update of updated) {
    const entry = entries.find(e => e.id === update.entryId)
    if (entry) {
      entry.strikes = update.strikes
      entry.eliminated = update.eliminated
    }
  }
  
  return {
    ok: true,
    appliedAllOutSurvive: false,
    updated,
  }
}

export function revealIfReady(leagueId: string, weekNo: number, force = false, reason?: string, adminId?: string): RevealResult {
  seedWeekZero()
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return { revealed: false, reason: 'already' }
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return { revealed: false, reason: 'already' }
  
  // Already revealed
  if (week.revealed_at) return { revealed: false, reason: 'already' }
  
  const weekState = getWeekState(leagueId, weekNo)
  
  // Check natural reveal conditions
  if (weekState.submittedCount >= weekState.aliveCount) {
    week.revealed_at = new Date().toISOString()
    return { revealed: true, reason: 'all_submitted' }
  }
  
  if (now() >= Date.parse(week.last_kickoff_at)) {
    week.revealed_at = new Date().toISOString()
    return { revealed: true, reason: 'last_kickoff' }
  }
  
  // Force reveal by admin
  if (force && adminId && reason) {
    week.revealed_at = new Date().toISOString()
    
    // Log admin action
    adminViewEvents.push({
      id: generateId(),
      admin_id: adminId,
      league_id: leagueId,
      week_id: week.id,
      action: 'force_reveal',
      reason,
      viewed_at: new Date().toISOString(),
    })
    
    return { revealed: true, reason: 'forced' }
  }
  
  return { revealed: false, reason: 'already' }
}

export function getNotSubmitted(leagueId: string, weekNo: number): NotSubmittedEntry[] {
  seedWeekZero()
  
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return []
  
  const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
  if (!week) return []
  
  const leagueEntries = entries.filter(e => e.league_id === leagueId && !e.eliminated)
  const submittedEntryIds = picks
    .filter(p => p.week_id === week.id && p.submitted_at)
    .map(p => p.entry_id)
  
  return leagueEntries
    .filter(e => !submittedEntryIds.includes(e.id))
    .map(e => ({
      entryId: e.id,
      displayName: e.display_name,
    }))
}

// Chat functions
export function listMessages(leagueId: string, weekNo: number): Message[] {
  seedWeekZero()
  
  return messages
    .filter(m => m.league_id === leagueId && m.week_no === weekNo)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function postMessage(params: PostMessageParams): Message {
  seedWeekZero()
  
  const { leagueId, weekNo, entryId, body, is_spoiler = false } = params
  const trimmedBody = body.trim()
  
  if (trimmedBody.length === 0 || trimmedBody.length > 500) {
    throw new Error('Message body must be 1-500 characters')
  }
  
  // Auto-detect spoilers by checking if body contains team abbreviations for this week
  let autoSpoiler = is_spoiler
  if (!autoSpoiler) {
    const league = leagues.find(l => l.id === leagueId)
    if (league) {
      const week = weeks.find(w => w.season_year === league.season_year && w.week_no === weekNo)
      if (week && !week.revealed_at) {
        const weekGames = games.filter(g => g.week_id === week.id)
        const weekTeamAbbrs = weekGames.flatMap(g => [g.home_team.abbr, g.away_team.abbr])
        
        autoSpoiler = weekTeamAbbrs.some(abbr => 
          trimmedBody.toUpperCase().includes(abbr.toUpperCase())
        )
      }
    }
  }
  
  const message: Message = {
    id: generateId(),
    league_id: leagueId,
    week_no: weekNo,
    entry_id: entryId,
    body: trimmedBody,
    is_spoiler: autoSpoiler,
    created_at: new Date().toISOString(),
    reactions: {},
  }
  
  messages.push(message)
  return message
}

export function reactToMessage(params: ReactToMessageParams): Message {
  const { messageId, emoji } = params
  
  const message = messages.find(m => m.id === messageId)
  if (!message) {
    throw new Error('Message not found')
  }
  
  if (!message.reactions) {
    message.reactions = {}
  }
  
  // Count total reactions
  const totalReactions = Object.values(message.reactions).reduce((sum, count) => sum + count, 0)
  
  if (totalReactions >= 10 && !message.reactions[emoji]) {
    // Ignore if at limit and this is a new emoji
    return message
  }
  
  if (message.reactions[emoji]) {
    message.reactions[emoji]++
  } else {
    message.reactions[emoji] = 1
  }
  
  return message
}

// Entry helpers
export function getMySeason(entryId: string): SeasonEntry[] {
  seedWeekZero()
  
  const entry = entries.find(e => e.id === entryId)
  if (!entry) return []
  
  const league = leagues.find(l => l.id === entry.league_id)
  if (!league) return []
  
  const leagueWeeks = weeks.filter(w => w.season_year === league.season_year).sort((a, b) => a.week_no - b.week_no)
  
  return leagueWeeks.map(week => {
    const pick = picks.find(p => p.entry_id === entryId && p.week_id === week.id && p.submitted_at)
    const game = pick ? games.find(g => g.id === pick.game_id) : null
    
    let opponentTeamAbbr: string | undefined
    if (game && pick) {
      opponentTeamAbbr = game.home_team.abbr === pick.team_abbr ? game.away_team.abbr : game.home_team.abbr
    }
    
    return {
      weekNo: week.week_no,
      teamAbbr: pick?.team_abbr || undefined,
      result: pick?.result,
      opponentTeamAbbr,
      finalScore: game?.status === 'final' ? `${game.home_team.abbr} vs ${game.away_team.abbr}` : undefined,
    }
  })
}

export function getRemainingTeams(entryId: string): string[] {
  seedWeekZero()
  
  const usedTeams = getUsedTeams(entryId)
  const allTeamAbbrs = teams.map(t => t.abbr)
  
  return allTeamAbbrs.filter(abbr => !usedTeams.includes(abbr))
}

// Teams seeding functions
export function seedTeamsFromStatic(staticTeams: Array<{
  teamId: number
  abbr: string
  city: string
  name: string
  logoUrl: string
}>): void {
  // Clear existing teams and replace with static teams
  teams.length = 0
  
  staticTeams.forEach(team => {
    teams.push({
      id: team.teamId.toString(),
      abbr: team.abbr,
      city: team.city,
      name: team.name,
      logo_url: team.logoUrl,
    })
  })
}

// Test-only helper functions
export async function seedTestData(): Promise<string> {
  // Allow test functions in development for E2E testing
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    throw new Error('Test-only function')
  }

  // Clear all data
  leagues.length = 0
  entries.length = 0
  invites.length = 0
  weeks.length = 0
  games.length = 0
  picks.length = 0
  sessions.length = 0
  
  // Seed teams first
  const { getTeamsArray } = await import('@/lib/teams')
  const staticTeams = getTeamsArray()
  
  teams.length = 0
  staticTeams.forEach(team => {
    teams.push({
      id: team.teamId.toString(),
      abbr: team.abbr,
      city: team.city,
      name: team.name,
      logo_url: team.logoUrl,
    })
  })

  // Create deterministic test league
  const testLeague = {
    id: 'test-league-1',
    name: 'Test Survivor League',
    season_year: 2024,
    league_code: '2024-test-survivor',
    buy_in_cents: 5000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
  leagues.push(testLeague)
  
  return testLeague.league_code
}

export async function createTestWeek(weekNo: number, gamesCount: number = 2) {
  // Allow test functions in development for E2E testing
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    throw new Error('Test-only function')
  }

  const weekId = `test-week-${weekNo}`
  
  // Create week
  const baseTime = new Date('2024-02-01T13:00:00Z')
  const kickoffTime = new Date(baseTime.getTime() + (weekNo - 1) * 7 * 24 * 60 * 60 * 1000)
  
  const week = {
    id: weekId,
    season_year: 2024,
    week_no: weekNo,
    phase: 'regular' as const,
    last_kickoff_at: kickoffTime.toISOString(),
    revealed_at: null,
  }
  
  // Remove existing week if it exists
  const existingIndex = weeks.findIndex(w => w.week_no === weekNo)
  if (existingIndex >= 1) {
    weeks.splice(existingIndex, 1)
  }
  weeks.push(week)
  
  // Create deterministic test games
  const testTeams = ['KC', 'SF', 'BUF', 'TB']
  for (let i = 0; i < gamesCount; i++) {
    const homeTeam = teams.find(t => t.abbr === testTeams[i * 2])
    const awayTeam = teams.find(t => t.abbr === testTeams[i * 2 + 1])
    
    if (homeTeam && awayTeam) {
      const gameTime = new Date(kickoffTime.getTime() + i * 30 * 60 * 1000) // 30min apart
      
      games.push({
        id: `test-game-${weekNo}-${i + 1}`,
        week_id: weekId,
        home_team: homeTeam,
        away_team: awayTeam,
        kickoff_at: gameTime.toISOString(),
        neutral_site: false,
        status: 'scheduled',
        winner_team: null,
      })
    }
  }
  
  return week
}

// SportsDataIO integration functions
export function importScheduleFromSportsDataIO(seasonCode: string, importedGames: Array<{ 
  gameId: string; 
  dateUTC: string; 
  homeAbbr: string; 
  awayAbbr: string; 
  neutralSite?: boolean; 
  week: number 
}>): void {
  seedWeekZero() // Ensure base structure exists
  
  const seasonYear = parseInt(seasonCode.substring(0, 4))
  const isPostseason = seasonCode.endsWith('POST')
  
  // Create/update weeks as needed
  const weekIds = new Map<number, string>()
  
  importedGames.forEach(game => {
    let weekNo = game.week
    let phase: 'regular' | 'wild_card' | 'divisional' | 'conference' = 'regular'
    
    // Map playoff weeks
    if (isPostseason) {
      if (game.week === 1) {
        phase = 'wild_card'
        weekNo = 19 // Wild card week
      } else if (game.week === 2) {
        phase = 'divisional'
        weekNo = 20 // Divisional week
      } else if (game.week === 3) {
        phase = 'conference'
        weekNo = 21 // Conference championship week
      } else {
        // Skip Super Bowl (week 4)
        return
      }
    }
    
    // Ensure week exists
    let weekId = weekIds.get(weekNo)
    if (!weekId) {
      weekId = `week-${weekNo}`
      weekIds.set(weekNo, weekId)
      
      const existingWeek = weeks.find(w => w.week_no === weekNo)
      if (!existingWeek) {
        weeks.push({
          id: weekId,
          season_year: seasonYear,
          week_no: weekNo,
          phase: phase as any,
          last_kickoff_at: new Date(game.dateUTC).toISOString(),
          revealed_at: null,
        })
      } else {
        // Update last_kickoff_at to latest game time
        const gameTime = new Date(game.dateUTC)
        const currentLastKickoff = new Date(existingWeek.last_kickoff_at)
        if (gameTime > currentLastKickoff) {
          existingWeek.last_kickoff_at = gameTime.toISOString()
        }
      }
    }
    
    // Find teams
    const homeTeam = teams.find(t => t.abbr === game.homeAbbr)
    const awayTeam = teams.find(t => t.abbr === game.awayAbbr)
    
    if (!homeTeam || !awayTeam) {
      console.warn(`Teams not found for game ${game.gameId}: ${game.awayAbbr} @ ${game.homeAbbr}`)
      return
    }
    
    // Check if game already exists
    const existingGame = games.find(g => g.id === game.gameId)
    if (!existingGame) {
      games.push({
        id: game.gameId,
        week_id: weekId,
        home_team: homeTeam,
        away_team: awayTeam,
        kickoff_at: game.dateUTC,
        neutral_site: game.neutralSite || false,
        status: 'scheduled',
        winner_team: null,
      })
    }
  })
}

export function syncResultsFromSportsDataIO(
  seasonCode: string, 
  week: number, 
  finalScores: Array<{ gameId: string; homeScore: number; awayScore: number }>,
  basicScores?: Array<{ gameId: string; status: 'Scheduled' | 'InProgress' | 'Final'; homeScore?: number; awayScore?: number }>
): { finalsCount: number; updatedCount: number; scoringTriggered: boolean; allOutSurvive?: boolean } {
  seedWeekZero()
  
  let finalsCount = 0
  let updatedCount = 0
  let scoringTriggered = false
  let allOutSurvive = false
  
  // Update final scores first
  if (finalScores.length > 0) {
    finalScores.forEach(score => {
      const game = games.find(g => g.id === score.gameId)
      if (game) {
        game.status = 'final'
        game.home_score = score.homeScore
        game.away_score = score.awayScore
        
        // Determine winner
        if (score.homeScore > score.awayScore) {
          game.winner_team = game.home_team
        } else if (score.awayScore > score.homeScore) {
          game.winner_team = game.away_team
        }
        // Tie games leave winner_team as null
        
        finalsCount++
        updatedCount++
      }
    })
    
    // Trigger week scoring if we have final results
    if (finalsCount > 0) {
      // Find the league and trigger scoring
      const league = leagues[0] // Assuming single league for now
      if (league) {
        const seasonYear = parseInt(seasonCode.substring(0, 4))
        let weekNo = week
        
        // Map playoff weeks back
        if (seasonCode.endsWith('POST')) {
          if (week === 1) weekNo = 19 // Wild card
          else if (week === 2) weekNo = 20 // Divisional  
          else if (week === 3) weekNo = 21 // Conference
          else return { finalsCount, updatedCount, scoringTriggered } // Skip Super Bowl
        }
        
        const scoreResult = scoreWeek(league.id, weekNo)
        if (scoreResult && 'ok' in scoreResult) {
          scoringTriggered = true
          allOutSurvive = scoreResult.appliedAllOutSurvive
        }
      }
    }
  }
  
  // Update basic scores (status only) if no finals
  if (finalsCount === 0 && basicScores) {
    basicScores.forEach(score => {
      const game = games.find(g => g.id === score.gameId)
      if (game) {
        const oldStatus = game.status
        
        if (score.status === 'Final') {
          game.status = 'final'
        } else if (score.status === 'InProgress') {
          game.status = 'in_progress'
        } else {
          game.status = 'scheduled'
        }
        
        // Update scores if available
        if (score.homeScore !== undefined) {
          game.home_score = score.homeScore
        }
        if (score.awayScore !== undefined) {
          game.away_score = score.awayScore
        }
        
        if (oldStatus !== game.status) {
          updatedCount++
        }
      }
    })
  }
  
  return {
    finalsCount,
    updatedCount,
    scoringTriggered,
    allOutSurvive: allOutSurvive || undefined,
  }
}

// League resolver
export function getLeagueByCode(leagueCode: string): League | null {
  seedWeekZero() // Ensure base structure exists
  return leagues.find(l => {
    const code = l.league_code || `${l.season_year}-${l.name.toLowerCase().replace(/\s+/g, '-')}`
    return code === leagueCode
  }) || null
}