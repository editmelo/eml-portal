import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import useQuoteStore from '../../store/quoteStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { TrendingUp, DollarSign, FolderKanban, Users, Pencil, Plus, Check, X, Activity } from 'lucide-react'
import ActivityFeed from '../../components/ui/ActivityFeed'

// ── Inline edit modal for revenue cards ──────────────────────────────────────
function RevenueEditModal({ label, fields, values, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...values })

  const handleSave = () => {
    const parsed = {}
    for (const f of fields) {
      const n = parseFloat(String(draft[f.key]).replace(/[^0-9.]/g, ''))
      parsed[f.key] = isNaN(n) ? 0 : n
    }
    onSave(parsed)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-80 rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-white mb-4">{label}</h3>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-admin-border bg-admin-bg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            <Check size={14} /> Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 border border-admin-border text-slate-400 hover:text-white text-sm transition-colors"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate       = useNavigate()
  const user           = useAuthStore(selectUser)
  const adminTheme     = useThemeStore((s) => s.adminTheme)
  const isDark         = adminTheme === 'dark'
  const getDailyQuote  = useQuoteStore((s) => s.getDailyQuote)
  const projects       = useProjectStore((s) => s.projects)
  const leads          = useProjectStore((s) => s.leads)
  const financials     = useProjectStore((s) => s.financials)
  const setFinancials  = useProjectStore((s) => s.setFinancials)

  const quote          = getDailyQuote()
  const DONE_STATUSES = ['Done', 'Archived', 'Dead']
  const activeProjects = projects.filter((p) => !DONE_STATUSES.includes(p.status))
  const openLeads      = leads.filter((l) => !['Done', 'Archived', 'Dead'].includes(l.status))

  const monthlyGoalPct = financials.goalMonthly > 0
    ? Math.min(100, Math.round((financials.monthlyRevenue / financials.goalMonthly) * 100))
    : 0
  const yearlyGoalPct  = financials.goalYearly > 0
    ? Math.min(100, Math.round((financials.ytdRevenue / financials.goalYearly) * 100))
    : 0

  const [editing, setEditing] = useState(null) // 'monthly' | 'ytd'

  const stats = [
    {
      key:   'monthly',
      label: 'Monthly Revenue',
      value: formatCurrency(financials.monthlyRevenue),
      sub:   `Goal: ${formatCurrency(financials.goalMonthly)}`,
      pct:   monthlyGoalPct,
      icon:  <DollarSign size={18} className="text-brand-400" />,
      onEdit: () => setEditing('monthly'),
    },
    {
      key:   'ytd',
      label: 'YTD Revenue',
      value: formatCurrency(financials.ytdRevenue),
      sub:   `Goal: ${formatCurrency(financials.goalYearly)}`,
      pct:   yearlyGoalPct,
      icon:  <TrendingUp size={18} className="text-emerald-400" />,
      onEdit: () => setEditing('ytd'),
    },
    {
      key:   'projects',
      label: 'Active Projects',
      value: activeProjects.length,
      sub:   `${projects.length} total`,
      pct:   null,
      icon:  <FolderKanban size={18} className="text-blue-400" />,
      onAdd: () => navigate('/admin/projects'),
    },
    {
      key:   'leads',
      label: 'Open Leads',
      value: openLeads.length,
      sub:   `${leads.length} total`,
      pct:   null,
      icon:  <Users size={18} className="text-purple-400" />,
      onAdd: () => navigate('/admin/leads'),
    },
  ]

  return (
    <AdminLayout>
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
          <DarkCard key={s.label} className="p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.onEdit && (
                  <button
                    onClick={s.onEdit}
                    className="p-1 rounded text-slate-500 hover:text-brand-400 hover:bg-admin-bg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {s.onAdd && (
                  <button
                    onClick={s.onAdd}
                    className="p-1 rounded text-slate-500 hover:text-brand-400 hover:bg-admin-bg transition-colors"
                    title="Add new"
                  >
                    <Plus size={13} />
                  </button>
                )}
                <span className="p-1.5 rounded-lg bg-admin-bg">{s.icon}</span>
              </div>
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

      {/* Activity Feed */}
      <DarkCard className="mt-8">
        <div className="px-6 py-4 border-b border-admin-border flex items-center gap-2">
          <Activity size={14} className="text-brand-400" />
          <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Activity</h2>
        </div>
        <div className="px-3 py-2 max-h-80 overflow-y-auto no-scrollbar">
          <ActivityFeed isDark={isDark} limit={25} />
        </div>
      </DarkCard>

      {/* Revenue edit modals */}
      {editing === 'monthly' && (
        <RevenueEditModal
          label="Monthly Revenue"
          fields={[
            { key: 'monthlyRevenue', label: 'Revenue This Month' },
            { key: 'goalMonthly',    label: 'Monthly Goal' },
          ]}
          values={{ monthlyRevenue: financials.monthlyRevenue, goalMonthly: financials.goalMonthly }}
          onSave={setFinancials}
          onClose={() => setEditing(null)}
        />
      )}
      {editing === 'ytd' && (
        <RevenueEditModal
          label="YTD Revenue"
          fields={[
            { key: 'ytdRevenue',  label: 'Revenue Year to Date' },
            { key: 'goalYearly',  label: 'Annual Goal' },
          ]}
          values={{ ytdRevenue: financials.ytdRevenue, goalYearly: financials.goalYearly }}
          onSave={setFinancials}
          onClose={() => setEditing(null)}
        />
      )}
    </AdminLayout>
  )
}
