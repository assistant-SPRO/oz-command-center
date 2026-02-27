import { useRealtimeTable } from '../hooks/useSupabase'
import { isConfigured } from '../lib/supabase'
import { Shield, CheckCircle, XCircle, Wifi, HardDrive } from 'lucide-react'

function formatTime(ts) {
  if (!ts) return 'Never'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  })
}

function StatusBadge({ ok, label }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle size={16} className="text-green-500" />
      ) : (
        <XCircle size={16} className="text-red-500" />
      )}
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  )
}

export default function SecurityMonitor() {
  const { data: checks, loading } = useRealtimeTable('security_checks', {
    orderBy: 'checked_at',
    ascending: false,
    limit: 1
  })

  const latest = checks[0] || null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Shield size={18} />
        Security Monitor
      </h2>

      {!isConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect Supabase to see security data.</p>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      ) : !latest ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No security scans yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last scan: {formatTime(latest.checked_at)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Firewall */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <StatusBadge ok={latest.firewall_status} label="Firewall" />
            </div>

            {/* Tailscale */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Wifi size={16} className={latest.tailscale_connected ? 'text-green-500' : 'text-red-500'} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Tailscale {latest.tailscale_connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {latest.tailscale_devices && latest.tailscale_devices.length > 0 && (
                <div className="mt-2 space-y-1">
                  {latest.tailscale_devices.map((device, i) => (
                    <span key={i} className="inline-block text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full mr-1">
                      {device}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Open Ports */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open Ports</div>
              {latest.open_ports && latest.open_ports.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {latest.open_ports.map((port, i) => (
                    <span key={i} className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                      {port}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500">None detected</span>
              )}
            </div>

            {/* GitHub Backup */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className={latest.github_backup_status === 'success' ? 'text-green-500' : 'text-red-500'} />
                <span className="text-sm text-gray-700 dark:text-gray-300">GitHub Backup</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {latest.github_backup_status || 'Unknown'} / {formatTime(latest.github_backup_last)}
              </div>
            </div>
          </div>

          {latest.notes && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
              {latest.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
