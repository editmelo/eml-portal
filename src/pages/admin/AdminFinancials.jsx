import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import { MOCK_FINANCIALS } from '../../lib/mockData'
import { formatCurrency } from '../../lib/utils'
import useThemeStore from '../../store/themeStore'

export default function AdminFinancials() {
  const { currentMonth, ytd, revenueGoalMonthly, revenueGoalYearly, monthlyBreakdown } = MOCK_FINANCIALS
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'

  return (
    <AdminLayout>
      <PageHeader dark={isDark} title="Financials" subtitle="Revenue, expenses, and goal tracking" className="mb-8" />

      {/* Overview row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DarkCard className="p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{currentMonth.label}</p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(currentMonth.revenue)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Profit: <span className="text-emerald-400">{formatCurrency(currentMonth.profit)}</span>
            &nbsp;· Expenses: <span className="text-red-400">{formatCurrency(currentMonth.expenses)}</span>
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Monthly goal</span>
              <span>{Math.round((currentMonth.revenue / revenueGoalMonthly) * 100)}%</span>
            </div>
            <ProgressBar value={currentMonth.revenue} max={revenueGoalMonthly} color="brand" className="bg-admin-bg" />
            <p className="text-xs text-slate-600 mt-1">Goal: {formatCurrency(revenueGoalMonthly)}</p>
          </div>
        </DarkCard>

        <DarkCard className="p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Year to Date</p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(ytd.revenue)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Profit: <span className="text-emerald-400">{formatCurrency(ytd.profit)}</span>
            &nbsp;· Expenses: <span className="text-red-400">{formatCurrency(ytd.expenses)}</span>
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Yearly goal</span>
              <span>{Math.round((ytd.revenue / revenueGoalYearly) * 100)}%</span>
            </div>
            <ProgressBar value={ytd.revenue} max={revenueGoalYearly} color="emerald" className="bg-admin-bg" />
            <p className="text-xs text-slate-600 mt-1">Goal: {formatCurrency(revenueGoalYearly)}</p>
          </div>
        </DarkCard>
      </div>

      {/* Monthly breakdown */}
      <DarkCard className="p-6">
        <h2 className={`text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-slate-800'}`}>Monthly Revenue</h2>
        <div className="space-y-4">
          {monthlyBreakdown.map((m) => (
            <div key={m.month}>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>{m.month}</span>
                <span>{formatCurrency(m.revenue)}</span>
              </div>
              <ProgressBar value={m.revenue} max={revenueGoalMonthly} color="brand" className="bg-admin-bg" />
            </div>
          ))}
        </div>
      </DarkCard>
    </AdminLayout>
  )
}
