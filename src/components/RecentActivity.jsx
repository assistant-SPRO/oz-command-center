import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const outcomeIcons = {
  success: { icon: CheckCircle, color: 'text-green-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
  partial: { icon: AlertTriangle, color: 'text-yellow-500' },
}

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

export default function RecentActivity({ limit = 5, onViewAll }) {
  const { data: logs, loading } = useRealtimeTable('activity_log', {
    orderBy: 'timestamp',
    ascending: false,
    limit
  })

  if (!isConfigured()) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            View all
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {logs.map(log => {
            const outcome = outcomeIcons[log.outcome] || outcomeIcons.success
            const Icon = outcome.icon
            return (
              <div key={log.id} className="flex items-center gap-2 py-1.5">
                <Icon size={14} className={outcome.color} />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {log.description}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {timeAgo(log.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
