import QuickStats from '../components/QuickStats'
import RecentActivity from '../components/RecentActivity'
import BusinessOverview from '../components/BusinessOverview'
import ClaudeUsage from '../components/ClaudeUsage'
import ModelBreakdown from '../components/ModelBreakdown'
import CostAnalysis from '../components/CostAnalysis'
import ApiHealth from '../components/ApiHealth'
import SecurityMonitor from '../components/SecurityMonitor'

export default function Overview({ onNavigate }) {
  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <QuickStats />

      {/* Claude Intelligence + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ClaudeUsage />
            <ModelBreakdown />
            <CostAnalysis />
          </div>
        </div>
        <RecentActivity limit={8} onViewAll={() => {}} />
      </div>

      {/* Business Overview */}
      <BusinessOverview />

      {/* Infrastructure Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SecurityMonitor />
        <ApiHealth />
      </div>
    </div>
  )
}
