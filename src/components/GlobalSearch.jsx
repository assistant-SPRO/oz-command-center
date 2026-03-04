import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { Search, X, LayoutGrid, Bot, ScrollText, FolderKanban, Loader } from 'lucide-react'

const SOURCE_CONFIG = {
  tasks:      { label: 'Task',       icon: LayoutGrid, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  agent_logs: { label: 'Bot Action', icon: Bot,        color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  activity:   { label: 'Activity',   icon: ScrollText, color: 'text-green-400',  bg: 'bg-green-500/10' },
}

function timeAgo(date) {
  if (!date) return ''
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 280)

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // parent controls isOpen - this just signals
        }
      }
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [isOpen])

  // Search Supabase when query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || !isConfigured()) {
      setResults([])
      return
    }
    if (debouncedQuery.trim().length < 2) return

    const run = async () => {
      setLoading(true)
      const q = debouncedQuery.trim()

      try {
        const [tasksRes, logsRes, activityRes] = await Promise.all([
          supabase
            .from('tasks')
            .select('id, title, description, status, priority, business_key, updated_at')
            .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
            .limit(6),

          supabase
            .from('agent_logs')
            .select('id, agent, action, success, error_msg, tokens_used, duration_ms, created_at')
            .ilike('action', `%${q}%`)
            .order('created_at', { ascending: false })
            .limit(6),

          supabase
            .from('activity_log')
            .select('id, description, outcome, task_type, duration_seconds, timestamp')
            .ilike('description', `%${q}%`)
            .order('timestamp', { ascending: false })
            .limit(4),
        ])

        const combined = [
          ...(tasksRes.data || []).map(r => ({ ...r, _source: 'tasks', _page: 'tasks' })),
          ...(logsRes.data || []).map(r => ({ ...r, _source: 'agent_logs', _page: 'audit' })),
          ...(activityRes.data || []).map(r => ({ ...r, _source: 'activity', _page: 'audit' })),
        ]
        setResults(combined)
        setSelected(0)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [debouncedQuery])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      const r = results[selected]
      onNavigate(r._page)
      onClose()
    }
  }, [results, selected, onNavigate, onClose])

  const handleResultClick = (r) => {
    onNavigate(r._page)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="bg-[#161b22] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
            {loading
              ? <Loader size={16} className="text-white/40 animate-spin shrink-0" />
              : <Search size={16} className="text-white/40 shrink-0" />
            }
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks, bot actions, activity..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }} className="text-white/30 hover:text-white">
                <X size={14} />
              </button>
            )}
            <kbd className="text-[10px] text-white/20 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-[380px] overflow-y-auto py-1">
              {results.map((r, i) => {
                const src = SOURCE_CONFIG[r._source] || SOURCE_CONFIG.activity
                const Icon = src.icon
                const isActive = i === selected
                const label = r.title || r.action || r.description || ''
                const sub = r.description || r.error_msg || r.outcome || ''
                const ts = r.updated_at || r.created_at || r.timestamp

                return (
                  <button
                    key={`${r._source}-${r.id}`}
                    onClick={() => handleResultClick(r)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-white/8' : 'hover:bg-white/5'}`}
                  >
                    <div className={`mt-0.5 p-1 rounded ${src.bg} shrink-0`}>
                      <Icon size={11} className={src.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/85 truncate leading-snug">{label}</p>
                      {sub && (
                        <p className="text-xs text-white/35 truncate mt-0.5">{sub}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <span className={`text-[10px] ${src.color} font-medium`}>{src.label}</span>
                      {ts && <span className="text-[10px] text-white/20">{timeAgo(ts)}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-white/30">No results for "{query}"</p>
            </div>
          )}

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
              <span className="text-[10px] text-white/20">↑↓ navigate</span>
              <span className="text-[10px] text-white/20">↵ open</span>
              <span className="text-[10px] text-white/20">esc close</span>
              <span className="text-[10px] text-white/20 ml-auto">{results.length} results</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
