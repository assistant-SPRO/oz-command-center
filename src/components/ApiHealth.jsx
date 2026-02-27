import { useLatestPerGroup } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Radio, MessageSquare, Cpu, Sparkles, Search, Mic, Github } from 'lucide-react'

const serviceIcons = {
  Telegram: MessageSquare,
  Groq: Cpu,
  'Google AI Studio': Sparkles,
  'Brave Search': Search,
  ElevenLabs: Mic,
  GitHub: Github,
}

const statusColors = {
  healthy: {
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
  },
  degraded: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  down: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
  },
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  })
}

// Default services to show even if no data yet
const defaultServices = ['Telegram', 'Groq', 'Google AI Studio', 'Brave Search', 'ElevenLabs', 'GitHub']

export default function ApiHealth() {
  const { data: healthData, loading } = useLatestPerGroup('api_health', 'service')

  // Merge actual data with defaults
  const services = defaultServices.map(name => {
    const actual = healthData.find(h => h.service === name)
    return actual || { service: name, status: null, response_ms: null, checked_at: null }
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Radio size={18} />
        API Health
      </h2>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see API health.</p>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {services.map(svc => {
            const colors = svc.status ? statusColors[svc.status] : {
              bg: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
              dot: 'bg-gray-400',
              text: 'text-gray-500 dark:text-gray-400',
            }
            const Icon = serviceIcons[svc.service] || Radio

            return (
              <div key={svc.service} className={`border rounded-lg p-3 ${colors.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {svc.service}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {svc.status ? svc.status.charAt(0).toUpperCase() + svc.status.slice(1) : 'No data'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  {svc.response_ms !== null && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{svc.response_ms}ms</span>
                  )}
                  {svc.checked_at && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(svc.checked_at)}</span>
                  )}
                </div>
                {svc.error_message && (
                  <p className="text-xs text-red-500 mt-1 truncate">{svc.error_message}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
