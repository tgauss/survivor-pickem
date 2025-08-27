import { resetState, seedWeekZero } from './data/adapters/local'

export { setFixedNow } from '@/lib/timectl'

export function setupTest(): void {
  resetState()
  seedWeekZero()
}

export function testTeamAbbr(): string {
  return 'BUF'
}

export function testUsedTeamAbbr(): string {
  return 'MIA'
}

export function testEntryId(): string {
  return 'entry-1'
}

export function testLeagueId(): string {
  return 'league-1'
}

export function testAdminId(): string {
  return 'entry-1'
}

export function advanceTime(milliseconds: number): void {
  // Mock implementation - in real app might need sinon/jest timers
  const originalNow = Date.now
  const targetTime = originalNow() + milliseconds
  global.Date.now = () => targetTime
  
  // Also mock constructor
  const originalDate = Date
  global.Date = class extends originalDate {
    constructor() {
      super()
      return new originalDate(targetTime)
    }
    static now() {
      return targetTime
    }
  } as any
}