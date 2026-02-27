import { LayoutDashboard, FolderKanban, Brain, Server } from 'lucide-react'

const tabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'claude', label: 'Claude AI', icon: Brain },
  { key: 'infrastructure', label: 'Infrastructure', icon: Server },
]

export default function Navigation({ current, onNavigate }) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = current === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => onNavigate(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
