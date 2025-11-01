'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { user, error } = await getCurrentUser()
    if (error || !user) {
      router.push('/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Clan Companion</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.user_metadata?.name || user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-gray-600">Here's what's happening with your family today.</p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Chores Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Chores</h3>
              <div className="text-3xl">✅</div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Manage family chores and tasks
            </p>
            <div className="mb-4">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-xs text-gray-500">Active chores</div>
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
              <Link 
  href="/chores"
  className="block w-full px-4 py-2 bg-blue-600 text-center text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
>
  View Chores
</Link>
            </button>
          </div>

          {/* Shopping Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Shopping</h3>
              <div className="text-3xl">🛒</div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Shared shopping lists
            </p>
            <div className="mb-4">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-xs text-gray-500">Items to buy</div>
            </div>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
            <Link 
  href="/shopping"
  className="block w-full px-4 py-2 bg-green-600 text-center text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
>
  View Lists
</Link>
            </button>
          </div>

          {/* Meals Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Meals</h3>
              <div className="text-3xl">🍽️</div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Plan your weekly meals
            </p>
            <div className="mb-4">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-xs text-gray-500">Meals planned</div>
            </div>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
              Plan Meals
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Family Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Tasks Completed Today</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Shopping Items</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming Events</div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2">🚧 Under Construction</h4>
          <p className="text-blue-800 text-sm">
            Individual feature pages are being built! For now, this dashboard shows the foundation of what's coming.
          </p>
        </div>
      </main>
    </div>
  )
}