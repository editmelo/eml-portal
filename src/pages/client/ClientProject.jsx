import { useState, useRef } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import FolderPanel from '../../components/ui/FolderPanel'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { CheckCircle2, Clock, Calendar, AlertCircle, StickyNote, Send, MessageCircle, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Timeline items with dates and notes ───────────────────────────────────────
const TIMELINE = [
  {
    label:   'Intake Form Submitted',
    date:    '2025-01-08',
    done:    true,
    note:    'Client completed onboarding questionnaire. Brand assets provided.',
  },
  {
    label:   'Kickoff Call',
    date:    '2025-01-10',
    done:    true,
    note:    '60-min strategy session. Agreed on brand direction: modern, minimal, navy + cyan palette.',
  },
  {
    label:   'Brand Discovery & Research',
    date:    '2025-01-17',
    done:    true,
    note:    'Competitor analysis and mood board delivered for review.',
  },
  {
    label:   'Initial Concepts Delivered',
    date:    '2025-01-28',
    done:    true,
    note:    '3 logo concepts uploaded to Drafts & Review. Awaiting feedback.',
  },
  {
    label:   'Client Feedback Round 1',
    date:    '2025-02-04',
    done:    false,
    deadline: true,
    note:    'Please review the uploaded drafts and leave your notes by this date.',
  },
  {
    label:   'Revisions & Refinements',
    date:    '2025-02-14',
    done:    false,
    note:    'Designer will apply feedback and refine chosen direction.',
  },
  {
    label:   'Client Feedback Round 2',
    date:    '2025-02-21',
    done:    false,
    deadline: true,
    note:    'Final round of feedback before production files are prepared.',
  },
  {
    label:   'Final File Delivery',
    date:    '2025-03-01',
    done:    false,
    note:    'All production-ready files delivered via shared folder (PDF, PNG, SVG, AI).',
  },
  {
    label:   'Project Complete',
    date:    '2025-03-07',
    done:    false,
    note:    'Final sign-off, invoice settled, project archived.',
  },
]

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

export default function ClientProject() {
  const user     = useAuthStore(selectUser)
  const projects = useProjectStore((s) => s.projects)
  // Match by clientId first (robust), fall back to projectId field on user
  const project  = projects.find((p) => p.clientId === user?.id)
    ?? projects.find((p) => p.id === user?.projectId)

  if (!project) {
    return (
      <PortalLayout>
        <div className="text-center py-20">
          <p className="text-slate-400">No project linked to your account yet.</p>
        </div>
      </PortalLayout>
    )
  }

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
              <p className="text-sm text-slate-600 leading-relaxed">{project.brief}</p>
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
                <p className="text-xs text-amber-600 mt-0.5">Due {formatDate(nextDeadline.date)} — {nextDeadline.note}</p>
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
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">{formatDate(step.date)}</span>
                    </div>
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
    </PortalLayout>
  )
}
