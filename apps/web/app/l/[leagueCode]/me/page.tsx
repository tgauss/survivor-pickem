'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ArrowLeft, User, Shield, Clock, Trophy } from 'lucide-react'

export default function MyProfilePage() {
  const router = useRouter()
  const params = useParams()
  const leagueCode = params.leagueCode as string
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const response = await fetch('/api/me/session')
      if (response.ok) {
        const data = await response.json()
        setSession(data)
      } else {
        router.push(`/l/${leagueCode}`)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/l/${leagueCode}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-charcoal-800 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{session.entry.display_name}</h1>
              <p className="text-charcoal-400">@{session.entry.username}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-charcoal-400">Strikes</div>
                <div className="font-semibold">{session.entry.strikes}/3</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-sm text-charcoal-400">Status</div>
                <div className="font-semibold">
                  {session.entry.is_alive ? 'Alive' : 'Eliminated'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-charcoal-400">Paid</div>
                <div className="font-semibold">
                  {session.entry.is_paid ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}