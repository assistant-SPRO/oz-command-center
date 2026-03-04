import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDays(offsetWeeks = 0) {
  const days = []
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + offsetWeeks * 7)
  startOfWeek.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    days.push(d)
  }
  return days
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Always Running bar ────────────────────────────────────────────────────────

const ALWAYS_RUNNING = [
  { name: 'Morning Brief', freq: '9:15am daily' },
  { name: 'Heartbeat', freq: 'Health check' },
  { name: 'Nightly Backup', freq: '2am daily' },
  { name: 'Embed Retry', freq: '30 min' },
]

function AlwaysRunningBar({ cronRuns }) {
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-indigo-400" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Always Running</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALWAYS_RUNNING.map(item => {
          const lastRun = cronRuns
            .filter(r => r.job_name?.toLowerCase().includes(item.name.toLowerCase().split(' ')[0].toLowerCase()))
            .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0]
          const isHealthy = !lastRun || lastRun.status === 'success'

          return (
            <div key={item.name} className="flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 rounded-lg px-3 py-2 transition-colors">
              <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-xs font-medium text-white/75">{item.name}</p>
                <p className="text-[10px] text-white/30">{item.freq}</p>
              </div>
              {lastRun && (
                <span className="text-[10px] text-white/25 ml-2">{timeAgo(lastRun.started_at)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Cron event card ───────────────────────────────────────────────────────────

const CRON_COLORS = {
  morning_brief: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-500' },
  heartbeat: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', text: 'text-indigo-300', dot: 'bg-indigo-500' },
  backup: { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-500' },
  embed: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-500' },
  default: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-500' },
}

function getCronStyle(name) {
  if (!name) return CRON_COLORS.default
  const n = name.toLowerCase()
  if (n.includes('brief') || n.includes('morning')) return CRON_COLORS.morning_brief
  if (n.includes('heartbeat') || n.includes('health')) return CRON_COLORS.heartbeat
  if (n.includes('backup')) return CRON_COLORS.backup
  if (n.includes('embed') || n.includes('sync')) return CRON_COLORS.embed
  return CRON_COLORS.default
}

function CronCard({ run, onClick }) {
  const style = getCronStyle(run.job_name)
  const success = run.status === 'success'

  return (
    <button
      onClick={() => onClick(run)}
      className={`w-full text-left ${style.bg} border ${style.border} rounded-md px-2 py-1.5 mb-1 hover:brightness-110 transition-all`}
    >
      <div className="flex items-start gap-1">
        {success
          ? <CheckCircle size={10} className="text-green-400 mt-0.5 shrink-0" />
          : <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />
        }
        <div className="min-w-0">
          <p className={`text-[11px] font-medium ${style.text} truncate leading-tight`}>
            {run.job_name || 'Cron job'}
          </p>
          <p className="text-[10px] text-white/30 leading-tight">
            {formatTime(run.started_at)}
            {run.duration_ms ? ` • ${run.duration_ms}ms` : ''}
          </p>
        </div>
      </div>
    </button>
  )
}

// ── Cron detail modal ─────────────────────────────────────────────────────────

function CronModal({ run, onClose }) {
  if (!run) return null
  const style = getCronStyle(run.job_name)
  const success = run.status === 'success'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl max-w-lg w-full p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-base font-semibold ${style.text}`}>{run.job_name || 'Cron Job'}</h3>
            <p className="text-xs text-white/35 mt-0.5">{new Date(run.started_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white">
            <XCircle size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {run.status}
          </span>
          {run.duration_ms && (
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">
              {run.duration_ms}ms
            </span>
          )}
          {run.tokens_used && (
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">
              {run.tokens_used.toLocaleString()} tokens
            </span>
          )}
        </div>

        {run.output && (
          <div className="bg-black/30 rounded-lg p-3 mb-3">
            <p className="text-xs text-white/50 font-mono whitespace-pre-wrap line-clamp-10">{run.output}</p>
          </div>
        )}

        {run.error_msg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{run.error_msg}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Calendar page ────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedRun, setSelectedRun] = useState(null)
  const weekDays = getWeekDays(weekOffset)

  const { data: cronRuns, loading, refetch } = useRealtimeTable('cron_runs', {
    orderBy: 'started_at',
    ascending: false,
    limit: 500,
  })

  // Stats
  const total = cronRuns.length
  const successes = cronRuns.filter(r => r.status === 'success').length
  const failures = cronRuns.filter(r => r.status !== 'success').length
  const successRate = total > 0 ? Math.round((successes / total) * 100) : 0

  const today = new Date()
  const isCurrentWeek = weekOffset === 0

  return (
    <div className="p-6">
      {/* Always Running bar */}
      <AlwaysRunningBar cronRuns={cronRuns} />

      {/* Stats + week nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <StatChip value={total} label="Total runs" color="text-white/70" />
          <StatChip value={successes} label="Succeeded" color="text-green-400" />
          <StatChip value={failures} label="Failed" color="text-red-400" />
          <StatChip value={`${successRate}%`} label="Success rate" color="text-blue-400" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isCurrentWeek ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-white/40 w-24 text-center">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly grid */}
      {!isConfigured() ? (
        <div className="flex items-center justify-center h-48 bg-white/3 rounded-xl border border-white/5">
          <p className="text-white/30 text-sm">Connect Supabase to see cron runs.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map(d => (
            <div key={d} className="space-y-1">
              <div className="h-6 bg-white/5 rounded animate-pulse" />
              {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isToday = sameDay(day, today)
            const dayRuns = cronRuns.filter(r => sameDay(new Date(r.started_at), day))
              .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))

            return (
              <div key={i}>
                {/* Day header */}
                <div className={`text-center py-2 rounded-lg mb-1.5 ${isToday ? 'bg-blue-600' : ''}`}>
                  <p className={`text-[10px] font-medium ${isToday ? 'text-blue-200' : 'text-white/35'}`}>
                    {DAYS[i]}
                  </p>
                  <p className={`text-sm font-bold ${isToday ? 'text-white' : 'text-white/50'}`}>
                    {day.getDate()}
                  </p>
                </div>

                {/* Runs for this day */}
                <div className="space-y-0 min-h-[60px]">
                  {dayRuns.length === 0 ? (
                    <div className="h-8 border border-dashed border-white/5 rounded-md flex items-center justify-center">
                      <span className="text-[9px] text-white/15">—</span>
                    </div>
                  ) : (
                    dayRuns.map(run => (
                      <CronCard key={run.id} run={run} onClick={setSelectedRun} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CronModal run={selectedRun} onClose={() => setSelectedRun(null)} />
    </div>
  )
}

function StatChip({ value, label, color }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  )
}
