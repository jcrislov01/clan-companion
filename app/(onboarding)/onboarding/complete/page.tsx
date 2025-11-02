'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingCompletePage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="mb-8 animate-bounce">
          <div className="text-8xl">🎉</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're All Set!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your family is ready to start coordinating chores, meals, and shopping together.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Taking you to your dashboard...</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Go to Dashboard Now →
        </button>
      </div>
    </div>
  )
}