import { useState, useCallback } from 'react'
import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import {
  ScrollText, Bot, Clock, Zap, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, Download, RefreshCw, Filter
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function timeAgo(date) {
  if (!date) return ''
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'bot',       label: 'Bot Turns' },
  { key: 'cron',      label: 'Cron Jobs' },
  { key: 'activity',  label: 'Activity' },
  { key: 'errors',    label: 'Errors' },
]

const TIME_FILTERS = [
  { key: '1h',  label: '1 hour' },
  { key: '24h', label: '24 hours' },
  { key: '7d',  label: '7 days' },
  { key: 'all', label: 'All time' },
]

function sinceTimestamp(key) {
  const now = Date.now()
  if (key === '1h')  return new Date(now - 3_600_000).toISOString()
  if (key === '24h') return new Date(now - 86_400_000).toISOString()
  if (key === '7d')  return new Date(now - 604_800_000).toISOString()
  return null
}

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({ entry, expanded, onToggle }) {
  const isError = entry._type === 'bot'
    ? !entry.success
    : entry._type === 'cron'
      ? entry.status === 'failed' || !entry.success
      : entry.outcome === 'failed'

  const typeColors = {
    bot:      'bg-indigo-500/15 text-indigo-300',
    cron:     'bg-blue-500/15 text-blue-300',
    activity: 'bg-green-500/15 text-green-300',
  }

  const label = {
    bot:      entry.action,
    cron:     entry.cron_name || entry.job_name,
    activity: entry.description,
  }[entry._type] || ''

  const ts = entry.created_at || entry.started_at || entry.timestamp

  return (
    <div
      className={`border-b border-white/5 last:border-0 ${isError ? 'bg-red-500/5' : ''}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-white/3 transition-colors group"
      >
        {/* Expand icon */}
        <div className="mt-0.5 text-white/20 group-hover:text-white/40 shrink-0 transition-colors">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>

        {/* Status dot */}
        <div className="mt-1.5 shrink-0">
          {isError
            ? <AlertCircle size={12} className="text-red-400" />
            : <CheckCircle size={12} className="text-green-400/60" />
          }
        </div>

        {/* Type badge */}
        <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${typeColors[entry._type]}`}>
          {entry._type === 'bot' ? (entry.agent || 'oz') : entry._type}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isError ? 'text-red-200/80' : 'text-white/80'} ${expanded ? '' : 'line-clamp-1'}`}>
            {label}
          </p>
          {isError && entry.error_msg && !expanded && (
            <p className="text-xs text-red-400 mt-0.5 truncate">{entry.error_msg}</p>
          )}
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {entry.tokens_used && (
            <div className="flex items-center gap-1 text-[10px] text-white/25">
              <Zap size={9} />
              {entry.tokens_used.toLocaleString()}
            </div>
          )}
          {(entry.duration_ms || entry.duration_seconds) && (
            <div className="flex items-center gap-1 text-[10px] text-white/25">
              <Clock size={9} />
              {entry.duration_ms
                ? `${(entry.duration_ms / 1000).toFixed(1)}s`
                : `${entry.duration_seconds}s`}
            </div>
          )}
          <div className="text-[10px] text-white/25 min-w-[80px] text-right">
            {timeAgo(ts)}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 pt-0 ml-[68px] space-y-3">
          {/* Full label */}
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
            {label}
          </p>

          {/* Error */}
          {entry.error_msg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Error</p>
              <p className="text-sm text-red-300 font-mono whitespace-pre-wrap break-words">
                {entry.error_msg}
              </p>
            </div>
          )}

          {/* Output (cron) */}
          {entry.output && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs font-semibold text-white/40 mb-1">Output</p>
              <p className="text-sm text-white/60 whitespace-pre-wrap break-words">{entry.output}</p>
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-xs text-white/40">
            <span>Time: {formatTime(ts)}</span>
            {entry.tokens_used && <span>Tokens: {entry.tokens_used.toLocaleString()}</span>}
            {entry.duration_ms && <span>Duration: {(entry.duration_ms / 1000).toFixed(2)}s</span>}
            {entry.duration_seconds && <span>Duration: {entry.duration_seconds}s</span>}
            {entry.metadata?.cost_usd && <span>Cost: ${Number(entry.metadata.cost_usd).toFixed(5)}</span>}
            {entry.outcome && <span>Outcome: {entry.outcome}</span>}
            {entry.status && <span>Status: {entry.status}</span>}
          </div>

          {/* Full metadata JSON */}
          {(entry.metadata && Object.keys(entry.metadata).length > 0) && (
            <details className="group">
              <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 select-none">
                Metadata JSON
              </summary>
              <pre className="mt-2 text-[11px] text-white/40 bg-white/5 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditLog() {
  const [tab, setTab] = useState('all')
  const [timeFilter, setTimeFilter] = useState('24h')
  const [expanded, setExpanded] = useState(new Set())

  const toggle = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Fetch all three streams
  const { data: agentLogs, loading: l1, refetch: r1 } = useRealtimeTable('agent_logs', {
    orderBy: 'created_at', ascending: false, limit: 200,
  })
  const { data: cronRuns, loading: l2, refetch: r2 } = useRealtimeTable('cron_runs', {
    orderBy: 'started_at', ascending: false, limit: 200,
  })
  const { data: activity, loading: l3, refetch: r3 } = useRealtimeTable('activity_log', {
    orderBy: 'timestamp', ascending: false, limit: 200,
  })

  const loading = l1 || l2 || l3

  // Tag each entry with its source type
  const since = sinceTimestamp(timeFilter)

  const botEntries = agentLogs
    .filter(e => !since || new Date(e.created_at) >= new Date(since))
    .map(e => ({ ...e, _type: 'bot', _ts: e.created_at }))

  const cronEntries = cronRuns
    .filter(e => !since || new Date(e.started_at) >= new Date(since))
    .map(e => ({ ...e, _type: 'cron', _ts: e.started_at }))

  const activityEntries = activity
    .filter(e => !since || new Date(e.timestamp) >= new Date(since))
    .map(e => ({ ...e, _type: 'activity', _ts: e.timestamp }))

  // Filter by tab
  let entries
  if (tab === 'bot')      entries = botEntries
  else if (tab === 'cron')     entries = cronEntries
  else if (tab === 'activity') entries = activityEntries
  else if (tab === 'errors')   entries = [...botEntries, ...cronEntries, ...activityEntries]
    .filter(e =>
      e.success === false ||
      e.status === 'failed' ||
      e.outcome === 'failed'
    )
  else entries = [...botEntries, ...cronEntries, ...activityEntries]

  // Sort by timestamp desc
  entries = entries.sort((a, b) => new Date(b._ts) - new Date(a._ts))

  // Export to JSON
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oz-audit-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRefresh = () => { r1?.(); r2?.(); r3?.() }

  // Stats
  const errorCount = entries.filter(e =>
    e.success === false || e.status === 'failed' || e.outcome === 'failed'
  ).length
  const totalTokens = botEntries.reduce((s, e) => s + (e.tokens_used || 0), 0)

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ScrollText size={18} className="text-white/50" />
            <h1 className="text-base font-semibold text-white">Audit Log</h1>
            <div className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            {/* Time filter */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {TIME_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setTimeFilter(f.key)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    timeFilter === f.key
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Export as JSON"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-5 mb-4">
          <StatItem value={entries.length} label="entries" color="text-white/70" />
          <StatItem value={errorCount} label="errors" color={errorCount > 0 ? 'text-red-400' : 'text-white/30'} />
          {totalTokens > 0 && (
            <StatItem value={`${(totalTokens / 1000).toFixed(1)}k`} label="tokens" color="text-blue-400" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/8">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              {t.label}
              {t.key === 'errors' && errorCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                  {errorCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Log stream */}
      <div className="flex-1 overflow-y-auto">
        {!isConfigured() ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-white/30 text-sm">Connect Supabase to see audit logs.</p>
          </div>
        ) : loading ? (
          <div className="space-y-px p-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <ScrollText size={24} className="text-white/15" />
            <p className="text-sm text-white/25">
              {tab === 'errors' ? 'No errors in this period.' : 'No entries in this period.'}
            </p>
            {tab !== 'errors' && (
              <p className="text-xs text-white/15">Activity will appear here as Oz runs.</p>
            )}
          </div>
        ) : (
          <div>
            {entries.map(entry => (
              <LogRow
                key={`${entry._type}-${entry.id}`}
                entry={entry}
                expanded={expanded.has(`${entry._type}-${entry.id}`)}
                onToggle={() => toggle(`${entry._type}-${entry.id}`)}
              />
            ))}
            {entries.length >= 200 && (
              <p className="text-center text-xs text-white/20 py-4">
                Showing 200 most recent entries per source.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatItem({ value, label, color }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  )
}
