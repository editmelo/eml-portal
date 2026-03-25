import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import useQuoteStore from '../../store/quoteStore'
import { MOCK_FINANCIALS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import { TrendingUp, DollarSign, FolderKanban, Users } from 'lucide-react'

export default function AdminDashboard() {
  const user           = useAuthStore(selectUser)
  const adminTheme     = useThemeStore((s) => s.adminTheme)
  const isDark         = adminTheme === 'dark'
  const getDailyQuote  = useQuoteStore((s) => s.getDailyQuote)
  const projects       = useProjectStore((s) => s.projects)
  const invoices       = useProjectStore((s) => s.invoices)
  const leads          = useProjectStore((s) => s.leads)

  const quote          = getDailyQuote()
  const activeProjects = projects.filter((p) => p.status === 'Active' || p.status === 'Review')
  const paidRevenue    = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const monthlyGoalPct = Math.round((MOCK_FINANCIALS.currentMonth.revenue / MOCK_FINANCIALS.revenueGoalMonthly) * 100)
  const yearlyGoalPct  = Math.round((MOCK_FINANCIALS.ytd.revenue / MOCK_FINANCIALS.revenueGoalYearly) * 100)

  const stats = [
    {
      label: 'Monthly Revenue',
      value: formatCurrency(MOCK_FINANCIALS.currentMonth.revenue),
      sub: `Goal: ${formatCurrency(MOCK_FINANCIALS.revenueGoalMonthly)}`,
      pct: monthlyGoalPct,
      icon: <DollarSign size={18} className="text-brand-400" />,
    },
    {
      label: 'YTD Revenue',
      value: formatCurrency(MOCK_FINANCIALS.ytd.revenue),
      sub: `Goal: ${formatCurrency(MOCK_FINANCIALS.revenueGoalYearly)}`,
      pct: yearlyGoalPct,
      icon: <TrendingUp size={18} className="text-emerald-400" />,
    },
    {
      label: 'Active Projects',
      value: activeProjects.length,
      sub: `${projects.length} total`,
      pct: null,
      icon: <FolderKanban size={18} className="text-blue-400" />,
    },
    {
      label: 'Open Leads',
      value: leads.filter((l) => !l.converted).length,
      sub: `${leads.length} total`,
      pct: null,
      icon: <Users size={18} className="text-purple-400" />,
    },
  ]

  return (
    <AdminLayout>
      {/* Header */}
      <PageHeader
        dark={isDark}
        title={`Good day, ${user?.name ?? 'Lo'} 👋`}
        subtitle="Here's what's happening across your business today."
        className="mb-8"
      />

      {/* Daily quote */}
      {quote && (
        <DarkCard className="mb-8 px-6 py-5 border-l-4 border-l-brand-500">
          <p className="text-slate-200 text-sm italic leading-relaxed">"{quote.text}"</p>
          <p className="text-slate-500 text-xs mt-2">— {quote.author}</p>
        </DarkCard>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <DarkCard key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</span>
              <span className="p-1.5 rounded-lg bg-admin-bg">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            {s.pct !== null && (
              <div className="mt-3">
                <ProgressBar
                  value={s.pct}
                  max={100}
                  color={s.pct >= 100 ? 'emerald' : 'brand'}
                  className="bg-admin-bg"
                />
                <p className="text-[10px] text-slate-600 mt-1">{s.pct}% of goal</p>
              </div>
            )}
          </DarkCard>
        ))}
      </div>

      {/* Active projects table */}
      <DarkCard>
        <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Active Projects</h2>
          <a href="/admin/projects" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Project', 'Status', 'Value', 'Progress', 'Due'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeProjects.map((p) => (
                <tr key={p.id} className="border-b border-admin-border/50 hover:bg-admin-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-slate-100 font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.tags?.join(', ')}</p>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-slate-200">{formatCurrency(p.projectValue)}</td>
                  <td className="px-6 py-4 w-40">
                    <ProgressBar value={p.progress} color="brand" className="bg-admin-bg" />
                    <p className="text-[11px] text-slate-500 mt-1">{p.progress}%</p>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(p.dueDate)}</td>
                </tr>
              ))}
              {activeProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No active projects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DarkCard>
    </AdminLayout>
  )
}
