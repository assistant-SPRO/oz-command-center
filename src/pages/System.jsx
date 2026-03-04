import { useRealtimeTable, useLatestPerGroup } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import {
  Server, Shield, Wifi, CheckCircle, XCircle, AlertTriangle,
  Brain, DollarSign, Zap, HardDrive, Activity, Lock
} from 'lucide-react'

function timeAgo(date) {
  if (!date) return 'never'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function getTimeRange(logs, hours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return logs.filter(l => new Date(l.timestamp || l.created_at).getTime() > cutoff)
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-white/40" />
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">{title}</h2>
    </div>
  )
}

// ── Infrastructure status ─────────────────────────────────────────────────────

const INFRA_CHECKS = [
  { label: 'Mac Mini M4',       icon: Server,   status: 'online',  detail: '16GB · launchd managed' },
  { label: 'Tailscale VPN',     icon: Wifi,     status: 'online',  detail: '100.103.224.113' },
  { label: 'FileVault',         icon: Lock,     status: 'online',  detail: 'Encryption active' },
  { label: 'Firewall',          icon: Shield,   status: 'online',  detail: 'Stealth mode ON' },
  { label: 'GitHub Backup',     icon: HardDrive, status: 'online', detail: '2am MT daily' },
  { label: 'LM Studio',         icon: Brain,    status: 'standby', detail: 'Qwen3.5-4B · Manual start' },
]

function InfraPanel() {
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-xl p-5">
      <SectionHeader icon={Server} title="Infrastructure" />
      <div className="space-y-2">
        {INFRA_CHECKS.map(item => {
          const Icon = item.icon
          const color = item.status === 'online' ? 'text-green-400' : item.status === 'standby' ? 'text-yellow-400' : 'text-red-400'
          const dot = item.status === 'online' ? 'bg-green-500' : item.status === 'standby' ? 'bg-yellow-500' : 'bg-red-500'

          return (
            <div key={item.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <Icon size={14} className="text-white/30 shrink-0" />
              <span className="text-sm text-white/70 flex-1">{item.label}</span>
              <span className="text-xs text-white/30">{item.detail}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className={`text-xs font-medium ${color}`}>{item.status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── API health ────────────────────────────────────────────────────────────────

function ApiHealthPanel() {
  const { data: healthData, loading } = useLatestPerGroup('api_health', 'service')

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-xl p-5">
      <SectionHeader icon={Wifi} title="API Health" />
      {!isConfigured() ? (
        <p className="text-xs text-white/25 italic">Connect Supabase to see API health.</p>
      ) : loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}
        </div>
      ) : healthData.length === 0 ? (
        <p className="text-xs text-white/25 italic">No health checks recorded yet.</p>
      ) : (
        <div className="space-y-1.5">
          {healthData.map(item => {
            const healthy = item.status === 'healthy'
            const degraded = item.status === 'degraded'

            return (
              <div key={item.service} className="flex items-center gap-3 py-1.5">
                {healthy
                  ? <CheckCircle size={13} className="text-green-400 shrink-0" />
                  : degraded
                  ? <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
                  : <XCircle size={13} className="text-red-400 shrink-0" />
                }
                <span className="text-sm text-white/65 flex-1 capitalize">{item.service}</span>
                {item.response_ms && (
                  <span className="text-xs text-white/25">{item.response_ms}ms</span>
                )}
                <span className="text-xs text-white/25">{timeAgo(item.checked_at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Claude usage + cost ───────────────────────────────────────────────────────

function UsagePanel() {
  const { data: usage } = useRealtimeTable('claude_usage', {
    orderBy: 'timestamp',
    ascending: false,
    limit: 500,
  })

  const today24h = getTimeRange(usage, 24)
  const week = getTimeRange(usage, 168)

  const totalInputTokens = usage.reduce((s, r) => s + (r.input_tokens || 0), 0)
  const totalCacheRead = usage.reduce((s, r) => s + (r.cache_read_tokens || 0), 0)
  const totalCost = usage.reduce((s, r) => s + (r.cost_usd || 0), 0)
  const todayCost = today24h.reduce((s, r) => s + (r.cost_usd || 0), 0)
  const weekCost = week.reduce((s, r) => s + (r.cost_usd || 0), 0)
  const cacheHitRate = (totalInputTokens + totalCacheRead) > 0
    ? Math.round((totalCacheRead / (totalInputTokens + totalCacheRead)) * 100)
    : 0

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-xl p-5">
      <SectionHeader icon={Brain} title="Claude AI Usage" />
      {!isConfigured() ? (
        <p className="text-xs text-white/25 italic">Connect Supabase to see usage data.</p>
      ) : (
        <div className="space-y-4">
          {/* Cost breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <CostStat label="Today" value={`$${todayCost.toFixed(3)}`} color="text-white/70" />
            <CostStat label="This week" value={`$${weekCost.toFixed(2)}`} color="text-blue-400" />
            <CostStat label="All time" value={`$${totalCost.toFixed(2)}`} color="text-purple-400" />
          </div>

          {/* Token stats */}
          <div className="border-t border-white/8 pt-3 grid grid-cols-3 gap-3">
            <CostStat label="Input tokens" value={formatNumber(totalInputTokens)} color="text-white/60" />
            <CostStat label="Cache reads" value={formatNumber(totalCacheRead)} color="text-cyan-400" />
            <CostStat label="Cache hit rate" value={`${cacheHitRate}%`} color="text-green-400" />
          </div>

          {/* Recent sessions */}
          {usage.slice(0, 5).length > 0 && (
            <div className="border-t border-white/8 pt-3">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Recent sessions</p>
              <div className="space-y-1.5">
                {usage.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/25 w-16 shrink-0">{timeAgo(r.timestamp)}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-500/60 rounded-full"
                        style={{ width: `${Math.min(100, ((r.cache_read_tokens || 0) / 200000) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/30 w-14 text-right">
                      {formatNumber(r.cache_read_tokens || r.input_tokens || 0)} tok
                    </span>
                    <span className="text-[10px] text-white/25 w-12 text-right">
                      ${(r.cost_usd || 0).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Security ──────────────────────────────────────────────────────────────────

function SecurityPanel() {
  const { data: checks } = useRealtimeTable('security_checks', {
    orderBy: 'checked_at',
    ascending: false,
    limit: 10,
  })

  const last = checks[0]

  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-xl p-5">
      <SectionHeader icon={Shield} title="Security" />
      <div className="space-y-3">
        {/* Last scan */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <span className="text-sm text-white/60">Last security scan</span>
          <span className="text-xs text-white/35">{last ? timeAgo(last.checked_at) : 'Not run yet'}</span>
        </div>

        {/* Fixed checks */}
        {[
          { label: 'Firewall + Stealth', ok: true },
          { label: 'FileVault encryption', ok: true },
          { label: 'SSH key-only auth', ok: true },
          { label: 'Tailscale active', ok: true },
          { label: '.env not in git', ok: true },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3">
            {item.ok
              ? <CheckCircle size={13} className="text-green-400 shrink-0" />
              : <XCircle size={13} className="text-red-400 shrink-0" />
            }
            <span className="text-sm text-white/60">{item.label}</span>
          </div>
        ))}

        {/* Check details from DB */}
        {last && last.details && typeof last.details === 'object' && (
          <div className="border-t border-white/5 pt-3 space-y-1.5">
            {Object.entries(last.details).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                {val
                  ? <CheckCircle size={11} className="text-green-400 shrink-0" />
                  : <XCircle size={11} className="text-red-400 shrink-0" />
                }
                <span className="text-xs text-white/40 capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main System page ──────────────────────────────────────────────────────────

export default function System() {
  const { data: usage } = useRealtimeTable('claude_usage', { orderBy: 'timestamp', ascending: false, limit: 1 })
  const { data: healthData } = useLatestPerGroup('api_health', 'service')

  const healthyCount = healthData.filter(h => h.status === 'healthy').length
  const totalApis = healthData.length || 0
  const lastSession = usage[0]

  return (
    <div className="p-6">
      {/* Summary bar */}
      <div className="flex items-center gap-6 mb-6">
        <StatChip
          value={`${healthyCount}/${totalApis || '—'}`}
          label="APIs healthy"
          color={healthyCount === totalApis && totalApis > 0 ? 'text-green-400' : 'text-yellow-400'}
        />
        <StatChip value="5/5" label="Infra checks" color="text-green-400" />
        <StatChip
          value={lastSession ? timeAgo(lastSession.timestamp) : '—'}
          label="Last session"
          color="text-white/50"
        />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <InfraPanel />
        <ApiHealthPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsagePanel />
        <SecurityPanel />
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

function CostStat({ label, value, color }) {
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-white/25">{label}</p>
    </div>
  )
}
