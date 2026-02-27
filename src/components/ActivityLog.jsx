import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const outcomeConfig = {
  success: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  partial: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
}

const taskTypeBadgeColors = {
  build: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deploy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  security: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  health_check: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  email: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  calendar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  })
}

function formatDuration(seconds) {
  if (!seconds) return ''
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export default function ActivityLog() {
  const { data: logs, loading } = useRealtimeTable('activity_log', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 50
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Clock size={18} />
        Activity Log
      </h2>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see activity.</p>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity logged yet.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {logs.map(log => {
            const outcome = outcomeConfig[log.outcome] || outcomeConfig.success
            const OutcomeIcon = outcome.icon
            const badgeColor = taskTypeBadgeColors[log.task_type] || taskTypeBadgeColors.default

            return (
              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className={`mt-0.5 p-1 rounded-full ${outcome.color}`}>
                  <OutcomeIcon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                      {log.task_type}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {log.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(log.timestamp)}
                    </span>
                    {log.duration_seconds && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDuration(log.duration_seconds)}
                      </span>
                    )}
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
