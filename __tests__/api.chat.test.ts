import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { setupTest, testLeagueId } from '../lib/testkit'
import { GET as getChatHandler, POST as postChatHandler } from '../app/api/chat/route'
import { POST as reactChatHandler } from '../app/api/chat/react/route'

// Mock auth
vi.mock('../lib/auth', () => ({
  getSessionFromCookies: () => Promise.resolve({
    entry: { id: 'entry-1', league_id: 'league-1' }
  })
}))

// Helper to create mock NextRequest
function mockRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options)
}

describe('API Routes - Chat', () => {
  beforeEach(() => {
    setupTest()
  })

  describe('GET /api/chat', () => {
    it('should return messages for league and week', async () => {
      const request = mockRequest(`http://localhost:3000/api/chat?leagueId=${testLeagueId()}&weekNo=0`)
      const response = await getChatHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('messages')
      expect(Array.isArray(data.messages)).toBe(true)
    })

    it('should return error for missing leagueId', async () => {
      const request = mockRequest('http://localhost:3000/api/chat?weekNo=0')
      const response = await getChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'League ID is required' })
    })

    it('should return error for missing weekNo', async () => {
      const request = mockRequest(`http://localhost:3000/api/chat?leagueId=${testLeagueId()}`)
      const response = await getChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'Week number is required' })
    })

    it('should return error for invalid week number', async () => {
      const request = mockRequest(`http://localhost:3000/api/chat?leagueId=${testLeagueId()}&weekNo=invalid`)
      const response = await getChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'Invalid week number' })
    })
  })

  describe('POST /api/chat', () => {
    it('should create a message successfully', async () => {
      const request = mockRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: testLeagueId(),
          weekNo: 0,
          body: 'Hello chat!',
        }),
      })
      
      const response = await postChatHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.message).toMatchObject({
        league_id: testLeagueId(),
        week_no: 0,
        entry_id: 'entry-1',
        body: 'Hello chat!',
      })
    })

    it('should return error for missing fields', async () => {
      const request = mockRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: testLeagueId(),
          // Missing weekNo and body
        }),
      })
      
      const response = await postChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'Missing required fields' })
    })

    it('should handle message validation errors', async () => {
      const request = mockRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: testLeagueId(),
          weekNo: 0,
          body: '', // Empty body should trigger validation error
        }),
      })
      
      const response = await postChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Message body must be 1-500 characters')
    })
  })

  describe('POST /api/chat/react', () => {
    it('should add reaction to message', async () => {
      // First create a message
      const postRequest = mockRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: testLeagueId(),
          weekNo: 0,
          body: 'React to this!',
        }),
      })
      
      const postResponse = await postChatHandler(postRequest)
      const { message } = await postResponse.json()
      
      // Now react to it
      const reactRequest = mockRequest('http://localhost:3000/api/chat/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          emoji: '👍',
        }),
      })
      
      const reactResponse = await reactChatHandler(reactRequest)
      
      expect(reactResponse.status).toBe(200)
      
      const data = await reactResponse.json()
      expect(data.message.reactions).toEqual({ '👍': 1 })
    })

    it('should return error for missing fields', async () => {
      const request = mockRequest('http://localhost:3000/api/chat/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: 'some-id',
          // Missing emoji
        }),
      })
      
      const response = await reactChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toEqual({ error: 'Missing required fields' })
    })

    it('should return error for non-existent message', async () => {
      const request = mockRequest('http://localhost:3000/api/chat/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: 'invalid-id',
          emoji: '👍',
        }),
      })
      
      const response = await reactChatHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Message not found')
    })
  })
})