import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import ClaudeUsage from '../components/ClaudeUsage'
import ModelBreakdown from '../components/ModelBreakdown'
import CostAnalysis from '../components/CostAnalysis'
import { Brain, Zap, TrendingUp } from 'lucide-react'

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

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function UsageTimeline({ usage }) {
  // Group by day for last 7 days
  const days = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayUsage = usage.filter(u => {
      const ts = new Date(u.timestamp)
      return ts >= dayStart && ts < dayEnd
    })

    const tokens = dayUsage.reduce((sum, u) => sum + (u.total_tokens || 0), 0)
    const messages = dayUsage.length

    days.push({
      label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tokens,
      messages,
    })
  }

  const maxTokens = Math.max(...days.map(d => d.tokens), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp size={18} />
        7-Day Usage Timeline
      </h2>
      <div className="flex items-end gap-2 h-32">
        {days.map((day, i) => {
          const height = (day.tokens / maxTokens) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                {day.messages > 0 ? formatNumber(day.tokens) : ''}
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <div
                  className="w-full max-w-[40px] bg-blue-500/80 dark:bg-blue-400/60 rounded-t-md transition-all duration-300"
                  style={{ height: `${Math.max(height, day.messages > 0 ? 4 : 0)}%` }}
                  title={`${day.date}: ${formatNumber(day.tokens)} tokens, ${day.messages} messages`}
                />
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{day.label}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">{day.messages}msg</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SessionHistory({ usage }) {
  // Group into sessions (gaps > 30 min = new session)
  const sorted = [...usage].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Brain size={18} />
        Session History
      </h2>
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No sessions recorded yet.</p>
        ) : (
          sorted.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                entry.source === 'telegram' ? 'bg-blue-500' : entry.source === 'claude_code' ? 'bg-purple-500' : 'bg-green-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {entry.source?.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {entry.model?.split('-').slice(1, 3).join(' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                  {entry.task_description || 'Interaction'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatNumber((entry.total_tokens || 0))} tok
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  {formatTime(entry.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Claude() {
  const { data: usage, loading } = useRealtimeTable('claude_usage', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 500
  })

  if (!isConfigured()) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Connect Supabase to see Claude usage.
      </div>
    )
  }

  const allTime = usage
  const totalTokens = allTime.reduce((sum, u) => sum + (u.total_tokens || 0), 0)
  const totalCost = allTime.reduce((sum, u) => sum + parseFloat(u.estimated_api_cost || 0), 0)
  const totalSessions = allTime.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Claude AI Intelligence</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span><Zap size={14} className="inline text-yellow-500" /> {formatNumber(totalTokens)} total tokens</span>
          <span>{totalSessions} total interactions</span>
          <span>${totalCost.toFixed(2)} est. API cost</span>
        </div>
      </div>

      {/* Top row: existing panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ClaudeUsage />
        <ModelBreakdown />
        <CostAnalysis />
      </div>

      {/* Timeline + Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsageTimeline usage={usage} />
        <SessionHistory usage={usage} />
      </div>
    </div>
  )
}
