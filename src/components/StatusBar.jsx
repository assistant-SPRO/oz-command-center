import { useRealtimeSingle } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Activity } from 'lucide-react'

function timeAgo(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function StatusBar() {
  const { data: status, loading } = useRealtimeSingle('oz_status')

  if (!isConfigured()) {
    return (
      <div className="bg-navy text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse-dot" />
          <span className="font-semibold text-sm">Awaiting Supabase connection...</span>
        </div>
        <span className="text-xs text-white/60">Configure .env to connect</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-navy text-white px-4 py-3 rounded-xl shadow-md flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-sm">Loading status...</span>
      </div>
    )
  }

  const isOnline = status?.is_online || false
  const currentTask = status?.current_task
  const lastActive = status?.last_active

  return (
    <div className="bg-navy text-white px-4 py-3 rounded-xl shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse-dot' : 'bg-red-500'}`} />
          <span className="font-semibold text-sm">
            Oz is {isOnline ? 'Online' : 'Offline'}
          </span>
          {lastActive && (
            <span className="text-xs text-white/60">
              Last active: {timeAgo(lastActive)}
            </span>
          )}
        </div>
        {currentTask && (
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
            <Activity size={14} className="text-blue-300" />
            <span className="text-xs">{currentTask}</span>
          </div>
        )}
      </div>
    </div>
  )
}
