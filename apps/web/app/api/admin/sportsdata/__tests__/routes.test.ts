import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as teamsRoute } from '../teams/route'
import { POST as scheduleRoute } from '../schedule/route'
import { POST as resultsRoute } from '../results/route'

// Mock the services and adapters
vi.mock('../../../../../lib/services/sportsdataio', () => ({
  listActiveTeams: vi.fn(),
  getSchedulesBasic: vi.fn(),
  getScoresFinal: vi.fn(),
  getScoresBasic: vi.fn()
}))

vi.mock('../../../../../lib/data/adapters/local', () => ({
  importTeamsFromSportsDataIO: vi.fn(),
  importScheduleFromSportsDataIO: vi.fn(),
  syncResultsFromSportsDataIO: vi.fn()
}))

const { 
  listActiveTeams,
  getSchedulesBasic,
  getScoresFinal,
  getScoresBasic
} = await import('../../../../../lib/services/sportsdataio')

const {
  importTeamsFromSportsDataIO,
  importScheduleFromSportsDataIO,
  syncResultsFromSportsDataIO
} = await import('../../../../../lib/data/adapters/local')

describe('SportsDataIO API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Teams Route', () => {
    it('should successfully import teams', async () => {
      const mockTeams = [
        {
          TeamID: 1,
          Key: 'BUF',
          City: 'Buffalo',
          Name: 'Bills',
          WikipediaLogoUrl: 'https://example.com/buffalo-bills.png'
        },
        {
          TeamID: 2,
          Key: 'MIA',
          City: 'Miami',
          Name: 'Dolphins',
          WikipediaLogoUrl: 'https://example.com/miami-dolphins.png'
        }
      ]

      vi.mocked(listActiveTeams).mockResolvedValueOnce(mockTeams)

      const response = await teamsRoute()
      const result = await response.json()

      expect(listActiveTeams).toHaveBeenCalled()
      expect(importTeamsFromSportsDataIO).toHaveBeenCalledWith([
        {
          teamId: 1,
          abbr: 'BUF',
          city: 'Buffalo',
          name: 'Bills',
          logoUrl: 'https://example.com/buffalo-bills.png'
        },
        {
          teamId: 2,
          abbr: 'MIA',
          city: 'Miami',
          name: 'Dolphins',
          logoUrl: 'https://example.com/miami-dolphins.png'
        }
      ])
      expect(result.success).toBe(true)
      expect(result.teamsImported).toBe(2)
      expect(response.status).toBe(200)
    })

    it('should handle service errors gracefully', async () => {
      vi.mocked(listActiveTeams).mockRejectedValueOnce(new Error('API Error'))

      const response = await teamsRoute()
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to import teams from SportsDataIO')
      expect(response.status).toBe(500)
    })
  })

  describe('Schedule Route', () => {
    it('should successfully import schedule for a season', async () => {
      const mockRegGames = [
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
      const mockPostGames = [
        {
          GameKey: '20250112_WC_GAME1',
          Date: '2025-01-12T17:00:00',
          HomeTeam: 'KC',
          AwayTeam: 'PIT',
          NeutralVenue: false,
          Season: 2024,
          Week: 1,
          SeasonType: 3
        }
      ]

      vi.mocked(getSchedulesBasic).mockImplementation((seasonCode) => {
        if (seasonCode === '2024REG') return Promise.resolve(mockRegGames)
        if (seasonCode === '2024POST') return Promise.resolve(mockPostGames)
        return Promise.resolve([])
      })

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({ seasonYear: 2024 })
      })

      const response = await scheduleRoute(request)
      const result = await response.json()

      expect(getSchedulesBasic).toHaveBeenCalledWith('2024REG')
      expect(getSchedulesBasic).toHaveBeenCalledWith('2024POST')
      expect(importScheduleFromSportsDataIO).toHaveBeenCalledWith('2024REG', [
        {
          gameId: '20240901_BUF_MIA',
          dateUTC: '2024-09-01T17:00:00',
          homeAbbr: 'MIA',
          awayAbbr: 'BUF',
          neutralSite: false,
          week: 1
        },
        {
          gameId: '20250112_WC_GAME1',
          dateUTC: '2025-01-12T17:00:00',
          homeAbbr: 'KC',
          awayAbbr: 'PIT',
          neutralSite: false,
          week: 1
        }
      ])
      expect(result.success).toBe(true)
      expect(result.regularSeasonGames).toBe(1)
      expect(result.postSeasonGames).toBe(1)
      expect(result.totalGamesImported).toBe(2)
      expect(response.status).toBe(200)
    })

    it('should validate request body', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({ seasonYear: 'invalid' })
      })

      const response = await scheduleRoute(request)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid request body')
      expect(response.status).toBe(400)
    })

    it('should handle missing season year', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await scheduleRoute(request)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('Results Route', () => {
    it('should successfully sync regular season results', async () => {
      const mockFinalScores = [
        {
          GameKey: '20240901_BUF_MIA',
          HomeScore: 21,
          AwayScore: 24
        }
      ]
      const mockBasicScores = [
        {
          GameKey: '20240901_BUF_MIA',
          Status: 'Final',
          HomeScore: 21,
          AwayScore: 24
        }
      ]
      const mockSyncResult = {
        finalsCount: 1,
        updatedCount: 1,
        scoringTriggered: true
      }

      vi.mocked(getScoresFinal).mockResolvedValueOnce(mockFinalScores)
      vi.mocked(getScoresBasic).mockResolvedValueOnce(mockBasicScores)
      vi.mocked(syncResultsFromSportsDataIO).mockReturnValueOnce(mockSyncResult)

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 1,
          phase: 'regular'
        })
      })

      const response = await resultsRoute(request)
      const result = await response.json()

      expect(getScoresFinal).toHaveBeenCalledWith('2024REG', 1)
      expect(getScoresBasic).toHaveBeenCalledWith('2024REG', 1)
      expect(syncResultsFromSportsDataIO).toHaveBeenCalledWith(
        '2024REG',
        1,
        [{ gameId: '20240901_BUF_MIA', homeScore: 21, awayScore: 24 }],
        [{ gameId: '2024090

1_BUF_MIA', status: 'Final', homeScore: 21, awayScore: 24 }]
      )
      expect(result.success).toBe(true)
      expect(result.seasonCode).toBe('2024REG')
      expect(result.week).toBe(1)
      expect(response.status).toBe(200)
    })

    it('should handle playoff phases correctly', async () => {
      const mockFinalScores = []
      const mockBasicScores = []
      const mockSyncResult = {
        finalsCount: 0,
        updatedCount: 0,
        scoringTriggered: false
      }

      vi.mocked(getScoresFinal).mockResolvedValueOnce(mockFinalScores)
      vi.mocked(getScoresBasic).mockResolvedValueOnce(mockBasicScores)
      vi.mocked(syncResultsFromSportsDataIO).mockReturnValueOnce(mockSyncResult)

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 2,
          phase: 'wild_card'
        })
      })

      const response = await resultsRoute(request)
      const result = await response.json()

      expect(getScoresFinal).toHaveBeenCalledWith('2024POST', 1)
      expect(getScoresBasic).toHaveBeenCalledWith('2024POST', 1)
      expect(result.seasonCode).toBe('2024POST')
      expect(result.week).toBe(1)
      expect(result.phase).toBe('wild_card')
    })

    it('should map divisional phase to week 2', async () => {
      vi.mocked(getScoresFinal).mockResolvedValueOnce([])
      vi.mocked(getScoresBasic).mockResolvedValueOnce([])
      vi.mocked(syncResultsFromSportsDataIO).mockReturnValueOnce({
        finalsCount: 0,
        updatedCount: 0,
        scoringTriggered: false
      })

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 3,
          phase: 'divisional'
        })
      })

      const response = await resultsRoute(request)
      
      expect(getScoresFinal).toHaveBeenCalledWith('2024POST', 2)
      expect(getScoresBasic).toHaveBeenCalledWith('2024POST', 2)
    })

    it('should map conference phase to week 3', async () => {
      vi.mocked(getScoresFinal).mockResolvedValueOnce([])
      vi.mocked(getScoresBasic).mockResolvedValueOnce([])
      vi.mocked(syncResultsFromSportsDataIO).mockReturnValueOnce({
        finalsCount: 0,
        updatedCount: 0,
        scoringTriggered: false
      })

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 4,
          phase: 'conference'
        })
      })

      const response = await resultsRoute(request)
      
      expect(getScoresFinal).toHaveBeenCalledWith('2024POST', 3)
      expect(getScoresBasic).toHaveBeenCalledWith('2024POST', 3)
    })

    it('should validate request body', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 25, // Invalid week
          phase: 'regular'
        })
      })

      const response = await resultsRoute(request)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid request body')
      expect(response.status).toBe(400)
    })

    it('should handle service errors', async () => {
      vi.mocked(getScoresFinal).mockRejectedValueOnce(new Error('API Error'))

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 1,
          phase: 'regular'
        })
      })

      const response = await resultsRoute(request)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to sync results from SportsDataIO')
      expect(response.status).toBe(500)
    })

    it('should handle all-out survive scenario', async () => {
      const mockSyncResult = {
        finalsCount: 4,
        updatedCount: 4,
        scoringTriggered: true,
        allOutSurvive: true
      }

      vi.mocked(getScoresFinal).mockResolvedValueOnce([])
      vi.mocked(getScoresBasic).mockResolvedValueOnce([])
      vi.mocked(syncResultsFromSportsDataIO).mockReturnValueOnce(mockSyncResult)

      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({
          seasonYear: 2024,
          week: 5
        })
      })

      const response = await resultsRoute(request)
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.allOutSurvive).toBe(true)
      expect(result.scoringTriggered).toBe(true)
    })
  })
})