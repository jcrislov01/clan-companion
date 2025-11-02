'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getCurrentUser, 
  getFamilyMembers, 
  addFamilyMember, 
  updateFamilyMember,
  deleteFamilyMember,
  updateFamilyName,
  supabase 
} from '@/lib/supabase'
import Link from 'next/link'

interface FamilyMember {
  id: string
  name: string
  email: string
  role: 'parent' | 'child'
}

interface Family {
  id: string
  name: string
}

export default function FamilySettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit family name
  const [editingName, setEditingName] = useState(false)
  const [familyName, setFamilyName] = useState('')
  
  // Add member
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'child' as 'parent' | 'child',
  })

  useEffect(() => {
    initialize()
  }, [])

  async function initialize() {
    try {
      const { user, error } = await getCurrentUser()
      if (error || !user) {
        router.push('/login')
        return
      }

      // Get user's family
      const { data: userData } = await supabase
        .from('users')
        .select('family_id')
        .eq('email', user.email)
        .maybeSingle()

      if (!userData?.family_id) {
        router.push('/onboarding/family')
        return
      }

      // Get family details
      const { data: familyData } = await supabase
        .from('families')
        .select('*')
        .eq('id', userData.family_id)
        .single()

      setUser(user)
      setFamily(familyData)
      setFamilyName(familyData.name)
      await loadMembers(userData.family_id)
    } catch (err) {
      console.error('Error initializing:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadMembers(familyId: string) {
    try {
      const membersList = await getFamilyMembers(familyId)
      setMembers(membersList)
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  async function handleUpdateFamilyName() {
    if (!family || !familyName.trim()) return

    try {
      await updateFamilyName(family.id, familyName.trim())
      setFamily({ ...family, name: familyName.trim() })
      setEditingName(false)
    } catch (err: any) {
      alert(`Failed to update family name: ${err.message}`)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!family || !newMember.name.trim()) return

    try {
      await addFamilyMember(family.id, newMember.name.trim(), newMember.role)
      await loadMembers(family.id)
      setNewMember({ name: '', role: 'child' })
      setShowAddForm(false)
    } catch (err: any) {
      alert(`Failed to add member: ${err.message}`)
    }
  }

  async function handleDeleteMember(memberId: string) {
    if (!confirm('Remove this family member? Their chores will be unassigned.')) return

    try {
      await deleteFamilyMember(memberId)
      await loadMembers(family!.id)
    } catch (err: any) {
      alert(`Failed to remove member: ${err.message}`)
    }
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Family Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Family Name Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Family Name</h2>
          {editingName ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleUpdateFamilyName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setFamilyName(family!.name)
                  setEditingName(false)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-2xl font-medium text-gray-900">{family?.name}</p>
              <button
                onClick={() => setEditingName(true)}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Family Members Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Family Members ({members.length})</h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                + Add Member
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {showAddForm && (
            <form onSubmit={handleAddMember} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="memberName"
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Sarah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="parent"
                        checked={newMember.role === 'parent'}
                        onChange={() => setNewMember({ ...newMember, role: 'parent' })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Parent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="child"
                        checked={newMember.role === 'child'}
                        onChange={() => setNewMember({ ...newMember, role: 'child' })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Child</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewMember({ name: '', role: 'child' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                    {member.role === 'parent' ? '👨‍💼' : '👶'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.name}
                      {member.email === user?.email && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">You</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                  </div>
                </div>
                {member.email !== user?.email && (
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                    title="Remove member"
                  >
                    <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}