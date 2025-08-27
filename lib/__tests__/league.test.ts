import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getLeagueByCode, requireLeague, getAllLeagueCodes } from '../league'

// Mock the data adapter
vi.mock('../data', () => ({
  listLeagues: vi.fn()
}))

const { listLeagues } = await import('../data')

describe('League Resolver', () => {
  const mockLeagues = [
    {
      id: 'league-1',
      name: 'NFL Survivor 2024',
      season_year: 2024,
      league_code: '2024-survivor',
      buy_in_cents: 10000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'league-2', 
      name: 'Family Pool',
      season_year: 2024,
      league_code: null, // No explicit code - should generate one
      buy_in_cents: 5000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listLeagues).mockResolvedValue(mockLeagues)
  })

  describe('getLeagueByCode', () => {
    it('should resolve league by explicit code', async () => {
      const result = await getLeagueByCode('2024-survivor')
      
      expect(result).toEqual({
        id: 'league-1',
        name: 'NFL Survivor 2024',
        season_year: 2024,
        league_code: '2024-survivor'
      })
    })

    it('should resolve league by generated code', async () => {
      const result = await getLeagueByCode('2024-family-pool')
      
      expect(result).toEqual({
        id: 'league-2',
        name: 'Family Pool', 
        season_year: 2024,
        league_code: '2024-family-pool'
      })
    })

    it('should return null for unknown league code', async () => {
      const result = await getLeagueByCode('unknown-league')
      
      expect(result).toBeNull()
    })

    it('should handle leagues with spaces in name', async () => {
      const mockLeaguesWithSpaces = [
        {
          id: 'league-3',
          name: 'Big Money Survivor',
          season_year: 2024,
          league_code: null,
          buy_in_cents: 50000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      
      vi.mocked(listLeagues).mockResolvedValue(mockLeaguesWithSpaces)
      
      const result = await getLeagueByCode('2024-big-money-survivor')
      
      expect(result).toEqual({
        id: 'league-3',
        name: 'Big Money Survivor',
        season_year: 2024,
        league_code: '2024-big-money-survivor'
      })
    })
  })

  describe('requireLeague', () => {
    it('should return league when found', async () => {
      const result = await requireLeague({ leagueCode: '2024-survivor' })
      
      expect(result).toEqual({
        id: 'league-1',
        name: 'NFL Survivor 2024',
        season_year: 2024,
        league_code: '2024-survivor'
      })
    })

    it('should throw error when league code is missing', async () => {
      await expect(requireLeague({})).rejects.toThrow('League code is required')
    })

    it('should throw error when league not found', async () => {
      await expect(requireLeague({ leagueCode: 'unknown-league' }))
        .rejects.toThrow('League not found: unknown-league')
    })
  })

  describe('getAllLeagueCodes', () => {
    it('should return all league codes', async () => {
      const result = await getAllLeagueCodes()
      
      expect(result).toEqual([
        '2024-survivor',
        '2024-family-pool'
      ])
    })

    it('should handle empty leagues list', async () => {
      vi.mocked(listLeagues).mockResolvedValue([])
      
      const result = await getAllLeagueCodes()
      
      expect(result).toEqual([])
    })
  })
})