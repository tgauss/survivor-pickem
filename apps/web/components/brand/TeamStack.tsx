import React from 'react'
import { TeamBrand } from './TeamBrand'
import { TeamLogo } from './TeamLogo'

interface TeamStackProps {
  teamAbbr: string
  picks: Array<{
    displayName: string
    avatarUrl?: string
  }>
}

export function TeamStack({ teamAbbr, picks }: TeamStackProps) {
  return (
    <TeamBrand abbr={teamAbbr}>
      <div 
        className="flex items-center gap-3 p-3 rounded-lg border"
        style={{
          backgroundColor: 'var(--team-primary, #374151)20',
          borderColor: 'var(--team-secondary, #4B5563)40',
          color: 'var(--team-text, #E6E8EA)'
        }}
      >
        {/* Team info */}
        <div className="flex items-center gap-2">
          <TeamLogo abbr={teamAbbr} size={24} />
          <span className="font-semibold text-sm">{teamAbbr}</span>
        </div>
        
        {/* Pick count */}
        <div className="text-xs opacity-75">
          {picks.length} pick{picks.length !== 1 ? 's' : ''}
        </div>
        
        {/* Avatar stack */}
        <div className="flex -space-x-2 ml-auto">
          {picks.slice(0, 5).map((pick, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full bg-charcoal-600 border-2 border-charcoal-800 flex items-center justify-center text-xs font-medium"
              title={pick.displayName}
            >
              {pick.avatarUrl ? (
                <img 
                  src={pick.avatarUrl} 
                  alt={pick.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                pick.displayName.charAt(0).toUpperCase()
              )}
            </div>
          ))}
          {picks.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-charcoal-600 border-2 border-charcoal-800 flex items-center justify-center text-xs font-medium">
              +{picks.length - 5}
            </div>
          )}
        </div>
      </div>
    </TeamBrand>
  )
}