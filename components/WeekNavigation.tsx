'use client'

import { ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface WeekNavigationProps {
  currentWeek: number
  totalWeeks: number
  leagueCode: string
  phase?: string
}

export function WeekNavigation({ currentWeek, totalWeeks, leagueCode, phase = 'regular' }: WeekNavigationProps) {
  const pathname = usePathname()
  const isOnWeekPage = pathname.includes('/week/')
  
  const getWeekLabel = (weekNo: number) => {
    if (phase === 'super_bowl' && weekNo === totalWeeks) return 'Super Bowl'
    if (phase === 'conference' && weekNo >= totalWeeks - 1) return 'Conference'
    if (phase === 'divisional' && weekNo >= totalWeeks - 2) return 'Divisional'
    if (phase === 'wild_card' && weekNo >= totalWeeks - 3) return 'Wild Card'
    return `Week ${weekNo}`
  }
  
  return (
    <div className="bg-charcoal-800 border-b border-charcoal-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Current Week Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-charcoal-300">Current:</span>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                {getWeekLabel(currentWeek)}
              </span>
            </div>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            {/* Previous Week */}
            {currentWeek > 1 && (
              <Link
                href={`/l/${leagueCode}/week/${currentWeek - 1}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-charcoal-300 hover:bg-charcoal-700 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {getWeekLabel(currentWeek - 1)}
              </Link>
            )}
            
            {/* Quick Week Selector */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(6, totalWeeks) }, (_, i) => i + 1).map(weekNo => (
                <Link
                  key={weekNo}
                  href={`/l/${leagueCode}/week/${weekNo}`}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors
                    ${weekNo === currentWeek 
                      ? 'bg-blue-600 text-white' 
                      : weekNo < currentWeek
                      ? 'bg-charcoal-700 text-charcoal-400 hover:bg-charcoal-600'
                      : 'bg-charcoal-700 text-charcoal-300 hover:bg-charcoal-600'
                    }
                  `}
                  title={getWeekLabel(weekNo)}
                >
                  {weekNo}
                </Link>
              ))}
              {totalWeeks > 6 && (
                <span className="text-charcoal-500 px-2">...</span>
              )}
            </div>
            
            {/* Next Week */}
            {currentWeek < totalWeeks && (
              <Link
                href={`/l/${leagueCode}/week/${currentWeek + 1}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-charcoal-300 hover:bg-charcoal-700 rounded transition-colors"
              >
                {getWeekLabel(currentWeek + 1)}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isOnWeekPage && (
              <Link
                href={`/l/${leagueCode}/week/${currentWeek}`}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                Make Pick for {getWeekLabel(currentWeek)}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}