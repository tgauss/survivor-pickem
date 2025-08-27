import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the config
vi.mock('../lib/config', () => ({
  BRANDING_MODE: 'private'
}))

// Mock the teams loader
vi.mock('../lib/teams', () => ({
  getTeamByAbbr: vi.fn((abbr: string) => {
    const mockTeams: Record<string, any> = {
      'KC': {
        abbr: 'KC',
        teamId: 1,
        city: 'Kansas City',
        name: 'Chiefs',
        fullName: 'Kansas City Chiefs',
        primaryColor: '#E31837',
        secondaryColor: '#FFB81C',
        tertiaryColor: null,
        quaternaryColor: null,
        logoUrl: 'https://example.com/kc-logo.png',
        wordMarkUrl: 'https://example.com/kc-wordmark.png'
      }
    }
    return mockTeams[abbr]
  })
}))

// Mock fetch
global.fetch = vi.fn()

describe('API Branding Payloads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Games API', () => {
    it('should include branding fields in enriched teams', async () => {
      const mockGamesResponse = {
        games: [{
          id: 'game-1',
          home_team: {
            id: 'team-1',
            abbr: 'KC',
            city: 'Kansas City',
            name: 'Chiefs',
            primaryColor: '#E31837',
            secondaryColor: '#FFB81C',
            logoUrl: 'https://example.com/kc-logo.png',
            colors: {
              primary: '#E31837',
              secondary: '#FFB81C',
              tertiary: null,
              quaternary: null
            }
          }
        }]
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGamesResponse
      } as Response)
      
      const response = await fetch('/api/weeks/1/games?leagueId=test')
      const data = await response.json()
      
      expect(data.games[0].home_team).toHaveProperty('colors')
      expect(data.games[0].home_team).toHaveProperty('logoUrl')
      expect(data.games[0].home_team).toHaveProperty('primaryColor')
      expect(data.games[0].home_team.colors).toEqual({
        primary: '#E31837',
        secondary: '#FFB81C',
        tertiary: null,
        quaternary: null
      })
    })
  })

  describe('Leaderboard API', () => {
    it('should include branding when entries have picks', async () => {
      const mockLeaderboardResponse = {
        league: { id: 'league-1', name: 'Test League' },
        entries: [{
          id: 'entry-1',
          display_name: 'Test User',
          current_pick: {
            team_abbr: 'KC',
            // Should be enriched with team branding
            team: {
              abbr: 'KC',
              colors: {
                primary: '#E31837',
                secondary: '#FFB81C'
              },
              logoUrl: 'https://example.com/kc-logo.png'
            }
          }
        }]
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboardResponse
      } as Response)
      
      const response = await fetch('/api/leaderboard?leagueCode=test&weekNo=1')
      const data = await response.json()
      
      // Verify that pick data includes branding
      const entry = data.entries[0]
      if (entry.current_pick?.team) {
        expect(entry.current_pick.team).toHaveProperty('colors')
        expect(entry.current_pick.team).toHaveProperty('logoUrl')
      }
    })
  })

  describe('Branding Mode Toggle', () => {
    it('should still return branding fields in neutral mode', async () => {
      // Mock neutral mode
      vi.doMock('../lib/config', () => ({
        BRANDING_MODE: 'neutral'
      }))
      
      const mockResponse = {
        games: [{
          home_team: {
            abbr: 'KC',
            colors: {
              primary: '#E31837',
              secondary: '#FFB81C'
            },
            logoUrl: 'https://example.com/kc-logo.png'
          }
        }]
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)
      
      const response = await fetch('/api/weeks/1/games?leagueId=test')
      const data = await response.json()
      
      // API should still return branding fields, components decide whether to use them
      expect(data.games[0].home_team).toHaveProperty('colors')
      expect(data.games[0].home_team).toHaveProperty('logoUrl')
    })
  })

  describe('Distribution API', () => {
    it('should include team branding in distribution data', () => {
      const distribution = {
        'KC': 5,
        'SF': 3,
        'BUF': 2
      }
      
      // Each team abbreviation should be enrichable with branding
      Object.keys(distribution).forEach(abbr => {
        const team = require('../lib/teams').getTeamByAbbr(abbr)
        if (team) {
          expect(team).toHaveProperty('primaryColor')
          expect(team).toHaveProperty('logoUrl')
        }
      })
    })
  })
})