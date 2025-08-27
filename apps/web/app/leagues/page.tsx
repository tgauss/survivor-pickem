'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Trophy, Users, Calendar, DollarSign } from 'lucide-react'
import { listLeagues } from '@/lib/data'
import type { League } from '@/lib/data/types'

export default function LeaguePickerPage() {
  const router = useRouter()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeagues()
  }, [])

  const loadLeagues = async () => {
    try {
      const data = await listLeagues()
      setLeagues(data)
    } catch (error) {
      console.error('Failed to load leagues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLeague = (league: League) => {
    const leagueCode = league.league_code || `${league.season_year}-${league.name.toLowerCase().replace(/\s+/g, '-')}`
    router.push(`/l/${leagueCode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Select a League</h1>
          <p className="text-charcoal-400">Choose a league to view the leaderboard and make picks</p>
        </div>

        {leagues.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No Leagues Available</h2>
            <p className="text-charcoal-400">No leagues are currently available. Please check back later.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {leagues.map((league) => {
              const leagueCode = league.league_code || `${league.season_year}-${league.name.toLowerCase().replace(/\s+/g, '-')}`
              return (
                <Card 
                  key={league.id}
                  className="p-6 cursor-pointer hover:border-blue-500/50 transition-colors"
                  onClick={() => handleSelectLeague(league)}
                >
                  <h2 className="text-xl font-bold mb-2">{league.name}</h2>
                  <div className="space-y-2 text-charcoal-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{league.season_year} Season</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Buy-in: ${league.buy_in_cents / 100}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <code className="text-blue-400">/{leagueCode}</code>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}