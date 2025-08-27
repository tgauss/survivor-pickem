import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  listActiveTeams,
  getCurrentTimeframe,
  getSchedulesBasic,
  getScoresBasic,
  getScoresFinal
} from '../sportsdataio'

global.fetch = vi.fn()

const mockFetch = fetch as vi.MockedFunction<typeof fetch>

describe('SportsDataIO Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SPORTSDATA_API_KEY = 'test-key'
    process.env.SPORTSDATA_BASE_URL = 'https://api.test.com'
    process.env.SPORTSDATA_USE_QUERY_KEY = 'false'
  })

  afterEach(() => {
    delete process.env.SPORTSDATA_API_KEY
    delete process.env.SPORTSDATA_BASE_URL
    delete process.env.SPORTSDATA_USE_QUERY_KEY
  })

  describe('listActiveTeams', () => {
    it('should fetch and validate team data', async () => {
      const mockTeams = [
        {
          TeamID: 1,
          Key: 'BUF',
          City: 'Buffalo',
          Name: 'Bills',
          WikipediaLogoUrl: 'https://example.com/buffalo-bills.png'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeams)
      } as Response)

      const result = await listActiveTeams()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/Teams',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Ocp-Apim-Subscription-Key': 'test-key'
          })
        })
      )
      expect(result).toEqual(mockTeams)
    })

    it('should use query key authentication when configured', async () => {
      process.env.SPORTSDATA_USE_QUERY_KEY = 'true'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      } as Response)

      await listActiveTeams()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/Teams?key=test-key',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Ocp-Apim-Subscription-Key': expect.anything()
          })
        })
      )
    })

    it('should return mock data when API key is not configured', async () => {
      delete process.env.SPORTSDATA_API_KEY

      const result = await listActiveTeams()
      
      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toHaveLength(32)
      expect(result[0]).toHaveProperty('TeamID')
      expect(result[0]).toHaveProperty('Key')
      expect(result[0]).toHaveProperty('City')
      expect(result[0]).toHaveProperty('Name')
    })

    it('should retry on 429 error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Rate limited' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        } as Response)

      vi.useFakeTimers()

      const resultPromise = listActiveTeams()
      
      await vi.advanceTimersByTimeAsync(1000)
      
      const result = await resultPromise

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual([])

      vi.useRealTimers()
    })

    it('should throw on validation error', async () => {
      const invalidTeams = [
        { TeamID: 'invalid', Key: 'BUF' } // Missing required fields
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidTeams)
      } as Response)

      await expect(listActiveTeams()).rejects.toThrow()
    })
  })

  describe('getCurrentTimeframe', () => {
    it('should fetch and validate timeframe data', async () => {
      const mockTimeframe = {
        Season: 2024,
        SeasonType: 1,
        Week: 5
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTimeframe)
      } as Response)

      const result = await getCurrentTimeframe()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/Timeframes/current',
        expect.any(Object)
      )
      expect(result).toEqual(mockTimeframe)
    })
  })

  describe('getSchedulesBasic', () => {
    it('should fetch schedule for given season code', async () => {
      const mockGames = [
        {
          GameKey: '20240901_BUF_MIA',
          Date: '2024-09-01T17:00:00',
          HomeTeam: 'MIA',
          AwayTeam: 'BUF',
          NeutralVenue: false,
          Season: 2024,
          Week: 1,
          SeasonType: 1
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGames)
      } as Response)

      const result = await getSchedulesBasic('2024REG')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/Schedules/2024REG',
        expect.any(Object)
      )
      expect(result).toEqual(mockGames)
    })
  })

  describe('getScoresBasic', () => {
    it('should fetch basic scores for season and week', async () => {
      const mockScores = [
        {
          GameKey: '20240901_BUF_MIA',
          Status: 'Final',
          HomeScore: 21,
          AwayScore: 24
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores)
      } as Response)

      const result = await getScoresBasic('2024REG', 1)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/ScoresBasic/2024REG/1',
        expect.any(Object)
      )
      expect(result).toEqual(mockScores)
    })
  })

  describe('getScoresFinal', () => {
    it('should fetch final scores for season and week', async () => {
      const mockScores = [
        {
          GameKey: '20240901_BUF_MIA',
          HomeScore: 21,
          AwayScore: 24
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores)
      } as Response)

      const result = await getScoresFinal('2024REG', 1)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/ScoresByWeekFinal/2024REG/1',
        expect.any(Object)
      )
      expect(result).toEqual(mockScores)
    })
  })

  describe('error handling', () => {
    it('should throw on non-retryable HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' })
      } as Response)

      await expect(listActiveTeams()).rejects.toThrow('SportsDataIO API error: 400')
    })

    it('should throw on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(listActiveTeams()).rejects.toThrow('Network error')
    })

    it('should throw after max retries', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        } as Response)

      vi.useFakeTimers()

      const resultPromise = listActiveTeams()
      
      await vi.advanceTimersByTimeAsync(7000) // Skip all retry delays
      
      await expect(resultPromise).rejects.toThrow('SportsDataIO API error: 500')
      expect(mockFetch).toHaveBeenCalledTimes(3)

      vi.useRealTimers()
    })
  })
})