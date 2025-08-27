import { describe, it, expect, vi } from 'vitest'
import { enrichTeam, enrichGame, enrichGames } from '../team-enricher'
import type { Team, Game } from '../data/types'

// Mock the teams loader
vi.mock('../teams', () => ({
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
      },
      'SF': {
        abbr: 'SF',
        teamId: 2,
        city: 'San Francisco',
        name: '49ers',
        fullName: 'San Francisco 49ers',
        primaryColor: '#AA0000',
        secondaryColor: '#B3995D',
        tertiaryColor: '#FFFFFF',
        quaternaryColor: null,
        logoUrl: 'https://example.com/sf-logo.png',
        wordMarkUrl: 'https://example.com/sf-wordmark.png'
      }
    }
    return mockTeams[abbr]
  })
}))

describe('Team Enricher', () => {
  describe('enrichTeam', () => {
    it('should enrich team with static data', () => {
      const baseTeam: Team = {
        id: 'team-1',
        abbr: 'KC',
        city: 'Kansas City',
        name: 'Chiefs',
        logo_url: 'old-logo.png'
      }

      const enriched = enrichTeam(baseTeam)

      expect(enriched).toMatchObject({
        id: 'team-1',
        abbr: 'KC',
        city: 'Kansas City',
        name: 'Chiefs',
        primaryColor: '#E31837',
        secondaryColor: '#FFB81C',
        tertiaryColor: null,
        quaternaryColor: null,
        fullName: 'Kansas City Chiefs',
        wordMarkUrl: 'https://example.com/kc-wordmark.png',
        logo_url: 'https://example.com/kc-logo.png' // Should use static logo URL
      })
    })

    it('should handle team not found in static data', () => {
      const baseTeam: Team = {
        id: 'team-unknown',
        abbr: 'UNKNOWN',
        city: 'Unknown',
        name: 'Team',
        logo_url: 'unknown-logo.png'
      }

      const enriched = enrichTeam(baseTeam)

      expect(enriched).toMatchObject({
        id: 'team-unknown',
        abbr: 'UNKNOWN',
        city: 'Unknown',
        name: 'Team',
        primaryColor: '#000000', // Default color
        secondaryColor: '#FFFFFF', // Default color
        tertiaryColor: null,
        quaternaryColor: null,
        fullName: 'Unknown Team', // Generated from city + name
        wordMarkUrl: '', // Default empty
        logo_url: 'unknown-logo.png' // Keep original
      })
    })

    it('should handle teams with tertiary colors', () => {
      const baseTeam: Team = {
        id: 'team-2',
        abbr: 'SF',
        city: 'San Francisco',
        name: '49ers',
        logo_url: null
      }

      const enriched = enrichTeam(baseTeam)

      expect(enriched.primaryColor).toBe('#AA0000')
      expect(enriched.secondaryColor).toBe('#B3995D')
      expect(enriched.tertiaryColor).toBe('#FFFFFF')
      expect(enriched.quaternaryColor).toBeNull()
    })
  })

  describe('enrichGame', () => {
    it('should enrich both home and away teams', () => {
      const baseGame: Game = {
        id: 'game-1',
        week_id: 'week-1',
        home_team: {
          id: 'team-1',
          abbr: 'KC',
          city: 'Kansas City',
          name: 'Chiefs',
          logo_url: null
        },
        away_team: {
          id: 'team-2',
          abbr: 'SF',
          city: 'San Francisco',
          name: '49ers',
          logo_url: null
        },
        kickoff_at: '2024-01-01T18:00:00Z',
        neutral_site: false,
        status: 'scheduled',
        winner_team: null
      }

      const enriched = enrichGame(baseGame)

      expect(enriched.home_team.primaryColor).toBe('#E31837')
      expect(enriched.home_team.fullName).toBe('Kansas City Chiefs')
      expect(enriched.away_team.primaryColor).toBe('#AA0000')
      expect(enriched.away_team.fullName).toBe('San Francisco 49ers')
      expect(enriched.winner_team).toBeNull()
    })

    it('should enrich winner team when present', () => {
      const baseGame: Game = {
        id: 'game-1',
        week_id: 'week-1',
        home_team: {
          id: 'team-1',
          abbr: 'KC',
          city: 'Kansas City',
          name: 'Chiefs',
          logo_url: null
        },
        away_team: {
          id: 'team-2',
          abbr: 'SF',
          city: 'San Francisco',
          name: '49ers',
          logo_url: null
        },
        kickoff_at: '2024-01-01T18:00:00Z',
        neutral_site: false,
        status: 'final',
        winner_team: {
          id: 'team-1',
          abbr: 'KC',
          city: 'Kansas City',
          name: 'Chiefs',
          logo_url: null
        }
      }

      const enriched = enrichGame(baseGame)

      expect(enriched.winner_team).toBeDefined()
      expect(enriched.winner_team?.primaryColor).toBe('#E31837')
      expect(enriched.winner_team?.fullName).toBe('Kansas City Chiefs')
    })
  })

  describe('enrichGames', () => {
    it('should enrich array of games', () => {
      const baseGames: Game[] = [
        {
          id: 'game-1',
          week_id: 'week-1',
          home_team: { id: 'team-1', abbr: 'KC', city: 'Kansas City', name: 'Chiefs', logo_url: null },
          away_team: { id: 'team-2', abbr: 'SF', city: 'San Francisco', name: '49ers', logo_url: null },
          kickoff_at: '2024-01-01T18:00:00Z',
          neutral_site: false,
          status: 'scheduled',
          winner_team: null
        }
      ]

      const enriched = enrichGames(baseGames)

      expect(enriched).toHaveLength(1)
      expect(enriched[0].home_team.primaryColor).toBe('#E31837')
      expect(enriched[0].away_team.primaryColor).toBe('#AA0000')
    })

    it('should handle empty array', () => {
      const enriched = enrichGames([])
      expect(enriched).toEqual([])
    })
  })

  describe('Type safety', () => {
    it('should maintain all original properties', () => {
      const baseTeam: Team = {
        id: 'team-1',
        abbr: 'KC',
        city: 'Kansas City',
        name: 'Chiefs',
        logo_url: 'test.png'
      }

      const enriched = enrichTeam(baseTeam)

      // Check that all original properties are maintained
      expect(enriched.id).toBe(baseTeam.id)
      expect(enriched.abbr).toBe(baseTeam.abbr)
      expect(enriched.city).toBe(baseTeam.city)
      expect(enriched.name).toBe(baseTeam.name)

      // Check that new properties are added
      expect(enriched.primaryColor).toBeDefined()
      expect(enriched.secondaryColor).toBeDefined()
      expect(enriched.fullName).toBeDefined()
      expect(enriched.wordMarkUrl).toBeDefined()
    })
  })
})