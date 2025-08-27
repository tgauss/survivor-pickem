import { describe, it, expect } from 'vitest'
import { 
  getTeamsArray, 
  getTeamsMap, 
  getTeamByAbbr, 
  requireTeamByAbbr, 
  TEAM_ABBREVIATIONS 
} from '../teams'

describe('Teams Loader', () => {
  describe('getTeamsArray', () => {
    it('should return an array of all NFL teams', () => {
      const teams = getTeamsArray()
      
      expect(teams).toHaveLength(32)
      expect(teams[0]).toMatchObject({
        abbr: expect.any(String),
        teamId: expect.any(Number),
        city: expect.any(String),
        name: expect.any(String),
        fullName: expect.any(String),
        primaryColor: expect.any(String),
        secondaryColor: expect.any(String),
        logoUrl: expect.any(String),
        wordMarkUrl: expect.any(String)
      })
    })
    
    it('should normalize hex colors', () => {
      const teams = getTeamsArray()
      
      teams.forEach(team => {
        expect(team.primaryColor).toMatch(/^#[0-9A-F]{6}$/i)
        expect(team.secondaryColor).toMatch(/^#[0-9A-F]{6}$/i)
        if (team.tertiaryColor) {
          expect(team.tertiaryColor).toMatch(/^#[0-9A-F]{6}$/i)
        }
        if (team.quaternaryColor) {
          expect(team.quaternaryColor).toMatch(/^#[0-9A-F]{6}$/i)
        }
      })
    })
    
    it('should include all major teams', () => {
      const teams = getTeamsArray()
      const abbreviations = teams.map(t => t.abbr)
      
      // Test a few well-known teams
      expect(abbreviations).toContain('KC')
      expect(abbreviations).toContain('SF')
      expect(abbreviations).toContain('BUF')
      expect(abbreviations).toContain('TB')
      expect(abbreviations).toContain('GB')
    })
  })

  describe('getTeamsMap', () => {
    it('should return a map keyed by team abbreviation', () => {
      const teamsMap = getTeamsMap()
      
      expect(teamsMap).toBeInstanceOf(Map)
      expect(teamsMap.size).toBe(32)
      
      const chiefs = teamsMap.get('KC')
      expect(chiefs).toBeDefined()
      expect(chiefs?.abbr).toBe('KC')
      expect(chiefs?.city).toBe('Kansas City')
      expect(chiefs?.name).toBe('Chiefs')
    })
  })

  describe('getTeamByAbbr', () => {
    it('should return team for valid abbreviation', () => {
      const team = getTeamByAbbr('KC')
      
      expect(team).toBeDefined()
      expect(team?.abbr).toBe('KC')
      expect(team?.city).toBe('Kansas City')
      expect(team?.name).toBe('Chiefs')
      expect(team?.primaryColor).toMatch(/^#[0-9A-F]{6}$/i)
    })
    
    it('should return undefined for invalid abbreviation', () => {
      const team = getTeamByAbbr('INVALID')
      expect(team).toBeUndefined()
    })
    
    it('should handle case sensitivity', () => {
      const team = getTeamByAbbr('kc')
      expect(team).toBeUndefined() // Should be case sensitive
    })
  })

  describe('requireTeamByAbbr', () => {
    it('should return team for valid abbreviation', () => {
      const team = requireTeamByAbbr('KC')
      
      expect(team).toBeDefined()
      expect(team.abbr).toBe('KC')
      expect(team.city).toBe('Kansas City')
      expect(team.name).toBe('Chiefs')
    })
    
    it('should throw error for invalid abbreviation', () => {
      expect(() => requireTeamByAbbr('INVALID')).toThrow('Team not found: INVALID')
    })
  })

  describe('TEAM_ABBREVIATIONS', () => {
    it('should contain all team abbreviations', () => {
      expect(TEAM_ABBREVIATIONS).toHaveLength(32)
      expect(TEAM_ABBREVIATIONS).toContain('KC')
      expect(TEAM_ABBREVIATIONS).toContain('SF')
      expect(TEAM_ABBREVIATIONS).toContain('BUF')
    })
    
    it('should be sorted alphabetically', () => {
      const sorted = [...TEAM_ABBREVIATIONS].sort()
      expect(TEAM_ABBREVIATIONS).toEqual(sorted)
    })
  })

  describe('Team data validation', () => {
    it('should have valid team IDs', () => {
      const teams = getTeamsArray()
      const teamIds = teams.map(t => t.teamId)
      
      // All team IDs should be positive numbers
      teamIds.forEach(id => {
        expect(id).toBeGreaterThan(0)
      })
      
      // All team IDs should be unique
      expect(new Set(teamIds).size).toBe(teamIds.length)
    })
    
    it('should have valid URLs', () => {
      const teams = getTeamsArray()
      
      teams.forEach(team => {
        expect(team.logoUrl).toMatch(/^https?:\/\/.+/)
        expect(team.wordMarkUrl).toMatch(/^https?:\/\/.+/)
      })
    })
    
    it('should have complete names', () => {
      const teams = getTeamsArray()
      
      teams.forEach(team => {
        expect(team.city).toBeTruthy()
        expect(team.name).toBeTruthy()
        expect(team.fullName).toBeTruthy()
        expect(team.fullName).toBe(`${team.city} ${team.name}`)
      })
    })
  })

  describe('Static data consistency', () => {
    it('should maintain consistent abbreviations across functions', () => {
      const arrayTeams = getTeamsArray()
      const mapTeams = getTeamsMap()
      
      arrayTeams.forEach(team => {
        const mapTeam = mapTeams.get(team.abbr)
        expect(mapTeam).toEqual(team)
      })
    })
    
    it('should handle all existing NFL teams', () => {
      const knownTeams = [
        'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
        'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
        'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
        'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
      ]
      
      const teams = getTeamsArray()
      const abbreviations = teams.map(t => t.abbr)
      
      // Check that we have all known teams
      knownTeams.forEach(abbr => {
        expect(abbreviations).toContain(abbr)
      })
      
      // Check that we don't have extra teams
      expect(abbreviations).toHaveLength(knownTeams.length)
    })
  })
})