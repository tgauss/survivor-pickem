import { formatKickoffTime, formatRelativeTime } from '@/lib/time'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { TeamBrand } from '@/components/brand/TeamBrand'
import { TeamLogo } from '@/components/brand/TeamLogo'
import type { Game } from '@/lib/data/types'

export interface GameCardProps {
  game: Game
  onSelectTeam: (teamAbbr: string) => void
  usedTeams: string[]
  disabled?: boolean
}

export function GameCard({ game, onSelectTeam, usedTeams, disabled }: GameCardProps) {
  const homeTeamUsed = usedTeams.includes(game.home_team.abbr)
  const awayTeamUsed = usedTeams.includes(game.away_team.abbr)
  const kickoffPassed = new Date() > new Date(game.kickoff_at)

  const getTeamButton = (team: typeof game.home_team, isUsed: boolean) => {
    return (
      <TeamBrand abbr={team.abbr}>
        <button
          onClick={() => onSelectTeam(team.abbr)}
          disabled={disabled || kickoffPassed}
          data-cy={`pick-${team.abbr}`}
          className={`
            w-full p-3 rounded-lg font-semibold text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-charcoal-900 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
            ${isUsed 
              ? 'bg-charcoal-700 text-charcoal-300 hover:bg-charcoal-600' 
              : 'hover:brightness-110'
            }
          `}
          style={!isUsed ? {
            backgroundColor: 'var(--team-primary, #3B82F6)',
            borderColor: 'var(--team-secondary, #3B82F6)',
            color: 'var(--team-text, #ffffff)'
          } : undefined}
        >
          {/* Diagonal stripe overlay for used teams */}
          {isUsed && (
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-charcoal-600/30 to-transparent transform rotate-45 scale-150" />
          )}
          
          <div className="relative z-10">
            <div className="flex justify-center mb-2">
              <TeamLogo abbr={team.abbr} size={24} />
            </div>
            <div className="text-xs opacity-75 mb-1">{team.abbr}</div>
            <div>{team.city} {team.name}</div>
            {isUsed && (
              <span className="block text-xs mt-1 opacity-75">USED</span>
            )}
          </div>
        </button>
      </TeamBrand>
    )
  }

  return (
    <Card className="p-4">
      <div className="text-center mb-4">
        <div className="text-sm text-charcoal-400 mb-1">
          {formatKickoffTime(new Date(game.kickoff_at))}
        </div>
        <div className="text-xs text-charcoal-500">
          {formatRelativeTime(new Date(game.kickoff_at))}
        </div>
        {kickoffPassed && (
          <Chip variant="warning" size="sm" className="mt-2">
            Started
          </Chip>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 items-center">
        <div>
          {getTeamButton(game.away_team, awayTeamUsed)}
        </div>
        
        <div className="text-center">
          <div className="text-charcoal-400 text-sm font-medium">@</div>
          {game.neutral_site && (
            <div className="text-xs text-charcoal-500 mt-1">Neutral</div>
          )}
        </div>
        
        <div>
          {getTeamButton(game.home_team, homeTeamUsed)}
        </div>
      </div>
    </Card>
  )
}