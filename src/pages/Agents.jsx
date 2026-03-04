import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Bot, Zap, Video, FileText, TrendingUp, Megaphone, Clock, CheckCircle, Lock } from 'lucide-react'
import ActiveRuns from '../components/ActiveRuns'

function timeAgo(date) {
  if (!date) return 'never'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Agent definitions ─────────────────────────────────────────────────────────

const AGENTS = [
  {
    key: 'oz',
    name: 'Oz',
    title: 'Master Agent',
    icon: Zap,
    iconBg: 'bg-blue-600',
    status: 'active',
    goals: ['Route & delegate tasks', 'Compound Craig\'s memory', 'Surface insights proactively'],
    skills: ['Memory', 'Routing', 'Telegram', 'Web search', 'File ops', 'Morning brief', 'Calendar'],
    logAgent: 'oz',
  },
  {
    key: 'dcv',
    name: 'DCV Agent',
    title: 'Denver Conference Video',
    icon: Video,
    iconBg: 'bg-cyan-700',
    status: 'planned',
    goals: ['Manage proposals & comms', 'Track shoot pipeline', 'Handle client bookings'],
    skills: ['Email', 'Notion', 'Rate cards', 'File gen', 'Web', 'Memory'],
    logAgent: 'dcv',
  },
  {
    key: 'content',
    name: 'Content Agent',
    title: 'Content Pipeline',
    icon: FileText,
    iconBg: 'bg-purple-700',
    status: 'planned',
    goals: ['Manage content pipeline', 'Publish & repurpose', 'YouTube data'],
    skills: ['Web search', 'Notion', 'File ops', 'Memory', 'Calendar', 'YouTube data'],
    logAgent: 'content',
  },
  {
    key: 'streamline',
    name: 'Streamline Agent',
    title: 'Streamline Pro AI',
    icon: TrendingUp,
    iconBg: 'bg-green-700',
    status: 'planned',
    goals: ['Manage leads & pipeline', 'Draft proposals', 'Handle onboarding'],
    skills: ['GHL', 'Email', 'Memory', 'Web', 'File gen', 'Notion'],
    logAgent: 'streamline',
  },
  {
    key: 'marketing',
    name: 'Marketing Agent',
    title: 'Brand & Campaigns',
    icon: Megaphone,
    iconBg: 'bg-pink-700',
    status: 'planned',
    goals: ['Positioning & copy', 'Run campaigns', 'Track performance'],
    skills: ['Web search', 'Notion', 'File ops', 'Memory', 'GHL'],
    logAgent: 'marketing',
  },
]

// ── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, logs }) {
  const Icon = agent.icon
  const isActive = agent.status === 'active'

  // Get last activity for this agent
  const agentLogs = logs.filter(l =>
    l.agent?.toLowerCase() === agent.logAgent ||
    l.agent?.toLowerCase().includes(agent.key)
  )
  const lastLog = agentLogs[0]
  const totalActions = agentLogs.length
  const recentSuccesses = agentLogs.filter(l => l.success !== false).length

  return (
    <div className={`
      relative bg-[#0d1117] border rounded-xl p-5
      ${isActive ? 'border-white/10' : 'border-white/5 opacity-60'}
    `}>
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        {isActive ? (
          <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
            <Lock size={9} className="text-white/30" />
            <span className="text-[10px] text-white/30 font-medium">Planned</span>
          </div>
        )}
      </div>

      {/* Icon + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${agent.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
          <p className="text-xs text-white/40">{agent.title}</p>
        </div>
      </div>

      {/* Goals */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">3 Goals</p>
        <div className="space-y-1.5">
          {agent.goals.map((goal, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] text-white/20 font-mono mt-0.5 shrink-0">{i + 1}.</span>
              <span className="text-xs text-white/60 leading-snug">{goal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Skills</p>
        <div className="flex flex-wrap gap-1">
          {agent.skills.map(skill => (
            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/45 border border-white/8">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Activity stats (active agents only) */}
      {isActive && isConfigured() && (
        <div className="border-t border-white/8 pt-3 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-sm font-bold text-white/70">{totalActions}</p>
            <p className="text-[10px] text-white/25">Actions</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-green-400">{recentSuccesses}</p>
            <p className="text-[10px] text-white/25">Successes</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-white/40 leading-tight">{lastLog ? timeAgo(lastLog.created_at) : '—'}</p>
            <p className="text-[10px] text-white/25">Last active</p>
          </div>
        </div>
      )}

      {/* Recent activity (active only) */}
      {isActive && lastLog && (
        <div className="mt-3 bg-white/3 rounded-lg p-2.5">
          <p className="text-[10px] text-white/25 mb-1">Last action</p>
          <p className="text-xs text-white/50 leading-snug line-clamp-2">
            {lastLog.action}
            {lastLog.details ? `: ${typeof lastLog.details === 'string' ? lastLog.details.slice(0, 80) : ''}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Agents page ──────────────────────────────────────────────────────────

export default function Agents() {
  const { data: logs, loading } = useRealtimeTable('agent_logs', {
    orderBy: 'created_at',
    ascending: false,
    limit: 500,
  })

  const activeAgents = AGENTS.filter(a => a.status === 'active').length
  const totalActions = logs.length
  const recentActions = logs.filter(l => {
    const ms = Date.now() - new Date(l.created_at).getTime()
    return ms < 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="p-6 space-y-6">
      {/* Live activity panel -- always at top */}
      <ActiveRuns />

      {/* Header stats */}
      <div className="flex items-center gap-6">
        <StatChip value={activeAgents} label="Active" color="text-green-400" />
        <StatChip value={AGENTS.length - activeAgents} label="Planned" color="text-white/30" />
        <StatChip value={totalActions} label="Total actions" color="text-white/60" />
        <StatChip value={recentActions} label="Last 24h" color="text-blue-400" />
      </div>

      {/* Active agents */}
      <div>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Operations Layer</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {AGENTS.filter(a => a.status === 'active').map(agent => (
            <AgentCard key={agent.key} agent={agent} logs={logs} />
          ))}
        </div>
      </div>

      {/* Planned agents */}
      <div>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Planned — Business Layer</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {AGENTS.filter(a => a.status === 'planned').map(agent => (
            <AgentCard key={agent.key} agent={agent} logs={logs} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatChip({ value, label, color }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  )
}
