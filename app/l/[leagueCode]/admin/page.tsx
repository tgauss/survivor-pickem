'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Modal } from '@/components/Modal'
import { Plus, Copy, Check, DollarSign, Calendar, Hash, Trophy, Eye, AlertTriangle, CheckCircle, Server, Download, Upload, RefreshCw, Database, Wifi } from 'lucide-react'
import type { League, Invite, Game, NotSubmittedEntry } from '@/lib/data/types'
import { USE_SUPABASE } from '@/lib/config'
import { isRealtimeConnected } from '@/lib/realtime'

export default function AdminPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [currentWeek, setCurrentWeek] = useState(0)
  const [games, setGames] = useState<Game[]>([])
  const [weekState, setWeekState] = useState<any>(null)
  const [notSubmitted, setNotSubmitted] = useState<NotSubmittedEntry[]>([])
  const [copied, setCopied] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showRevealModal, setShowRevealModal] = useState(false)
  const [revealReason, setRevealReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [sportsDataLoading, setSportsDataLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    season_year: new Date().getFullYear(),
    buy_in: 100,
  })

  useEffect(() => {
    fetchLeagues()
  }, [])

  useEffect(() => {
    if (selectedLeague) {
      fetchInvites(selectedLeague.id)
      fetchWeekData(selectedLeague.id, currentWeek)
    }
  }, [selectedLeague, currentWeek])

  const fetchLeagues = async () => {
    const response = await fetch('/api/admin/leagues')
    const data = await response.json()
    setLeagues(data.leagues)
    if (data.leagues.length > 0 && !selectedLeague) {
      setSelectedLeague(data.leagues[0])
    }
  }

  const fetchInvites = async (leagueId: string) => {
    const response = await fetch(`/api/admin/invites?leagueId=${leagueId}`)
    const data = await response.json()
    setInvites(data.invites)
  }

  const fetchWeekData = async (leagueId: string, weekNo: number) => {
    try {
      const [gamesRes, stateRes, notSubmittedRes] = await Promise.all([
        fetch(`/api/weeks/${weekNo}/games?leagueId=${leagueId}`),
        fetch(`/api/weeks/${weekNo}/state?leagueId=${leagueId}`),
        fetch(`/api/weeks/${weekNo}/not-submitted?leagueId=${leagueId}`),
      ])

      const [gamesData, stateData, notSubmittedData] = await Promise.all([
        gamesRes.json(),
        stateRes.json(),
        notSubmittedRes.json(),
      ])

      setGames(gamesData.games || [])
      setWeekState(stateData.weekState)
      setNotSubmitted(notSubmittedData.notSubmitted || [])
    } catch (error) {
      console.error('Failed to fetch week data:', error)
    }
  }

  const createLeague = async () => {
    const response = await fetch('/api/admin/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        season_year: formData.season_year,
        buy_in_cents: formData.buy_in * 100,
      }),
    })
    
    if (response.ok) {
      setShowCreateForm(false)
      setFormData({ name: '', season_year: new Date().getFullYear(), buy_in: 100 })
      await fetchLeagues()
    }
  }

  const generateInvite = async () => {
    if (!selectedLeague) return
    
    const response = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId: selectedLeague.id }),
    })
    
    if (response.ok) {
      await fetchInvites(selectedLeague.id)
    }
  }

  const markGameWinner = async (gameId: string, winnerAbbr: string) => {
    if (!selectedLeague) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/games/${gameId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: selectedLeague.id,
          weekNo: currentWeek,
          winnerAbbr,
        }),
      })

      if (response.ok) {
        await fetchWeekData(selectedLeague.id, currentWeek)
      }
    } catch (error) {
      console.error('Failed to mark winner:', error)
    } finally {
      setLoading(false)
    }
  }

  const scoreWeek = async () => {
    if (!selectedLeague) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/weeks/${currentWeek}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: selectedLeague.id }),
      })

      if (response.ok) {
        const result = await response.json()
        await fetchWeekData(selectedLeague.id, currentWeek)
        
        if (result.appliedAllOutSurvive) {
          alert('Everyone lost this week. All-out survive rule applied - no strikes given.')
        } else {
          alert(`Week scored successfully. Updated ${result.updated.length} entries.`)
        }
      }
    } catch (error) {
      console.error('Failed to score week:', error)
    } finally {
      setLoading(false)
    }
  }

  const revealWeek = async (force = false) => {
    if (!selectedLeague) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/weeks/${currentWeek}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: selectedLeague.id,
          force,
          reason: force ? revealReason : undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        await fetchWeekData(selectedLeague.id, currentWeek)
        
        setShowRevealModal(false)
        setRevealReason('')
        
        if (result.revealed) {
          alert(`Week revealed: ${result.reason}`)
        } else {
          alert('Week already revealed or conditions not met')
        }
      }
    } catch (error) {
      console.error('Failed to reveal week:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text)
    setCopied(token)
    setTimeout(() => setCopied(''), 2000)
  }

  const getInviteUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/claim/${token}`
  }

  const handleTeamsSeed = async () => {
    setSportsDataLoading(true)
    try {
      const response = await fetch('/api/admin/teams/seed', {
        method: 'POST',
      })

      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Failed to seed teams: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSportsDataLoading(false)
    }
  }

  const handleSportsDataAction = async (action: 'schedule' | 'results', body?: any) => {
    setSportsDataLoading(true)
    try {
      const response = await fetch(`/api/admin/sportsdata/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
        if (action === 'schedule' || action === 'results') {
          await fetchWeekData(selectedLeague!.id, currentWeek)
        }
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Failed to ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSportsDataLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {leagues.length === 0 && !showCreateForm ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No Leagues Found</h2>
            <p className="text-charcoal-400 mb-6">Create your first league to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create League
            </button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Data Adapter Status Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-semibold">Data Adapter</h2>
                </div>
                <div className="flex items-center gap-3">
                  <Chip variant={USE_SUPABASE ? 'success' : 'secondary'} size="sm">
                    {USE_SUPABASE ? 'Supabase' : 'Local'}
                  </Chip>
                  {USE_SUPABASE && (
                    <Chip 
                      variant={isRealtimeConnected() ? 'success' : 'warning'} 
                      size="sm"
                      icon={<Wifi className="w-3 h-3" />}
                    >
                      {isRealtimeConnected() ? 'Realtime Connected' : 'Realtime Disconnected'}
                    </Chip>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm text-charcoal-400">
                {USE_SUPABASE ? (
                  <p>Using Supabase for data persistence and real-time updates. All operations use service role authentication.</p>
                ) : (
                  <p>Using local in-memory adapter. Data will not persist between sessions.</p>
                )}
              </div>
            </Card>

            {/* SportsDataIO Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">SportsDataIO</h2>
                </div>
                <Chip variant="success" size="sm">Connected</Chip>
              </div>
              
              <div className="mb-4 p-3 bg-charcoal-800 rounded border border-charcoal-700">
                <p className="text-sm text-charcoal-400">
                  <strong>Note:</strong> Team branding comes from the static teams JSON. Toggle <code className="text-blue-400">TEAM_BRANDING_MODE</code> to &apos;neutral&apos; to disable logos and colors.
                </p>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => handleTeamsSeed()}
                  disabled={sportsDataLoading}
                  className="flex items-center justify-center gap-2 p-3 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Seed Teams
                </button>
                
                <button
                  onClick={() => handleSportsDataAction('schedule', { seasonYear: selectedLeague?.season_year || new Date().getFullYear() })}
                  disabled={sportsDataLoading || !selectedLeague}
                  className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Schedule
                </button>
                
                <button
                  onClick={() => handleSportsDataAction('results', { 
                    seasonYear: selectedLeague?.season_year || new Date().getFullYear(),
                    week: currentWeek || 1,
                    phase: currentWeek === 0 ? 'regular' : undefined
                  })}
                  disabled={sportsDataLoading || !selectedLeague}
                  className="flex items-center justify-center gap-2 p-3 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Results
                </button>
              </div>
              
              {sportsDataLoading && (
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-charcoal-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                </div>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-4">
              {/* League Selection */}
              <div>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Leagues</h2>
                    <button
                      onClick={() => setShowCreateForm(!showCreateForm)}
                      className="p-1.5 hover:bg-charcoal-800 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {showCreateForm && (
                    <div className="mb-4 p-4 bg-charcoal-800 rounded space-y-3">
                      <input
                        type="text"
                        placeholder="League Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-charcoal-700 border border-charcoal-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Year"
                          value={formData.season_year}
                          onChange={(e) => setFormData({ ...formData, season_year: parseInt(e.target.value) })}
                          className="px-3 py-2 bg-charcoal-700 border border-charcoal-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Buy-in ($)"
                          value={formData.buy_in}
                          onChange={(e) => setFormData({ ...formData, buy_in: parseInt(e.target.value) })}
                          className="px-3 py-2 bg-charcoal-700 border border-charcoal-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <button
                        onClick={createLeague}
                        disabled={!formData.name}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Create
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {leagues.map((league) => (
                      <button
                        key={league.id}
                        onClick={() => setSelectedLeague(league)}
                        className={`w-full text-left p-3 rounded transition-colors ${
                          selectedLeague?.id === league.id
                            ? 'bg-charcoal-800 border border-blue-500/50'
                            : 'hover:bg-charcoal-800'
                        }`}
                      >
                        <div className="font-medium">{league.name}</div>
                        <div className="text-sm text-charcoal-400 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {league.season_year}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${league.buy_in_cents / 100}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Week Results */}
              {selectedLeague && (
                <div className="lg:col-span-3">
                  <div className="grid gap-6">
                    {/* Week Selector & Status */}
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold">Week Results</h2>
                          {selectedLeague && currentWeek > 0 && (
                            <Link 
                              href={`/l/${selectedLeague.league_code}/week/${currentWeek}`}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                            >
                              View Week →
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={currentWeek}
                            onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                            className="px-3 py-1 bg-charcoal-800 border border-charcoal-700 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          >
                            {[0, 1, 2, 3, 4].map(week => (
                              <option key={week} value={week}>Week {week}</option>
                            ))}
                          </select>
                          
                          {weekState && (
                            <div className="flex items-center gap-2">
                              {weekState.concealed ? (
                                <Chip variant="warning" size="sm">Concealed</Chip>
                              ) : (
                                <Chip variant="success" size="sm">Revealed</Chip>
                              )}
                              
                              {weekState.rolled_back && (
                                <Chip variant="secondary" size="sm">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Rolled Back
                                </Chip>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {weekState && (
                        <div className="flex items-center justify-between">
                          <Chip variant={weekState.submittedCount < weekState.aliveCount ? 'warning' : 'success'}>
                            Submitted {weekState.submittedCount}/{weekState.aliveCount}
                          </Chip>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={scoreWeek}
                              disabled={loading}
                              data-cy="admin-score-week"
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                            >
                              <Trophy className="w-3 h-3" />
                              Score Week
                            </button>
                            
                            <button
                              onClick={() => setShowRevealModal(true)}
                              disabled={loading}
                              data-cy="admin-reveal-now"
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Reveal Now
                            </button>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Games */}
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Games</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {games.map((game) => (
                          <div key={game.id} className="p-3 bg-charcoal-800 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{game.away_team.abbr}</span>
                                <span className="text-charcoal-400">@</span>
                                <span className="font-medium">{game.home_team.abbr}</span>
                              </div>
                              {game.status === 'final' && game.winner_team && (
                                <Chip variant="success" size="sm">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {game.winner_team.abbr}
                                </Chip>
                              )}
                            </div>
                            
                            {game.status !== 'final' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => markGameWinner(game.id, game.home_team.abbr)}
                                  disabled={loading}
                                  className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                  {game.home_team.abbr} Wins
                                </button>
                                <button
                                  onClick={() => markGameWinner(game.id, game.away_team.abbr)}
                                  disabled={loading}
                                  className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                  {game.away_team.abbr} Wins
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Not Submitted */}
                    {notSubmitted.length > 0 && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3">Not Submitted ({notSubmitted.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {notSubmitted.map((entry) => (
                            <Chip key={entry.entryId} variant="warning" size="sm">
                              {entry.displayName}
                            </Chip>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Invites */}
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Invites</h3>
                        <button
                          onClick={generateInvite}
                          data-cy="admin-generate-invite"
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Generate
                        </button>
                      </div>

                      {invites.length === 0 ? (
                        <div className="text-center py-4 text-charcoal-400">
                          <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No invites generated yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {invites.slice(0, 5).map((invite) => (
                            <div
                              key={invite.id}
                              className="p-2 bg-charcoal-800 rounded flex items-center justify-between gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <code className="text-xs font-mono text-blue-400 truncate">
                                    {invite.token}
                                  </code>
                                  {invite.claimed_by_user_id ? (
                                    <Chip variant="success" size="sm">Claimed</Chip>
                                  ) : (
                                    <Chip variant="warning" size="sm">Available</Chip>
                                  )}
                                </div>
                              </div>
                              {!invite.claimed_by_user_id && (
                                <button
                                  onClick={() => copyToClipboard(getInviteUrl(invite.token), invite.token)}
                                  className="p-1 hover:bg-charcoal-700 rounded transition-colors"
                                  title="Copy invite URL"
                                >
                                  {copied === invite.token ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reveal Modal */}
        <Modal
          isOpen={showRevealModal}
          onClose={() => setShowRevealModal(false)}
          title="Force Reveal Week"
          actions={
            <>
              <button
                onClick={() => setShowRevealModal(false)}
                className="px-4 py-2 text-charcoal-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => revealWeek(true)}
                disabled={loading || !revealReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Revealing...' : 'Force Reveal'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-charcoal-400">
              This will immediately reveal all picks for the current week, overriding normal reveal rules.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Reason (required)</label>
              <textarea
                value={revealReason}
                onChange={(e) => setRevealReason(e.target.value)}
                placeholder="e.g., Technical issue, emergency reveal needed..."
                className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}