import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import useQuoteStore from '../../store/quoteStore'
import { MOCK_USERS } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/utils'
import {
  Upload, DollarSign, ArrowRight, AlertTriangle,
  Clock, CheckCircle2, Flag, CalendarDays, MapPin,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date(new Date().toDateString())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function DesignerDashboard() {
  const user            = useAuthStore(selectUser)
  const projects        = useProjectStore((s) => s.projects)
  const payroll         = useProjectStore((s) => s.payroll)
  const dTodos          = useProjectStore((s) => s.designerTodos)
  const designerProfile = useProjectStore((s) => s.designerProfiles[user?.id])
  const getDailyQuote   = useQuoteStore((s) => s.getDailyQuote)
  const navigate        = useNavigate()

  const quote = getDailyQuote()
  const addressMissing = !designerProfile?.street || !designerProfile?.city || !designerProfile?.state || !designerProfile?.zip

  const myProjects    = projects.filter((p) => p.designerIds?.includes(user?.id))
  const myPayroll     = payroll.filter((p) => p.designerId === user?.id)
  const earned        = myPayroll.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const pending       = myPayroll.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)

  // Projects due within 14 days (non-null dueDate)
  const dueSoon = myProjects
    .filter((p) => {
      const d = daysUntil(p.dueDate)
      return d !== null && d >= 0 && d <= 14
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  // Priority todos
  const myTodos     = dTodos[user?.id] ?? []
  const priorityTasks = myTodos.filter((t) => t.isPriority && !t.done)

  const getClientName = (clientId) =>
    MOCK_USERS.find((u) => u.id === clientId)?.name ?? 'Client'

  const urgencyColor = (days) => {
    if (days <= 3)  return 'text-red-600 bg-red-50 border-red-200'
    if (days <= 7)  return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-blue-700 bg-blue-50 border-blue-200'
  }

  return (
    <PortalLayout>
      <PageHeader
        title={`Hey ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
        subtitle="Your work at a glance — due soon, priorities, and active projects."
        className="mb-8"
      />

      {/* Daily quote */}
      {quote && (
        <Card className="mb-6 px-6 py-5 border-l-4 border-l-brand-500">
          <p className="text-slate-700 dark:text-slate-200 text-sm italic leading-relaxed">"{quote.text}"</p>
          <p className="text-slate-400 text-xs mt-2">— {quote.author}</p>
        </Card>
      )}

      {/* Address missing banner */}
      {addressMissing && (
        <button
          onClick={() => navigate('/designer/settings')}
          className="w-full mb-6 flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-5 py-3.5 text-left hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors"
        >
          <MapPin size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Mailing address required</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">We need your address on file to send your 1099 at year-end. Update it in Settings.</p>
          </div>
          <ArrowRight size={14} className="text-amber-400 shrink-0" />
        </button>
      )}

      {/* ── Earnings row ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-5 border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} className="text-emerald-600" />
            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Earned</p>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{formatCurrency(earned)}</p>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={15} className="text-amber-600" />
            <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Pending</p>
          </div>
          <p className="text-2xl font-bold text-amber-800">{formatCurrency(pending)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left: Due soon + Active projects ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Due Soon */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <CardTitle>Due Within 2 Weeks</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/designer/timeline')}>
                Full calendar <ArrowRight size={12} className="ml-1" />
              </Button>
            </CardHeader>
            {dueSoon.length === 0 ? (
              <CardBody>
                <div className="flex items-center gap-2 py-4 text-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <p className="text-sm text-slate-400">Nothing due in the next 2 weeks!</p>
                </div>
              </CardBody>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {dueSoon.map((p) => {
                  const days = daysUntil(p.dueDate)
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${urgencyColor(days)}`}>
                        <CalendarDays size={11} />
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{getClientName(p.clientId)} · Due {formatDate(p.dueDate)}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Active Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Projects</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => navigate('/designer/projects')}>
                View all <ArrowRight size={12} className="ml-1" />
              </Button>
            </CardHeader>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {myProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <ProgressBar value={p.progress} color="brand" className="max-w-xs" />
                    <p className="text-xs text-slate-400 mt-1">
                      {p.progress}% · {p.dueDate ? `Due ${formatDate(p.dueDate)}` : 'No due date'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Upload size={13} />}
                    onClick={() => navigate('/designer/upload')}
                    className="ml-4 text-brand-500 hover:bg-blue-50 shrink-0"
                  >
                    Upload
                  </Button>
                </div>
              ))}
              {myProjects.length === 0 && (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">No projects assigned yet.</div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Right: Priority tasks ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag size={14} className="text-red-500" />
                <CardTitle>Priority Tasks</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/designer/todo')}>
                All tasks <ArrowRight size={12} className="ml-1" />
              </Button>
            </CardHeader>
            <CardBody className="space-y-2 pt-2">
              {priorityTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No priority tasks. Head to To-Do to add some.
                </p>
              ) : (
                priorityTasks.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-start gap-2.5 py-1">
                    <Flag size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-snug">{t.text}</p>
                  </div>
                ))
              )}
              {priorityTasks.length > 6 && (
                <p className="text-xs text-slate-400 pt-1">+{priorityTasks.length - 6} more in To-Do</p>
              )}
            </CardBody>
          </Card>

          {/* Draft activity */}
          <Card>
            <CardHeader><CardTitle>Recent Client Notes</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {myProjects.flatMap((p) =>
                (p.drafts ?? []).flatMap((d) =>
                  [...(d.notes ?? []), ...(d.comments ?? [])].map((n) => ({
                    ...n, projectName: p.name, draftLabel: d.label,
                  }))
                )
              ).slice(0, 3).map((note) => (
                <div key={note.id} className="text-xs">
                  <p className="font-medium text-slate-700 truncate">"{note.text}"</p>
                  <p className="text-slate-400 mt-0.5">{note.projectName} · {note.draftLabel}</p>
                </div>
              ))}
              {myProjects.flatMap((p) => (p.drafts ?? []).flatMap((d) =>
                [...(d.notes ?? []), ...(d.comments ?? [])]
              )).length === 0 && (
                <p className="text-sm text-slate-400">No client notes yet.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </PortalLayout>
  )
}
