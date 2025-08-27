export const USE_SUPABASE = process.env.USE_SUPABASE === 'true'

export const SUPABASE = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

export const SPORTSDATA = {
  baseUrl: process.env.SPORTSDATA_BASE_URL || 'https://api.sportsdata.io/v3/nfl',
  apiKey: process.env.SPORTSDATA_API_KEY || '',
  enabled: Boolean(process.env.SPORTSDATA_API_KEY),
  useQueryKey: process.env.SPORTSDATA_USE_QUERY_KEY === 'true',
}

export const BRANDING_MODE = process.env.TEAM_BRANDING_MODE ?? 'neutral'