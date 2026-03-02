import { useTheme } from './hooks/useTheme'
import { useRouter } from './hooks/useRouter'
import { useAuth } from './hooks/useAuth'
import StatusBar from './components/StatusBar'
import Navigation from './components/Navigation'
import ThemeToggle from './components/ThemeToggle'
import Overview from './pages/Overview'
import Projects from './pages/Projects'
import Claude from './pages/Claude'
import Infrastructure from './pages/Infrastructure'
import Login from './pages/Login'
import { isConfigured } from './lib/supabase'
import { LogOut } from 'lucide-react'

const pages = {
  overview: Overview,
  projects: Projects,
  claude: Claude,
  infrastructure: Infrastructure,
}

export default function App() {
  const { dark, toggle } = useTheme()
  const { page, navigate } = useRouter()
  const { session, loading, signIn, signOut } = useAuth()
  const Page = pages[page] || Overview

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show login page if not authenticated
  if (!session) {
    return <Login onLogin={signIn} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-navy shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('overview')}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <div className="text-xl font-bold text-white tracking-tight">
              OZ <span className="font-normal text-white/70">Command Center</span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            {!isConfigured() && (
              <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded">
                No Supabase
              </span>
            )}
            <ThemeToggle dark={dark} onToggle={toggle} />
            <button
              onClick={signOut}
              title="Sign out"
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Navigation current={page} onNavigate={navigate} />

      {/* Status Bar - always visible */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <StatusBar />
      </div>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <Page onNavigate={navigate} />
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Oz Command Center / Real-time via Supabase / Built by Oz
        </p>
      </footer>
    </div>
  )
}
