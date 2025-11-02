'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, createFamily, checkOnboardingStatus } from '@/lib/supabase'

export default function OnboardingFamilyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [familyName, setFamilyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { user: currentUser, error } = await getCurrentUser()
      if (error || !currentUser || !currentUser.email) {
        router.push('/login')
        return
      }

      // Check if already completed onboarding
      const status = await checkOnboardingStatus(currentUser.email)
      if (status.completed && status.hasFamily) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
    } catch (err) {
      console.error('Error checking user:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !familyName.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const userName = user.user_metadata?.name || user.email
      await createFamily(familyName.trim(), user.email, userName)
      
      // Go to next step
      router.push('/onboarding/members')
    } catch (err: any) {
      console.error('Error creating family:', err)
      setError(err.message || 'Failed to create family')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
              ✓
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span className="font-medium text-blue-600">Family</span>
            <span>Members</span>
            <span>Done</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Clan Companion!
            </h1>
            <p className="text-gray-600">
              Let's start by creating your family
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                Family Name
              </label>
              <input
                id="familyName"
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="e.g., The Smiths"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-500">
                This is what you'll see throughout the app
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !familyName.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Step 1 of 2 • This will only take a minute
        </p>
      </div>
    </div>
  )
}