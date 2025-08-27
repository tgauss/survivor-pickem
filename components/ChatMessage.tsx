'use client'

import React from 'react'
import { Avatar } from '@/components/ui/Avatar'
import type { Message } from '@/lib/data/types'

interface ChatMessageProps {
  message: Message
  senderName: string
  senderAvatar?: string
  isRevealed: boolean
  onReact: (messageId: string, emoji: string) => void
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢']

export function ChatMessage({ 
  message, 
  senderName, 
  senderAvatar, 
  isRevealed,
  onReact 
}: ChatMessageProps) {
  const shouldShowSpoiler = isRevealed || !message.is_spoiler
  
  return (
    <div className="flex gap-3 group">
      <Avatar
        src={senderAvatar}
        alt={senderName}
        fallback={senderName.slice(0, 2)}
        size="sm"
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-sm text-charcoal-200 truncate">
            {senderName}
          </span>
          <span className="text-xs text-charcoal-400 flex-shrink-0">
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        
        <div className="text-sm text-charcoal-100 mb-2">
          {shouldShowSpoiler ? (
            message.body
          ) : (
            <span className="bg-charcoal-700 text-charcoal-700 px-2 py-1 rounded select-none cursor-help" 
                  title="Hidden until picks are revealed">
              {message.body.replace(/./g, '█')}
            </span>
          )}
          {message.is_spoiler && !isRevealed && (
            <span className="ml-2 text-xs text-yellow-500 bg-yellow-500/20 px-1.5 py-0.5 rounded">
              SPOILER
            </span>
          )}
        </div>
        
        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.entries(message.reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-charcoal-800 hover:bg-charcoal-700 rounded-full text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-charcoal-900"
              >
                <span>{emoji}</span>
                <span className="text-charcoal-300">{count}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Reaction bar - show on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className="w-7 h-7 flex items-center justify-center hover:bg-charcoal-700 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-charcoal-900"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}