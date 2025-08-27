'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Banner } from '@/components/ui/Banner'
import { Avatar } from '@/components/ui/Avatar'
import { DonutChart } from '@/components/ui/DonutChart'
import { ConfettiClient } from '@/components/ui/ConfettiClient'
import { PickBadge } from '@/components/brand/PickBadge'
import { TeamStack } from '@/components/brand/TeamStack'
import { TeamLogo } from '@/components/brand/TeamLogo'
import { TeamBrand } from '@/components/brand/TeamBrand'
import { DollarSign, Skull, CheckCircle, XCircle, Clock, LogIn, LogOut, Settings, ChevronDown, ChevronUp, Users, MessageCircle, History, User2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Entry, NotSubmittedEntry } from '@/lib/data/types'
import { USE_SUPABASE } from '@/lib/config'
import { subscribeToLeagueWeek, isRealtimeConnected } from '@/lib/realtime'

interface LeaderboardData {
  league: {
    id: string
    name: string
    season_year: number
    buy_in_cents: number
  }
  weekNo: number
  submittedCount: number
  aliveCount: number
  totalCount: number
  concealed: boolean
  rolledBack: boolean
  entries: Entry[]
  distribution?: Record<string, number>
}

interface SessionData {
  entry: Entry
}

export default function LeaderboardPage({ params }: { params: { leagueCode: string } }) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [notSubmitted, setNotSubmitted] = useState<NotSubmittedEntry[]>([])
  const [showNotSubmitted, setShowNotSubmitted] = useState(false)
  const [pot, setPot] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPickStacks, setShowPickStacks] = useState(false)

  useEffect(() => {
    loadData()
    
    // Set up either realtime subscription or polling based on adapter
    let cleanup: (() => void) | undefined
    
    if (USE_SUPABASE && data?.league?.id) {
      // Use realtime for Supabase
      cleanup = subscribeToLeagueWeek({
        leagueId: data.league.id,
        onChange: (change) => {
          console.log('Realtime change:', change)
          // Refresh data on any change
          loadData()
        }
      })
    } else {
      // Poll for updates every 5 seconds in development (local adapter)
      const interval = setInterval(loadData, 5000)
      cleanup = () => clearInterval(interval)
    }
    
    return () => {
      if (cleanup) cleanup()
    }
  }, [data?.league?.id])

  const loadData = async () => {
    // Show refreshing spinner if not initial load
    if (!loading) setRefreshing(true)
    
    try {
      // Check session
      let sessionData = null
      try {
        const sessionRes = await fetch('/api/me/session')
        if (sessionRes.ok) {
          sessionData = await sessionRes.json()
          setSession(sessionData)
        }
      } catch {
        setSession(null)
      }

      // Load leaderboard data
      const leagueCode = params.leagueCode as string
      const [leaderboardRes, potRes, notSubmittedRes] = await Promise.all([
        fetch(`/api/leaderboard?leagueCode=${leagueCode}&weekNo=0`),
        fetch(`/api/league/pot?leagueCode=${leagueCode}`),
        fetch(`/api/weeks/0/not-submitted?leagueCode=${leagueCode}`),
      ])

      const [leaderboardData, potData, notSubmittedData] = await Promise.all([
        leaderboardRes.json(),
        potRes.json(),
        notSubmittedRes.json(),
      ])

      if (leaderboardRes.ok) {
        setData(leaderboardData)
      }
      if (potRes.ok) {
        setPot(potData.pot)
      }
      if (notSubmittedRes.ok) {
        setNotSubmitted(notSubmittedData.notSubmitted || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      if (loading) setLoading(false)
      setRefreshing(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    
    if (showAbsoluteTime) {
      return date.toLocaleString()
    }
    
    if (diffMs <= 0) {
      return 'Deadline passed'
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`
    } else {
      return `${diffMinutes}m left`
    }
  }

  const getStatusChip = (entry: Entry) => {
    if (entry.eliminated) {
      return <Chip variant="destructive" icon={<XCircle className="w-3 h-3" />}>Eliminated</Chip>
    }
    if (!entry.current_pick?.submitted) {
      // Show "Make Pick" link for logged-in user
      if (session && session.entry.id === entry.id) {
        return (
          <Link
            href={`/l/${data!.league.league_code || `${data!.league.season_year}-${data!.league.name.toLowerCase().replace(/\s+/g, '-')}`}/week/${data!.weekNo}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Clock className="w-3 h-3" />
            Make Pick
          </Link>
        )
      }
      return <Chip variant="warning" icon={<Clock className="w-3 h-3" />}>No Pick</Chip>
    }
    if (entry.current_pick?.team_abbr && !data?.concealed) {
      // Show PickBadge when revealed
      const isCurrentUser = session && session.entry.id === entry.id
      const label = isCurrentUser ? 'YOU' : entry.display_name
      return <PickBadge abbr={entry.current_pick.team_abbr} label={label} />
    }
    return <Chip variant="success" icon={<CheckCircle className="w-3 h-3" />}>Submitted</Chip>
  }

  // Sort entries: alive first, then eliminated
  const sortedEntries = data?.entries.sort((a, b) => {
    if (a.eliminated !== b.eliminated) {
      return a.eliminated ? 1 : -1
    }
    if (a.strikes !== b.strikes) {
      return a.strikes - b.strikes
    }
    return a.display_name.localeCompare(b.display_name)
  }) || []

  const aliveEntries = sortedEntries.filter(e => !e.eliminated)
  const eliminatedEntries = sortedEntries.filter(e => e.eliminated)

  // Group picks by team for pick stacks (only when revealed)
  const pickStacks = !data?.concealed && data?.entries ? 
    data.entries
      .filter(entry => entry.current_pick?.team_abbr)
      .reduce((acc, entry) => {
        const teamAbbr = entry.current_pick!.team_abbr!
        if (!acc[teamAbbr]) acc[teamAbbr] = []
        acc[teamAbbr].push({
          displayName: entry.display_name,
          avatarUrl: entry.avatar_url
        })
        return acc
      }, {} as Record<string, Array<{displayName: string; avatarUrl?: string}>>) 
    : {}

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-charcoal-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-4">League not found</div>
  }

  const { league, weekNo, submittedCount, aliveCount, totalCount, concealed, rolledBack, entries, distribution } = data

  return (
    <div className="min-h-screen bg-charcoal-950">
      <header className="bg-charcoal-900 border-b border-charcoal-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{league.name}</h1>
            {refreshing && (
              <Loader2 className="w-4 h-4 animate-spin text-charcoal-400" />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Chip variant="primary" icon={<DollarSign className="w-4 h-4" />}>
              Pot: ${pot.toLocaleString()}
            </Chip>
            <Chip variant="secondary">
              Week {weekNo}
            </Chip>
            <Chip variant={submittedCount < aliveCount ? 'warning' : 'success'}>
              Submitted {submittedCount}/{aliveCount}
            </Chip>
            
            {/* Not Submitted Pill */}
            {notSubmitted.length > 0 && (
              <button
                onClick={() => setShowNotSubmitted(!showNotSubmitted)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-600 text-white rounded-full text-xs font-medium hover:bg-yellow-700 transition-colors"
              >
                Not Submitted ({notSubmitted.length})
                {showNotSubmitted ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
            
            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link
                href={`/l/${data.league.league_code || `${data.league.season_year}-${data.league.name.toLowerCase().replace(/\s+/g, '-')}`}/history`}
                className="p-1.5 hover:bg-charcoal-800 rounded transition-colors"
                title="History"
              >
                <History className="w-4 h-4" />
              </Link>
              {session && (
                <Link
                  href={`/l/${data.league.league_code || `${data.league.season_year}-${data.league.name.toLowerCase().replace(/\s+/g, '-')}`}/me`}
                  className="p-1.5 hover:bg-charcoal-800 rounded transition-colors"
                  title="My Profile"
                >
                  <User2 className="w-4 h-4" />
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <Chip variant="default" size="sm">
                    {session.entry.username}
                  </Chip>
                  <Link
                    href={`/l/${data.league.league_code || `${data.league.season_year}-${data.league.name.toLowerCase().replace(/\s+/g, '-')}`}/admin`}
                    className="p-1.5 hover:bg-charcoal-800 rounded transition-colors"
                    title="Admin"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/logout"
                    className="p-1.5 hover:bg-charcoal-800 rounded transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  data-cy="nav-login"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Not Submitted Panel */}
      {showNotSubmitted && notSubmitted.length > 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-yellow-400 font-medium">Not submitted:</span>
              {notSubmitted.map((entry, index) => (
                <span key={entry.entryId} className="text-sm text-yellow-300">
                  {entry.displayName}
                  {index < notSubmitted.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {concealed && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Banner variant="info">
            <strong>Picks are concealed.</strong> All picks will be revealed when everyone alive has submitted or at the last kickoff time for this week.
          </Banner>
        </div>
      )}

      {rolledBack && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Banner variant="warning">
            <strong>Everyone lost this week.</strong> All-out survive rule applied - no strikes given.
          </Banner>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Pick Distribution */}
        {data.distribution && !data.concealed && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Pick Distribution</h3>
              <button
                onClick={() => setShowAbsoluteTime(!showAbsoluteTime)}
                className="p-1.5 hover:bg-charcoal-700 rounded transition-colors"
                title="Toggle time format"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="flex-shrink-0">
                {typeof window !== 'undefined' && (
                  <DonutChart
                    data={Object.entries(data.distribution).map(([team, count], index) => ({
                      label: team,
                      value: count,
                      color: [`#3B82F6`, `#EF4444`, `#10B981`, `#F59E0B`][index % 4]
                    }))}
                    size={100}
                    strokeWidth={12}
                  />
                )}
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                {Object.entries(data.distribution).map(([team, count], index) => (
                  <div key={team} className="flex items-center gap-2">
                    <TeamBrand abbr={team}>
                      <TeamLogo abbr={team} size={12} rounded />
                    </TeamBrand>
                    <span className="font-medium">{team}</span>
                    <span className="text-charcoal-400">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Pick Stacks Section */}
        {Object.keys(pickStacks).length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pick Stacks</h3>
              <button
                onClick={() => setShowPickStacks(!showPickStacks)}
                className="flex items-center gap-2 text-charcoal-400 hover:text-charcoal-200 transition-colors"
              >
                {showPickStacks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showPickStacks ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showPickStacks && (
              <div className="space-y-3">
                {Object.entries(pickStacks)
                  .sort(([,a], [,b]) => b.length - a.length)
                  .map(([teamAbbr, picks]) => (
                    <TeamStack key={teamAbbr} teamAbbr={teamAbbr} picks={picks} />
                  ))}
              </div>
            )}
          </Card>
        )}

        <div className="space-y-4">
          {/* Alive Section */}
          {aliveEntries.length > 0 && (
            <div>
              <div className="sticky top-0 bg-charcoal-950/95 backdrop-blur-sm py-2 px-4 -mx-4 mb-3">
                <h2 className="text-lg font-semibold text-green-400 uppercase tracking-wide">
                  Alive ({aliveEntries.length})
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {aliveEntries.map((entry, index) => (
                  <Card key={entry.id} className="fade-in-up" data-cy={`lb-row-${entry.display_name.replace(/\s+/g, '-').toLowerCase()}`}>
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={entry.avatar_url}
                        alt={entry.display_name}
                        fallback={entry.display_name.slice(0, 2)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg truncate">{entry.display_name}</div>
                        <div className="text-sm text-charcoal-400 truncate">{entry.real_name}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {entry.strikes > 0 && !data.rolledBack && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: entry.strikes }).map((_, i) => (
                              <Skull key={i} className="w-5 h-5 text-red-500" />
                            ))}
                          </div>
                        )}
                        
                        {getStatusChip(entry)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Eliminated Section */}
          {eliminatedEntries.length > 0 && (
            <div>
              <div className="sticky top-0 bg-charcoal-950/95 backdrop-blur-sm py-2 px-4 -mx-4 mb-3">
                <h2 className="text-lg font-semibold text-red-400 uppercase tracking-wide">
                  Eliminated ({eliminatedEntries.length})
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {eliminatedEntries.map((entry) => (
                  <Card key={entry.id} className="opacity-60">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={entry.avatar_url}
                        alt={entry.display_name}
                        fallback={entry.display_name.slice(0, 2)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg truncate">{entry.display_name}</div>
                        <div className="text-sm text-charcoal-400 truncate">{entry.real_name}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: entry.strikes }).map((_, i) => (
                            <Skull key={i} className="w-5 h-5 text-red-500" />
                          ))}
                        </div>
                        
                        {getStatusChip(entry)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>
      
      {/* Confetti */}
      <ConfettiClient
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  )
}