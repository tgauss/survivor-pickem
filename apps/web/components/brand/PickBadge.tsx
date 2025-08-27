import React, { useEffect, useState } from 'react'
import { TeamBrand } from './TeamBrand'
import { TeamLogo } from './TeamLogo'

interface PickBadgeProps {
  abbr: string
  label: string
}

export function PickBadge({ abbr, label }: PickBadgeProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <TeamBrand abbr={abbr}>
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
          ${mounted ? 'slide-mask-in' : ''}
        `}
        data-cy={`pick-badge-${abbr}`}
        style={{
          backgroundColor: 'var(--team-primary, #374151)',
          borderColor: 'var(--team-secondary, #4B5563)',
          color: 'var(--team-text, #E6E8EA)'
        }}
      >
        <TeamLogo abbr={abbr} size={20} />
        <span className="font-semibold">{abbr}</span>
        <span className="text-xs opacity-75">{label}</span>
      </div>
    </TeamBrand>
  )
}