import React from 'react'
import { getTeamByAbbr } from '@/lib/teams'

interface TeamsGridProps {
  allTeams: string[]
  usedTeams: string[]
  remainingTeams: string[]
}

export function TeamsGrid({ allTeams, usedTeams, remainingTeams }: TeamsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {allTeams.map(teamAbbr => {
        const isUsed = usedTeams.includes(teamAbbr)
        const isRemaining = remainingTeams.includes(teamAbbr)
        const team = getTeamByAbbr(teamAbbr)
        
        return (
          <div
            key={teamAbbr}
            className={`
              p-3 rounded-lg border text-center font-medium text-sm transition-colors relative overflow-hidden
              ${isUsed 
                ? 'bg-charcoal-800 border-charcoal-600 text-charcoal-500 opacity-50' 
                : isRemaining
                  ? 'bg-charcoal-700 border-charcoal-600 text-charcoal-200'
                  : 'bg-charcoal-800 border-charcoal-700 text-charcoal-400'
              }
            `}
            style={team && !isUsed ? {
              borderColor: team.primaryColor + '40',
              background: `linear-gradient(135deg, ${team.primaryColor}10, transparent)`
            } : undefined}
          >
            {team?.logoUrl && (
              <div className="flex justify-center mb-2">
                <img 
                  src={team.logoUrl} 
                  alt={`${team.fullName} logo`}
                  className="w-8 h-8 object-contain"
                  style={{ filter: isUsed ? 'grayscale(100%) opacity(0.5)' : undefined }}
                />
              </div>
            )}
            <div className="font-bold text-base mb-1">{teamAbbr}</div>
            {team && (
              <div className="text-xs opacity-75 mb-1">{team.city} {team.name}</div>
            )}
            {isUsed && (
              <div className="text-xs text-red-400">Used</div>
            )}
            {!isUsed && isRemaining && (
              <div className="text-xs text-green-400">Available</div>
            )}
          </div>
        )
      })}
    </div>
  )
}