'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ShoppingItem {
  id: string
  name: string
  checked: boolean
  category: string | null
  created_at: string
}

export default function ShoppingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const [filter, setFilter] = useState<'all' | 'needed' | 'purchased'>('all')

  useEffect(() => {
    initialize()
  }, [])

  async function initialize() {
    const { user: currentUser, error } = await getCurrentUser()
    // ensure user and email exist before proceeding
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
        await loadItems(existingUser.family_id)
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

  async function loadItems(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error: any) {
      console.error('Error loading items:', error)
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId || !newItemName.trim()) return

    try {
      const { error } = await supabase
        .from('shopping_items')
        .insert({
          family_id: familyId,
          name: newItemName.trim(),
          checked: false,
        })

      if (error) throw error

      setNewItemName('')
      await loadItems(familyId)
    } catch (error: any) {
      console.error('Error adding item:', error)
      alert(`Failed to add item: ${error.message}`)
    }
  }

  async function handleToggleCheck(item: ShoppingItem) {
    if (!familyId) return

    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ checked: !item.checked })
        .eq('id', item.id)

      if (error) throw error

      await loadItems(familyId)
    } catch (error: any) {
      console.error('Error updating item:', error)
      alert(`Failed to update item: ${error.message}`)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!familyId) return

    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      await loadItems(familyId)
    } catch (error: any) {
      console.error('Error deleting item:', error)
      alert(`Failed to delete item: ${error.message}`)
    }
  }

  async function handleClearPurchased() {
    if (!familyId) return
    if (!confirm('Clear all purchased items?')) return

    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('family_id', familyId)
        .eq('checked', true)

      if (error) throw error

      await loadItems(familyId)
    } catch (error: any) {
      console.error('Error clearing items:', error)
      alert(`Failed to clear items: ${error.message}`)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'needed') return !item.checked
    if (filter === 'purchased') return item.checked
    return true
  })

  const neededCount = items.filter((i) => !i.checked).length
  const purchasedCount = items.filter((i) => i.checked).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading shopping list...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          </div>
          {purchasedCount > 0 && (
            <button
              onClick={handleClearPurchased}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
            >
              Clear Purchased ({purchasedCount})
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add an item... (e.g., Milk, Bread)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{neededCount}</div>
            <div className="text-sm text-gray-600">Items to Buy</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{purchasedCount}</div>
            <div className="text-sm text-gray-600">Purchased</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('needed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'needed'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Needed ({neededCount})
          </button>
          <button
            onClick={() => setFilter('purchased')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'purchased'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Purchased ({purchasedCount})
          </button>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'purchased' ? 'No purchased items' : 'Your list is empty'}
            </h3>
            <p className="text-gray-600">
              {filter === 'purchased'
                ? 'Check off items as you buy them!'
                : 'Add items to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border divide-y">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition ${
                  item.checked ? 'opacity-60' : ''
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleCheck(item)}
                  className="flex-shrink-0"
                >
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                      item.checked
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {item.checked && (
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

                {/* Item Name */}
                <div className="flex-1">
                  <span
                    className={`text-lg ${
                      item.checked
                        ? 'line-through text-gray-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition"
                  title="Delete item"
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
            ))}
          </div>
        )}
      </main>
    </div>
  )
}