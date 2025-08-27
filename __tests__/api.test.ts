import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { setupTest, testLeagueId } from '../lib/testkit'
import { GET as getPotHandler } from '../app/api/pot/route'
import { GET as getHistoryHandler } from '../app/api/history/week/[weekNo]/route'

// Helper to create mock NextRequest
function mockRequest(url: string): NextRequest {
  return new NextRequest(url)
}

describe('API Routes', () => {
  beforeEach(() => {
    setupTest()
  })

  describe('/api/pot', () => {
    it('should return pot amount', async () => {
      const request = mockRequest(`http://localhost:3000/api/pot?leagueId=${testLeagueId()}`)
      const response = await getPotHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toEqual({ pot: 300 }) // 3 entries * $100 buy-in
    })

    it('should return error for missing leagueId', async () => {
      const request = mockRequest('http://localhost:3000/api/pot')
      const response = await getPotHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'League ID is required' })
    })
  })

  describe('/api/history/week/[weekNo]', () => {
    it('should return week history', async () => {
      const request = mockRequest(`http://localhost:3000/api/history/week/0?leagueId=${testLeagueId()}`)
      const response = await getHistoryHandler(request, { params: { weekNo: '0' } })
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toMatchObject({
        weekNo: 0,
        phase: 'regular',
        revealed: false, // concealed by default
        rolledBack: false,
      })
      expect(data.entries).toHaveLength(3)
      expect(data.entries[0]).toMatchObject({
        id: 'entry-1',
        display_name: 'Johnny Football',
      })
    })

    it('should return error for invalid week number', async () => {
      const request = mockRequest(`http://localhost:3000/api/history/week/invalid?leagueId=${testLeagueId()}`)
      const response = await getHistoryHandler(request, { params: { weekNo: 'invalid' } })
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'Invalid week number' })
    })

    it('should return error for missing leagueId', async () => {
      const request = mockRequest('http://localhost:3000/api/history/week/0')
      const response = await getHistoryHandler(request, { params: { weekNo: '0' } })
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'League ID is required' })
    })

    it('should return data for non-existent week', async () => {
      const request = mockRequest(`http://localhost:3000/api/history/week/999?leagueId=${testLeagueId()}`)
      const response = await getHistoryHandler(request, { params: { weekNo: '999' } })
      
      expect(response.status).toBe(200) // Returns data even for non-existent week
      
      const data = await response.json()
      expect(data.entries).toHaveLength(3) // Still returns all entries
    })
  })
})