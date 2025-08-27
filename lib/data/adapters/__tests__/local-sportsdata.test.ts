import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  importTeamsFromSportsDataIO,
  importScheduleFromSportsDataIO,
  syncResultsFromSportsDataIO
} from '../local'

// Mock the local data store
vi.mock('../local', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    importTeamsFromSportsDataIO: vi.fn(),
    importScheduleFromSportsDataIO: vi.fn(),
    syncResultsFromSportsDataIO: vi.fn()
  }
})

const mockImportTeams = importTeamsFromSportsDataIO as vi.MockedFunction<typeof importTeamsFromSportsDataIO>
const mockImportSchedule = importScheduleFromSportsDataIO as vi.MockedFunction<typeof importScheduleFromSportsDataIO>
const mockSyncResults = syncResultsFromSportsDataIO as vi.MockedFunction<typeof syncResultsFromSportsDataIO>

describe('Local Adapter - SportsDataIO Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('importTeamsFromSportsDataIO', () => {
    it('should import teams with correct transformation', () => {
      const sportsTeams = [
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
          name: 'Dolphins'
        }
      ]

      importTeamsFromSportsDataIO(sportsTeams)

      expect(mockImportTeams).toHaveBeenCalledWith(sportsTeams)
    })

    it('should handle teams without logo URLs', () => {
      const sportsTeams = [
        {
          teamId: 1,
          abbr: 'BUF',
          city: 'Buffalo',
          name: 'Bills'
        }
      ]

      importTeamsFromSportsDataIO(sportsTeams)

      expect(mockImportTeams).toHaveBeenCalledWith(sportsTeams)
    })
  })

  describe('importScheduleFromSportsDataIO', () => {
    it('should import regular season games', () => {
      const seasonCode = '2024REG'
      const games = [
        {
          gameId: '20240901_BUF_MIA',
          dateUTC: '2024-09-01T17:00:00',
          homeAbbr: 'MIA',
          awayAbbr: 'BUF',
          neutralSite: false,
          week: 1
        },
        {
          gameId: '20240908_KC_BAL',
          dateUTC: '2024-09-08T17:00:00',
          homeAbbr: 'BAL',
          awayAbbr: 'KC',
          neutralSite: false,
          week: 2
        }
      ]

      importScheduleFromSportsDataIO(seasonCode, games)

      expect(mockImportSchedule).toHaveBeenCalledWith(seasonCode, games)
    })

    it('should import playoff games with phase mapping', () => {
      const seasonCode = '2024POST'
      const games = [
        {
          gameId: '20250112_WC_GAME1',
          dateUTC: '2025-01-12T17:00:00',
          homeAbbr: 'KC',
          awayAbbr: 'PIT',
          neutralSite: false,
          week: 1 // Wild card
        },
        {
          gameId: '20250119_DIV_GAME1',
          dateUTC: '2025-01-19T17:00:00',
          homeAbbr: 'KC',
          awayAbbr: 'BUF',
          neutralSite: false,
          week: 2 // Divisional
        },
        {
          gameId: '20250126_CONF_GAME1',
          dateUTC: '2025-01-26T17:00:00',
          homeAbbr: 'KC',
          awayAbbr: 'PHI',
          neutralSite: false,
          week: 3 // Conference
        }
      ]

      importScheduleFromSportsDataIO(seasonCode, games)

      expect(mockImportSchedule).toHaveBeenCalledWith(seasonCode, games)
    })

    it('should handle neutral site games', () => {
      const seasonCode = '2024REG'
      const games = [
        {
          gameId: '20241225_LONDON_GAME',
          dateUTC: '2024-12-25T18:00:00',
          homeAbbr: 'NYJ',
          awayAbbr: 'MIA',
          neutralSite: true,
          week: 17
        }
      ]

      importScheduleFromSportsDataIO(seasonCode, games)

      expect(mockImportSchedule).toHaveBeenCalledWith(seasonCode, games)
    })
  })

  describe('syncResultsFromSportsDataIO', () => {
    it('should sync final scores and return results', () => {
      const mockResult = {
        finalsCount: 2,
        updatedCount: 2,
        scoringTriggered: true,
        allOutSurvive: false
      }

      mockSyncResults.mockReturnValueOnce(mockResult)

      const seasonCode = '2024REG'
      const week = 1
      const finalScores = [
        {
          gameId: '20240901_BUF_MIA',
          homeScore: 21,
          awayScore: 24
        },
        {
          gameId: '20240901_NE_NYJ',
          homeScore: 17,
          awayScore: 10
        }
      ]

      const result = syncResultsFromSportsDataIO(seasonCode, week, finalScores)

      expect(mockSyncResults).toHaveBeenCalledWith(seasonCode, week, finalScores, undefined)
      expect(result).toEqual(mockResult)
    })

    it('should sync with basic scores for in-progress games', () => {
      const mockResult = {
        finalsCount: 1,
        updatedCount: 2,
        scoringTriggered: false
      }

      mockSyncResults.mockReturnValueOnce(mockResult)

      const seasonCode = '2024REG'
      const week = 2
      const finalScores = [
        {
          gameId: '20240908_KC_BAL',
          homeScore: 14,
          awayScore: 7
        }
      ]
      const basicScores = [
        {
          gameId: '20240908_KC_BAL',
          status: 'Final' as const,
          homeScore: 14,
          awayScore: 7
        },
        {
          gameId: '20240908_DAL_SF',
          status: 'InProgress' as const,
          homeScore: 10,
          awayScore: 3
        }
      ]

      const result = syncResultsFromSportsDataIO(seasonCode, week, finalScores, basicScores)

      expect(mockSyncResults).toHaveBeenCalledWith(seasonCode, week, finalScores, basicScores)
      expect(result).toEqual(mockResult)
    })

    it('should handle all-out survive scenario', () => {
      const mockResult = {
        finalsCount: 4,
        updatedCount: 4,
        scoringTriggered: true,
        allOutSurvive: true
      }

      mockSyncResults.mockReturnValueOnce(mockResult)

      const seasonCode = '2024REG'
      const week = 5
      const finalScores = [
        {
          gameId: '20241006_GAME1',
          homeScore: 17,
          awayScore: 21
        },
        {
          gameId: '20241006_GAME2',
          homeScore: 14,
          awayScore: 28
        },
        {
          gameId: '20241006_GAME3',
          homeScore: 10,
          awayScore: 24
        },
        {
          gameId: '20241006_GAME4',
          homeScore: 7,
          awayScore: 31
        }
      ]

      const result = syncResultsFromSportsDataIO(seasonCode, week, finalScores)

      expect(mockSyncResults).toHaveBeenCalledWith(seasonCode, week, finalScores, undefined)
      expect(result).toEqual(mockResult)
    })

    it('should handle playoff weeks correctly', () => {
      const mockResult = {
        finalsCount: 2,
        updatedCount: 2,
        scoringTriggered: true
      }

      mockSyncResults.mockReturnValueOnce(mockResult)

      const seasonCode = '2024POST'
      const week = 1 // Wild card round
      const finalScores = [
        {
          gameId: '20250112_WC_GAME1',
          homeScore: 21,
          awayScore: 17
        },
        {
          gameId: '20250112_WC_GAME2',
          homeScore: 28,
          awayScore: 14
        }
      ]

      const result = syncResultsFromSportsDataIO(seasonCode, week, finalScores)

      expect(mockSyncResults).toHaveBeenCalledWith(seasonCode, week, finalScores, undefined)
      expect(result).toEqual(mockResult)
    })
  })

  describe('edge cases', () => {
    it('should handle empty arrays gracefully', () => {
      importTeamsFromSportsDataIO([])
      expect(mockImportTeams).toHaveBeenCalledWith([])

      importScheduleFromSportsDataIO('2024REG', [])
      expect(mockImportSchedule).toHaveBeenCalledWith('2024REG', [])

      const mockResult = { finalsCount: 0, updatedCount: 0, scoringTriggered: false }
      mockSyncResults.mockReturnValueOnce(mockResult)
      
      const result = syncResultsFromSportsDataIO('2024REG', 1, [])
      expect(result).toEqual(mockResult)
    })

    it('should handle malformed season codes', () => {
      const games = [
        {
          gameId: 'test_game',
          dateUTC: '2024-09-01T17:00:00',
          homeAbbr: 'MIA',
          awayAbbr: 'BUF',
          neutralSite: false,
          week: 1
        }
      ]

      importScheduleFromSportsDataIO('INVALID', games)
      expect(mockImportSchedule).toHaveBeenCalledWith('INVALID', games)
    })
  })
})