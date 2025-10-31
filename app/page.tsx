import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Clan Companion</h1>
          <Link 
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Clan Companion
          </h1>
          <p className="text-2xl text-gray-600 mb-4">
            Family Coordination. Simplified.
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Manage chores, plan meals, organize shopping, and keep your family connected—all in one place.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/login"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 shadow-lg transition"
            >
              Get Started Free
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-50 shadow-lg border border-gray-200 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Everything your family needs</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Chore Management</h3>
            <p className="text-gray-600">
              Assign tasks, track completion, and keep everyone accountable with gamified rewards
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">Meal Planning</h3>
            <p className="text-gray-600">
              Plan weekly meals and link recipes to keep dinner stress-free
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">Shopping Lists</h3>
            <p className="text-gray-600">
              Shared lists that everyone can access and update in real-time
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Family Calendar</h3>
            <p className="text-gray-600">
              Coordinate schedules with shared events and reminders
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold mb-2">Kid-Friendly</h3>
            <p className="text-gray-600">
              Designed for both parents and children with appropriate controls
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-600">
              Your family data stays private with no tracking or advertising
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to simplify your family life?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join families who are spending less time managing and more time connecting.
          </p>
          <Link 
            href="/login"
            className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-50 shadow-lg transition"
          >
            Get Started Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Clan Companion. Built with integrity.</p>
        </div>
      </footer>
    </div>
  )
}