import { useState, useRef } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import FolderPanel from '../../components/ui/FolderPanel'
import RichBrief from '../../components/ui/RichBrief'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { CheckCircle2, Clock, Calendar, AlertCircle, StickyNote, Send, MessageCircle, FolderOpen, Sparkles, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Timeline steps derived from project status ──────────────────────────────
// Each step maps to a project status. Steps up to and including the current
// status are marked done. This way the admin controls progress via status.
import { PROJECT_STATUS } from '../../lib/constants'

const STEP_ORDER = [
  { status: PROJECT_STATUS.NEW,               label: 'Project Created',           note: 'Your project has been set up in the system.' },
  { status: PROJECT_STATUS.CONSULTATION,      label: 'Consultation',              note: 'Discovery call to understand your goals and vision.' },
  { status: PROJECT_STATUS.PROJECT_PROPOSAL,  label: 'Project Proposal',          note: 'Review your custom project proposal and scope.' },
  { status: PROJECT_STATUS.SERVICE_AGREEMENT, label: 'Service Agreement',         note: 'Sign the service agreement to get started.' },
  { status: PROJECT_STATUS.INVOICE_DEPOSIT,   label: 'Deposit Invoice',           note: 'Deposit invoice sent for review.' },
  { status: PROJECT_STATUS.DEPOSIT_PAID,      label: 'Deposit Paid',              note: 'Deposit received — project is officially underway!' },
  { status: PROJECT_STATUS.KICK_OFF_CALL,     label: 'Kick-Off Call',             note: 'Strategy session to align on direction, timeline, and deliverables.' },
  { status: PROJECT_STATUS.DRAFT_1,           label: 'Draft 1 Delivered',         note: 'First draft is ready for your review in Drafts & Review.', deadline: true },
  { status: PROJECT_STATUS.DRAFT_2,           label: 'Draft 2 Delivered',         note: 'Revised draft based on your feedback.', deadline: true },
  { status: PROJECT_STATUS.DRAFT_3,           label: 'Draft 3 Delivered',         note: 'Third revision delivered for review.', deadline: true },
  { status: PROJECT_STATUS.FINAL_REVISIONS,   label: 'Final Revisions',           note: 'Final tweaks before production files are prepared.' },
  { status: PROJECT_STATUS.INVOICE_REMAINDER, label: 'Final Invoice',             note: 'Remaining balance invoice sent.' },
  { status: PROJECT_STATUS.LAUNCH,            label: 'Launch',                    note: 'All final files delivered — your project is live!' },
  { status: PROJECT_STATUS.DONE,              label: 'Project Complete',          note: 'Project wrapped up. Thank you!' },
]

function buildTimeline(project) {
  const statusList = STEP_ORDER.map((s) => s.status)
  const currentIdx = statusList.indexOf(project?.status)
  return STEP_ORDER.map((step, i) => ({
    label:    step.label,
    note:     step.note,
    date:     null, // dates come from project start/due, not hardcoded
    done:     i <= currentIdx,
    deadline: step.deadline && i === currentIdx + 1, // next step after current is the action item
  }))
}

// ── Notes Hub ─────────────────────────────────────────────────────────────────
function NotesHub({ projectId }) {
  const user           = useAuthStore(selectUser)
  const projectNotes   = useProjectStore((s) => s.projectNotes[projectId]) ?? []
  const addProjectNote = useProjectStore((s) => s.addProjectNote)
  const [text, setText] = useState('')
  const inputRef        = useRef(null)

  const handleSend = () => {
    if (!text.trim()) return
    addProjectNote(projectId, {
      id:         `note_${Date.now()}`,
      authorId:   user?.id,
      authorRole: user?.role,
      authorName: user?.name,
      text:       text.trim(),
      createdAt:  new Date().toISOString(),
    })
    toast.success('Note sent')
    setText('')
    inputRef.current?.focus()
  }

  const roleColor = (role) => {
    if (role === 'admin')    return 'bg-red-100 text-red-600'
    if (role === 'designer') return 'bg-brand-500/10 text-brand-500'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-brand-500" />
          <CardTitle>Project Notes</CardTitle>
          {projectNotes.length > 0 && (
            <span className="text-[10px] font-bold bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded-full">
              {projectNotes.length}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">All messages here are visible to your designer and Edit Me Lo.</p>
      </CardHeader>
      <CardBody className="space-y-4 pt-0">
        {/* Thread */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {projectNotes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No notes yet. Use the box below to leave a message.</p>
          ) : (
            projectNotes.map((note) => {
              const isMe = note.authorId === user?.id
              return (
                <div key={note.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : '')}>
                  <div className="h-7 w-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-500">
                    {(note.authorName ?? '?').charAt(0)}
                  </div>
                  <div className={cn(
                    'flex-1 rounded-xl px-3 py-2.5 max-w-[80%]',
                    isMe ? 'bg-brand-500 text-white ml-auto' : 'bg-slate-50 border border-slate-100'
                  )}>
                    <div className={cn('flex items-center gap-2 mb-1', isMe ? 'flex-row-reverse' : '')}>
                      <p className={cn('text-xs font-semibold', isMe ? 'text-white/90' : 'text-slate-700')}>
                        {isMe ? 'You' : note.authorName}
                      </p>
                      {!isMe && (
                        <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', roleColor(note.authorRole))}>
                          {note.authorRole}
                        </span>
                      )}
                      <span className={cn('text-[10px] flex items-center gap-1', isMe ? 'text-white/60 mr-auto' : 'text-slate-400 ml-auto')}>
                        <Clock size={9} /> {formatDate(note.createdAt?.split('T')[0])}
                      </span>
                    </div>
                    <p className={cn('text-xs leading-relaxed', isMe ? 'text-white' : 'text-slate-600')}>{note.text}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Compose */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            ref={inputRef}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            placeholder="Leave a note for your designer or Edit Me Lo…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </CardBody>
    </Card>
  )
}

// ── Client Folders ─────────────────────────────────────────────────────────────
function ClientFolders({ clientId, projectId }) {
  const folders               = useProjectStore((s) => s.folders)
  const createFolder          = useProjectStore((s) => s.createFolder)
  const deleteFolder          = useProjectStore((s) => s.deleteFolder)
  const renameFolder          = useProjectStore((s) => s.renameFolder)
  const addFileToFolder       = useProjectStore((s) => s.addFileToFolder)
  const removeFileFromFolder  = useProjectStore((s) => s.removeFileFromFolder)
  const user                  = useAuthStore(selectUser)

  // Client's own profile-level folders (shared with their designer)
  const myFolders = folders.filter(
    (f) => f.context === 'profile' && f.contextId === clientId
  )

  // Designer folders for this project that are client-visible
  const designerFolders = folders.filter(
    (f) => f.context === 'project' && f.contextId === projectId && f.clientVisible
  )

  const handleCreate = (name) => {
    createFolder({
      name,
      ownerId:       user.id,
      ownerRole:     user.role,
      ownerName:     user.name,
      context:       'profile',
      contextId:     clientId,
      clientVisible: true,
    })
    toast.success('Folder created')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderOpen size={15} className="text-brand-500" />
          <CardTitle>My Folders</CardTitle>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Organize your project files. Folders are shared with your designer automatically.</p>
      </CardHeader>
      <CardBody className="space-y-5 pt-0">
        {/* Client's own folders */}
        <FolderPanel
          folders={myFolders}
          onCreateFolder={handleCreate}
          onDeleteFolder={deleteFolder}
          onRenameFolder={renameFolder}
          onAddFile={addFileToFolder}
          onRemoveFile={removeFileFromFolder}
          emptyMessage="Create your first folder to start organizing."
        />

        {/* Designer-shared folders */}
        {designerFolders.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Shared by Designer</p>
            <FolderPanel
              folders={designerFolders}
              emptyMessage="No shared folders yet."
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// ── Service Options ──────────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  'Logo Design',
  'Brand Identity',
  'Website Design',
  'Website Redesign',
  'Social Media Kit',
  'Print Design',
  'Packaging Design',
  'Marketing Materials',
  'Presentation Design',
  'Merchandise Design',
  'Other',
]

const TIMELINE_OPTIONS = [
  'ASAP',
  '1–2 Weeks',
  '2–4 Weeks',
  '1–2 Months',
  '3+ Months',
  'Flexible / No Rush',
]

const BUDGET_OPTIONS = [
  'Under $500',
  '$500 – $1,000',
  '$1,000 – $2,500',
  '$2,500 – $5,000',
  '$5,000 – $10,000',
  '$10,000+',
  'Not Sure Yet',
]

// ── New Project Request Form ─────────────────────────────────────────────────
function NewProjectRequest({ user }) {
  const submitProjectRequest = useProjectStore((s) => s.submitProjectRequest)
  const projectRequests      = useProjectStore((s) => s.projectRequests)
  const existingProfile      = useProjectStore((s) => s.clientProfiles[user?.id])

  const [open, setOpen]       = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm]       = useState({
    serviceType: '',
    description: '',
    timeline:    '',
    budget:      '',
    goal:        '',
  })

  const set_ = (field, val) => setForm((f) => ({ ...f, [field]: val }))

  const canSubmit = form.serviceType && form.description.trim() && form.timeline && form.budget && form.goal.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    submitProjectRequest({
      clientId:    user?.id,
      clientName:  user?.name ?? user?.email,
      clientEmail: user?.email,
      businessId:  existingProfile?.activeBusinessId ?? null,
      ...form,
      description: form.description.trim(),
      goal:        form.goal.trim(),
    })
    setForm({ serviceType: '', description: '', timeline: '', budget: '', goal: '' })
    setSubmitted(true)
    toast.success('Project request submitted! We\'ll be in touch soon.')
    setTimeout(() => setSubmitted(false), 4000)
  }

  const myRequests = projectRequests.filter((r) => r.clientId === user?.id)

  const INPUT  = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500'
  const SELECT = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 appearance-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100'
  const LABEL  = 'block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-brand-500" />
            <CardTitle>Request a New Project</CardTitle>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              open
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            )}
          >
            {open ? 'Cancel' : 'New Request'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Want to start something new? Let us know what you have in mind.</p>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Form */}
        {open && (
          <div className="space-y-4 pt-4">
            {/* Service Type */}
            <div>
              <label className={LABEL}>What would you like done? *</label>
              <div className="relative">
                <select className={SELECT} value={form.serviceType} onChange={(e) => set_('serviceType', e.target.value)}>
                  <option value="">Select a service...</option>
                  {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={LABEL}>Describe what you're looking for *</label>
              <textarea
                className={cn(INPUT, 'resize-none')}
                rows={3}
                placeholder="In your own words, tell us about the project..."
                value={form.description}
                onChange={(e) => set_('description', e.target.value)}
              />
            </div>

            {/* Timeline & Budget row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Timeline *</label>
                <div className="relative">
                  <select className={SELECT} value={form.timeline} onChange={(e) => set_('timeline', e.target.value)}>
                    <option value="">When do you need this?</option>
                    {TIMELINE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={LABEL}>Budget *</label>
                <div className="relative">
                  <select className={SELECT} value={form.budget} onChange={(e) => set_('budget', e.target.value)}>
                    <option value="">What's your budget?</option>
                    {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className={LABEL}>What's the overall goal? *</label>
              <textarea
                className={cn(INPUT, 'resize-none')}
                rows={2}
                placeholder="e.g. Launch a new product line, refresh our brand for a rebrand, increase social media presence..."
                value={form.goal}
                onChange={(e) => set_('goal', e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
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
        )}

        {/* Success callout */}
        {submitted && !open && (
          <div className="flex items-center gap-3 p-4 mt-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <Check size={18} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Request submitted!</p>
              <p className="text-xs text-emerald-600 mt-0.5">We'll review it and get back to you shortly.</p>
            </div>
          </div>
        )}

        {/* Past requests */}
        {myRequests.length > 0 && !open && (
          <div className="space-y-2 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Your Requests</p>
            {myRequests.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-700/50 dark:border-slate-600">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{r.serviceType}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">{r.timeline}</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-400">{r.budget}</span>
                  </div>
                </div>
                <span className={cn(
                  'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  r.status === 'Pending'  && 'bg-amber-100 text-amber-700',
                  r.status === 'Reviewed' && 'bg-blue-100 text-blue-700',
                  r.status === 'Approved' && 'bg-emerald-100 text-emerald-700',
                  r.status === 'Declined' && 'bg-red-100 text-red-700',
                )}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default function ClientProject() {
  const user     = useAuthStore(selectUser)
  const projects = useProjectStore((s) => s.projects)
  const getActiveClientProject = useProjectStore((s) => s.getActiveClientProject)
  // Match by active business first, then clientId, then projectId fallback
  const project  = getActiveClientProject(user?.id)
    ?? projects.find((p) => p.clientId === user?.id)
    ?? projects.find((p) => p.id === user?.projectId)

  if (!project) {
    return (
      <PortalLayout>
        <PageHeader title="My Project" subtitle="No active project yet" />
        <div className="text-center py-12">
          <p className="text-slate-400 mb-6">No project linked to your account yet.</p>
        </div>
        <NewProjectRequest user={user} />
      </PortalLayout>
    )
  }

  const TIMELINE       = buildTimeline(project)
  const completedSteps = TIMELINE.filter((t) => t.done).length
  const nextDeadline   = TIMELINE.find((t) => !t.done && t.deadline)

  return (
    <PortalLayout>
      <div className="flex items-start justify-between mb-8 gap-4">
        <PageHeader title={project.name} subtitle={`Due ${formatDate(project.dueDate)}`} />
        <StatusBadge status={project.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left: Brief + Progress ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Project Brief */}
          <Card>
            <CardHeader><CardTitle>Project Brief</CardTitle></CardHeader>
            <CardBody>
              <RichBrief text={project.brief} className="text-sm text-slate-600" />
              <div className="flex flex-wrap gap-2 mt-4">
                {project.tags?.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
              </div>
            </CardBody>
          </Card>

          {/* Overall Progress */}
          <Card>
            <CardHeader><CardTitle>Overall Progress</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Completion</span>
                  <span className="font-semibold text-slate-800">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} color="blue" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-lg font-bold text-emerald-700">{completedSteps}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Steps Done</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-lg font-bold text-blue-700">{TIMELINE.length - completedSteps}</p>
                  <p className="text-xs text-blue-600 mt-0.5">Remaining</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-lg font-bold text-slate-700">{TIMELINE.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Steps</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Next Deadline callout */}
          {nextDeadline && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Action Required: {nextDeadline.label}</p>
                <p className="text-xs text-amber-600 mt-0.5">{nextDeadline.note}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Timeline ── */}
        <Card className="self-start">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Timeline</CardTitle>
              <span className="text-xs text-slate-400">{completedSteps}/{TIMELINE.length}</span>
            </div>
          </CardHeader>
          <CardBody className="px-4">
            <ol className="relative border-l border-slate-200 space-y-0 ml-2">
              {TIMELINE.map((step, i) => (
                <li key={i} className="ml-4 pb-5 last:pb-0">
                  {/* Dot */}
                  <span className={`absolute -left-[9px] flex items-center justify-center h-4 w-4 rounded-full ring-4 ring-white transition-colors ${
                    step.done
                      ? 'bg-emerald-500'
                      : step.deadline
                      ? 'bg-amber-400'
                      : 'bg-slate-200'
                  }`}>
                    {step.done && <CheckCircle2 size={10} className="text-white" />}
                    {!step.done && step.deadline && <AlertCircle size={9} className="text-white" />}
                  </span>

                  {/* Content */}
                  <div className={`${step.done ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-xs font-semibold ${step.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {step.label}
                      </p>
                      {step.deadline && !step.done && (
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          Action needed
                        </span>
                      )}
                    </div>
                    {step.date && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-400">{formatDate(step.date)}</span>
                      </div>
                    )}
                    {step.note && (
                      <div className="flex items-start gap-1.5 mt-1.5 bg-slate-50 rounded-lg px-2.5 py-2">
                        <StickyNote size={10} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 leading-relaxed">{step.note}</p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      {/* ── Notes Hub ── */}
      <div className="mt-6">
        <NotesHub projectId={project.id} />
      </div>

      {/* ── Folders ── */}
      <div className="mt-6">
        <ClientFolders clientId={user.id} projectId={project.id} />
      </div>

      {/* ── New Project Request ── */}
      <div className="mt-6">
        <NewProjectRequest user={user} />
      </div>
    </PortalLayout>
  )
}
