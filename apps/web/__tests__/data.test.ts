import { describe, it, expect, beforeEach } from 'vitest'
import { setupTest, testEntryId, testLeagueId, testTeamAbbr, testUsedTeamAbbr, testAdminId } from '../lib/testkit'
import { 
  savePick, 
  scoreWeek, 
  revealIfReady,
  markGameWinner,
  getUsedTeams,
  getPickForWeek,
  getWeekState 
} from '../lib/data/adapters/local'

describe('Data Layer', () => {
  beforeEach(() => {
    setupTest()
  })

  describe('savePick', () => {
    it('should save a valid pick successfully', () => {
      const result = savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0, // Week 0 has games, week 1 doesn't
        teamAbbr: testTeamAbbr(),
      })
      
      expect(result).toEqual({ ok: true })
    })

    it('should reject pick for eliminated entry', () => {
      const result = savePick({
        entryId: 'entry-3', // eliminated entry
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: testTeamAbbr(),
      })
      
      expect(result).toEqual({ error: 'Cannot make picks when eliminated' })
    })

    it('should reject invalid team abbr', () => {
      const result = savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: 'INVALID',
      })
      
      expect(result).toEqual({ error: 'Team is not playing in this week' })
    })

    it('should reject duplicate pick submission', () => {
      // First pick
      savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: testTeamAbbr(),
      })
      
      // Attempt duplicate
      const result = savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: 'NE',
      })
      
      expect(result).toEqual({ error: 'Pick already submitted and locked for this week' })
    })
  })

  describe('scoreWeek', () => {
    beforeEach(() => {
      // Set up game winners for week 0
      markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-1',
        winnerAbbr: 'BUF',
      })
      markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-2',
        winnerAbbr: 'NE',
      })
    })

    it('should score week correctly with winners and losers', () => {
      const result = scoreWeek(testLeagueId(), 0)
      
      expect(result).toMatchObject({
        ok: true,
        appliedAllOutSurvive: true, // All lose because no picks
      })
      
      if ('updated' in result) {
        // All picks are pending due to all-out survive
        result.updated.forEach(update => {
          expect(update.pickResult).toBe('pending')
        })
      }
    })

    it('should apply all-out survive when everyone loses', () => {
      // Mark all teams as losers by changing winners
      markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-1',
        winnerAbbr: 'MIA', // BUF loses
      })
      markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-2',
        winnerAbbr: 'NYJ', // NE loses  
      })

      const result = scoreWeek(testLeagueId(), 0)
      
      expect(result).toMatchObject({
        ok: true,
        appliedAllOutSurvive: true,
      })
      
      // All picks should be pending (rolled back)
      if ('updated' in result) {
        result.updated.forEach(update => {
          expect(update.pickResult).toBe('pending')
        })
      }
    })
  })

  describe('revealIfReady', () => {
    it('should reveal when all alive have submitted', () => {
      // Make picks for both alive entries to complete submissions
      savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: 'BUF',
      })
      savePick({
        entryId: 'entry-2',
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: 'NE',
      })
      
      const result = revealIfReady(testLeagueId(), 0)
      expect(result).toEqual({ revealed: true, reason: 'all_submitted' })
    })

    it('should force reveal with admin reason', () => {
      const result = revealIfReady(testLeagueId(), 0, true, 'Testing force reveal', testAdminId())
      expect(result).toEqual({ revealed: true, reason: 'forced' })
    })

    it('should not reveal if conditions not met', () => {
      const result = revealIfReady(testLeagueId(), 0)
      expect(result).toEqual({ revealed: false, reason: 'already' })
    })
  })

  describe('markGameWinner', () => {
    it('should mark game winner successfully', () => {
      const result = markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-1',
        winnerAbbr: 'BUF',
      })
      
      expect(result).toEqual({ ok: true })
    })

    it('should reject invalid winner', () => {
      const result = markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-1',
        winnerAbbr: 'INVALID',
      })
      
      expect(result).toEqual({ error: 'Winner team not found' })
    })

    it('should reject winner not playing in game', () => {
      const result = markGameWinner({
        leagueId: testLeagueId(),
        weekNo: 0,
        gameId: 'game-1',
        winnerAbbr: 'NE', // NE not in BUF vs MIA game
      })
      
      expect(result).toEqual({ error: 'Winner team is not playing in this game' })
    })
  })

  describe('getUsedTeams', () => {
    it('should return empty array for no picks', () => {
      const teams = getUsedTeams(testEntryId())
      expect(teams).toEqual([])
    })

    it('should return used teams after picks', () => {
      savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: testTeamAbbr(),
      })
      
      const teams = getUsedTeams(testEntryId())
      expect(teams).toContain(testTeamAbbr())
    })
  })

  describe('getPickForWeek', () => {
    it('should return null for non-existent entry', () => {
      const pick = getPickForWeek('invalid-entry', 0)
      expect(pick).toBeNull()
    })

    it('should return not submitted for no pick', () => {
      const pick = getPickForWeek('entry-2', 0)
      expect(pick).toEqual({ submitted: false })
    })

    it('should return pick details when pick exists', () => {
      // First make a pick
      savePick({
        entryId: testEntryId(),
        leagueId: testLeagueId(),
        weekNo: 0,
        teamAbbr: testTeamAbbr(),
      })
      
      const pick = getPickForWeek(testEntryId(), 0)
      expect(pick).toMatchObject({
        team_abbr: 'BUF',
        submitted: true,
      })
    })
  })

  describe('getWeekState', () => {
    it('should return correct state for active week', () => {
      const state = getWeekState(testLeagueId(), 0)
      expect(state).toMatchObject({
        concealed: true, // Not all alive submitted
        submittedCount: 0, // No picks by default
        aliveCount: 2,
      })
      expect(state.lastKickoffAt).toBeDefined()
    })
  })
})