import { useTheme } from './hooks/useTheme'
import StatusBar from './components/StatusBar'
import ClaudeUsage from './components/ClaudeUsage'
import ModelBreakdown from './components/ModelBreakdown'
import CostAnalysis from './components/CostAnalysis'
import ActivityLog from './components/ActivityLog'
import TaskBoard from './components/TaskBoard'
import SecurityMonitor from './components/SecurityMonitor'
import ApiHealth from './components/ApiHealth'
import ThemeToggle from './components/ThemeToggle'
import { isConfigured } from './lib/supabase'

export default function App() {
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-navy shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold text-white tracking-tight">
              OZ <span className="font-normal text-white/70">Command Center</span>
            </div>
          </div>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Status Bar */}
        <StatusBar />

        {/* Claude Intelligence: Usage + Models + Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClaudeUsage />
          <ModelBreakdown />
          <CostAnalysis />
        </div>

        {/* Activity Log + Task Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityLog />
          <TaskBoard />
        </div>

        {/* Security + API Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SecurityMonitor />
          <ApiHealth />
        </div>
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
