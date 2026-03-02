import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'

// Current Anthropic API pricing per million tokens (as of 2025)
const MODEL_PRICING = {
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00, cached: 0.30 },
  'claude-opus-4-20250514': { input: 15.00, output: 75.00, cached: 1.50 },
  'claude-haiku-3-20250414': { input: 0.25, output: 1.25, cached: 0.025 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, cached: 0.30 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00, cached: 0.08 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00, cached: 1.50 },
}

// Subscription costs
const PLANS = {
  pro: { name: 'Pro', monthly: 20 },
  max_5x: { name: 'Max (5x)', monthly: 100 },
  max_20x: { name: 'Max (20x)', monthly: 200 },
}

function estimateCost(usage) {
  let totalCost = 0
  for (const u of usage) {
    const pricing = MODEL_PRICING[u.model] || MODEL_PRICING['claude-sonnet-4-20250514']
    const inputCost = ((u.input_tokens || 0) / 1_000_000) * pricing.input
    const outputCost = ((u.output_tokens || 0) / 1_000_000) * pricing.output
    const cacheCost = ((u.cache_read_tokens || 0) / 1_000_000) * pricing.cached
    totalCost += inputCost + outputCost + cacheCost
  }
  return totalCost
}

function getTimeRange(logs, hours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return logs.filter(l => new Date(l.timestamp).getTime() > cutoff)
}

export default function CostAnalysis() {
  const { data: usage, loading } = useRealtimeTable('claude_usage', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 1000
  })

  const [planKey, setPlanKey] = useState(() =>
    localStorage.getItem('oz-plan') || 'max_5x'
  )

  const thisMonth = getTimeRange(usage, 24 * 30)
  const apiCost = estimateCost(thisMonth)
  const currentPlan = PLANS[planKey] || PLANS.max_5x

  const savings = currentPlan.monthly - apiCost
  const isSaving = savings > 0

  // Daily average
  const daysTracked = Math.max(1, Math.ceil(
    thisMonth.length > 1
      ? (Date.now() - new Date(thisMonth[thisMonth.length - 1]?.timestamp).getTime()) / (24 * 60 * 60 * 1000)
      : 1
  ))
  const dailyAvgCost = apiCost / daysTracked
  const projectedMonthly = dailyAvgCost * 30

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign size={18} />
          Cost Analysis
        </h2>
        <select
          value={planKey}
          onChange={e => {
            setPlanKey(e.target.value)
            localStorage.setItem('oz-plan', e.target.value)
          }}
          className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-300 cursor-pointer"
        >
          {Object.entries(PLANS).map(([key, plan]) => (
            <option key={key} value={key}>{plan.name} (${plan.monthly}/mo)</option>
          ))}
        </select>
      </div>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see costs.</p>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : thisMonth.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No usage data to analyze.</p>
      ) : (
        <div className="space-y-4">
          {/* Subscription vs API comparison */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
              Subscription vs API (30 days)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Your Plan</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${currentPlan.monthly}
                  <span className="text-xs font-normal text-gray-500">/mo</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{currentPlan.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">If API Instead</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${apiCost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">estimated</div>
              </div>
            </div>
          </div>

          {/* Savings indicator */}
          <div className={`rounded-lg p-3 ${isSaving
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <TrendingDown size={16} className="text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    API would be ${Math.abs(savings).toFixed(2)} cheaper
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Subscription saves you ${Math.abs(savings).toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Projections */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Avg (API)</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ${dailyAvgCost.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projected Monthly</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ${projectedMonthly.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Plan comparison table */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Plan Comparison</div>
            <div className="space-y-1.5">
              {Object.entries(PLANS).map(([key, plan]) => {
                const diff = plan.monthly - apiCost
                const better = diff < 0
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {plan.name}
                      {key === planKey && <span className="text-xs text-blue-500 ml-1">(current)</span>}
                    </span>
                    <span className={better ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400'}>
                      ${plan.monthly}/mo {better ? '(saves $' + Math.abs(diff).toFixed(2) + ')' : ''}
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-1.5">
                <span className="text-gray-700 dark:text-gray-300 font-medium">API Pay-as-you-go</span>
                <span className="text-gray-900 dark:text-white font-medium">${apiCost.toFixed(2)}/mo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
