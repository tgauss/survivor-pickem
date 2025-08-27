import React from 'react'
import { Chip } from '@/components/ui/Chip'
import { CheckCircle, XCircle, Clock, Minus } from 'lucide-react'
import type { SeasonEntry } from '@/lib/data/types'

interface MeTimelineItemProps {
  entry: SeasonEntry
}

export function MeTimelineItem({ entry }: MeTimelineItemProps) {
  const getResultIcon = () => {
    switch (entry.result) {
      case 'win':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'loss':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'tie':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Minus className="w-4 h-4 text-charcoal-400" />
    }
  }
  
  const getResultChip = () => {
    if (!entry.result) {
      return <Chip variant="secondary" size="sm">No Pick</Chip>
    }
    
    switch (entry.result) {
      case 'win':
        return <Chip variant="success" size="sm">Win</Chip>
      case 'loss':
        return <Chip variant="destructive" size="sm">Loss</Chip>
      case 'tie':
        return <Chip variant="destructive" size="sm">Tie (Loss)</Chip>
      case 'pending':
        return <Chip variant="secondary" size="sm">Pending</Chip>
      default:
        return <Chip variant="secondary" size="sm">Unknown</Chip>
    }
  }
  
  return (
    <div className="flex items-center gap-4 p-4 bg-charcoal-800 rounded-lg border border-charcoal-700">
      <div className="flex items-center justify-center w-8 h-8 bg-charcoal-700 rounded-full flex-shrink-0">
        <span className="text-sm font-medium text-charcoal-200">
          {entry.weekNo}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getResultIcon()}
          <span className="font-medium text-charcoal-200">
            Week {entry.weekNo}
          </span>
        </div>
        
        <div className="text-sm text-charcoal-400">
          {entry.teamAbbr ? (
            <span>Picked: <span className="font-medium text-charcoal-300">{entry.teamAbbr}</span></span>
          ) : (
            <span>No pick submitted</span>
          )}
          {entry.opponentTeamAbbr && (
            <span className="ml-2">vs {entry.opponentTeamAbbr}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {getResultChip()}
      </div>
    </div>
  )
}