import { getTeamByAbbr } from './teams'
import type { Team, Game } from './data/types'

export interface EnrichedTeam extends Team {
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string | null
  quaternaryColor: string | null
  fullName: string
  wordMarkUrl: string
  logoUrl: string
  colors?: {
    primary?: string
    secondary?: string
    tertiary?: string | null
    quaternary?: string | null
  }
}

export interface EnrichedGame extends Omit<Game, 'home_team' | 'away_team'> {
  home_team: EnrichedTeam
  away_team: EnrichedTeam
  winner_team: EnrichedTeam | null
}

export function enrichTeam(team: Team): EnrichedTeam {
  const staticTeam = getTeamByAbbr(team.abbr)
  
  const primaryColor = staticTeam?.primaryColor || '#000000'
  const secondaryColor = staticTeam?.secondaryColor || '#FFFFFF'
  const tertiaryColor = staticTeam?.tertiaryColor || null
  const quaternaryColor = staticTeam?.quaternaryColor || null
  const logoUrl = staticTeam?.logoUrl || team.logo_url || ''
  
  return {
    ...team,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    quaternaryColor,
    fullName: staticTeam?.fullName || `${team.city} ${team.name}`,
    wordMarkUrl: staticTeam?.wordMarkUrl || '',
    logoUrl,
    logo_url: logoUrl,
    colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      tertiary: tertiaryColor,
      quaternary: quaternaryColor,
    }
  }
}

export function enrichGame(game: Game): EnrichedGame {
  return {
    ...game,
    home_team: enrichTeam(game.home_team),
    away_team: enrichTeam(game.away_team),
    winner_team: game.winner_team ? enrichTeam(game.winner_team) : null,
  }
}

export function enrichGames(games: Game[]): EnrichedGame[] {
  return games.map(enrichGame)
}