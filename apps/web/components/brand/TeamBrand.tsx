import React, { ReactNode } from 'react'
import { getTeamByAbbr } from '@/lib/teams'
import { contrastColor, sanitizeHex, DEFAULT_TEXT } from '@/lib/color'
import { BRANDING_MODE } from '@/lib/config'

interface TeamBrandProps {
  abbr: string
  children: ReactNode
}

export function TeamBrand({ abbr, children }: TeamBrandProps) {
  const team = getTeamByAbbr(abbr)
  
  // Get team colors
  const primaryColor = sanitizeHex(team?.primaryColor)
  const secondaryColor = sanitizeHex(team?.secondaryColor) 
  const tertiaryColor = sanitizeHex(team?.tertiaryColor)
  
  // Compute text color
  const textColor = primaryColor 
    ? contrastColor(primaryColor)
    : secondaryColor
    ? contrastColor(secondaryColor)
    : DEFAULT_TEXT
  
  // Set CSS custom properties
  const style: React.CSSProperties = {
    '--team-text': textColor,
  }
  
  // Only apply colors in private mode
  if (BRANDING_MODE === 'private') {
    if (primaryColor) style['--team-primary'] = primaryColor
    if (secondaryColor) style['--team-secondary'] = secondaryColor
    if (tertiaryColor) style['--team-tertiary'] = tertiaryColor
  } else {
    // In neutral mode, provide default text color
    style['--team-text'] = DEFAULT_TEXT
  }
  
  return (
    <div style={style as any}>
      {children}
    </div>
  )
}