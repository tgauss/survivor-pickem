'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Send } from 'lucide-react'
import { ChatMessage } from '@/components/ChatMessage'
import type { Message } from '@/lib/data/types'

interface SessionData {
  entry: {
    id: string
    display_name: string
    avatar_url: string | null
    league_id: string
  }
}

export default function ChatPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentWeek] = useState(0) // Would be dynamic in real app
  const [isRevealed, setIsRevealed] = useState(false)

  // Mock entries data for display names and avatars
  const [entries] = useState([
    { id: 'entry-1', display_name: 'Johnny Football', avatar_url: null },
    { id: 'entry-2', display_name: 'Sarah the Great', avatar_url: null },
    { id: 'entry-3', display_name: 'Iron Mike', avatar_url: null },
  ])

  useEffect(() => {
    loadSession()
    loadMessages()
    
    // Poll for new messages
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSession = async () => {
    try {
      const response = await fetch('/api/me/session')
      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat?leagueId=league-1&weekNo=${currentWeek}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Check if week is revealed (simplified logic)
        // In real app, this would be determined by week state
        setIsRevealed(true) // For demo purposes
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !session || sending) return
    
    setSending(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leagueId: session.entry.league_id,
          weekNo: currentWeek,
          body: newMessage.trim(),
        }),
      })
      
      if (response.ok) {
        setNewMessage('')
        await loadMessages()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/chat/react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, emoji }),
      })
      
      if (response.ok) {
        await loadMessages()
      }
    } catch (error) {
      console.error('Failed to react to message:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-charcoal-400">Loading chat...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal-400 mb-4">Not logged in</div>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col">
      {/* Header */}
      <div className="bg-charcoal-900 border-b border-charcoal-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold">Week {currentWeek} Chat</h1>
            <p className="text-sm text-charcoal-400">
              {isRevealed ? 'Picks revealed • Open discussion' : 'Picks concealed • Spoilers hidden'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {messages.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-charcoal-400 mb-2">No messages yet</p>
              <p className="text-sm text-charcoal-500">Be the first to start the conversation!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const sender = entries.find(e => e.id === message.entry_id)
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    senderName={sender?.display_name || 'Unknown'}
                    senderAvatar={sender?.avatar_url}
                    isRevealed={isRevealed}
                    onReact={handleReact}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-charcoal-900 border-t border-charcoal-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isRevealed 
                    ? "Share your thoughts..." 
                    : "Be careful not to spoil picks before reveal..."
                }
                className="min-h-[60px] max-h-32 resize-none"
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-charcoal-400">
                  {newMessage.length}/500 characters
                  {!isRevealed && newMessage && (
                    <span className="ml-2 text-yellow-400">
                      • Team names may be auto-flagged as spoilers
                    </span>
                  )}
                </div>
                <div className="text-xs text-charcoal-500">
                  Shift+Enter for new line
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2 font-medium h-fit"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}