'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trophy } from 'lucide-react'
// Remove server import - we'll use API instead
import type { League } from '@/lib/data/types'

interface LeagueSwitcherProps {
  currentLeagueCode: string
}

export function LeagueSwitcher({ currentLeagueCode }: LeagueSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [leagues, setLeagues] = useState<League[]>([])
  const [currentLeague, setCurrentLeague] = useState<League | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLeagues()
  }, [currentLeagueCode])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadLeagues = async () => {
    try {
      const response = await fetch('/api/leagues', {
        credentials: 'same-origin'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch leagues')
      }
      
      const { leagues: data } = await response.json()
      if (data && Array.isArray(data)) {
        const typedData = data as League[]
        setLeagues(typedData)
        
        // Find current league by code
        const current = typedData.find(l => {
          const code = l.league_code || `${l.season_year}-${l.name.toLowerCase().replace(/\s+/g, '-')}`
          return code === currentLeagueCode
        })
        setCurrentLeague(current || null)
      }
    } catch (error) {
      console.error('Failed to load leagues:', error)
    }
  }

  const handleSelectLeague = (league: League) => {
    const leagueCode = league.league_code || `${league.season_year}-${league.name.toLowerCase().replace(/\s+/g, '-')}`
    
    // Set cookie and navigate
    document.cookie = `last_league_code=${leagueCode};path=/;max-age=${60 * 60 * 24 * 30}`
    
    // Get current path and replace league code
    const currentPath = window.location.pathname
    const newPath = currentPath.replace(/^\/l\/[^\/]+/, `/l/${leagueCode}`)
    
    router.push(newPath)
    setIsOpen(false)
  }

  if (!currentLeague) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded hover:bg-charcoal-700 transition-colors"
      >
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">{currentLeague.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-charcoal-800 border border-charcoal-700 rounded shadow-xl z-50">
          <div className="p-2 border-b border-charcoal-700">
            <div className="text-xs text-charcoal-400 uppercase tracking-wide px-2">Switch League</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {leagues.map((league) => {
              const leagueCode = league.league_code || `${league.season_year}-${league.name.toLowerCase().replace(/\s+/g, '-')}`
              const isActive = leagueCode === currentLeagueCode
              
              return (
                <button
                  key={league.id}
                  onClick={() => handleSelectLeague(league)}
                  className={`w-full text-left px-4 py-2 hover:bg-charcoal-700 transition-colors ${
                    isActive ? 'bg-charcoal-700' : ''
                  }`}
                >
                  <div className="font-medium">{league.name}</div>
                  <div className="text-xs text-charcoal-400">
                    {league.season_year} • ${league.buy_in_cents / 100}
                  </div>
                </button>
              )
            })}
          </div>
          {leagues.length > 1 && (
            <div className="p-2 border-t border-charcoal-700">
              <button
                onClick={() => router.push('/leagues')}
                className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All Leagues
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}