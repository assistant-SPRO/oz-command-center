import {
  LayoutGrid,
  Bot,
  CalendarDays,
  FolderKanban,
  Brain,
  Server,
  Radar,
  GitBranch,
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'tasks',     label: 'Tasks',     icon: LayoutGrid,   active: true },
  { key: 'agents',    label: 'Agents',    icon: Bot,          active: true },
  { key: 'calendar',  label: 'Calendar',  icon: CalendarDays, active: true },
  { key: 'projects',  label: 'Projects',  icon: FolderKanban, active: true },
  { key: 'system',    label: 'System',    icon: Server,       active: true },
  { key: 'audit',     label: 'Audit Log', icon: ScrollText,   active: true },
  { key: 'memory',    label: 'Memory',    icon: Brain,        active: false, soon: true },
  { key: 'radar',     label: 'Radar',     icon: Radar,        active: false, soon: true },
  { key: 'pipeline',  label: 'Pipeline',  icon: GitBranch,    active: false, soon: true },
]

export default function Sidebar({ current, onNavigate, onSignOut, collapsed, onToggle, onSearch }) {
  return (
    <aside className={`
      flex flex-col h-screen bg-[#0d1117] border-r border-white/5
      transition-all duration-200 ease-in-out shrink-0
      ${collapsed ? 'w-[56px]' : 'w-[220px]'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 h-[56px] border-b border-white/5 shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Oz</p>
            <p className="text-white/40 text-[10px] leading-tight">Mission Control</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = current === item.key
          const isDisabled = !item.active

          if (isDisabled) {
            return (
              <div
                key={item.key}
                title={collapsed ? `${item.label} (coming soon)` : undefined}
                className={`
                  flex items-center gap-2.5 rounded-md px-2.5 py-2
                  cursor-not-allowed opacity-30
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <Icon size={16} className="text-white/40 shrink-0" />
                {!collapsed && (
                  <span className="text-xs text-white/40 truncate">{item.label}</span>
                )}
              </div>
            )
          }

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-2.5 rounded-md px-2.5 py-2
                text-left transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <span className="text-xs font-medium truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-white/5 p-2 space-y-0.5 shrink-0">
        {/* Search button */}
        <button
          onClick={onSearch}
          title={collapsed ? 'Search (⌘K)' : undefined}
          className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-white/30 hover:text-white hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <Search size={15} className="shrink-0" />
          {!collapsed && (
            <span className="text-xs flex-1">Search</span>
          )}
          {!collapsed && (
            <span className="text-[10px] text-white/20 font-mono">⌘K</span>
          )}
        </button>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-white/30 hover:text-white hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
        <button
          onClick={onSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span className="text-xs">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
