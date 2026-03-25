import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { MOCK_USERS } from '../../lib/mockData'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import {
  ChevronLeft, ChevronRight, CalendarDays, List,
  AlertTriangle, CheckCircle2, User,
} from 'lucide-react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getClientName(clientId) {
  return MOCK_USERS.find((u) => u.id === clientId)?.name ?? '—'
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date(new Date().toDateString())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function urgencyClasses(days) {
  if (days < 0)    return 'text-red-400 bg-red-400/10 border-red-400/30'
  if (days <= 3)   return 'text-red-400 bg-red-400/10 border-red-400/30'
  if (days <= 7)   return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
  if (days <= 14)  return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
  return 'text-slate-400 bg-white/5 border-admin-border'
}

// ── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ projects, isDark }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Map dueDate → projects for this month/year
  const dueDatesMap = {}
  projects.forEach((p) => {
    if (!p.dueDate) return
    const d = new Date(p.dueDate)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!dueDatesMap[day]) dueDatesMap[day] = []
      dueDatesMap[day].push(p)
    }
  })

  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <DarkCard>
      {/* Month nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
        <button onClick={prevMonth} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{MONTH_NAMES[month]} {year}</p>
        <button onClick={nextMonth} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day header */}
      <div className="grid grid-cols-7 border-b border-admin-border">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div
            key={i}
            className={cn(
              'min-h-[80px] p-1.5 border-b border-r border-admin-border/40 last:border-r-0',
              !day ? 'bg-admin-bg/30' : 'hover:bg-white/[0.02]'
            )}
          >
            {day && (
              <>
                <p className={cn(
                  'text-[11px] font-semibold mb-1 h-5 w-5 flex items-center justify-center rounded-full',
                  isToday(day) ? 'bg-brand-500 text-white' : 'text-slate-500'
                )}>
                  {day}
                </p>
                {(dueDatesMap[day] ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="mb-0.5 px-1 py-0.5 rounded text-[9px] font-medium truncate bg-brand-500/20 text-brand-300 border border-brand-500/30"
                    title={p.name}
                  >
                    {p.name}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </DarkCard>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ projects }) {
  const withDates    = projects.filter((p) => p.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const withoutDates = projects.filter((p) => !p.dueDate)

  const overdue  = withDates.filter((p) => { const d = daysUntil(p.dueDate); return d !== null && d < 0 })
  const upcoming = withDates.filter((p) => { const d = daysUntil(p.dueDate); return d !== null && d >= 0 })

  const Row = ({ project }) => {
    const days = daysUntil(project.dueDate)
    return (
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-admin-border/40 last:border-0 hover:bg-white/[0.02] transition-colors">
        <div className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0', urgencyClasses(days))}>
          {days < 0 ? <AlertTriangle size={11} /> : <CalendarDays size={11} />}
          {days === null   ? 'No date'
           : days < 0     ? `${Math.abs(days)}d overdue`
           : days === 0   ? 'Today'
           : days === 1   ? 'Tomorrow'
           : `${days}d`}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{project.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <User size={10} /> {getClientName(project.clientId)} · Due {formatDate(project.dueDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={project.status} />
          <div className="w-16">
            <div className="h-1.5 bg-admin-bg rounded-full overflow-hidden border border-admin-border">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${project.progress}%` }} />
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5 text-right">{project.progress}%</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <DarkCard className="overflow-hidden border-red-400/20">
          <div className="px-5 py-3 border-b border-admin-border flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-400" />
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Overdue ({overdue.length})</p>
          </div>
          {overdue.map((p) => <Row key={p.id} project={p} />)}
        </DarkCard>
      )}

      {upcoming.length > 0 && (
        <DarkCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-admin-border flex items-center gap-2">
            <CalendarDays size={13} className="text-brand-400" />
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Upcoming ({upcoming.length})</p>
          </div>
          {upcoming.map((p) => <Row key={p.id} project={p} />)}
        </DarkCard>
      )}

      {withoutDates.length > 0 && (
        <DarkCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-admin-border">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No Due Date ({withoutDates.length})</p>
          </div>
          {withoutDates.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-admin-border/40 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <User size={10} /> {getClientName(p.clientId)}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </DarkCard>
      )}

      {projects.length === 0 && (
        <DarkCard className="p-8 text-center">
          <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No projects yet.</p>
        </DarkCard>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminTimeline() {
  const projects  = useProjectStore((s) => s.projects)
  const isDark    = useThemeStore((s) => s.adminTheme) === 'dark'
  const [view, setView] = useState('list') // calendar | list

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-6 gap-4">
        <PageHeader dark={isDark} title="Timeline" subtitle="All project deadlines at a glance." />
        <div className="flex gap-1 p-1 bg-admin-surface border border-admin-border rounded-lg shrink-0">
          <button
            onClick={() => setView('list')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              view === 'list' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <List size={13} /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              view === 'calendar' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <CalendarDays size={13} /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' && <CalendarView projects={projects} isDark={isDark} />}
      {view === 'list'     && <ListView     projects={projects} />}
    </AdminLayout>
  )
}
