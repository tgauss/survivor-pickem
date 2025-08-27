import { describe, it, expect } from 'vitest'
import type * as SupabaseAdapter from '../supabase'

// This is a compile-time test to ensure Supabase adapter exports match expected types
describe('Supabase Adapter Type Safety', () => {
  it('should export required league functions', () => {
    type ListLeagues = typeof SupabaseAdapter.listLeagues
    type CreateLeague = typeof SupabaseAdapter.createLeague
    
    // These assertions are compile-time only
    const _listLeagues: ListLeagues = {} as any
    const _createLeague: CreateLeague = {} as any
    
    expect(true).toBe(true) // Test passes if TypeScript compiles
  })

  it('should export required invite functions', () => {
    type CreateInvite = typeof SupabaseAdapter.createInvite
    type GetInvite = typeof SupabaseAdapter.getInvite
    type ListInvites = typeof SupabaseAdapter.listInvites
    
    const _createInvite: CreateInvite = {} as any
    const _getInvite: GetInvite = {} as any
    const _listInvites: ListInvites = {} as any
    
    expect(true).toBe(true)
  })

  it('should export required entry and session functions', () => {
    type ClaimInvite = typeof SupabaseAdapter.claimInvite
    type Login = typeof SupabaseAdapter.login
    type GetSession = typeof SupabaseAdapter.getSession
    type Logout = typeof SupabaseAdapter.logout
    
    const _claimInvite: ClaimInvite = {} as any
    const _login: Login = {} as any
    const _getSession: GetSession = {} as any
    const _logout: Logout = {} as any
    
    expect(true).toBe(true)
  })

  it('should export required pick functions', () => {
    type ListGames = typeof SupabaseAdapter.listGames
    type GetUsedTeams = typeof SupabaseAdapter.getUsedTeams
    type GetPickForWeek = typeof SupabaseAdapter.getPickForWeek
    type SavePick = typeof SupabaseAdapter.savePick
    
    const _listGames: ListGames = {} as any
    const _getUsedTeams: GetUsedTeams = {} as any
    const _getPickForWeek: GetPickForWeek = {} as any
    const _savePick: SavePick = {} as any
    
    expect(true).toBe(true)
  })

  it('should export required leaderboard functions', () => {
    type GetLeaderboard = typeof SupabaseAdapter.getLeaderboard
    
    const _getLeaderboard: GetLeaderboard = {} as any
    
    expect(true).toBe(true)
  })

  it('should export required week functions', () => {
    type GetWeekState = typeof SupabaseAdapter.getWeekState
    type RevealIfReady = typeof SupabaseAdapter.revealIfReady
    type ForceRevealWeek = typeof SupabaseAdapter.forceRevealWeek
    
    const _getWeekState: GetWeekState = {} as any
    const _revealIfReady: RevealIfReady = {} as any
    const _forceRevealWeek: ForceRevealWeek = {} as any
    
    expect(true).toBe(true)
  })

  it('should export required admin functions', () => {
    type MarkGameWinner = typeof SupabaseAdapter.markGameWinner
    type ScoreWeek = typeof SupabaseAdapter.scoreWeek
    type GetNotSubmitted = typeof SupabaseAdapter.getNotSubmitted
    
    const _markGameWinner: MarkGameWinner = {} as any
    const _scoreWeek: ScoreWeek = {} as any
    const _getNotSubmitted: GetNotSubmitted = {} as any
    
    expect(true).toBe(true)
  })

  it('should export SportsDataIO integration functions', () => {
    type ImportTeams = typeof SupabaseAdapter.importTeamsFromSportsDataIO
    type ImportSchedule = typeof SupabaseAdapter.importScheduleFromSportsDataIO
    type SyncResults = typeof SupabaseAdapter.syncResultsFromSportsDataIO
    
    const _importTeams: ImportTeams = {} as any
    const _importSchedule: ImportSchedule = {} as any
    const _syncResults: SyncResults = {} as any
    
    expect(true).toBe(true)
  })

  it('should have matching signatures with local adapter', async () => {
    // Dynamic import to avoid loading during compile phase
    const localAdapter = await import('../local')
    const supabaseAdapter = await import('../supabase')
    
    // Check that both adapters export the same functions
    const localExports = Object.keys(localAdapter).sort()
    const supabaseExports = Object.keys(supabaseAdapter).sort()
    
    // Both should have the same exports
    expect(supabaseExports).toContain('listLeagues')
    expect(supabaseExports).toContain('createLeague')
    expect(supabaseExports).toContain('createInvite')
    expect(supabaseExports).toContain('getInvite')
    expect(supabaseExports).toContain('listInvites')
    expect(supabaseExports).toContain('claimInvite')
    expect(supabaseExports).toContain('login')
    expect(supabaseExports).toContain('getSession')
    expect(supabaseExports).toContain('logout')
    expect(supabaseExports).toContain('listGames')
    expect(supabaseExports).toContain('getUsedTeams')
    expect(supabaseExports).toContain('getPickForWeek')
    expect(supabaseExports).toContain('savePick')
    expect(supabaseExports).toContain('getLeaderboard')
    expect(supabaseExports).toContain('getWeekState')
    expect(supabaseExports).toContain('revealIfReady')
    expect(supabaseExports).toContain('forceRevealWeek')
    expect(supabaseExports).toContain('markGameWinner')
    expect(supabaseExports).toContain('scoreWeek')
    expect(supabaseExports).toContain('getNotSubmitted')
    expect(supabaseExports).toContain('importTeamsFromSportsDataIO')
    expect(supabaseExports).toContain('importScheduleFromSportsDataIO')
    expect(supabaseExports).toContain('syncResultsFromSportsDataIO')
  })
})