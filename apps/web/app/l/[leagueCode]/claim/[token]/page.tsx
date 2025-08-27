'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'

export default function ClaimInvitePage() {
  const router = useRouter()
  const params = useParams()
  const leagueCode = params.leagueCode as string
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    pin: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadInvite()
  }, [token])

  const loadInvite = async () => {
    try {
      const response = await fetch(`/api/invites/${token}`)
      if (response.ok) {
        const data = await response.json()
        setInvite(data)
      } else {
        setError('Invalid or expired invite')
      }
    } catch (error) {
      setError('Failed to load invite')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ...formData
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/l/${leagueCode}`)
      } else {
        setError(data.error || 'Failed to claim invite')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Invalid Invite</h1>
          <p className="text-charcoal-400">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2">Join League</h1>
        {invite && (
          <p className="text-charcoal-400 mb-6">
            You've been invited to join <strong>{invite.league?.name}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              data-cy="claim-username"
              className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              data-cy="claim-display-name"
              className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PIN (4 digits)</label>
            <input
              type="text"
              pattern="[0-9]{4}"
              maxLength={4}
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              data-cy="claim-pin"
              className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating Entry...' : 'Join League'}
          </button>
        </form>
      </Card>
    </div>
  )
}