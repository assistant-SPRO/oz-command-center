import { useState, useCallback } from 'react'
import { useRouter } from './hooks/useRouter'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import Sidebar from './components/Sidebar'
import GlobalSearch from './components/GlobalSearch'
import Login from './pages/Login'
import Tasks from './pages/Tasks'
import Agents from './pages/Agents'
import CalendarPage from './pages/CalendarPage'
import Projects from './pages/Projects'
import System from './pages/System'
import AuditLog from './pages/AuditLog'
import { isConfigured } from './lib/supabase'

const pages = {
  tasks:    Tasks,
  agents:   Agents,
  calendar: CalendarPage,
  projects: Projects,
  system:   System,
  audit:    AuditLog,
}

const PAGE_LABELS = {
  tasks:    'Mission Control',
  calendar: 'Scheduled Tasks',
  audit:    'Audit Log',
}

export default function App() {
  const { dark } = useTheme()
  const { page, navigate } = useRouter('tasks')
  const { session, loading, signIn, signOut } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  // Cmd+K global shortcut (also handled inside GlobalSearch, but open needs to be here)
  useState(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const Page = pages[page] || Tasks

  const pageLabel = PAGE_LABELS[page] || (page.charAt(0).toUpperCase() + page.slice(1))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Login onLogin={signIn} />
  }

  return (
    <div className="flex h-screen bg-[#0f1923] overflow-hidden">
      <Sidebar
        current={page}
        onNavigate={navigate}
        onSignOut={signOut}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onSearch={openSearch}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-[56px] border-b border-white/5 bg-[#0d1117] flex items-center justify-between px-6 shrink-0">
          <h1 className="text-white/80 text-sm font-medium">{pageLabel}</h1>
          <div className="flex items-center gap-3">
            {!isConfigured() && (
              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                Supabase not connected
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-white/30">Oz online</span>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <Page onNavigate={navigate} />
        </main>
      </div>

      {/* Global Search overlay */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={closeSearch}
        onNavigate={(p) => { navigate(p); closeSearch() }}
      />
    </div>
  )
}
