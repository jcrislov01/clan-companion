'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Stats
  const [stats, setStats] = useState({
    totalChores: 0,
    openChores: 0,
    completedToday: 0,
    shoppingItems: 0,
    mealsPlanned: 0,
  })

  useEffect(() => {
    initialize()
  }, [])

  async function initialize() {
    const { user: currentUser, error } = await getCurrentUser()
    // ensure we have a user and an email before proceeding
    if (error || !currentUser || !currentUser.email) {
      router.push('/login')
      return
    }
    setUser(currentUser)
    await loadUserFamily(currentUser.email)
  }

  async function loadUserFamily(email: string) {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('family_id')
        .eq('email', email)
        .maybeSingle()

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        throw userCheckError
      }

      if (existingUser?.family_id) {
        setFamilyId(existingUser.family_id)
        await loadStats(existingUser.family_id)
      }
    } catch (error: any) {
      console.error('Error loading family:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats(familyId: string) {
    try {
      const { supabase } = await import('@/lib/supabase')
      // Load chores stats
      const { data: chores, error: choresError } = await supabase
        .from('chores')
        .select('status, completed_at')
        .eq('family_id', familyId)

      if (choresError) throw choresError

      const totalChores = chores?.length || 0
      const openChores = chores?.filter(c => c.status !== 'completed').length || 0
      
      // Count completed today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const completedToday = chores?.filter(c => {
        if (!c.completed_at) return false
        const completedDate = new Date(c.completed_at)
        completedDate.setHours(0, 0, 0, 0)
        return completedDate.getTime() === today.getTime()
      }).length || 0

      // Load shopping items
      const { data: shopping, error: shoppingError } = await supabase
        .from('shopping_items')
        .select('checked')
        .eq('family_id', familyId)

      if (shoppingError) throw shoppingError

      const shoppingItems = shopping?.filter(item => !item.checked).length || 0

      // Load meals planned
      const { data: meals, error: mealsError } = await supabase
        .from('meal_slots')
        .select('id')
        .eq('family_id', familyId)

      if (mealsError) throw mealsError

      const mealsPlanned = meals?.length || 0

      setStats({
        totalChores,
        openChores,
        completedToday,
        shoppingItems,
        mealsPlanned,
      })
    } catch (error: any) {
      console.error('Error loading stats:', error)
    }
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
              <div className="text-3xl font-bold text-blue-600">{stats.openChores}</div>
              <div className="text-xs text-gray-500">Active chores</div>
            </div>
            <Link 
              href="/chores"
              className="block w-full px-4 py-2 bg-blue-600 text-center text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              View Chores
            </Link>
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
              <div className="text-3xl font-bold text-green-600">{stats.shoppingItems}</div>
              <div className="text-xs text-gray-500">Items to buy</div>
            </div>
            <Link 
              href="/shopping"
              className="block w-full px-4 py-2 bg-green-600 text-center text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              View Lists
            </Link>
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
              <div className="text-3xl font-bold text-purple-600">{stats.mealsPlanned}</div>
              <div className="text-xs text-gray-500">Meals planned</div>
            </div>
            <Link 
              href="/meals"
              className="block w-full px-4 py-2 bg-purple-600 text-center text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              Plan Meals
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Family Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.completedToday}</div>
              <div className="text-sm text-gray-600 mt-1">Tasks Completed Today</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.shoppingItems}</div>
              <div className="text-sm text-gray-600 mt-1">Shopping Items Needed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{stats.mealsPlanned}</div>
              <div className="text-sm text-gray-600 mt-1">Meals Planned This Week</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {familyId && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/chores"
              className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition text-center"
            >
              <div className="text-2xl mb-2">➕</div>
              <div className="font-medium text-gray-900">Add Chore</div>
            </Link>
            <Link
              href="/shopping"
              className="bg-white border-2 border-green-200 rounded-lg p-4 hover:border-green-400 hover:bg-green-50 transition text-center"
            >
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-medium text-gray-900">Add Shopping Item</div>
            </Link>
            <Link
              href="/meals"
              className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:bg-purple-50 transition text-center"
            >
              <div className="text-2xl mb-2">🍽️</div>
              <div className="font-medium text-gray-900">Plan Meal</div>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}