'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Banner } from '@/components/ui/Banner'
import { Modal } from '@/components/Modal'
import { GameCard } from '@/components/GameCard'
import { Countdown } from '@/components/Countdown'
import { PickBadge } from '@/components/brand/PickBadge'
import { TeamLogo } from '@/components/brand/TeamLogo'
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { formatKickoffTime } from '@/lib/time'
import type { Game, WeekState } from '@/lib/data/types'
import { USE_SUPABASE } from '@/lib/config'
import { subscribeToLeagueWeek } from '@/lib/realtime'

interface WeekPageData {
  games: Game[]
  weekState: WeekState
  userPick: { team_abbr?: string; submitted: boolean } | null
  usedTeams: string[]
  isLoggedIn: boolean
  weekNo: number
  leagueId: string
}

export default function WeekPage({ params }: { params: { leagueCode: string; n: string } }) {
  const router = useRouter()
  const weekNo = parseInt(params.n)
  const leagueCode = params.leagueCode
  
  const [data, setData] = useState<WeekPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    teamAbbr: string
    teamName: string
  }>({
    isOpen: false,
    teamAbbr: '',
    teamName: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
    
    // Set up either realtime subscription or polling based on adapter
    let cleanup: (() => void) | undefined
    
    if (USE_SUPABASE && data?.leagueId) {
      // Use realtime for Supabase
      cleanup = subscribeToLeagueWeek({
        leagueId: data.leagueId,
        onChange: (change) => {
          console.log('Realtime change:', change)
          // Refresh data on any change
          loadData()
        }
      })
    }
    
    return () => {
      if (cleanup) cleanup()
    }
  }, [weekNo, leagueCode])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Check if logged in by trying to get used teams
      let isLoggedIn = true
      let usedTeams: string[] = []
      let userPick = null
      
      try {
        const usedTeamsResponse = await fetch(`/api/me/used-teams?leagueCode=${leagueCode}`)
        if (usedTeamsResponse.ok) {
          const usedTeamsData = await usedTeamsResponse.json()
          usedTeams = usedTeamsData.usedTeams
          
          // Get user's pick for this week
          const pickResponse = await fetch(`/api/me/pick?leagueCode=${leagueCode}&weekNo=${weekNo}`)
          if (pickResponse.ok) {
            const pickData = await pickResponse.json()
            userPick = pickData.pick
          }
        } else {
          isLoggedIn = false
        }
      } catch {
        isLoggedIn = false
      }
      
      // Get games and week state
      const [gamesResponse, weekStateResponse] = await Promise.all([
        fetch(`/api/weeks/${weekNo}/games?leagueCode=${leagueCode}`),
        fetch(`/api/weeks/${weekNo}/state?leagueCode=${leagueCode}`),
      ])
      
      const gamesData = await gamesResponse.json()
      const weekStateData = await weekStateResponse.json()
      
      if (!gamesResponse.ok || !weekStateResponse.ok) {
        throw new Error('Failed to load week data')
      }
      
      setData({
        games: gamesData.games,
        weekState: weekStateData.weekState,
        userPick,
        usedTeams,
        isLoggedIn,
        weekNo,
        leagueId: leagueCode,
      })
    } catch (err) {
      setError('Failed to load week data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTeam = async (teamAbbr: string) => {
    if (!data) return
    
    const game = data.games.find(g => 
      g.home_team.abbr === teamAbbr || g.away_team.abbr === teamAbbr
    )
    
    if (!game) return
    
    const team = game.home_team.abbr === teamAbbr ? game.home_team : game.away_team
    const isUsed = data.usedTeams.includes(teamAbbr)
    
    if (isUsed) {
      setConfirmModal({
        isOpen: true,
        teamAbbr,
        teamName: `${team.city} ${team.name}`,
      })
    } else {
      await submitPick(teamAbbr)
    }
  }

  const submitPick = async (teamAbbr: string) => {
    try {
      setSubmitting(true)
      setError('')
      
      const response = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueCode: params.leagueCode,
          weekNo: data!.weekNo,
          teamAbbr,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || 'Failed to save pick')
        return
      }
      
      // Reload page to show updated state
      router.refresh()
      await loadData()
      
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
      setConfirmModal({ isOpen: false, teamAbbr: '', teamName: '' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-charcoal-400">Loading week {weekNo}...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-charcoal-950 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leaderboard
            </Link>
          </div>
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
            <p className="text-charcoal-400 mb-4">{error || 'Week not found'}</p>
          </Card>
        </div>
      </div>
    )
  }

  if (!data.isLoggedIn) {
    return (
      <div className="min-h-screen bg-charcoal-950 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leaderboard
            </Link>
          </div>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-charcoal-400 mb-6">
              You need to be logged in to make picks for Week {weekNo}.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const nextKickoff = data.games
    .filter(g => new Date(g.kickoff_at) > new Date())
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())[0]

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/l/${leagueCode}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Week {weekNo} Picks</h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Chip 
              variant={data.weekState.submittedCount < data.weekState.aliveCount ? 'warning' : 'success'}
            >
              Submitted {data.weekState.submittedCount}/{data.weekState.aliveCount}
            </Chip>
            
            {nextKickoff && (
              <Chip variant="secondary">
                Next: <Countdown targetDate={nextKickoff.kickoff_at} />
              </Chip>
            )}
          </div>

          {data.weekState.concealed && (
            <Banner variant="info" className="mb-4">
              <strong>Picks are concealed</strong> until all alive players submit or at the last kickoff time for this week.
            </Banner>
          )}

          {error && (
            <Banner variant="error" className="mb-4">
              {error}
            </Banner>
          )}
        </div>

        {data.userPick?.submitted ? (
          <Card className="p-6 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pick saved. Locked for Week {weekNo}.</h2>
            {data.userPick.team_abbr && !data.weekState.concealed && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-charcoal-400">Your selection:</p>
                <div className="pulse-on-reveal">
                  <PickBadge abbr={data.userPick.team_abbr} label="YOU" />
                </div>
              </div>
            )}
            {data.weekState.concealed && (
              <p className="text-charcoal-400">
                Your pick will be revealed when all players submit or at kickoff time.
              </p>
            )}
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Select a team to win:</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {data.games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onSelectTeam={handleSelectTeam}
                    usedTeams={data.usedTeams}
                    disabled={submitting}
                  />
                ))}
              </div>
            </div>
            
            {data.usedTeams.length > 0 && (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-500 mb-1">Previously Used Teams</div>
                    <div className="text-sm text-charcoal-400">
                      You&apos;ve already picked: {data.usedTeams.join(', ')}. 
                      Reusing any team is an automatic loss under league rules.
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Past Week Results */}
        {data.games.some(g => g.status === 'final') && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Week {weekNo} Results</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.games.map((game) => (
                <Card key={game.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="mx-auto mb-1">
                          <TeamLogo abbr={game.away_team.abbr} size={32} />
                        </div>
                        <div className="text-xs font-medium">{game.away_team.abbr}</div>
                      </div>
                      <div className="text-charcoal-400">@</div>
                      <div className="text-center">
                        <div className="mx-auto mb-1">
                          <TeamLogo abbr={game.home_team.abbr} size={32} />
                        </div>
                        <div className="text-xs font-medium">{game.home_team.abbr}</div>
                      </div>
                    </div>
                    
                    {game.status === 'final' && game.home_score !== undefined && game.away_score !== undefined && (
                      <div className="text-center">
                        <div className="font-semibold">
                          {game.away_score} - {game.home_score}
                        </div>
                        <div className="text-xs text-charcoal-400">Final</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Show user's pick result for this game if they picked a team in this game */}
                  {data.userPick?.team_abbr && 
                   (game.home_team.abbr === data.userPick.team_abbr || game.away_team.abbr === data.userPick.team_abbr) && (
                    <div className="border-t border-charcoal-700 pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PickBadge abbr={data.userPick.team_abbr} label="YOUR PICK" />
                        </div>
                        {game.status === 'final' && game.winner_team && (
                          <div className="flex items-center gap-1">
                            {game.winner_team.abbr === data.userPick.team_abbr ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-500 font-medium">Won</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-500 font-medium">Lost</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, teamAbbr: '', teamName: '' })}
          title="Confirm Team Selection"
          actions={
            <>
              <button
                onClick={() => setConfirmModal({ isOpen: false, teamAbbr: '', teamName: '' })}
                className="px-4 py-2 text-charcoal-400 hover:text-white transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-charcoal-900"
                disabled={submitting}
                autoFocus
              >
                Cancel
              </button>
              <button
                onClick={() => submitPick(confirmModal.teamAbbr)}
                className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-charcoal-900"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit anyway'}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <p className="mb-3">
                You already used <strong>{confirmModal.teamName}</strong> earlier in the season. 
                Reusing a team is an automatic loss under league rules.
              </p>
              <p className="text-sm text-charcoal-400">
                Are you sure you want to submit this pick anyway?
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}