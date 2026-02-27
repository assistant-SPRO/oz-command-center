import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Cpu } from 'lucide-react'

const modelConfig = {
  'claude-sonnet-4-20250514': { label: 'Sonnet 4', color: 'bg-blue-500', short: 'Sonnet 4' },
  'claude-opus-4-20250514': { label: 'Opus 4', color: 'bg-purple-500', short: 'Opus 4' },
  'claude-haiku-3-20250414': { label: 'Haiku 3', color: 'bg-green-500', short: 'Haiku 3' },
  'claude-3-5-sonnet-20241022': { label: 'Sonnet 3.5', color: 'bg-blue-400', short: 'Sonnet 3.5' },
  'claude-3-5-haiku-20241022': { label: 'Haiku 3.5', color: 'bg-green-400', short: 'Haiku 3.5' },
  'claude-3-opus-20240229': { label: 'Opus 3', color: 'bg-purple-400', short: 'Opus 3' },
}

function getModelInfo(model) {
  // Try exact match first
  if (modelConfig[model]) return modelConfig[model]
  // Try partial match
  const key = Object.keys(modelConfig).find(k => model?.includes(k.split('-').slice(0, 3).join('-')))
  if (key) return modelConfig[key]
  // Fallback: parse the name
  const short = model?.replace('claude-', '').replace(/-\d{8}$/, '') || 'Unknown'
  return { label: short, color: 'bg-gray-500', short }
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export default function ModelBreakdown() {
  const { data: usage, loading } = useRealtimeTable('claude_usage', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 500
  })

  // Aggregate by model
  const modelStats = usage.reduce((acc, u) => {
    const model = u.model || 'unknown'
    if (!acc[model]) {
      acc[model] = { count: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 }
    }
    acc[model].count++
    acc[model].inputTokens += u.input_tokens || 0
    acc[model].outputTokens += u.output_tokens || 0
    acc[model].totalTokens += u.total_tokens || 0
    acc[model].cost += parseFloat(u.estimated_api_cost || 0)
    return acc
  }, {})

  const sortedModels = Object.entries(modelStats)
    .sort(([, a], [, b]) => b.count - a.count)

  const totalInteractions = usage.length || 1

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Cpu size={18} />
        Models Used
      </h2>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see models.</p>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sortedModels.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No model data yet.</p>
      ) : (
        <div className="space-y-3">
          {sortedModels.map(([model, stats]) => {
            const info = getModelInfo(model)
            const pct = (stats.count / totalInteractions) * 100

            return (
              <div key={model} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{info.short}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.count}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">calls</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${info.color} h-2 rounded-full`}
                    style={{ width: `${pct}%`, minWidth: '4px' }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatNumber(stats.totalTokens)} tokens</span>
                  <span>{pct.toFixed(0)}% of usage</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
