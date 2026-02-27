import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { BarChart3, MessageSquare, Zap, Clock } from 'lucide-react'

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function getTimeRange(logs, hours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return logs.filter(l => new Date(l.timestamp).getTime() > cutoff)
}

export default function ClaudeUsage() {
  const { data: usage, loading } = useRealtimeTable('claude_usage', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 500
  })

  const today = getTimeRange(usage, 24)
  const thisWeek = getTimeRange(usage, 24 * 7)
  const thisMonth = getTimeRange(usage, 24 * 30)

  const todayTokens = today.reduce((sum, u) => sum + (u.total_tokens || 0), 0)
  const weekTokens = thisWeek.reduce((sum, u) => sum + (u.total_tokens || 0), 0)
  const monthTokens = thisMonth.reduce((sum, u) => sum + (u.total_tokens || 0), 0)
  const todayMessages = today.length
  const weekMessages = thisWeek.length

  // Source breakdown
  const sourceBreakdown = usage.reduce((acc, u) => {
    const src = u.source || 'unknown'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const sourceColors = {
    telegram: 'bg-blue-500',
    claude_code: 'bg-purple-500',
    api: 'bg-green-500',
  }

  const sourceLabels = {
    telegram: 'Telegram',
    claude_code: 'Claude Code',
    api: 'API Direct',
  }

  const totalMessages = usage.length || 1

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <BarChart3 size={18} />
        Claude Usage
      </h2>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see usage.</p>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : usage.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No usage tracked yet.</p>
      ) : (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare size={14} className="text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Today</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{todayMessages}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(todayTokens)} tokens</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={14} className="text-purple-500" />
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">This Week</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{weekMessages}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(weekTokens)} tokens</div>
            </div>

            <div className="col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={14} className="text-yellow-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">30-Day Total</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(monthTokens)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">tokens</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{thisMonth.length} interactions</span>
              </div>
            </div>
          </div>

          {/* Source Breakdown Bar */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">By Source</div>
            <div className="flex rounded-full overflow-hidden h-3">
              {Object.entries(sourceBreakdown).map(([src, count]) => (
                <div
                  key={src}
                  className={`${sourceColors[src] || 'bg-gray-400'}`}
                  style={{ width: `${(count / totalMessages) * 100}%` }}
                  title={`${sourceLabels[src] || src}: ${count}`}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              {Object.entries(sourceBreakdown).map(([src, count]) => (
                <div key={src} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${sourceColors[src] || 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {sourceLabels[src] || src} ({count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
