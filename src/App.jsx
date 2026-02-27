import { useTheme } from './hooks/useTheme'
import { useRouter } from './hooks/useRouter'
import StatusBar from './components/StatusBar'
import Navigation from './components/Navigation'
import ThemeToggle from './components/ThemeToggle'
import Overview from './pages/Overview'
import Projects from './pages/Projects'
import Claude from './pages/Claude'
import Infrastructure from './pages/Infrastructure'
import { isConfigured } from './lib/supabase'

const pages = {
  overview: Overview,
  projects: Projects,
  claude: Claude,
  infrastructure: Infrastructure,
}

export default function App() {
  const { dark, toggle } = useTheme()
  const { page, navigate } = useRouter()
  const Page = pages[page] || Overview

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
