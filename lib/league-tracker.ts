// Client-side league tracking without disrupting session cookies
// This replaces the middleware cookie setting that was destroying sessions

const STORAGE_KEY = 'last_league_code'

export function saveLastLeagueCode(leagueCode: string) {
  if (typeof window === 'undefined') return
  
  try {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, leagueCode)
    
    // Also set a cookie for middleware redirects (only from client-side)
    // This won't destroy other cookies like the middleware was doing
    document.cookie = `last_league_code=${leagueCode}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  } catch (error) {
    console.error('Failed to save league code:', error)
  }
}

export function getLastLeagueCode(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to get league code:', error)
    return null
  }
}

export function clearLastLeagueCode() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    // Clear the cookie too
    document.cookie = 'last_league_code=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
  } catch (error) {
    console.error('Failed to clear league code:', error)
  }
}