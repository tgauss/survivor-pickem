'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

export default function HistoryPage() {
  const params = useParams()
  const leagueCode = params.leagueCode as string

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
          <h1 className="text-2xl font-bold mb-4">Pick History</h1>
          <p className="text-charcoal-400">History view coming soon...</p>
        </Card>
      </div>
    </div>
  )
}