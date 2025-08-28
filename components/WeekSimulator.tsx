'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { FastForward, RotateCcw, Play, Check } from 'lucide-react'

interface WeekSimulatorProps {
  leagueCode: string
  currentWeek: number
  onRefresh: () => void
}

export function WeekSimulator({ leagueCode, currentWeek, onRefresh }: WeekSimulatorProps) {
  const [simulating, setSimulating] = useState(false)
  const [message, setMessage] = useState('')
  
  const simulateWeek = async (action: string) => {
    setSimulating(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/admin/weeks/${currentWeek}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ 
          leagueCode,
          force: action === 'reveal',
          reason: 'Admin simulation'
        })
      })
      
      if (response.ok) {
        setMessage(`Week ${currentWeek} ${action} complete!`)
        setTimeout(() => {
          onRefresh()
          setMessage('')
        }, 1500)
      } else {
        setMessage('Simulation failed')
      }
    } catch (error) {
      setMessage('Error during simulation')
    } finally {
      setSimulating(false)
    }
  }
  
  const advanceTime = async () => {
    setSimulating(true)
    setMessage('Advancing time...')
    
    try {
      // This would call an API to advance the current time for testing
      const response = await fetch('/api/test/advance-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      })
      
      if (response.ok) {
        setMessage('Time advanced by 1 week')
        setTimeout(() => {
          onRefresh()
          setMessage('')
        }, 1500)
      }
    } catch (error) {
      setMessage('Failed to advance time')
    } finally {
      setSimulating(false)
    }
  }
  
  const resetWeek = async () => {
    if (!confirm(`Reset Week ${currentWeek}? This will clear all picks and results.`)) return
    
    setSimulating(true)
    setMessage('Resetting week...')
    
    try {
      const response = await fetch('/api/test/reset-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNo: currentWeek })
      })
      
      if (response.ok) {
        setMessage(`Week ${currentWeek} reset`)
        setTimeout(() => {
          onRefresh()
          setMessage('')
        }, 1500)
      }
    } catch (error) {
      setMessage('Failed to reset week')
    } finally {
      setSimulating(false)
    }
  }
  
  return (
    <Card className="p-4 bg-purple-900/10 border-purple-500/20">
      <h3 className="text-sm font-semibold text-purple-400 mb-3">Season Simulator</h3>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => simulateWeek('reveal')}
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            Reveal Picks
          </button>
          
          <button
            onClick={() => simulateWeek('score')}
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            Score Week
          </button>
          
          <button
            onClick={advanceTime}
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FastForward className="w-4 h-4" />
            Advance Time
          </button>
          
          <button
            onClick={resetWeek}
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Week
          </button>
        </div>
        
        {message && (
          <div className="text-sm text-purple-300 animate-fade-in">
            {message}
          </div>
        )}
        
        <div className="text-xs text-purple-400/60">
          Use these controls to simulate a full season for testing. Reveal shows all picks, Score determines winners/losers.
        </div>
      </div>
    </Card>
  )
}