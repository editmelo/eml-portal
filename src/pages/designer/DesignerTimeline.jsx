import { useState } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { MOCK_USERS } from '../../lib/mockData'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { CalendarDays, List, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getClientName(clientId) {
  return MOCK_USERS.find((u) => u.id === clientId)?.name ?? '—'
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date(new Date().toDateString())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function urgencyClasses(days) {
  if (days < 0)   return 'text-slate-400'
  if (days <= 3)  return 'text-red-600 font-semibold'
  if (days <= 7)  return 'text-amber-600 font-medium'
  if (days <= 14) return 'text-blue-600'
  return 'text-slate-600'
}

// ── Calendar view ──────────────────────────────────────────────────────────────
function CalendarView({ projects }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())  // 0-indexed

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  // Build the calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // Map due dates to day numbers for this month/year
  const dueDates = {}
  projects.forEach((p) => {
    if (!p.dueDate) return
    const d = new Date(p.dueDate)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!dueDates[day]) dueDates[day] = []
      dueDates[day].push(p)
    }
  })

  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-slate-800">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        {cells.map((day, i) => {
          const hasDeadlines = day && dueDates[day]?.length > 0
          const isToday = day === todayDay
          return (
            <div
              key={i}
              className={cn(
                'min-h-[72px] bg-white p-1.5',
                !day && 'bg-slate-50/50 dark:bg-slate-900/50',
                isToday && 'bg-blue-50 dark:bg-brand-500/10'
              )}
            >
              {day && (
                <>
                  <span className={cn(
                    'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium',
                    isToday ? 'bg-brand-500 text-white' : 'text-slate-600'
                  )}>
                    {day}
                  </span>
                  {hasDeadlines && (
                    <div className="mt-1 space-y-0.5">
                      {dueDates[day].map((p) => (
                        <div
                          key={p.id}
                          className="text-[9px] font-medium px-1 py-0.5 rounded bg-brand-500/10 text-brand-500 truncate leading-tight"
                          title={p.name}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-brand-500" />
          <span className="text-xs text-slate-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-brand-500/10 border border-brand-500/20" />
          <span className="text-xs text-slate-500">Project deadline</span>
        </div>
      </div>
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ projects }) {
  const withDates = projects
    .filter((p) => p.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const overdue  = withDates.filter((p) => daysUntil(p.dueDate) < 0)
  const upcoming = withDates.filter((p) => daysUntil(p.dueDate) >= 0)

  const Row = ({ p }) => {
    const days = daysUntil(p.dueDate)
    return (
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
        <div className="w-24 shrink-0 text-center">
          <p className="text-xs font-bold text-slate-800">
            {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-400">
            {new Date(p.dueDate).getFullYear()}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{getClientName(p.clientId)}</p>
        </div>
        <StatusBadge status={p.status} />
        <span className={cn('text-xs shrink-0', urgencyClasses(days))}>
          {days < 0
            ? `${Math.abs(days)}d overdue`
            : days === 0
            ? 'Due today'
            : days === 1
            ? 'Due tomorrow'
            : `${days}d left`}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <Card className="border-red-200">
          <div className="px-5 py-3 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-sm font-semibold text-red-700">Overdue</p>
          </div>
          {overdue.map((p) => <Row key={p.id} p={p} />)}
        </Card>
      )}

      <Card>
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <CalendarDays size={14} className="text-brand-500" />
          <p className="text-sm font-semibold text-slate-700">Upcoming Deadlines</p>
        </div>
        {upcoming.length === 0 ? (
          <CardBody>
            <div className="flex items-center gap-2 justify-center py-6">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <p className="text-sm text-slate-400">No upcoming deadlines.</p>
            </div>
          </CardBody>
        ) : (
          upcoming.map((p) => <Row key={p.id} p={p} />)
        )}
      </Card>

      {projects.filter((p) => !p.dueDate).length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-500">No Due Date Set</p>
          </div>
          {projects.filter((p) => !p.dueDate).map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
              <div className="w-24 shrink-0 text-center">
                <p className="text-xs text-slate-300">—</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 truncate">{p.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{getClientName(p.clientId)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DesignerTimeline() {
  const user     = useAuthStore(selectUser)
  const projects = useProjectStore((s) => s.projects)
  const [view, setView] = useState('calendar')

  const myProjects = projects.filter((p) => p.designerIds?.includes(user?.id))

  return (
    <PortalLayout>
      <div className="flex items-start justify-between mb-8 gap-4">
        <PageHeader
          title="Timeline"
          subtitle="Track project deadlines in calendar or list view."
        />
        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'calendar'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <CalendarDays size={14} /> Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'list'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {myProjects.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <p className="text-slate-400 text-sm">No projects assigned yet.</p>
          </CardBody>
        </Card>
      ) : view === 'calendar' ? (
        <Card>
          <CardBody>
            <CalendarView projects={myProjects} />
          </CardBody>
        </Card>
      ) : (
        <ListView projects={myProjects} />
      )}
    </PortalLayout>
  )
}
