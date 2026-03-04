import { useEffect, useState } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Zap, Clock, CheckCircle, XCircle, Loader2, Radio } from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────

function elapsed(startedAt) {
  const ms = Date.now() - new Date(startedAt).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

function etaLabel(run) {
  if (run.status !== 'running') return null
  if (!run.estimated_end_at) return 'ETA unknown'
  const remaining = new Date(run.estimated_end_at).getTime() - Date.now()
  if (remaining <= 0) return 'Any moment...'
  const s = Math.floor(remaining / 1000)
  if (s < 60) return `~${s}s left`
  return `~${Math.floor(s / 60)}m left`
}

function agentLabel(agent) {
  const map = {
    oz_master: 'Oz',
    morning_brief: 'Morning Brief',
    backup: 'Backup',
    dcv_agent: 'DCV',
    streamline_agent: 'Streamline',
  }
  return map[agent] || agent
}

function sourceColor(source) {
  const map = {
    telegram: 'text-blue-400',
    cron: 'text-purple-400',
    manual: 'text-yellow-400',
  }
  return map[source] || 'text-white/40'
}

// ── single run row ────────────────────────────────────────────────────────────

function RunRow({ run }) {
  const [tick, setTick] = useState(0)

  // Live elapsed ticker for running jobs
  useEffect(() => {
    if (run.status !== 'running') return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [run.status])

  const isRunning = run.status === 'running'
  const isDone = run.status === 'done'
  const isFailed = run.status === 'failed'

  return (
    <div className={`
      flex items-start gap-3 px-4 py-3 rounded-lg border transition-all
      ${isRunning
        ? 'bg-blue-500/8 border-blue-500/20'
        : isDone
          ? 'bg-green-500/5 border-green-500/10 opacity-60'
          : 'bg-red-500/5 border-red-500/10 opacity-60'
      }
    `}>
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">
        {isRunning && <Loader2 size={14} className="text-blue-400 animate-spin" />}
        {isDone && <CheckCircle size={14} className="text-green-400" />}
        {isFailed && <XCircle size={14} className="text-red-400" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white/80">{agentLabel(run.agent)}</span>
          <span className={`text-[10px] font-medium ${sourceColor(run.source)}`}>
            via {run.source}
          </span>
          {isRunning && (
            <span className="ml-auto text-[10px] text-blue-300 font-mono shrink-0">
              {etaLabel(run)}
            </span>
          )}
          {!isRunning && (
            <span className="ml-auto text-[10px] text-white/25 font-mono shrink-0">
              {run.elapsed_ms ? `${(run.elapsed_ms / 1000).toFixed(1)}s` : ''}
            </span>
          )}
        </div>

        {/* Task description */}
        <p className="text-xs text-white/55 leading-snug line-clamp-2 mb-1.5">
          {run.task}
        </p>

        {/* Progress bar (running only) */}
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              {/* Animated indeterminate bar since we don't have real progress */}
              <div className="h-full bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <span className="text-[10px] text-white/30 font-mono shrink-0">
              {elapsed(run.started_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function ActiveRuns({ compact = false }) {
  if (!isConfigured()) return null

  const { data: runs } = useRealtimeTable('active_runs', {
    orderBy: 'started_at',
    ascending: false,
    limit: 20,
  })

  const running = runs.filter(r => r.status === 'running')
  const recent = runs.filter(r => r.status !== 'running').slice(0, compact ? 3 : 5)

  const hasActivity = running.length > 0 || recent.length > 0

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <div className="flex items-center gap-2">
          <Radio size={14} className={running.length > 0 ? 'text-blue-400 animate-pulse' : 'text-white/30'} />
          <span className="text-xs font-semibold text-white/70">Live Agent Activity</span>
          {running.length > 0 && (
            <span className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/20 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] text-blue-300 font-medium">{running.length} running</span>
            </span>
          )}
        </div>
        {recent.length > 0 && (
          <span className="text-[10px] text-white/25">{recent.length} recent</span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Running jobs first */}
        {running.map(run => <RunRow key={run.id} run={run} />)}

        {/* Divider if both running and recent */}
        {running.length > 0 && recent.length > 0 && (
          <div className="border-t border-white/5 my-1" />
        )}

        {/* Recent completed */}
        {recent.map(run => <RunRow key={run.id} run={run} />)}

        {/* Empty state */}
        {!hasActivity && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Zap size={20} className="text-white/15" />
            <p className="text-xs text-white/25">No recent activity</p>
            <p className="text-[10px] text-white/15">Oz is idle and ready</p>
          </div>
        )}
      </div>
    </div>
  )
}
