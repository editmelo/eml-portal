import { useState, useRef } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatDate } from '../../lib/utils'
import {
  FileText, Image as ImageIcon, File, Eye, StickyNote,
  X, Send, ChevronDown, ChevronUp, Download, Globe, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Draft type badge config ───────────────────────────────────────────────────
const DRAFT_BADGES = {
  website:            { label: 'Website',          cls: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  brand_identity:     { label: 'Brand Identity',   cls: 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  social_management:  { label: 'Social',           cls: 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' },
  creative_on_demand: { label: 'Creative',         cls: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
}

// ── File type helpers ──────────────────────────────────────────────────────────
function fileIcon(url = '') {
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return <ImageIcon size={18} className="text-violet-500" />
  if (/\.pdf$/i.test(url)) return <FileText size={18} className="text-red-500" />
  return <File size={18} className="text-slate-400" />
}

function isImage(url = '') {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ draft, onClose }) {
  if (!draft) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">{draft.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">Uploaded {formatDate(draft.uploadedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={draft.url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={13} /> Download
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isImage(draft.url) ? (
            <img src={draft.url} alt={draft.label} className="w-full rounded-lg object-contain max-h-[70vh]" />
          ) : (
            <iframe
              src={draft.url}
              title={draft.label}
              className="w-full h-[65vh] rounded-lg border border-slate-100"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Note panel for a single draft ─────────────────────────────────────────────
function NotesPanel({ draft, projectId, user }) {
  const addNote = useProjectStore((s) => s.addDraftNote)
  const [open, setOpen]   = useState(false)
  const [text, setText]   = useState('')
  const inputRef          = useRef(null)

  const notes = draft.notes ?? []

  const handleSubmit = () => {
    if (!text.trim()) return
    addNote(projectId, draft.id, {
      id:        `note_${Date.now()}`,
      authorId:  user.id,
      authorName: user.name,
      text:      text.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    })
    toast.success('Note added!')
    setText('')
  }

  return (
    <div className="border-t border-slate-100">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        onClick={() => { setOpen((o) => !o); if (!open) setTimeout(() => inputRef.current?.focus(), 100) }}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <StickyNote size={14} className="text-amber-500" />
          Notes {notes.length > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notes.length}</span>}
        </span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Existing notes */}
          {notes.length === 0 && (
            <p className="text-xs text-slate-400 italic">No notes yet. Be the first to add one.</p>
          )}
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-brand-500">{note.authorName?.charAt(0) ?? '?'}</span>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-slate-700">{note.authorName}</p>
                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{note.text}</p>
                <p className="text-[10px] text-slate-400 mt-1">{formatDate(note.createdAt)}</p>
              </div>
            </div>
          ))}

          {/* New note input */}
          <div className="flex gap-2 items-end pt-1">
            <textarea
              ref={inputRef}
              rows={2}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none bg-white"
              placeholder="Add a note on this file…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            />
            <button
              onClick={handleSubmit}
              className="p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ClientDrafts() {
  const user     = useAuthStore(selectUser)
  const projects = useProjectStore((s) => s.projects)

  const project = projects.find((p) => p.id === user?.projectId)
  const drafts  = project?.drafts ?? []

  const [preview, setPreview] = useState(null)

  return (
    <PortalLayout>
      <PageHeader
        title="Drafts & Review"
        subtitle="View your project files and leave notes directly on each document."
        className="mb-8"
      />

      {preview && <PreviewModal draft={preview} onClose={() => setPreview(null)} />}

      {drafts.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <File size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No files uploaded yet.</p>
            <p className="text-slate-400 text-xs mt-1">Your designer will upload drafts here when they're ready.</p>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {drafts.map((draft) => {
          const isWebsite = draft.draftType === 'website'
          return (
            <Card key={draft.id} className="overflow-hidden">
              {/* File row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0">
                  {isWebsite ? <Globe size={18} className="text-blue-500" /> : fileIcon(draft.url)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{draft.label}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      (DRAFT_BADGES[draft.draftType] ?? DRAFT_BADGES.brand_identity).cls
                    }`}>
                      {(DRAFT_BADGES[draft.draftType] ?? DRAFT_BADGES.brand_identity).label}
                    </span>
                    {draft.contentCategory && (
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {draft.contentCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isWebsite ? 'Shared' : 'Uploaded'} {formatDate(draft.uploadedAt)}
                    {draft.pillar && <span> &middot; {draft.pillar}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isWebsite ? (
                    <a
                      href={draft.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink size={14} /> View Site
                    </a>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye size={14} />}
                      onClick={() => setPreview(draft)}
                    >
                      Open
                    </Button>
                  )}
                </div>
              </div>

              {/* Website link display */}
              {isWebsite && (
                <div className="mx-5 mb-4 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-4">
                  <a
                    href={draft.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {draft.url}
                  </a>
                </div>
              )}

              {/* Preview thumbnail for images */}
              {!isWebsite && isImage(draft.url) && (
                <div
                  className="mx-5 mb-4 rounded-xl overflow-hidden border border-slate-100 cursor-pointer group relative"
                  onClick={() => setPreview(draft)}
                >
                  <img
                    src={draft.url}
                    alt={draft.label}
                    className="w-full max-h-72 object-cover group-hover:opacity-90 transition-opacity"
                    draggable={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                    <span className="bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow">
                      Click to open full view
                    </span>
                  </div>
                </div>
              )}

              {/* Notes panel */}
              <NotesPanel draft={draft} projectId={project.id} user={user} />
            </Card>
          )
        })}
      </div>
    </PortalLayout>
  )
}
