'use client'

import { useState, useEffect } from 'react'
import { getTimeUntilKickoff } from '@/lib/time'

export interface CountdownProps {
  targetDate: Date | string
  className?: string
}

export function Countdown({ targetDate, className = '' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilKickoff(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilKickoff(targetDate))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.isPast) {
    return <span className={className}>Time expired</span>
  }

  const parts = []
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`)
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`)
  if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`)

  if (parts.length === 0) {
    parts.push('< 1m')
  }

  return (
    <span className={className}>
      in {parts.join(' ')}
    </span>
  )
}