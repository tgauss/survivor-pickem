import teamsData from '../NFL Team Info.json'

export interface TeamStatic {
  abbr: string
  teamId: number
  city: string
  name: string
  fullName: string
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string | null
  quaternaryColor: string | null
  logoUrl: string
  wordMarkUrl: string
}

function normalizeHexColor(color: string | null): string | null {
  if (!color) return null
  return color.startsWith('#') ? color : `#${color}`
}

function transformTeamData(rawTeam: typeof teamsData[0]): TeamStatic {
  return {
    abbr: rawTeam.Key,
    teamId: rawTeam.TeamID,
    city: rawTeam.City,
    name: rawTeam.Name,
    fullName: rawTeam.FullName,
    primaryColor: normalizeHexColor(rawTeam.PrimaryColor) || '#000000',
    secondaryColor: normalizeHexColor(rawTeam.SecondaryColor) || '#FFFFFF',
    tertiaryColor: normalizeHexColor(rawTeam.TertiaryColor),
    quaternaryColor: normalizeHexColor(rawTeam.QuaternaryColor),
    logoUrl: rawTeam.WikipediaLogoURL,
    wordMarkUrl: rawTeam.WikipediaWordMarkURL
  }
}

const transformedTeams = teamsData.map(transformTeamData)
const teamsMap = new Map(transformedTeams.map(team => [team.abbr, team]))

export function getTeamsArray(): TeamStatic[] {
  return transformedTeams
}

export function getTeamsMap(): Map<string, TeamStatic> {
  return teamsMap
}

export function getTeamByAbbr(abbr: string): TeamStatic | undefined {
  return teamsMap.get(abbr)
}

export function requireTeamByAbbr(abbr: string): TeamStatic {
  const team = teamsMap.get(abbr)
  if (!team) {
    throw new Error(`Team not found: ${abbr}`)
  }
  return team
}

export const TEAM_ABBREVIATIONS = transformedTeams.map(team => team.abbr)