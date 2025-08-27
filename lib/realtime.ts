import { createBrowserClient } from './supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeChange {
  table: 'picks' | 'games' | 'weeks'
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  record: any
  old?: any
}

export interface SubscriptionOptions {
  leagueId: string
  weekId?: string
  onChange: (change: RealtimeChange) => void
}

let activeChannel: RealtimeChannel | null = null

export function subscribeToLeagueWeek({ 
  leagueId, 
  weekId, 
  onChange 
}: SubscriptionOptions): () => void {
  // Clean up any existing subscription
  if (activeChannel) {
    activeChannel.unsubscribe()
    activeChannel = null
  }

  const client = createBrowserClient()
  
  // Create a new channel for this league/week
  const channelName = weekId ? `league-${leagueId}-week-${weekId}` : `league-${leagueId}`
  activeChannel = client.channel(channelName)
  
  // Subscribe to picks changes
  activeChannel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'picks',
        filter: weekId ? `week_id=eq.${weekId}` : undefined
      },
      (payload) => {
        onChange({
          table: 'picks',
          type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          record: payload.new,
          old: payload.old
        })
      }
    )
  
  // Subscribe to games changes
  activeChannel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: weekId ? `week_id=eq.${weekId}` : undefined
      },
      (payload) => {
        onChange({
          table: 'games',
          type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          record: payload.new,
          old: payload.old
        })
      }
    )
  
  // Subscribe to weeks changes
  activeChannel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'weeks',
        filter: weekId ? `id=eq.${weekId}` : `league_id=eq.${leagueId}`
      },
      (payload) => {
        onChange({
          table: 'weeks',
          type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          record: payload.new,
          old: payload.old
        })
      }
    )
  
  // Start the subscription
  activeChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`Realtime subscribed to ${channelName}`)
    } else if (status === 'CLOSED') {
      console.log(`Realtime disconnected from ${channelName}`)
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`Realtime error on ${channelName}`)
    }
  })
  
  // Return cleanup function
  return () => {
    if (activeChannel) {
      activeChannel.unsubscribe()
      activeChannel = null
    }
  }
}

export function isRealtimeConnected(): boolean {
  return activeChannel !== null
}