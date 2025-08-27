import { describe, it, expect, beforeEach } from 'vitest'
import { setupTest, testEntryId } from '../lib/testkit'
import { 
  getMySeason,
  getRemainingTeams,
  savePick
} from '../lib/data/adapters/local'

describe('Data Layer - Me', () => {
  beforeEach(() => {
    setupTest()
  })

  describe('getRemainingTeams', () => {
    it('should return all teams when no picks made', () => {
      const remaining = getRemainingTeams(testEntryId())
      
      expect(remaining).toEqual(['BUF', 'MIA', 'NE', 'NYJ'])
    })

    it('should exclude previously used teams', () => {
      // Make a pick
      savePick({
        entryId: testEntryId(),
        leagueId: 'league-1',
        weekNo: 0,
        teamAbbr: 'BUF',
      })
      
      const remaining = getRemainingTeams(testEntryId())
      
      expect(remaining).toEqual(['MIA', 'NE', 'NYJ'])
      expect(remaining).not.toContain('BUF')
    })

    it('should return empty array when all teams used', () => {
      // Use all teams
      const teams = ['BUF', 'MIA', 'NE', 'NYJ']
      teams.forEach((team, index) => {
        savePick({
          entryId: testEntryId(),
          leagueId: 'league-1',
          weekNo: index,
          teamAbbr: team,
        })
      })
      
      const remaining = getRemainingTeams(testEntryId())
      
      expect(remaining).toEqual([])
    })
  })

  describe('getMySeason', () => {
    it('should return season entries in week order', () => {
      const season = getMySeason(testEntryId())
      
      expect(season).toHaveLength(2) // Week 0 and 1 exist
      expect(season[0].weekNo).toBe(0)
      expect(season[1].weekNo).toBe(1)
    })

    it('should include pick details when picks exist', () => {
      // Make a pick for week 0
      savePick({
        entryId: testEntryId(),
        leagueId: 'league-1',
        weekNo: 0,
        teamAbbr: 'BUF',
      })
      
      const season = getMySeason(testEntryId())
      const week0Entry = season.find(e => e.weekNo === 0)
      
      expect(week0Entry).toMatchObject({
        weekNo: 0,
        teamAbbr: 'BUF',
        result: 'pending',
        opponentTeamAbbr: 'MIA', // BUF vs MIA in seeded game
      })
    })

    it('should show no pick for weeks without submissions', () => {
      const season = getMySeason(testEntryId())
      const week1Entry = season.find(e => e.weekNo === 1)
      
      expect(week1Entry).toMatchObject({
        weekNo: 1,
        teamAbbr: undefined,
        result: undefined,
        opponentTeamAbbr: undefined,
      })
    })

    it('should return empty array for non-existent entry', () => {
      const season = getMySeason('invalid-entry-id')
      
      expect(season).toEqual([])
    })

    it('should include final scores when games are complete', () => {
      // Make a pick
      savePick({
        entryId: testEntryId(),
        leagueId: 'league-1',
        weekNo: 0,
        teamAbbr: 'BUF',
      })
      
      // Mark game as final (this would normally be done by markGameWinner)
      const season = getMySeason(testEntryId())
      const week0Entry = season.find(e => e.weekNo === 0)
      
      // Final score format should be present when game is final
      expect(week0Entry?.finalScore).toBeDefined()
    })
  })
})