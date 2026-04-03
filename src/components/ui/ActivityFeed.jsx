import { useEffect } from 'react'
import useActivityStore from '../../store/activityStore'
import { cn } from '../../lib/utils'
import {
  UserPlus, Upload, MessageSquare, StickyNote, FileText,
  CheckCircle2, FolderKanban, DollarSign, ClipboardList,
  User, PenLine, Clock,
} from 'lucide-react'

const ACTION_ICON = {
  invite_sent:      UserPlus,
  invite_accepted:  UserPlus,
  invite_resent:    UserPlus,
  invite_cancelled: UserPlus,
  project_created:  FolderKanban,
  project_status:   FolderKanban,
  draft_uploaded:   Upload,
  message_sent:     MessageSquare,
  note_added:       StickyNote,
  invoice_created:  FileText,
  invoice_paid:     DollarSign,
  intake_submitted: ClipboardList,
  agreement_signed: PenLine,
  todo_completed:   CheckCircle2,
  profile_updated:  User,
}

const ACTION_COLOR = {
  invite_sent:      'text-cyan-400 bg-cyan-500/10',
  invite_accepted:  'text-emerald-400 bg-emerald-500/10',
  invite_resent:    'text-amber-400 bg-amber-500/10',
  invite_cancelled: 'text-red-400 bg-red-500/10',
  project_created:  'text-brand-400 bg-brand-500/10',
  project_status:   'text-amber-400 bg-amber-500/10',
  draft_uploaded:   'text-violet-400 bg-violet-500/10',
  message_sent:     'text-blue-400 bg-blue-500/10',
  note_added:       'text-yellow-400 bg-yellow-500/10',
  invoice_created:  'text-slate-400 bg-slate-500/10',
  invoice_paid:     'text-emerald-400 bg-emerald-500/10',
  intake_submitted: 'text-indigo-400 bg-indigo-500/10',
  agreement_signed: 'text-emerald-400 bg-emerald-500/10',
  todo_completed:   'text-emerald-400 bg-emerald-500/10',
  profile_updated:  'text-slate-400 bg-slate-500/10',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimestamp(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Renders a chronological activity feed.
 * @param {object} props
 * @param {string} [props.projectId] — filter to a specific project
 * @param {string} [props.actorId]   — filter to a specific user
 * @param {number} [props.limit=20]  — max items
 * @param {boolean} [props.isDark=true]
 * @param {string} [props.className]
 */
export default function ActivityFeed({ projectId, actorId, limit = 20, isDark = true, className }) {
  const events    = useActivityStore((s) => s.events)
  const isLoading = useActivityStore((s) => s.isLoading)
  const loadActivity = useActivityStore((s) => s.loadActivity)

  useEffect(() => {
    loadActivity({ projectId, actorId, limit })
  }, [projectId, actorId, limit])

  const filtered = events.slice(0, limit)

  if (isLoading && filtered.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>Loading activity...</p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <Clock size={24} className={cn('mx-auto mb-2', isDark ? 'text-slate-600' : 'text-slate-300')} />
        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>No activity yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {filtered.map((evt) => {
        const Icon = ACTION_ICON[evt.action] ?? Clock
        const color = ACTION_COLOR[evt.action] ?? 'text-slate-400 bg-slate-500/10'
        return (
          <div
            key={evt.id}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors',
              isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
            )}
            title={formatTimestamp(evt.createdAt)}
          >
            <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', color)}>
              <Icon size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-700')}>
                <span className="font-semibold">{evt.actorName}</span>{' '}
                {evt.description}
              </p>
              <p className={cn('text-[10px] mt-0.5', isDark ? 'text-slate-600' : 'text-slate-400')}>
                {formatTimestamp(evt.createdAt)}
              </p>
            </div>
            <span className={cn('text-[10px] shrink-0 mt-1', isDark ? 'text-slate-600' : 'text-slate-400')}>
              {timeAgo(evt.createdAt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
