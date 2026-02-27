import { useRealtimeTable, useLatestPerGroup } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import SecurityMonitor from '../components/SecurityMonitor'
import {
  Server, Wifi, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
  Activity, HardDrive, Globe
} from 'lucide-react'

function formatTime(ts) {
  if (!ts) return 'Never'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function ApiHealthDetailed() {
  const { data: healthData, loading } = useLatestPerGroup('api_health', 'service')
  const { data: history } = useRealtimeTable('api_health', {
    orderBy: 'checked_at',
    ascending: false,
    limit: 100
  })

  const statusColors = {
    healthy: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: CheckCircle },
    degraded: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', icon: AlertTriangle },
    down: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: XCircle },
  }

  const defaultServices = ['Telegram', 'Groq', 'Google AI Studio', 'Brave Search', 'ElevenLabs', 'GitHub']

  const services = defaultServices.map(name => {
    const actual = healthData.find(h => h.service === name)
    // Get recent history for this service
    const serviceHistory = history.filter(h => h.service === name).slice(0, 10)
    return {
      ...(actual || { service: name, status: null, response_ms: null, checked_at: null }),
      history: serviceHistory,
    }
  })

  // Overall stats
  const healthy = healthData.filter(h => h.status === 'healthy').length
  const total = defaultServices.length
  const avgResponse = healthData.reduce((sum, h) => sum + (h.response_ms || 0), 0) / (healthData.length || 1)

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{healthy}/{total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Services Healthy</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(avgResponse)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response (ms)</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center">
          <div className={`text-3xl font-bold ${healthy === total ? 'text-green-500' : 'text-yellow-500'}`}>
            {healthy === total ? 'ALL CLEAR' : 'ISSUES'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overall Status</div>
        </div>
      </div>

      {/* Detailed API Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map(svc => {
          const colors = svc.status ? statusColors[svc.status] : {
            bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500', icon: Clock,
          }
          const StatusIcon = colors.icon

          return (
            <div key={svc.service} className={`${colors.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-600 dark:text-gray-300" />
                  <span className="font-semibold text-gray-900 dark:text-white">{svc.service}</span>
                </div>
                <StatusIcon size={18} className={colors.text} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`font-medium ${colors.text}`}>
                    {svc.status ? svc.status.charAt(0).toUpperCase() + svc.status.slice(1) : 'No data'}
                  </span>
                </div>
                {svc.response_ms !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Response</span>
                    <span className="text-gray-900 dark:text-white font-medium">{svc.response_ms}ms</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Check</span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs">{formatTime(svc.checked_at)}</span>
                </div>

                {/* Mini uptime bar from history */}
                {svc.history.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Recent checks</div>
                    <div className="flex gap-0.5">
                      {svc.history.slice(0, 10).reverse().map((h, i) => (
                        <div
                          key={i}
                          className={`h-3 flex-1 rounded-sm ${
                            h.status === 'healthy' ? 'bg-green-400' :
                            h.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          title={`${h.status} - ${h.response_ms}ms`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {svc.error_message && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-1.5 mt-1">
                    {svc.error_message}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SystemInfo() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <HardDrive size={18} />
        System Info
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Machine</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Mac Mini (Denver)</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">User</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">aiosadmin</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stack</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Node 22 / Supabase / Vercel</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bot</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">ClaudeClaw (Telegram)</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timezone</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Mountain Time (MT)</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Automations</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">n8n / GoHighLevel</div>
        </div>
      </div>
    </div>
  )
}

export default function Infrastructure() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Infrastructure</h1>

      {/* API Health Detailed */}
      <ApiHealthDetailed />

      {/* Security + System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SecurityMonitor />
        <SystemInfo />
      </div>
    </div>
  )
}
