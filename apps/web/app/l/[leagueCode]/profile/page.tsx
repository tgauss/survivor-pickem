'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ArrowLeft, Upload } from 'lucide-react'

interface SessionData {
  entry: {
    id: string
    username: string
    display_name: string
    real_name: string
    email: string
    phone: string
    avatar_url: string | null
  }
}

export default function ProfilePage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [formData, setFormData] = useState({
    real_name: '',
    email: '',
    phone: '',
    new_pin: '',
    confirm_pin: '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const response = await fetch('/api/me/session')
      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)
        setFormData({
          real_name: sessionData.entry.real_name,
          email: sessionData.entry.email,
          phone: sessionData.entry.phone,
          new_pin: '',
          confirm_pin: '',
        })
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.new_pin && formData.new_pin !== formData.confirm_pin) {
      setMessage({ type: 'error', text: 'PINs do not match' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // In a real app, this would update the profile
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setFormData(prev => ({ ...prev, new_pin: '', confirm_pin: '' }))
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-charcoal-400">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal-400 mb-4">Not logged in</div>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/me"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar
                src={avatarPreview || session.entry.avatar_url}
                alt={session.entry.display_name}
                fallback={session.entry.display_name.slice(0, 2)}
                size="xl"
              />
              
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-charcoal-400 mt-2">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={session.entry.username}
                  disabled
                  className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg text-charcoal-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={session.entry.display_name}
                  disabled
                  className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg text-charcoal-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Real Name</label>
              <input
                type="text"
                value={formData.real_name}
                onChange={handleChange('real_name')}
                className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-charcoal-400 mt-1">For notifications only</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-charcoal-400 mt-1">For notifications only</p>
              </div>
            </div>

            {/* PIN Reset */}
            <div className="border-t border-charcoal-700 pt-6">
              <h3 className="text-lg font-semibold mb-4">Change PIN</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">New PIN</label>
                  <input
                    type="password"
                    value={formData.new_pin}
                    onChange={handleChange('new_pin')}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm PIN</label>
                  <input
                    type="password"
                    value={formData.confirm_pin}
                    onChange={handleChange('confirm_pin')}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className="w-full px-3 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <p className="text-xs text-charcoal-400 mt-2">
                Leave blank to keep current PIN
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              
              <Link
                href="/me"
                className="px-6 py-2 bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}