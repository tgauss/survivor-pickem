'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { User, Key, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    pin: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to login')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Welcome Back</h1>
          
          {error && (
            <div className="mb-4 p-3 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange('username')}
                  className="w-full px-3 py-2 pl-10 bg-charcoal-800 border border-charcoal-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="jsmith"
                  autoComplete="username"
                />
                <User className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">PIN</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.pin}
                  onChange={handleChange('pin')}
                  className="w-full px-3 py-2 pl-10 bg-charcoal-800 border border-charcoal-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="••••"
                  autoComplete="current-password"
                />
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-charcoal-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </Card>

        <div className="text-center text-sm text-charcoal-400 mt-4">
          <p>Test credentials:</p>
          <p className="text-xs mt-1">
            jsmith / 1234 • sarahc / 5678 • mikej / 9999
          </p>
        </div>
      </div>
    </div>
  )
}