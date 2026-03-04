import { useState, useCallback } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Plus, X, Zap, Clock, Activity } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date) {
  if (!date) return ''
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function startOfWeek() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'recurring', label: 'Recurring', dot: '#6366f1', bg: 'bg-indigo-500/10' },
  { key: 'todo',      label: 'Backlog',   dot: '#64748b', bg: 'bg-slate-500/10' },
  { key: 'in_progress', label: 'In Progress', dot: '#3b82f6', bg: 'bg-blue-500/10' },
  { key: 'review',    label: 'Review',    dot: '#f59e0b', bg: 'bg-amber-500/10' },
  { key: 'done',      label: 'Done',      dot: '#22c55e', bg: 'bg-green-500/10' },
]

const BRAND_COLORS = {
  dcv: 'bg-blue-500/20 text-blue-300',
  streamline: 'bg-purple-500/20 text-purple-300',
  'streamline-pro': 'bg-purple-500/20 text-purple-300',
  marketing: 'bg-pink-500/20 text-pink-300',
  oz: 'bg-indigo-500/20 text-indigo-300',
  personal: 'bg-gray-500/20 text-gray-300',
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-500/20 text-red-400',
  high:   'bg-orange-500/20 text-orange-400',
  normal: 'bg-blue-500/20 text-blue-400',
  low:    'bg-gray-500/20 text-gray-400',
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick }) {
  const brand = task.business_key || task.brand || task.category
  const brandColor = BRAND_COLORS[brand?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left bg-white/5 hover:bg-white/8 border border-white/8 rounded-lg p-3 transition-colors group"
    >
      <p className="text-sm text-white/85 leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>
      {task.description && (
        <p className="text-xs text-white/35 leading-snug line-clamp-2 mb-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {brand && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${brandColor}`}>
            {brand.toUpperCase()}
          </span>
        )}
        {task.priority && task.priority !== 'normal' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColor}`}>
            {task.priority}
          </span>
        )}
        <span className="text-[10px] text-white/25 ml-auto">
          {timeAgo(task.updated_at || task.created_at)}
        </span>
      </div>
    </button>
  )
}

// ── Task detail modal ─────────────────────────────────────────────────────────

function TaskModal({ task, onClose }) {
  if (!task) return null
  const brand = task.business_key || task.brand || task.category
  const brandColor = BRAND_COLORS[brand?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl max-w-lg w-full p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base font-semibold text-white leading-snug pr-4">{task.title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {brand && (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${brandColor}`}>
              {brand.toUpperCase()}
            </span>
          )}
          {task.priority && (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColor}`}>
              {task.priority}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">
            {task.status?.replace('_', ' ')}
          </span>
        </div>

        {task.description && (
          <p className="text-sm text-white/60 whitespace-pre-wrap mb-4 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="border-t border-white/8 pt-3 space-y-1.5">
          {task.assignee && (
            <p className="text-xs text-white/35">Assignee: <span className="text-white/55">{task.assignee}</span></p>
          )}
          {task.due_date && (
            <p className="text-xs text-white/35">Due: <span className="text-white/55">{new Date(task.due_date).toLocaleDateString()}</span></p>
          )}
          <p className="text-xs text-white/25">Created: {new Date(task.created_at).toLocaleString()}</p>
          {task.completed_at && (
            <p className="text-xs text-white/25">Completed: {new Date(task.completed_at).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Live Activity sidebar ─────────────────────────────────────────────────────

const ACTION_COLORS = {
  search: 'text-blue-400',
  read: 'text-cyan-400',
  write: 'text-green-400',
  execute: 'text-yellow-400',
  error: 'text-red-400',
  complete: 'text-green-400',
  heartbeat: 'text-indigo-400',
}

function LiveActivity() {
  const { data: logs, loading } = useRealtimeTable('agent_logs', {
    orderBy: 'created_at',
    ascending: false,
    limit: 50,
  })
  const [expanded, setExpanded] = useState(new Set())

  const toggle = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-white/40" />
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Live Activity</h3>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>

      {!isConfigured() ? (
        <p className="text-xs text-white/25 italic">Connect Supabase to see live activity.</p>
      ) : loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-white/25 italic">No activity yet. Oz is standing by.</p>
      ) : (
        <div className="space-y-0 overflow-y-auto flex-1 -mx-1">
          {logs.map(log => {
            const isExpanded = expanded.has(log.id)
            const isError = !log.success
            const details = log.metadata || log.details
            return (
              <button
                key={log.id}
                onClick={() => toggle(log.id)}
                className="w-full text-left px-1 py-2 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-semibold uppercase ${isError ? 'text-red-400' : 'text-indigo-400'}`}>
                    {log.agent || 'oz'}
                  </span>
                  {isError && (
                    <span className="text-[10px] text-red-500 bg-red-500/10 px-1 rounded">error</span>
                  )}
                  <span className="text-[10px] text-white/25 ml-auto shrink-0">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
                <p className={`text-xs text-white/55 leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {log.action}
                </p>
                {isExpanded && (
                  <div className="mt-1.5 space-y-1">
                    {log.error_msg && (
                      <p className="text-[10px] text-red-400 bg-red-500/10 rounded px-1.5 py-1 font-mono break-words">
                        {log.error_msg}
                      </p>
                    )}
                    {log.tokens_used && (
                      <p className="text-[10px] text-white/30">
                        {log.tokens_used.toLocaleString()} tokens
                        {log.duration_ms ? ` · ${(log.duration_ms / 1000).toFixed(1)}s` : ''}
                        {details?.cost_usd ? ` · $${Number(details.cost_usd).toFixed(4)}` : ''}
                      </p>
                    )}
                    {details && Object.keys(details).length > 0 && (
                      <pre className="text-[10px] text-white/25 bg-white/5 rounded p-1.5 overflow-x-auto font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Tasks page ───────────────────────────────────────────────────────────

export default function Tasks() {
  const { data: tasks, loading } = useRealtimeTable('tasks', {
    orderBy: 'updated_at',
    ascending: false,
    limit: 200,
  })
  const [selectedTask, setSelectedTask] = useState(null)

  // Stats
  const weekStart = startOfWeek()
  const thisWeek = tasks.filter(t => new Date(t.created_at) >= weekStart).length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex h-full">
      {/* Kanban main area */}
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6">
          <StatPill value={thisWeek} label="This week" color="text-blue-400" />
          <StatPill value={inProgress} label="In progress" color="text-yellow-400" />
          <StatPill value={total} label="Total" color="text-white/70" />
          <StatPill value={`${completionPct}%`} label="Completion" color="text-green-400" />
          <div className="ml-auto">
            <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} />
              New task
            </button>
          </div>
        </div>

        {/* Kanban columns */}
        {!isConfigured() ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/30 text-sm">Connect Supabase to see tasks.</p>
          </div>
        ) : loading ? (
          <div className="flex gap-4 flex-1">
            {COLUMNS.map(col => (
              <div key={col.key} className="flex-1 space-y-2">
                <div className="h-7 bg-white/5 rounded-lg animate-pulse" />
                {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 flex-1 overflow-x-auto overflow-y-hidden pb-2">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => {
                if (col.key === 'recurring') return t.status === 'recurring' || t.is_recurring
                return t.status === col.key
              })
              return (
                <div key={col.key} className="flex flex-col w-[220px] shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dot }} />
                    <span className="text-xs font-medium text-white/60">{col.label}</span>
                    <span className="ml-auto text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                    {colTasks.length === 0 ? (
                      <div className="border border-dashed border-white/8 rounded-lg h-16 flex items-center justify-center">
                        <span className="text-[10px] text-white/20">Empty</span>
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Live Activity sidebar */}
      <div className="w-[260px] shrink-0 border-l border-white/5 bg-[#0d1117] p-4 overflow-hidden flex flex-col">
        <LiveActivity />
      </div>

      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  )
}

function StatPill({ value, label, color }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  )
}
