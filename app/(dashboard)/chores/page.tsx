'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Chore {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  points: number
  status: 'open' | 'in_progress' | 'completed'
  due_date: string | null
  created_at: string
  completed_at: string | null
  assignee?: {
    name: string
  }
}

interface FamilyMember {
  id: string
  name: string
  email: string
  role: string
}

export default function ChoresPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [chores, setChores] = useState<Chore[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all')

  // New chore form state
  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    assigned_to: '',
    points: 10,
  })

  useEffect(() => {
    initialize()
  }, [])

  async function initialize() {
    const { user, error } = await getCurrentUser()
    if (error || !user) {
      router.push('/login')
      return
    }
    setUser(user)
    await loadUserFamily(user.email)
  }

  async function loadUserFamily(email: string) {
    try {
      // Get user's family
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_id')
        .eq('email', email)
        .single()

      if (userError) throw userError

      if (!userData?.family_id) {
        // Create family if doesn't exist
        const familyId = await createDefaultFamily(email)
        setFamilyId(familyId)
        await loadChores(familyId)
        await loadFamilyMembers(familyId)
      } else {
        setFamilyId(userData.family_id)
        await loadChores(userData.family_id)
        await loadFamilyMembers(userData.family_id)
      }
    } catch (error) {
      console.error('Error loading family:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createDefaultFamily(email: string) {
    try {
      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: 'My Family' })
        .select()
        .single()

      if (familyError) throw familyError

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          family_id: family.id,
          email: email,
          name: user?.user_metadata?.name || 'Parent',
          role: 'parent',
        })

      if (userError) throw userError

      return family.id
    } catch (error) {
      console.error('Error creating family:', error)
      throw error
    }
  }

  async function loadChores(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          assignee:users!chores_assigned_to_fkey(name)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setChores(data || [])
    } catch (error) {
      console.error('Error loading chores:', error)
    }
  }

  async function loadFamilyMembers(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('family_id', familyId)

      if (error) throw error
      setFamilyMembers(data || [])
    } catch (error) {
      console.error('Error loading family members:', error)
    }
  }

  async function handleAddChore(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId) return

    try {
      const { error } = await supabase
        .from('chores')
        .insert({
          family_id: familyId,
          title: newChore.title,
          description: newChore.description || null,
          assigned_to: newChore.assigned_to || null,
          points: newChore.points,
          status: 'open',
        })

      if (error) throw error

      // Reset form
      setNewChore({
        title: '',
        description: '',
        assigned_to: '',
        points: 10,
      })
      setShowAddModal(false)

      // Reload chores
      await loadChores(familyId)
    } catch (error) {
      console.error('Error adding chore:', error)
      alert('Failed to add chore')
    }
  }

  async function handleToggleComplete(chore: Chore) {
    if (!familyId) return

    const newStatus = chore.status === 'completed' ? 'open' : 'completed'
    const completed_at = newStatus === 'completed' ? new Date().toISOString() : null

    try {
      const { error } = await supabase
        .from('chores')
        .update({
          status: newStatus,
          completed_at,
        })
        .eq('id', chore.id)

      if (error) throw error

      // Reload chores
      await loadChores(familyId)
    } catch (error) {
      console.error('Error updating chore:', error)
      alert('Failed to update chore')
    }
  }

  async function handleDeleteChore(choreId: string) {
    if (!confirm('Are you sure you want to delete this chore?')) return
    if (!familyId) return

    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)

      if (error) throw error

      // Reload chores
      await loadChores(familyId)
    } catch (error) {
      console.error('Error deleting chore:', error)
      alert('Failed to delete chore')
    }
  }

  const filteredChores = chores.filter((chore) => {
    if (filter === 'all') return true
    if (filter === 'open') return chore.status !== 'completed'
    if (filter === 'completed') return chore.status === 'completed'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading chores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Add Chore
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({chores.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Open ({chores.filter((c) => c.status !== 'completed').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Completed ({chores.filter((c) => c.status === 'completed').length})
          </button>
        </div>

        {/* Chores List */}
        {filteredChores.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'completed' ? 'No completed chores yet' : 'No chores yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'completed'
                ? 'Complete some chores to see them here!'
                : 'Get started by adding your first chore.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Add Your First Chore
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChores.map((chore) => (
              <div
                key={chore.id}
                className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition ${
                  chore.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(chore)}
                    className="mt-1 flex-shrink-0"
                  >
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                        chore.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {chore.status === 'completed' && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Chore Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-lg font-semibold ${
                        chore.status === 'completed'
                          ? 'line-through text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {chore.title}
                    </h3>
                    {chore.description && (
                      <p className="text-sm text-gray-600 mt-1">{chore.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {chore.assignee && (
                        <span className="text-xs text-gray-500">
                          Assigned to: <span className="font-medium">{chore.assignee.name}</span>
                        </span>
                      )}
                      <span className="text-xs text-blue-600 font-medium">
                        {chore.points} points
                      </span>
                      {chore.status === 'completed' && chore.completed_at && (
                        <span className="text-xs text-green-600">
                          ✓ Completed {new Date(chore.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteChore(chore.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition"
                    title="Delete chore"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Chore Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Add New Chore</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddChore} className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Chore Title *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={newChore.title}
                  onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Clean your room"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newChore.description}
                  onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              {/* Assign To */}
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To (optional)
                </label>
                <select
                  id="assigned_to"
                  value={newChore.assigned_to}
                  onChange={(e) => setNewChore({ ...newChore, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Unassigned --</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Points */}
              <div>
                <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  id="points"
                  type="number"
                  min="0"
                  value={newChore.points}
                  onChange={(e) => setNewChore({ ...newChore, points: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Chore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}