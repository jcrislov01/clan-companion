'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, supabase } from '@/lib/supabase'
import Link from 'next/link'

interface MealSlot {
  id: string
  day_of_week: number
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  meal_name: string | null
  recipe_notes: string | null
  created_at: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const

export default function MealsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [mealSlots, setMealSlots] = useState<MealSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{
    day: number
    mealType: 'breakfast' | 'lunch' | 'dinner'
    existingSlot?: MealSlot
  } | null>(null)

  const [mealForm, setMealForm] = useState({
    meal_name: '',
    recipe_notes: '',
  })

  useEffect(() => {
    initialize()
  }, [])

  async function initialize() {
    const { user: currentUser, error } = await getCurrentUser()
    // Ensure we have a user with an email before proceeding
    if (error || !currentUser || !currentUser.email) {
      router.push('/login')
      return
    }
    setUser(currentUser)
    await loadUserFamily(currentUser.email)
  }

  async function loadUserFamily(email: string) {
    try {
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
        await loadMealSlots(existingUser.family_id)
      } else {
        alert('Please set up your family first by visiting the Chores page.')
        router.push('/chores')
      }
    } catch (error: any) {
      console.error('Error loading family:', error)
      alert(`Error: ${error.message || 'Failed to load family data'}`)
    } finally {
      setLoading(false)
    }
  }

  async function loadMealSlots(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('family_id', familyId)

      if (error) throw error
      setMealSlots(data || [])
    } catch (error: any) {
      console.error('Error loading meals:', error)
    }
  }

  function getMealForSlot(day: number, mealType: string): MealSlot | undefined {
    return mealSlots.find(
      (slot) => slot.day_of_week === day && slot.meal_type === mealType
    )
  }

  function handleOpenEdit(day: number, mealType: 'breakfast' | 'lunch' | 'dinner') {
    const existingSlot = getMealForSlot(day, mealType)
    
    setEditingSlot({
      day,
      mealType,
      existingSlot,
    })

    setMealForm({
      meal_name: existingSlot?.meal_name || '',
      recipe_notes: existingSlot?.recipe_notes || '',
    })

    setShowEditModal(true)
  }

  async function handleSaveMeal(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId || !editingSlot) return

    try {
      if (editingSlot.existingSlot) {
        // Update existing meal
        const { error } = await supabase
          .from('meal_slots')
          .update({
            meal_name: mealForm.meal_name || null,
            recipe_notes: mealForm.recipe_notes || null,
          })
          .eq('id', editingSlot.existingSlot.id)

        if (error) throw error
      } else {
        // Create new meal
        const { error } = await supabase
          .from('meal_slots')
          .insert({
            family_id: familyId,
            day_of_week: editingSlot.day,
            meal_type: editingSlot.mealType,
            meal_name: mealForm.meal_name || null,
            recipe_notes: mealForm.recipe_notes || null,
          })

        if (error) throw error
      }

      setShowEditModal(false)
      setEditingSlot(null)
      setMealForm({ meal_name: '', recipe_notes: '' })
      await loadMealSlots(familyId)
    } catch (error: any) {
      console.error('Error saving meal:', error)
      alert(`Failed to save meal: ${error.message}`)
    }
  }

  async function handleDeleteMeal() {
    if (!editingSlot?.existingSlot) return
    if (!confirm('Remove this meal from the plan?')) return

    try {
      const { error } = await supabase
        .from('meal_slots')
        .delete()
        .eq('id', editingSlot.existingSlot.id)

      if (error) throw error

      setShowEditModal(false)
      setEditingSlot(null)
      await loadMealSlots(familyId!)
    } catch (error: any) {
      console.error('Error deleting meal:', error)
      alert(`Failed to delete meal: ${error.message}`)
    }
  }

  const totalMealsPlanned = mealSlots.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading meal plan...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
          </div>
          <div className="text-sm text-gray-600">
            {totalMealsPlanned} {totalMealsPlanned === 1 ? 'meal' : 'meals'} planned
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-800">
            📅 <strong>Plan your week:</strong> Click any meal slot to add or edit. Keep it simple or add detailed recipes!
          </p>
        </div>

        {/* Weekly Grid */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-gray-100 border-b">
            <div className="p-3 font-semibold text-gray-700">Day</div>
            <div className="p-3 font-semibold text-gray-700">Breakfast</div>
            <div className="p-3 font-semibold text-gray-700">Lunch</div>
            <div className="p-3 font-semibold text-gray-700">Dinner</div>
          </div>

          {/* Table Body */}
          {DAYS.map((day, dayIndex) => (
            <div
              key={day}
              className="grid grid-cols-4 border-b last:border-b-0 hover:bg-gray-50 transition"
            >
              {/* Day Name */}
              <div className="p-3 font-medium text-gray-900 border-r bg-gray-50">
                {day}
              </div>

              {/* Meal Slots */}
              {MEAL_TYPES.map((mealType) => {
                const meal = getMealForSlot(dayIndex, mealType)
                return (
                  <button
                    key={`${dayIndex}-${mealType}`}
                    onClick={() => handleOpenEdit(dayIndex, mealType)}
                    className="p-3 text-left border-r last:border-r-0 hover:bg-purple-50 transition min-h-[80px]"
                  >
                    {meal ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {meal.meal_name}
                        </div>
                        {meal.recipe_notes && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {meal.recipe_notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">+ Add meal</div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Empty State Prompt */}
        {totalMealsPlanned === 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Start planning your week
            </h3>
            <p className="text-gray-600 mb-6">
              Click any meal slot above to add what you're eating this week!
            </p>
          </div>
        )}
      </main>

      {/* Edit Meal Modal */}
      {showEditModal && editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {DAYS[editingSlot.day]} - {editingSlot.mealType.charAt(0).toUpperCase() + editingSlot.mealType.slice(1)}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
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

            <form onSubmit={handleSaveMeal} className="space-y-4">
              {/* Meal Name */}
              <div>
                <label htmlFor="meal_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Name
                </label>
                <input
                  id="meal_name"
                  type="text"
                  value={mealForm.meal_name}
                  onChange={(e) => setMealForm({ ...mealForm, meal_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Spaghetti Bolognese"
                />
              </div>

              {/* Recipe Notes */}
              <div>
                <label htmlFor="recipe_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Notes (optional)
                </label>
                <textarea
                  id="recipe_notes"
                  value={mealForm.recipe_notes}
                  onChange={(e) => setMealForm({ ...mealForm, recipe_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ingredients, instructions, or cooking notes..."
                  rows={4}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                {editingSlot.existingSlot && (
                  <button
                    type="button"
                    onClick={handleDeleteMeal}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Save Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}