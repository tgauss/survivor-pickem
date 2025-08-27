export interface League {
  id: string
  name: string
  season_year: number
  buy_in_cents: number
  created_at: string
  league_code?: string
}

export interface Entry {
  id: string
  league_id: string
  username: string
  display_name: string
  real_name: string
  email: string
  phone: string
  pin_hash: string
  avatar_url: string | null
  strikes: number
  eliminated: boolean
  opted_in: boolean
  paid: boolean
  paid_at: string | null
  created_at: string
  current_pick?: {
    team_abbr?: string
    submitted: boolean
  }
}

export interface Invite {
  id: string
  league_id: string
  token: string
  claimed_by_entry: string | null
  created_at: string
  claimed_at: string | null
}

export interface Session {
  id: string
  entry_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export interface Week {
  id: string
  season_year: number
  week_no: number
  phase: 'regular' | 'wild_card' | 'divisional' | 'conference' | 'super_bowl'
  last_kickoff_at: string
  revealed_at: string | null
  rolled_back?: boolean
}

export interface Team {
  id: string
  abbr: string
  city: string
  name: string
  logo_url: string | null
}

export interface Game {
  id: string
  week_id: string
  home_team: Team
  away_team: Team
  kickoff_at: string
  neutral_site: boolean
  status: 'scheduled' | 'in_progress' | 'final'
  winner_team: Team | null
  home_score?: number
  away_score?: number
}

export interface Pick {
  id: string
  entry_id: string
  week_id: string
  game_id: string | null
  team_id: string | null
  team_abbr: string | null
  submitted_at: string | null
  locked: boolean
  result: 'pending' | 'win' | 'loss' | 'tie'
}

export interface WeekState {
  concealed: boolean
  submittedCount: number
  aliveCount: number
  lastKickoffAt: string
}

export interface LeaderboardData {
  league: League
  weekNo: number
  submittedCount: number
  aliveCount: number
  totalCount: number
  concealed: boolean
  entries: Entry[]
  distribution?: Record<string, number>
}

export interface ClaimPayload {
  username: string
  display_name: string
  real_name: string
  email: string
  phone: string
  pin: string
  avatar_url?: string | null
}

export interface LoginAttempt {
  username: string
  attempts: number
  locked_until: Date | null
}

export interface SavePickParams {
  entryId: string
  leagueId: string
  weekNo: number
  teamAbbr: string
}

export interface MarkGameWinnerParams {
  leagueId: string
  weekNo: number
  gameId: string
  winnerAbbr: string
}

export interface ScoreWeekResult {
  ok: true
  appliedAllOutSurvive: boolean
  updated: {
    entryId: string
    strikes: number
    eliminated: boolean
    pickResult: 'win' | 'loss' | 'tie' | 'pending'
  }[]
}

export interface RevealResult {
  revealed: boolean
  reason: 'all_submitted' | 'last_kickoff' | 'forced' | 'already'
}

export interface NotSubmittedEntry {
  entryId: string
  displayName: string
}

export interface Message {
  id: string
  league_id: string
  week_no: number
  entry_id: string
  body: string
  is_spoiler: boolean
  created_at: string
  reactions?: Record<string, number>
}

export interface PostMessageParams {
  leagueId: string
  weekNo: number
  entryId: string
  body: string
  is_spoiler?: boolean
}

export interface ReactToMessageParams {
  messageId: string
  emoji: string
}

export interface SeasonEntry {
  weekNo: number
  teamAbbr?: string
  result?: 'win' | 'loss' | 'tie' | 'pending'
  opponentTeamAbbr?: string
  finalScore?: string
}

export interface AdminViewEvent {
  id: string
  admin_id: string
  league_id: string
  week_id?: string
  action: string
  reason: string
  viewed_at: string
}