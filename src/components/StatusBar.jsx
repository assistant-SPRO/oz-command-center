import { useState, useEffect } from 'react'
import { useRealtimeSingle, useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Activity, Loader, Clock } from 'lucide-react'

function timeAgo(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function ElapsedTimer({ since }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!since) return
    const start = new Date(since).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [since])

  if (!since) return null
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  return <span className="font-mono text-xs">{mins}:{secs.toString().padStart(2, '0')}</span>
}

export default function StatusBar() {
  const { data: status, loading } = useRealtimeSingle('oz_status')
  const { data: recentActivity } = useRealtimeTable('activity_log', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 1
  })

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
  const isWorking = isOnline && currentTask
  const lastCompleted = recentActivity?.[0]

  return (
    <div className="bg-navy text-white rounded-xl shadow-md overflow-hidden">
      {/* Main status row */}
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse-dot' : 'bg-red-500'}`} />
          <span className="font-semibold text-sm">
            Oz is {isWorking ? 'Working' : isOnline ? 'Online' : 'Offline'}
          </span>
          {lastActive && (
            <span className="text-xs text-white/60">
              Last active: {timeAgo(lastActive)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastCompleted && (
            <span className="text-xs text-white/40">
              Last completed: {lastCompleted.description?.slice(0, 30)}
              {lastCompleted.description?.length > 30 ? '...' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Active task detail bar - only shows when working */}
      {isWorking && (
        <div className="px-4 py-2 bg-blue-600/30 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader size={14} className="text-blue-300 animate-spin" />
            <span className="text-sm text-blue-100">{currentTask}</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-200">
            <Clock size={12} />
            <ElapsedTimer since={status?.updated_at} />
          </div>
        </div>
      )}
    </div>
  )
}
