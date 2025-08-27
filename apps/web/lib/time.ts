export function formatLocalTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...options,
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (Math.abs(diffSec) < 60) {
    return diffSec < 0 ? `${Math.abs(diffSec)}s ago` : `in ${diffSec}s`
  }
  if (Math.abs(diffMin) < 60) {
    return diffMin < 0 ? `${Math.abs(diffMin)}m ago` : `in ${diffMin}m`
  }
  if (Math.abs(diffHour) < 24) {
    return diffHour < 0 ? `${Math.abs(diffHour)}h ago` : `in ${diffHour}h`
  }
  if (Math.abs(diffDay) < 7) {
    return diffDay < 0 ? `${Math.abs(diffDay)}d ago` : `in ${diffDay}d`
  }

  return formatLocalTime(d, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function formatKickoffTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return formatLocalTime(d, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getTimeUntilKickoff(date: Date | string): {
  days: number
  hours: number
  minutes: number
  isPast: boolean
} {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const isPast = diffMs < 0
  const absDiffMs = Math.abs(diffMs)
  
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, isPast }
}