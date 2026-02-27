import { useRealtimeTable, useLatestPerGroup } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { MessageSquare, ListChecks, Wifi, Shield } from 'lucide-react'

function getTimeRange(logs, hours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return logs.filter(l => new Date(l.timestamp).getTime() > cutoff)
}

export default function QuickStats() {
  const { data: usage } = useRealtimeTable('claude_usage', { orderBy: 'timestamp', ascending: false, limit: 200 })
  const { data: tasks } = useRealtimeTable('tasks', { orderBy: 'created_at', ascending: false, limit: 100 })
  const { data: healthData } = useLatestPerGroup('api_health', 'service')
  const { data: security } = useRealtimeTable('security_checks', { orderBy: 'checked_at', ascending: false, limit: 1 })

  const todayMessages = getTimeRange(usage, 24).length
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const healthyApis = healthData.filter(h => h.status === 'healthy').length
  const totalApis = healthData.length || 6
  const lastScan = security[0]?.checked_at
  const daysSinceScan = lastScan ? Math.floor((Date.now() - new Date(lastScan).getTime()) / (24 * 60 * 60 * 1000)) : null

  const stats = [
    {
      label: 'Messages Today',
      value: todayMessages,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Active Tasks',
      value: activeTasks,
      sub: `${todoTasks} in backlog`,
      icon: ListChecks,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'APIs Healthy',
      value: `${healthyApis}/${totalApis}`,
      icon: Wifi,
      color: healthyApis === totalApis ? 'text-green-500' : 'text-yellow-500',
      bg: healthyApis === totalApis ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Security',
      value: daysSinceScan !== null ? (daysSinceScan === 0 ? 'Today' : `${daysSinceScan}d ago`) : 'No scan',
      icon: Shield,
      color: daysSinceScan !== null && daysSinceScan <= 1 ? 'text-green-500' : 'text-orange-500',
      bg: daysSinceScan !== null && daysSinceScan <= 1 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  if (!isConfigured()) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(stat => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={stat.color} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            {stat.sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.sub}</div>}
          </div>
        )
      })}
    </div>
  )
}
