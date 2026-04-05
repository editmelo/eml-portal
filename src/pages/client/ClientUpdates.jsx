import { useState } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import {
  Send, Globe, ChevronDown, Clock, CheckCircle2,
  AlertCircle, Wrench, Type, Image, FileText,
  Layout, Bug, Plus, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Options ──────────────────────────────────────────────────────────────────
const UPDATE_TYPES = [
  { value: 'text',        label: 'Text / Copy Change',     icon: Type },
  { value: 'image',       label: 'Image / Photo Swap',     icon: Image },
  { value: 'new-page',    label: 'New Page',                icon: FileText },
  { value: 'layout',      label: 'Layout / Design Change',  icon: Layout },
  { value: 'bug',         label: 'Bug / Something Broken',  icon: Bug },
  { value: 'feature',     label: 'New Feature / Addition',  icon: Plus },
  { value: 'content',     label: 'Content Update',          icon: FileText },
  { value: 'other',       label: 'Other',                   icon: Wrench },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low — Whenever you get to it',  color: 'bg-slate-100 text-slate-600' },
  { value: 'normal', label: 'Normal — Within a few days',    color: 'bg-blue-100 text-blue-700' },
  { value: 'high',   label: 'High — Needs attention soon',   color: 'bg-amber-100 text-amber-700' },
  { value: 'urgent', label: 'Urgent — ASAP please!',         color: 'bg-red-100 text-red-700' },
]

const STATUS_STYLES = {
  New:           'bg-brand-500/10 text-brand-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Complete:      'bg-emerald-100 text-emerald-700',
  'On Hold':     'bg-amber-100 text-amber-700',
}

// ── Request Form ─────────────────────────────────────────────────────────────
function UpdateRequestForm({ user, onClose }) {
  const submitUpdateRequest = useProjectStore((s) => s.submitUpdateRequest)
  const existingProfile     = useProjectStore((s) => s.clientProfiles[user?.id])

  const [form, setForm] = useState({
    updateType:  '',
    pageUrl:     '',
    description: '',
    priority:    'normal',
  })

  const set_ = (field, val) => setForm((f) => ({ ...f, [field]: val }))

  const canSubmit = form.updateType && form.description.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    submitUpdateRequest({
      clientId:    user?.id,
      clientName:  user?.name ?? user?.email,
      clientEmail: user?.email,
      businessId:  existingProfile?.activeBusinessId ?? null,
      updateType:  form.updateType,
      pageUrl:     form.pageUrl.trim(),
      description: form.description.trim(),
      priority:    form.priority,
    })
    toast.success('Update request submitted!')
    onClose()
  }

  const selectedType = UPDATE_TYPES.find((t) => t.value === form.updateType)

  const INPUT  = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500'
  const LABEL  = 'block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300'

  return (
    <div className="space-y-4">
      {/* Update Type — visual picker */}
      <div>
        <label className={LABEL}>What needs updating? *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UPDATE_TYPES.map((t) => {
            const Icon = t.icon
            const selected = form.updateType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set_('updateType', t.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                  selected
                    ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700'
                )}
              >
                <Icon size={18} />
                <span className="text-[11px] font-medium leading-tight">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Page / URL */}
      <div>
        <label className={LABEL}>Which page? (optional)</label>
        <input
          className={INPUT}
          placeholder="e.g. Home page, About Us, or paste the URL..."
          value={form.pageUrl}
          onChange={(e) => set_('pageUrl', e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className={LABEL}>Describe the update *</label>
        <textarea
          className={cn(INPUT, 'resize-none')}
          rows={4}
          placeholder="Tell us exactly what you'd like changed. The more detail, the faster we can get it done..."
          value={form.description}
          onChange={(e) => set_('description', e.target.value)}
        />
      </div>

      {/* Priority */}
      <div>
        <label className={LABEL}>Priority</label>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set_('priority', p.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left',
                form.priority === p.value
                  ? 'border-brand-500 ring-2 ring-brand-500/20 ' + p.color
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-600'
              )}
            >
              {form.priority === p.value && <CheckCircle2 size={12} className="shrink-0" />}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
            canSubmit
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700'
          )}
        >
          <Send size={14} />
          Submit Request
        </button>
      </div>
    </div>
  )
}

// ── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ request }) {
  const [expanded, setExpanded] = useState(false)
  const typeInfo = UPDATE_TYPES.find((t) => t.value === request.updateType) ?? UPDATE_TYPES[UPDATE_TYPES.length - 1]
  const TypeIcon = typeInfo.icon
  const priorityInfo = PRIORITY_OPTIONS.find((p) => p.value === request.priority)

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-600">
      <button
        className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-700/30"
        onClick={() => setExpanded((o) => !o)}
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 dark:bg-brand-500/10 dark:border-brand-500/20">
            <TypeIcon size={14} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{typeInfo.label}</p>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', STATUS_STYLES[request.status] ?? STATUS_STYLES.New)}>
                {request.status}
              </span>
              {priorityInfo && request.priority !== 'normal' && (
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', priorityInfo.color)}>
                  {request.priority}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{request.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock size={9} /> {formatDate(request.createdAt?.split('T')[0])}
            </span>
            <ChevronDown size={14} className={cn('text-slate-400 mt-1 ml-auto transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-700/20 dark:border-slate-600">
          {request.pageUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Page</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{request.pageUrl}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">{request.description}</p>
          </div>
          {request.adminNote && (
            <div className="mt-2 p-3 rounded-lg bg-brand-50 border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-0.5">Response from Edit Me Lo</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{request.adminNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ClientUpdates() {
  const user            = useAuthStore(selectUser)
  const updateRequests  = useProjectStore((s) => s.updateRequests)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState('all')

  const myRequests = updateRequests.filter((r) => r.clientId === user?.id)
  const filtered   = filter === 'all'
    ? myRequests
    : myRequests.filter((r) => r.status === filter)

  const newCount        = myRequests.filter((r) => r.status === 'New').length
  const inProgressCount = myRequests.filter((r) => r.status === 'In Progress').length

  return (
    <PortalLayout>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <PageHeader
          title="Website Updates"
          subtitle="Request changes and updates to your website"
        />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shrink-0"
        >
          <Plus size={14} />
          New Update Request
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardBody className="py-3 px-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center dark:bg-brand-500/10">
              <Globe size={16} className="text-brand-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{myRequests.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3 px-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center dark:bg-amber-500/10">
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{newCount}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pending</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3 px-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center dark:bg-blue-500/10">
              <Wrench size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{inProgressCount}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">In Progress</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* New request form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench size={15} className="text-brand-500" />
              <CardTitle>New Update Request</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tell us what needs to be updated and we'll take care of it.</p>
          </CardHeader>
          <CardBody className="pt-0">
            <UpdateRequestForm user={user} onClose={() => setShowForm(false)} />
          </CardBody>
        </Card>
      )}

      {/* Filter tabs */}
      {myRequests.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {['all', 'New', 'In Progress', 'Complete'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
              )}
            >
              {f === 'all' ? 'All' : f}
              {f === 'New' && newCount > 0 && ` (${newCount})`}
              {f === 'In Progress' && inProgressCount > 0 && ` (${inProgressCount})`}
            </button>
          ))}
        </div>
      )}

      {/* Request list */}
      <div className="space-y-2">
        {filtered.map((r) => <RequestCard key={r.id} request={r} />)}
      </div>

      {/* Empty state */}
      {myRequests.length === 0 && !showForm && (
        <Card className="text-center py-12">
          <CardBody>
            <Globe size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No update requests yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Need something changed on your website? Submit a request and we'll handle it.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              <Plus size={14} />
              Submit Your First Request
            </button>
          </CardBody>
        </Card>
      )}
    </PortalLayout>
  )
}
