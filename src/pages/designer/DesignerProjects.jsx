import { useState, useRef } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import FolderPanel from '../../components/ui/FolderPanel'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { MOCK_USERS } from '../../lib/mockData'
import { PROJECT_STATUS } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import {
  Search, ChevronDown, ChevronUp, StickyNote,
  MessageSquare, User, FileText, X, Building2,
  Phone, Mail, Send, Palette, Tag, Target,
  MessageCircle, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = Object.values(PROJECT_STATUS)

function getClientUser(clientId) {
  return MOCK_USERS.find((u) => u.id === clientId) ?? null
}

function getClientName(clientId) {
  return getClientUser(clientId)?.name ?? '—'
}

// ── Notes panel for a draft ───────────────────────────────────────────────────
function DraftNotes({ draft }) {
  const [open, setOpen] = useState(false)
  const allNotes = [
    ...(draft.notes ?? []),
    ...(draft.comments ?? []).map((c) => ({ ...c, authorName: getClientName(c.authorId) })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  if (allNotes.length === 0) return (
    <p className="text-xs text-slate-400 italic px-4 pb-3">No client notes on this file yet.</p>
  )

  return (
    <div className="px-4 pb-3">
      <button
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors mb-2"
        onClick={() => setOpen((o) => !o)}
      >
        <StickyNote size={12} className="text-amber-500" />
        {allNotes.length} note{allNotes.length > 1 ? 's' : ''} from client
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="space-y-2 ml-1">
          {allNotes.map((note) => (
            <div key={note.id} className="flex gap-2.5">
              <div className="h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-brand-500">
                  {(note.authorName ?? 'C').charAt(0)}
                </span>
              </div>
              <div className="flex-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
                <p className="text-[11px] font-medium text-slate-600">{note.authorName ?? 'Client'}</p>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{note.text}</p>
                <p className="text-[10px] text-slate-400 mt-1">{formatDate(note.createdAt?.split('T')[0] ?? note.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Client Profile Modal ──────────────────────────────────────────────────────
function ClientProfileModal({ clientId, project, onClose }) {
  const clientProfile  = useProjectStore((s) => s.clientProfiles[clientId])
  const intakeForm     = useProjectStore((s) => s.intakeForms[project?.id])
  const projectNotes   = useProjectStore((s) => s.projectNotes[project?.id]) ?? []
  const brief          = useProjectStore((s) => s.projectBriefs[project?.id])
  const addProjectNote = useProjectStore((s) => s.addProjectNote)
  const authUser       = useAuthStore(selectUser)

  // Folder store actions
  const folders              = useProjectStore((s) => s.folders)
  const createFolder         = useProjectStore((s) => s.createFolder)
  const deleteFolder         = useProjectStore((s) => s.deleteFolder)
  const renameFolder         = useProjectStore((s) => s.renameFolder)
  const setFolderClientVisible = useProjectStore((s) => s.setFolderClientVisible)
  const addFileToFolder      = useProjectStore((s) => s.addFileToFolder)
  const removeFileFromFolder = useProjectStore((s) => s.removeFileFromFolder)

  // Client profile folders (shared with this designer automatically)
  const clientFolders = folders.filter(
    (f) => f.context === 'profile' && f.contextId === clientId
  )
  // This designer's folders for this project
  const myProjectFolders = folders.filter(
    (f) => f.context === 'project' && f.contextId === project?.id && f.ownerId === authUser?.id
  )

  const handleCreateProjectFolder = (name) => {
    createFolder({
      name,
      ownerId:       authUser.id,
      ownerRole:     authUser.role,
      ownerName:     authUser.name,
      context:       'project',
      contextId:     project?.id,
      clientVisible: false,
    })
    toast.success('Folder created')
  }

  const [noteText, setNoteText] = useState('')
  const [activeSection, setActiveSection] = useState('profile')
  const inputRef = useRef(null)

  const clientUser = getClientUser(clientId)
  const displayName = clientProfile?.name ?? clientUser?.name ?? 'Client'
  const avatar      = clientProfile?.avatar ?? null
  const company     = clientProfile?.company ?? clientUser?.company ?? null
  const phone       = clientProfile?.phone ?? clientUser?.phone ?? null
  const email       = clientUser?.email ?? null

  const handleSendNote = () => {
    if (!noteText.trim()) return
    addProjectNote(project?.id, {
      id:         `note_${Date.now()}`,
      authorId:   authUser?.id,
      authorRole: authUser?.role,
      authorName: authUser?.name,
      text:       noteText.trim(),
      createdAt:  new Date().toISOString(),
    })
    toast.success('Note added')
    setNoteText('')
    inputRef.current?.focus()
  }

  const SECTIONS = [
    { id: 'profile',  label: 'Profile' },
    { id: 'brief',    label: 'Brief' },
    { id: 'intake',   label: 'Intake Form' },
    { id: 'files',    label: 'Files' },
    { id: 'notes',    label: `Notes${projectNotes.length > 0 ? ` (${projectNotes.length})` : ''}` },
  ]

  const roleColor = (role) => {
    if (role === 'admin')    return 'bg-red-100 text-red-600'
    if (role === 'designer') return 'bg-brand-500/10 text-brand-500'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-brand-500/10 flex items-center justify-center text-base font-bold text-brand-500 shrink-0">
              {avatar
                ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                : displayName.charAt(0)
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{displayName}</p>
              {company && <p className="text-xs text-slate-400">{company}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-0.5 px-4 pt-3 border-b border-slate-100">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
                activeSection === s.id
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── Profile section ── */}
          {activeSection === 'profile' && (
            <div className="space-y-3">
              {[
                { icon: Mail,      label: 'Email',   value: email },
                { icon: Phone,     label: 'Phone',   value: phone },
                { icon: Building2, label: 'Company', value: company },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-slate-700">{value}</p>
                  </div>
                </div>
              ) : null)}

              {!email && !phone && !company && (
                <p className="text-sm text-slate-400 py-4 text-center">No profile info on file yet.</p>
              )}

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Project</p>
                <p className="text-sm font-medium text-slate-800">{project?.name}</p>
                <div className="mt-1.5">
                  <StatusBadge status={project?.status} />
                </div>
              </div>
            </div>
          )}

          {/* ── Brief section ── */}
          {activeSection === 'brief' && (
            <div className="space-y-5">
              {!brief ? (
                <p className="text-sm text-slate-400 py-6 text-center">No brief yet — client hasn't submitted the intake form.</p>
              ) : (
                <>
                  {brief.overview && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Overview</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{brief.overview}</p>
                    </div>
                  )}

                  {brief.objectives?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Objectives</p>
                      <ul className="space-y-1.5">
                        {brief.objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-brand-500 shrink-0 mt-0.5 font-bold">•</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {brief.deliverables && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deliverables</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{brief.deliverables}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Intake Form section ── */}
          {activeSection === 'intake' && (
            <div className="space-y-4">
              {!intakeForm ? (
                <p className="text-sm text-slate-400 py-6 text-center">Client has not submitted the intake form yet.</p>
              ) : (
                <>
                  {intakeForm.businessName && (
                    <Field icon={Building2} label="Business Name" value={intakeForm.businessName} />
                  )}
                  {intakeForm.industry && (
                    <Field icon={Tag} label="Industry" value={intakeForm.industry} />
                  )}
                  {intakeForm.targetAudience && (
                    <Field icon={Target} label="Target Audience" value={intakeForm.targetAudience} />
                  )}
                  {intakeForm.projectGoal && (
                    <Field icon={FileText} label="Project Goal" value={intakeForm.projectGoal} multiline />
                  )}
                  {intakeForm.brandPersonality?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Palette size={11} /> Brand Personality
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {intakeForm.brandPersonality.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-xs font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {intakeForm.brandColors && (
                    <Field icon={Palette} label="Brand Colors" value={intakeForm.brandColors} />
                  )}
                  {intakeForm.competitors && (
                    <Field icon={Building2} label="Competitors / Inspiration" value={intakeForm.competitors} multiline />
                  )}
                  {intakeForm.additionalNotes && (
                    <Field icon={FileText} label="Additional Notes" value={intakeForm.additionalNotes} multiline />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Files section ── */}
          {activeSection === 'files' && (
            <div className="space-y-5">

              {/* Uploaded drafts */}
              {(project?.drafts?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Uploaded Drafts</p>
                  {project.drafts.map((draft) => (
                    <div key={draft.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <FileText size={15} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{draft.label}</p>
                        <p className="text-[10px] text-slate-400">
                          Uploaded {formatDate(draft.uploadedAt)} ·{' '}
                          {(draft.notes?.length ?? 0) + (draft.comments?.length ?? 0)} note{(draft.notes?.length ?? 0) + (draft.comments?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Client's profile folders */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Client Folders</p>
                <FolderPanel
                  folders={clientFolders}
                  onAddFile={addFileToFolder}
                  onRemoveFile={removeFileFromFolder}
                  emptyMessage="Client hasn't created any folders yet."
                />
              </div>

              {/* Designer's project folders */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">My Project Folders</p>
                <FolderPanel
                  folders={myProjectFolders}
                  onCreateFolder={handleCreateProjectFolder}
                  onDeleteFolder={deleteFolder}
                  onRenameFolder={renameFolder}
                  onToggleVisible={setFolderClientVisible}
                  onAddFile={addFileToFolder}
                  onRemoveFile={removeFileFromFolder}
                  emptyMessage="No project folders yet. Create one to get organized."
                />
                <p className="text-[10px] text-slate-400">
                  Toggle the eye icon to control whether the client can see each folder.
                </p>
              </div>
            </div>
          )}

          {/* ── Notes Hub section ── */}
          {activeSection === 'notes' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">All communication on this project — visible to you, the client, and Edit Me Lo.</p>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {projectNotes.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No notes yet. Start the conversation below.</p>
                ) : (
                  projectNotes.map((note) => (
                    <div key={note.id} className="flex gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-500">
                        {(note.authorName ?? '?').charAt(0)}
                      </div>
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-700">{note.authorName}</p>
                          <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', roleColor(note.authorRole))}>
                            {note.authorRole}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                            <Clock size={9} /> {formatDate(note.createdAt?.split('T')[0])}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{note.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Compose */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <input
                  ref={inputRef}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="Add a note visible to client and admin…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                />
                <button
                  onClick={handleSendNote}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shrink-0"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Small helper for intake form fields
function Field({ icon: Icon, label, value, multiline }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        <Icon size={10} /> {label}
      </p>
      <p className={cn('text-sm text-slate-700', multiline ? 'leading-relaxed' : '')}>{value}</p>
    </div>
  )
}

// ── Single project card ───────────────────────────────────────────────────────
function ProjectCard({ project }) {
  const updateStatus = useProjectStore((s) => s.updateProjectStatus)
  const brief        = useProjectStore((s) => s.projectBriefs[project.id])
  const [expanded, setExpanded] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const clientName = getClientName(project.clientId)
  const totalNotes = (project.drafts ?? []).reduce(
    (sum, d) => sum + (d.notes?.length ?? 0) + (d.comments?.length ?? 0), 0
  )

  const handleStatus = (status) => {
    updateStatus(project.id, status)
    setStatusOpen(false)
    toast.success(`Status updated to "${status}"`)
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header row */}
        <button
          className="w-full text-left"
          onClick={() => setExpanded((o) => !o)}
        >
          <CardHeader className="flex flex-row items-center justify-between hover:bg-slate-50/60 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="truncate">{project.name}</CardTitle>
                {totalNotes > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    <MessageSquare size={9} /> {totalNotes} note{totalNotes > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {/* Clickable client name */}
                <button
                  onClick={(e) => { e.stopPropagation(); setClientModalOpen(true) }}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:underline font-medium"
                >
                  <User size={11} /> {clientName}
                </button>
                <span className="text-slate-200">·</span>
                <span className="text-xs text-slate-400">Due {formatDate(project.dueDate)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <StatusBadge status={project.status} />
              {expanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </div>
          </CardHeader>
        </button>

        {expanded && (
          <CardBody className="space-y-4 pt-2">
            {/* Brief + tags */}
            {project.brief && (
              <p className="text-sm text-slate-600 leading-relaxed">{project.brief}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {project.tags?.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>

            {/* Structured client brief from onboarding */}
            {brief && (
              <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Client Brief</p>

                {brief.overview && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Overview</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{brief.overview}</p>
                  </div>
                )}

                {brief.objectives?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Key Objectives</p>
                    <ul className="space-y-1">
                      {brief.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-brand-500 shrink-0 mt-0.5">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {brief.deliverables && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Deliverables</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{brief.deliverables}</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} color="brand" />
            </div>

            {/* Status updater */}
            <div className="relative">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Update Status</p>
              <button
                onClick={() => setStatusOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left"
              >
                <span className="flex-1">{project.status}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {statusOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatus(s)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors',
                        project.status === s ? 'text-brand-500 font-semibold' : 'text-slate-700'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drafts with notes */}
            {(project.drafts?.length ?? 0) > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Uploaded Drafts & Client Notes</p>
                <div className="space-y-3">
                  {project.drafts.map((draft) => (
                    <div key={draft.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{draft.label}</p>
                          <p className="text-[10px] text-slate-400">Uploaded {formatDate(draft.uploadedAt)}</p>
                        </div>
                      </div>
                      <DraftNotes draft={draft} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(project.drafts?.length ?? 0) === 0 && (
              <p className="text-xs text-slate-400 italic">No drafts uploaded yet for this project.</p>
            )}
          </CardBody>
        )}
      </Card>

      {clientModalOpen && (
        <ClientProfileModal
          clientId={project.clientId}
          project={project}
          onClose={() => setClientModalOpen(false)}
        />
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DesignerProjects() {
  const user     = useAuthStore(selectUser)
  const projects = useProjectStore((s) => s.projects)
  const [query, setQuery] = useState('')

  const myProjects = projects.filter((p) => p.designerIds?.includes(user?.id))

  const filtered = myProjects.filter((p) => {
    const q = query.toLowerCase()
    if (!q) return true
    const clientName = getClientName(p.clientId).toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      clientName.includes(q) ||
      (p.brief ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <PortalLayout>
      <PageHeader
        title="My Projects"
        subtitle={`${myProjects.length} project${myProjects.length !== 1 ? 's' : ''} assigned to you`}
        className="mb-6"
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white"
          placeholder="Search by project name or client…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <p className="text-slate-400 text-sm">
              {query ? `No results for "${query}"` : 'No projects assigned to you yet.'}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </PortalLayout>
  )
}
