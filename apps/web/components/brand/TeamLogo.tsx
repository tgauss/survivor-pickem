import React from 'react'
import { getTeamByAbbr } from '@/lib/teams'
import { BRANDING_MODE } from '@/lib/config'

interface TeamLogoProps {
  abbr: string
  size?: number
  rounded?: boolean
}

export function TeamLogo({ abbr, size = 32, rounded = false }: TeamLogoProps) {
  const team = getTeamByAbbr(abbr)
  
  // Show logo only in private mode and when logo exists
  const showLogo = BRANDING_MODE === 'private' && team?.logoUrl
  
  if (showLogo) {
    return (
      <img
        src={team.logoUrl}
        alt={`${team.fullName} logo`}
        width={size}
        height={size}
        className={`object-contain ${rounded ? 'rounded-full' : ''}`}
        style={{ width: size, height: size }}
      />
    )
  }
  
  // Fallback to monogram pill
  return (
    <div
      className={`
        inline-flex items-center justify-center font-bold text-xs
        bg-charcoal-700 text-charcoal-200 border border-charcoal-600
        ${rounded ? 'rounded-full' : 'rounded'}
      `}
      style={{ 
        width: size, 
        height: size,
        fontSize: size <= 24 ? '10px' : size <= 32 ? '12px' : '14px'
      }}
    >
      {abbr}
    </div>
  )
}