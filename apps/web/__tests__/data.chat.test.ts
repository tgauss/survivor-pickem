import { describe, it, expect, beforeEach } from 'vitest'
import { setupTest, testEntryId, testLeagueId } from '../lib/testkit'
import { 
  postMessage, 
  listMessages,
  reactToMessage
} from '../lib/data/adapters/local'

describe('Data Layer - Chat', () => {
  beforeEach(() => {
    setupTest()
  })

  describe('postMessage', () => {
    it('should post a message successfully', () => {
      const message = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'Hello world!',
      })
      
      expect(message).toMatchObject({
        league_id: testLeagueId(),
        week_no: 0,
        entry_id: testEntryId(),
        body: 'Hello world!',
        is_spoiler: false,
      })
      expect(message.id).toBeDefined()
      expect(message.created_at).toBeDefined()
    })

    it('should respect length limits', () => {
      expect(() => {
        postMessage({
          leagueId: testLeagueId(),
          weekNo: 0,
          entryId: testEntryId(),
          body: '',
        })
      }).toThrow('Message body must be 1-500 characters')
      
      expect(() => {
        postMessage({
          leagueId: testLeagueId(),
          weekNo: 0,
          entryId: testEntryId(),
          body: 'x'.repeat(501),
        })
      }).toThrow('Message body must be 1-500 characters')
    })

    it('should auto-flag spoilers with team names', () => {
      const message = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'I think BUF will win this week!',
      })
      
      expect(message.is_spoiler).toBe(true)
    })

    it('should not auto-flag spoilers for revealed weeks', () => {
      // First reveal the week by force
      import('../lib/data/adapters/local').then(({ revealIfReady }) => {
        revealIfReady(testLeagueId(), 0, true, 'Test reveal', testEntryId())
        
        const message = postMessage({
          leagueId: testLeagueId(),
          weekNo: 0,
          entryId: testEntryId(),
          body: 'I think BUF will win this week!',
        })
        
        expect(message.is_spoiler).toBe(false)
      })
    })
  })

  describe('listMessages', () => {
    it('should return messages in chronological order', () => {
      const message1 = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'First message',
      })
      
      const message2 = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: 'entry-2',
        body: 'Second message',
      })
      
      const messages = listMessages(testLeagueId(), 0)
      
      expect(messages).toHaveLength(2)
      expect(messages[0].id).toBe(message1.id)
      expect(messages[1].id).toBe(message2.id)
    })

    it('should filter by league and week', () => {
      postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'Week 0 message',
      })
      
      postMessage({
        leagueId: testLeagueId(),
        weekNo: 1,
        entryId: testEntryId(),
        body: 'Week 1 message',
      })
      
      const week0Messages = listMessages(testLeagueId(), 0)
      const week1Messages = listMessages(testLeagueId(), 1)
      
      expect(week0Messages).toHaveLength(1)
      expect(week0Messages[0].body).toBe('Week 0 message')
      expect(week1Messages).toHaveLength(1)
      expect(week1Messages[0].body).toBe('Week 1 message')
    })
  })

  describe('reactToMessage', () => {
    it('should add reaction to message', () => {
      const message = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'Great game!',
      })
      
      const reacted = reactToMessage({
        messageId: message.id,
        emoji: '👍',
      })
      
      expect(reacted.reactions).toEqual({ '👍': 1 })
    })

    it('should increment existing reaction', () => {
      const message = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'Great game!',
      })
      
      reactToMessage({ messageId: message.id, emoji: '👍' })
      const reacted = reactToMessage({ messageId: message.id, emoji: '👍' })
      
      expect(reacted.reactions).toEqual({ '👍': 2 })
    })

    it('should cap reactions at 10 total', () => {
      const message = postMessage({
        leagueId: testLeagueId(),
        weekNo: 0,
        entryId: testEntryId(),
        body: 'Popular message!',
      })
      
      // Add 10 reactions
      for (let i = 0; i < 10; i++) {
        reactToMessage({ messageId: message.id, emoji: '👍' })
      }
      
      // Try to add a new emoji - should be ignored
      const reacted = reactToMessage({ messageId: message.id, emoji: '❤️' })
      
      expect(reacted.reactions).toEqual({ '👍': 10 })
      expect(reacted.reactions['❤️']).toBeUndefined()
    })

    it('should throw error for non-existent message', () => {
      expect(() => {
        reactToMessage({
          messageId: 'invalid-id',
          emoji: '👍',
        })
      }).toThrow('Message not found')
    })
  })
})