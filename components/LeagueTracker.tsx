'use client'

import { useEffect } from 'react'
import { saveLastLeagueCode } from '@/lib/league-tracker'

export function LeagueTracker({ leagueCode }: { leagueCode: string }) {
  useEffect(() => {
    // Save the league code whenever we navigate to a league page
    if (leagueCode) {
      saveLastLeagueCode(leagueCode)
    }
  }, [leagueCode])
  
  return null // This component doesn't render anything
}