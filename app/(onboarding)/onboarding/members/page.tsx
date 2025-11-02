'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getFamilyMembers, addFamilyMember, deleteFamilyMember, completeOnboarding, supabase } from '@/lib/supabase'

interface FamilyMember {
  id: string
  name: string
  email: string
  role: 'parent' | 'child'
}

export default function OnboardingMembersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Add member form
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
        // No family yet, go back to step 1
        router.push('/onboarding/family')
        return
      }

      setUser(user)
      setFamilyId(userData.family_id)
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

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId || !newMember.name.trim()) return

    try {
      await addFamilyMember(familyId, newMember.name.trim(), newMember.role)
      await loadMembers(familyId)
      
      // Reset form
      setNewMember({ name: '', role: 'child' })
      setShowAddForm(false)
    } catch (err: any) {
      console.error('Error adding member:', err)
      alert(`Failed to add member: ${err.message}`)
    }
  }

  async function handleDeleteMember(memberId: string) {
    if (!confirm('Remove this family member?')) return

    try {
      await deleteFamilyMember(memberId)
      await loadMembers(familyId!)
    } catch (err: any) {
      console.error('Error deleting member:', err)
      alert(`Failed to remove member: ${err.message}`)
    }
  }

  async function handleFinish() {
    if (members.length < 2) {
      alert('Please add at least one family member to continue.')
      return
    }

    setSubmitting(true)
    try {
      await completeOnboarding(user.email)
      router.push('/onboarding/complete')
    } catch (err: any) {
      console.error('Error completing onboarding:', err)
      alert(`Failed to complete setup: ${err.message}`)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              ✓
            </div>
            <div className="w-16 h-1 bg-blue-600"></div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
              ✓
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span className="text-green-600">Family</span>
            <span className="font-medium text-blue-600">Members</span>
            <span>Done</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👥</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add Your Family Members
            </h1>
            <p className="text-gray-600">
              Add parents and children so you can assign chores and coordinate together
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-3 mb-6">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                    {member.role === 'parent' ? '👨‍💼' : '👶'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
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

          {/* Add Member Form */}
          {showAddForm ? (
            <form onSubmit={handleAddMember} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <div className="space-y-4">
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
                    autoFocus
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
                        onChange={(e) => setNewMember({ ...newMember, role: 'parent' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Parent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="child"
                        checked={newMember.role === 'child'}
                        onChange={(e) => setNewMember({ ...newMember, role: 'child' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Child</span>
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition font-medium mb-6"
            >
              + Add Family Member
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/onboarding/family')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              ← Back
            </button>
            <button
              onClick={handleFinish}
              disabled={submitting || members.length < 2}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Finishing...' : 'Finish Setup'}
            </button>
          </div>

          {members.length < 2 && (
            <p className="text-sm text-amber-600 mt-4 text-center">
              💡 Add at least one family member to continue
            </p>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Step 2 of 2 • You can add more members later
        </p>
      </div>
    </div>
  )
}