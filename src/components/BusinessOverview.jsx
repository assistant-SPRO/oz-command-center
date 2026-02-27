import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Video, Bot, Music } from 'lucide-react'

const businesses = [
  {
    key: 'dcv',
    name: 'Denver Conference Video',
    entity: 'Babineau Media LLC',
    icon: Video,
    color: 'border-blue-500',
    accent: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    description: 'Conference & event videography',
    tiers: ['RECAP $8.5K', 'AMPLIFY $15K', 'COMMAND $22K+'],
  },
  {
    key: 'spai',
    name: 'Streamline Pro AI',
    entity: 'AI Solutions',
    icon: Bot,
    color: 'border-purple-500',
    accent: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    description: 'AI automation consulting for service businesses',
    tiers: null,
  },
  {
    key: 'nmm',
    name: 'Ninja Music Marketing',
    entity: 'With Jack',
    icon: Music,
    color: 'border-green-500',
    accent: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/10',
    description: 'Marketing for $1M+ artists',
    tiers: null,
  },
]

export default function BusinessOverview() {
  const { data: metrics } = useRealtimeTable('business_metrics', {
    orderBy: 'updated_at',
    ascending: false,
    limit: 10
  })

  // Group latest metric per business
  const latestMetrics = {}
  for (const m of metrics) {
    if (!latestMetrics[m.business_key]) latestMetrics[m.business_key] = m
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Businesses</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {businesses.map(biz => {
          const Icon = biz.icon
          const metric = latestMetrics[biz.key]

          return (
            <div key={biz.key} className={`border-l-4 ${biz.color} ${biz.bg} rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={biz.accent} />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{biz.name}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{biz.description}</p>

              {metric ? (
                <div className="space-y-1">
                  {metric.status && (
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        metric.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{metric.status}</span>
                    </div>
                  )}
                  {metric.pipeline_value && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Pipeline: <span className="font-medium">${Number(metric.pipeline_value).toLocaleString()}</span>
                    </div>
                  )}
                  {metric.active_clients !== null && metric.active_clients !== undefined && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Clients: <span className="font-medium">{metric.active_clients}</span>
                    </div>
                  )}
                  {metric.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">{metric.notes}</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500">No metrics yet</div>
              )}

              {biz.tiers && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {biz.tiers.map(tier => (
                    <span key={tier} className="text-[10px] bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                      {tier}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
