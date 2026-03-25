import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import useProjectStore from '../../store/projectStore'
import { formatCurrency } from '../../lib/utils'
import useThemeStore from '../../store/themeStore'

export default function AdminFinancials() {
  const isDark     = useThemeStore((s) => s.adminTheme) === 'dark'
  const financials = useProjectStore((s) => s.financials)

  const {
    monthlyRevenue, monthlyExpenses,
    ytdRevenue,     ytdExpenses,
    goalMonthly,    goalYearly,
    monthlyBreakdown,
  } = financials

  const monthlyProfit = monthlyRevenue - monthlyExpenses
  const ytdProfit     = ytdRevenue - ytdExpenses

  const monthlyPct = goalMonthly > 0 ? Math.min(100, Math.round((monthlyRevenue / goalMonthly) * 100)) : 0
  const yearlyPct  = goalYearly  > 0 ? Math.min(100, Math.round((ytdRevenue     / goalYearly)  * 100)) : 0

  return (
    <AdminLayout>
      <PageHeader dark={isDark} title="Financials" subtitle="Revenue, expenses, and goal tracking" className="mb-8" />

      {/* Overview row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DarkCard className="p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">This Month</p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(monthlyRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Profit: <span className="text-emerald-400">{formatCurrency(monthlyProfit)}</span>
            &nbsp;· Expenses: <span className="text-red-400">{formatCurrency(monthlyExpenses)}</span>
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Monthly goal</span>
              <span>{monthlyPct}%</span>
            </div>
            <ProgressBar value={monthlyRevenue} max={goalMonthly || 1} color="brand" className="bg-admin-bg" />
            <p className="text-xs text-slate-600 mt-1">Goal: {formatCurrency(goalMonthly)}</p>
          </div>
        </DarkCard>

        <DarkCard className="p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Year to Date</p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(ytdRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Profit: <span className="text-emerald-400">{formatCurrency(ytdProfit)}</span>
            &nbsp;· Expenses: <span className="text-red-400">{formatCurrency(ytdExpenses)}</span>
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Yearly goal</span>
              <span>{yearlyPct}%</span>
            </div>
            <ProgressBar value={ytdRevenue} max={goalYearly || 1} color="emerald" className="bg-admin-bg" />
            <p className="text-xs text-slate-600 mt-1">Goal: {formatCurrency(goalYearly)}</p>
          </div>
        </DarkCard>
      </div>

      {/* Monthly breakdown */}
      <DarkCard className="p-6">
        <h2 className={`text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-slate-800'}`}>Monthly Revenue</h2>
        {monthlyBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No monthly data yet.</p>
        ) : (
          <div className="space-y-4">
            {monthlyBreakdown.map((m) => (
              <div key={m.month}>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{m.month}</span>
                  <span>{formatCurrency(m.revenue)}</span>
                </div>
                <ProgressBar value={m.revenue} max={goalMonthly || 1} color="brand" className="bg-admin-bg" />
              </div>
            ))}
          </div>
        )}
      </DarkCard>
    </AdminLayout>
  )
}
