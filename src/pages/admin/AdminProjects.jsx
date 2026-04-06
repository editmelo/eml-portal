import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import useProjectStore from '../../store/projectStore'
import useAuthStore, { selectUser } from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { supabase } from '../../lib/supabase'
import { PROJECT_STATUS } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import RichBrief from '../../components/ui/RichBrief'
import {
  Plus, Search, ChevronDown, ChevronUp, X, Edit2,
  User, Calendar, DollarSign, Save, Users, Sparkles, Clock,
  CheckCircle2, XCircle, Eye, Globe, Wrench, MessageSquare,
  Lock, MessageCircle, Send, TrendingUp, Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = Object.values(PROJECT_STATUS)

// ── New Project Modal ─────────────────────────────────────────────────────────
function NewProjectModal({ onClose, isDark, clients, designers }) {
  const createProject  = useProjectStore((s) => s.createProject)
  const clientProfiles = useProjectStore((s) => s.clientProfiles)
  const [form, setForm] = useState({
    name:           '',
    clientId:       '',
    businessId:     '',
    designerIds:    [],
    status:         PROJECT_STATUS.NEW,
    startDate:      '',
    dueDate:        '',
    projectValue:   '',
    designerPayout: '',
    brief:          '',
    tags:           '',
  })

  const selectedClientBusinesses = form.clientId ? (clientProfiles[form.clientId]?.businesses ?? []) : []

  const set_ = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }))
    if (field === 'clientId') setForm((f) => ({ ...f, clientId: val, businessId: '' }))
  }
  const toggleDesigner = (id) => {
    setForm((f) => ({
      ...f,
      designerIds: f.designerIds.includes(id)
        ? f.designerIds.filter((d) => d !== id)
        : [...f.designerIds, id],
    }))
  }

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    createProject({
      name:           form.name.trim(),
      clientId:       form.clientId || null,
      businessId:     form.businessId || null,
      designerIds:    form.designerIds,
      status:         form.status,
      startDate:      form.startDate || null,
      dueDate:        form.dueDate || null,
      projectValue:   parseFloat(form.projectValue) || 0,
      designerPayout: parseFloat(form.designerPayout) || 0,
      brief:          form.brief.trim(),
      tags:           form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    toast.success(`Project "${form.name}" created!`)
    onClose()
  }

  const INPUT  = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-100 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40'
  const LABEL  = 'block text-xs font-medium text-slate-400 mb-1.5'
  const SELECT = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] mx-2 sm:mx-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>New Project</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL}>Project Name *</label>
              <input className={INPUT} placeholder="e.g. Acme Brand Refresh" value={form.name} onChange={(e) => set_('name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Client</label>
              <select className={SELECT} value={form.clientId} onChange={(e) => set_('clientId', e.target.value)}>
                <option value="">— No client yet —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name || c.email}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Business</label>
              <select className={SELECT} value={form.businessId} onChange={(e) => set_('businessId', e.target.value)} disabled={!selectedClientBusinesses.length}>
                <option value="">{selectedClientBusinesses.length ? '— Select business —' : '— No businesses —'}</option>
                {selectedClientBusinesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select className={SELECT} value={form.status} onChange={(e) => set_('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Start Date</label>
              <input className={INPUT} type="date" value={form.startDate} onChange={(e) => set_('startDate', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Due Date</label>
              <input className={INPUT} type="date" value={form.dueDate} onChange={(e) => set_('dueDate', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Project Value ($)</label>
              <input className={INPUT} type="number" placeholder="0.00" value={form.projectValue} onChange={(e) => set_('projectValue', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Designer Payout ($)</label>
              <input className={INPUT} type="number" placeholder="0.00" value={form.designerPayout} onChange={(e) => set_('designerPayout', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Assign Designer(s)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {designers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDesigner(d.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      form.designerIds.includes(d.id)
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-admin-border text-slate-400 hover:border-brand-400 hover:text-slate-200'
                    )}
                  >
                    <User size={10} /> {d.name || d.email}{d.role === 'ADMIN' ? ' (You)' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Project Brief</label>
              <textarea className={cn(INPUT, 'resize-y')} rows={8} placeholder={"Describe the project scope, deliverables, and key details…\n\nUse **double asterisks** to bold important info.\nLine breaks are preserved exactly as you type them."} value={form.brief} onChange={(e) => set_('brief', e.target.value)} />
              <p className="text-[10px] text-slate-600 mt-1">Tip: Use **bold** for emphasis. Line breaks are preserved.</p>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Tags (comma-separated)</label>
              <input className={INPUT} placeholder="Branding, Logo, Web Design" value={form.tags} onChange={(e) => set_('tags', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-admin-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
            <Plus size={14} /> Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, isDark, clients, designers }) {
  const updateProject  = useProjectStore((s) => s.updateProject)
  const clientProfiles = useProjectStore((s) => s.clientProfiles)
  const [form, setForm] = useState({
    name:           project.name,
    clientId:       project.clientId ?? '',
    businessId:     project.businessId ?? '',
    designerIds:    project.designerIds ?? [],
    status:         project.status,
    startDate:      project.startDate ?? '',
    dueDate:        project.dueDate ?? '',
    projectValue:   String(project.projectValue ?? ''),
    designerPayout: String(project.designerPayout ?? ''),
    brief:          project.brief ?? '',
    tags:           (project.tags ?? []).join(', '),
    progress:       String(project.progress ?? 0),
  })

  const selectedClientBusinesses = form.clientId ? (clientProfiles[form.clientId]?.businesses ?? []) : []

  const set_ = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }))
    if (field === 'clientId') setForm((f) => ({ ...f, clientId: val, businessId: '' }))
  }
  const toggleDesigner = (id) => {
    setForm((f) => ({
      ...f,
      designerIds: f.designerIds.includes(id)
        ? f.designerIds.filter((d) => d !== id)
        : [...f.designerIds, id],
    }))
  }

  const handleSave = () => {
    updateProject(project.id, {
      name:           form.name.trim(),
      clientId:       form.clientId || null,
      businessId:     form.businessId || null,
      designerIds:    form.designerIds,
      status:         form.status,
      startDate:      form.startDate || null,
      dueDate:        form.dueDate || null,
      projectValue:   parseFloat(form.projectValue) || 0,
      designerPayout: parseFloat(form.designerPayout) || 0,
      brief:          form.brief.trim(),
      tags:           form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      progress:       Math.min(100, Math.max(0, parseInt(form.progress) || 0)),
    })
    toast.success('Project updated')
    onClose()
  }

  const INPUT  = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-100 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40'
  const LABEL  = 'block text-xs font-medium text-slate-400 mb-1.5'
  const SELECT = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] mx-2 sm:mx-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit Project</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL}>Project Name</label>
              <input className={INPUT} value={form.name} onChange={(e) => set_('name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Client</label>
              <select className={SELECT} value={form.clientId} onChange={(e) => set_('clientId', e.target.value)}>
                <option value="">— No client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name || c.email}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Business</label>
              <select className={SELECT} value={form.businessId} onChange={(e) => set_('businessId', e.target.value)} disabled={!selectedClientBusinesses.length}>
                <option value="">{selectedClientBusinesses.length ? '— Select business —' : '— No businesses —'}</option>
                {selectedClientBusinesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select className={SELECT} value={form.status} onChange={(e) => set_('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Start Date</label>
              <input className={INPUT} type="date" value={form.startDate} onChange={(e) => set_('startDate', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Due Date</label>
              <input className={INPUT} type="date" value={form.dueDate} onChange={(e) => set_('dueDate', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Project Value ($)</label>
              <input className={INPUT} type="number" value={form.projectValue} onChange={(e) => set_('projectValue', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Designer Payout ($)</label>
              <input className={INPUT} type="number" value={form.designerPayout} onChange={(e) => set_('designerPayout', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Progress (%)</label>
              <input className={INPUT} type="number" min="0" max="100" value={form.progress} onChange={(e) => set_('progress', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Assign Designer(s)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {designers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDesigner(d.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      form.designerIds.includes(d.id)
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-admin-border text-slate-400 hover:border-brand-400 hover:text-slate-200'
                    )}
                  >
                    <User size={10} /> {d.name || d.email}{d.role === 'ADMIN' ? ' (You)' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Project Brief</label>
              <textarea className={cn(INPUT, 'resize-y')} rows={8} value={form.brief} onChange={(e) => set_('brief', e.target.value)} />
              <p className="text-[10px] text-slate-600 mt-1">Tip: Use **bold** for emphasis. Line breaks are preserved.</p>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Tags (comma-separated)</label>
              <input className={INPUT} value={form.tags} onChange={(e) => set_('tags', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-admin-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Internal Notes Panel (admin + designer only, dark theme) ────────────────
function AdminInternalNotes({ projectId }) {
  const user            = useAuthStore(selectUser)
  const internalNotes   = useProjectStore((s) => s.internalNotes[projectId]) ?? []
  const addInternalNote = useProjectStore((s) => s.addInternalNote)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef        = useRef(null)

  const handleSend = () => {
    if (!text.trim()) return
    addInternalNote(projectId, {
      id:         `inote_${Date.now()}`,
      authorId:   user?.id,
      authorRole: user?.role,
      authorName: user?.name,
      text:       text.trim(),
      createdAt:  new Date().toISOString(),
    })
    toast.success('Internal note added')
    setText('')
    inputRef.current?.focus()
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <Lock size={13} className="text-amber-400" />
        <span className="text-xs font-semibold text-amber-300 flex-1">Internal Notes</span>
        <span className="text-[10px] text-amber-500 mr-1 hidden sm:inline">Admin & Designer only</span>
        {internalNotes.length > 0 && (
          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">
            {internalNotes.length}
          </span>
        )}
        {open ? <ChevronUp size={12} className="text-amber-500" /> : <ChevronDown size={12} className="text-amber-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {internalNotes.length === 0 ? (
              <p className="text-xs text-amber-500/60 text-center py-3">No internal notes yet. The client cannot see these.</p>
            ) : (
              internalNotes.map((note) => {
                const isMe = note.authorId === user?.id
                return (
                  <div key={note.id} className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-amber-300">
                      {(note.authorName ?? '?').charAt(0)}
                    </div>
                    <div className="flex-1 bg-white/5 border border-admin-border rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[11px] font-semibold text-slate-200">{isMe ? 'You' : note.authorName}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {note.authorRole}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
                          <Clock size={9} /> {formatDate(note.createdAt?.split('T')[0])}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{note.text}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded-lg border border-admin-border bg-admin-bg text-sm text-slate-100 px-3 py-2 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              placeholder="Leave an internal note…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Client Notes Panel (visible to client, dark theme) ──────────────────────
function AdminClientNotes({ projectId }) {
  const user           = useAuthStore(selectUser)
  const projectNotes   = useProjectStore((s) => s.projectNotes[projectId]) ?? []
  const addProjectNote = useProjectStore((s) => s.addProjectNote)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
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
    toast.success('Note sent — client can see this')
    setText('')
    inputRef.current?.focus()
  }

  const roleColor = (role) => {
    if (role === 'admin' || role === 'ADMIN') return 'bg-red-500/20 text-red-300'
    if (role === 'designer' || role === 'DESIGNER') return 'bg-brand-500/20 text-brand-300'
    return 'bg-slate-500/20 text-slate-300'
  }

  return (
    <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-brand-500/10 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <MessageCircle size={13} className="text-brand-400" />
        <span className="text-xs font-semibold text-brand-300 flex-1">Client Notes</span>
        <span className="text-[10px] text-brand-500 mr-1 hidden sm:inline">Visible to client</span>
        {projectNotes.length > 0 && (
          <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded-full">
            {projectNotes.length}
          </span>
        )}
        {open ? <ChevronUp size={12} className="text-brand-400" /> : <ChevronDown size={12} className="text-brand-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {projectNotes.length === 0 ? (
              <p className="text-xs text-brand-500/50 text-center py-3">No notes yet. Messages here are visible to the client.</p>
            ) : (
              projectNotes.map((note) => {
                const isMe = note.authorId === user?.id
                return (
                  <div key={note.id} className={cn('flex gap-2', isMe ? 'flex-row-reverse' : '')}>
                    <div className="h-6 w-6 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand-300">
                      {(note.authorName ?? '?').charAt(0)}
                    </div>
                    <div className={cn(
                      'flex-1 rounded-lg px-2.5 py-2 max-w-[85%]',
                      isMe ? 'bg-brand-500 text-white ml-auto' : 'bg-white/5 border border-admin-border'
                    )}>
                      <div className={cn('flex items-center gap-2 mb-0.5', isMe ? 'flex-row-reverse' : '')}>
                        <p className={cn('text-[11px] font-semibold', isMe ? 'text-white/90' : 'text-slate-200')}>
                          {isMe ? 'You' : note.authorName}
                        </p>
                        {!isMe && (
                          <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', roleColor(note.authorRole))}>
                            {note.authorRole}
                          </span>
                        )}
                        <span className={cn('text-[10px] flex items-center gap-1', isMe ? 'text-white/60 mr-auto' : 'text-slate-500 ml-auto')}>
                          <Clock size={9} /> {formatDate(note.createdAt?.split('T')[0])}
                        </span>
                      </div>
                      <p className={cn('text-xs leading-relaxed', isMe ? 'text-white' : 'text-slate-300')}>{note.text}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded-lg border border-admin-border bg-admin-bg text-sm text-slate-100 px-3 py-2 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              placeholder="Send a note to the client…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Project Row ───────────────────────────────────────────────────────────────
const ALL_STATUS_OPTIONS = Object.values(PROJECT_STATUS)

function ProjectRow({ project, isDark, profiles, clients, designers }) {
  const [expanded,  setExpanded]  = useState(false)
  const [editOpen,  setEditOpen]  = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const updateProjectStatus = useProjectStore((s) => s.updateProjectStatus)
  const intakeForm      = useProjectStore((s) => s.intakeForms[project.id])
  const brief           = useProjectStore((s) => s.projectBriefs[project.id])
  const clientProfiles  = useProjectStore((s) => s.clientProfiles)

  const clientName    = profiles.find((u) => u.id === project.clientId)?.name || '—'
  const designerNames = (project.designerIds ?? []).map((id) => profiles.find((u) => u.id === id)?.name || 'Unknown').join(', ') || 'Unassigned'
  const clientProfile = clientProfiles[project.clientId]
  const businessName  = project.businessId
    ? (clientProfile?.businesses ?? []).find((b) => b.id === project.businessId)?.name
    : null
  const companyProfit = (project.projectValue ?? 0) - (project.designerPayout ?? 0)

  return (
    <>
      <DarkCard className="overflow-hidden">
        <button className="w-full text-left" onClick={() => setExpanded((o) => !o)}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                <h3 className="text-slate-100 font-semibold text-sm sm:text-base">{project.name}</h3>
                <StatusBadge status={project.status} />
                {project.leadId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">
                    From Lead
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><User size={11} /> {clientName}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {designerNames}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> Due {formatDate(project.dueDate)}</span>
              </div>
              <div className="mt-3 max-w-xs">
                <ProgressBar value={project.progress} color="brand" className="bg-admin-bg" />
                <p className="text-xs text-slate-600 mt-1">{project.progress}% complete</p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
              <div className="sm:text-right">
                <p className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(project.projectValue)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Payout: {formatCurrency(project.designerPayout)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-admin-border text-xs text-slate-400 hover:text-brand-400 hover:border-brand-400/50 transition-colors"
                >
                  <Edit2 size={11} /> Edit
                </button>
                {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-admin-border px-4 sm:px-5 py-4 space-y-4">

            {/* ── Project Details Strip ── */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
              <div className="rounded-xl bg-white/5 border border-admin-border p-2 sm:p-3 text-center">
                <DollarSign size={13} className="text-slate-400 mx-auto mb-0.5 sm:mb-1" />
                <p className="text-xs sm:text-sm font-bold text-slate-100">{formatCurrency(project.projectValue)}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Project Value</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-admin-border p-2 sm:p-3 text-center">
                <Users size={13} className="text-slate-400 mx-auto mb-0.5 sm:mb-1" />
                <p className="text-xs sm:text-sm font-bold text-slate-100">{formatCurrency(project.designerPayout)}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Payout</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 sm:p-3 text-center">
                <TrendingUp size={13} className="text-emerald-400 mx-auto mb-0.5 sm:mb-1" />
                <p className="text-xs sm:text-sm font-bold text-emerald-300">{formatCurrency(companyProfit)}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-500 mt-0.5">Profit</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-admin-border p-2 sm:p-3 text-center">
                <Calendar size={13} className="text-blue-400 mx-auto mb-0.5 sm:mb-1" />
                <p className="text-xs sm:text-sm font-semibold text-slate-100">{formatDate(project.startDate) || '—'}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Start</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-admin-border p-2 sm:p-3 text-center">
                <Calendar size={13} className="text-amber-400 mx-auto mb-0.5 sm:mb-1" />
                <p className="text-xs sm:text-sm font-semibold text-slate-100">{formatDate(project.dueDate) || '—'}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Due</p>
              </div>
            </div>

            {/* Client & Business */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><User size={11} /> {clientName}</span>
              {businessName && <span className="flex items-center gap-1"><Building2 size={11} /> {businessName}</span>}
              <span className="flex items-center gap-1"><Users size={11} /> Designer: {designerNames}</span>
            </div>

            {/* Status updater */}
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Update Status</p>
              <button
                onClick={() => setStatusOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-sm text-slate-200 hover:border-brand-400/50 transition-colors w-full sm:w-64 text-left"
              >
                <span className="flex-1">{project.status}</span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>
              {statusOpen && (
                <div className="absolute top-full left-0 mt-1 w-full sm:w-64 bg-admin-surface rounded-xl border border-admin-border shadow-lg z-10 max-h-64 overflow-y-auto">
                  {ALL_STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        updateProjectStatus(project.id, s)
                        setStatusOpen(false)
                        toast.success(`Status updated to "${s}"`)
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors',
                        project.status === s ? 'text-brand-400 font-semibold' : 'text-slate-300'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Brief */}
            {project.brief && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Project Brief</p>
                <RichBrief text={project.brief} className="text-sm text-slate-300" />
              </div>
            )}

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-admin-border text-xs text-slate-400">{t}</span>
                ))}
              </div>
            )}

            {/* Structured project brief from onboarding */}
            {brief && (
              <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Client Brief</p>

                {brief.overview && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Project Overview</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{brief.overview}</p>
                  </div>
                )}

                {brief.objectives?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Key Objectives</p>
                    <ul className="space-y-1">
                      {brief.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-brand-400 shrink-0 mt-0.5">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {brief.deliverables && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Deliverables</p>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{brief.deliverables}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Notes Panels ── */}
            <div className="space-y-3">
              <AdminInternalNotes projectId={project.id} />
              <AdminClientNotes projectId={project.id} />
            </div>

            {/* Drafts count */}
            <p className="text-xs text-slate-600">
              {(project.drafts?.length ?? 0)} draft{project.drafts?.length !== 1 ? 's' : ''} uploaded
              {intakeForm ? ' · Intake form on file' : ''}
            </p>
          </div>
        )}
      </DarkCard>

      {editOpen && <EditProjectModal project={project} onClose={() => setEditOpen(false)} isDark={isDark} clients={clients} designers={designers} />}
    </>
  )
}


// ── Project Requests Section ─────────────────────────────────────────────────
function ProjectRequests({ isDark }) {
  const projectRequests          = useProjectStore((s) => s.projectRequests)
  const updateProjectRequestStatus = useProjectStore((s) => s.updateProjectRequestStatus)
  const [expanded, setExpanded]  = useState(null)

  if (projectRequests.length === 0) return null

  const pending  = projectRequests.filter((r) => r.status === 'Pending')
  const others   = projectRequests.filter((r) => r.status !== 'Pending')

  const statusActions = [
    { label: 'Reviewed', icon: <Eye size={12} />,          color: 'text-blue-400 hover:bg-blue-500/10' },
    { label: 'Approved', icon: <CheckCircle2 size={12} />, color: 'text-emerald-400 hover:bg-emerald-500/10' },
    { label: 'Declined', icon: <XCircle size={12} />,      color: 'text-red-400 hover:bg-red-500/10' },
  ]

  const renderRequest = (r) => (
    <DarkCard key={r.id} className="overflow-hidden">
      <button className="w-full text-left" onClick={() => setExpanded((v) => v === r.id ? null : r.id)}>
        <div className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-100">{r.serviceType}</h4>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                r.status === 'Pending'  && 'bg-amber-500/10 text-amber-400',
                r.status === 'Reviewed' && 'bg-blue-500/10 text-blue-400',
                r.status === 'Approved' && 'bg-emerald-500/10 text-emerald-400',
                r.status === 'Declined' && 'bg-red-500/10 text-red-400',
              )}>
                {r.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><User size={11} /> {r.clientName}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {r.timeline}</span>
              <span className="flex items-center gap-1"><DollarSign size={11} /> {r.budget}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</p>
            {expanded === r.id ? <ChevronUp size={14} className="text-slate-500 mt-1 ml-auto" /> : <ChevronDown size={14} className="text-slate-500 mt-1 ml-auto" />}
          </div>
        </div>
      </button>

      {expanded === r.id && (
        <div className="border-t border-admin-border px-4 py-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed">{r.description}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Goal</p>
            <p className="text-sm text-slate-300 leading-relaxed">{r.goal}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span>Timeline: <strong className="text-slate-200">{r.timeline}</strong></span>
            <span>Budget: <strong className="text-slate-200">{r.budget}</strong></span>
            {r.clientEmail && <span>Email: <strong className="text-slate-200">{r.clientEmail}</strong></span>}
          </div>
          {r.status === 'Pending' && (
            <div className="flex gap-2 pt-2">
              {statusActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { updateProjectRequestStatus(r.id, a.label); toast.success(`Request marked as ${a.label}`) }}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-admin-border transition-colors', a.color)}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </DarkCard>
  )

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-brand-400" />
        <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Client Project Requests
        </h2>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
            {pending.length} new
          </span>
        )}
      </div>
      <div className="space-y-2">
        {pending.map(renderRequest)}
        {others.map(renderRequest)}
      </div>
    </div>
  )
}

// ── Website Update Requests Section ──────────────────────────────────────────
function UpdateRequests({ isDark }) {
  const updateRequests             = useProjectStore((s) => s.updateRequests)
  const updateUpdateRequestStatus  = useProjectStore((s) => s.updateUpdateRequestStatus)
  const addUpdateRequestNote       = useProjectStore((s) => s.addUpdateRequestNote)
  const [expanded, setExpanded]    = useState(null)
  const [noteText, setNoteText]    = useState('')

  if (updateRequests.length === 0) return null

  const newReqs    = updateRequests.filter((r) => r.status === 'New')
  const inProgress = updateRequests.filter((r) => r.status === 'In Progress')
  const rest       = updateRequests.filter((r) => r.status !== 'New' && r.status !== 'In Progress')

  const statusActions = [
    { label: 'In Progress', icon: <Wrench size={12} />,       color: 'text-blue-400 hover:bg-blue-500/10' },
    { label: 'Complete',    icon: <CheckCircle2 size={12} />,  color: 'text-emerald-400 hover:bg-emerald-500/10' },
    { label: 'On Hold',     icon: <Clock size={12} />,         color: 'text-amber-400 hover:bg-amber-500/10' },
  ]

  const priorityStyle = {
    low:    'bg-slate-500/10 text-slate-400',
    normal: 'bg-blue-500/10 text-blue-400',
    high:   'bg-amber-500/10 text-amber-400',
    urgent: 'bg-red-500/10 text-red-400',
  }

  const handleNote = (reqId) => {
    if (!noteText.trim()) return
    addUpdateRequestNote(reqId, noteText.trim())
    setNoteText('')
    toast.success('Note added — client can see it')
  }

  const renderRequest = (r) => (
    <DarkCard key={r.id} className="overflow-hidden">
      <button className="w-full text-left" onClick={() => { setExpanded((v) => v === r.id ? null : r.id); setNoteText(r.adminNote ?? '') }}>
        <div className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-100">
                {r.updateType === 'text' ? 'Text / Copy Change' :
                 r.updateType === 'image' ? 'Image / Photo Swap' :
                 r.updateType === 'new-page' ? 'New Page' :
                 r.updateType === 'layout' ? 'Layout Change' :
                 r.updateType === 'bug' ? 'Bug Fix' :
                 r.updateType === 'feature' ? 'New Feature' :
                 r.updateType === 'content' ? 'Content Update' : 'Other'}
              </h4>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                r.status === 'New'         && 'bg-brand-500/10 text-brand-400',
                r.status === 'In Progress' && 'bg-blue-500/10 text-blue-400',
                r.status === 'Complete'    && 'bg-emerald-500/10 text-emerald-400',
                r.status === 'On Hold'     && 'bg-amber-500/10 text-amber-400',
              )}>
                {r.status}
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', priorityStyle[r.priority] ?? priorityStyle.normal)}>
                {r.priority}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><User size={11} /> {r.clientName}</span>
              {r.pageUrl && <span className="flex items-center gap-1"><Globe size={11} /> {r.pageUrl}</span>}
              <span className="flex items-center gap-1"><Clock size={11} /> {new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="shrink-0">
            {expanded === r.id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </div>
        </div>
      </button>

      {expanded === r.id && (
        <div className="border-t border-admin-border px-4 py-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed">{r.description}</p>
          </div>
          {r.pageUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Page / URL</p>
              <p className="text-sm text-slate-300">{r.pageUrl}</p>
            </div>
          )}
          {r.clientEmail && (
            <p className="text-xs text-slate-500">Contact: <span className="text-slate-300">{r.clientEmail}</span></p>
          )}

          {/* Status actions */}
          <div className="flex gap-2 pt-1">
            {statusActions
              .filter((a) => a.label !== r.status)
              .map((a) => (
                <button
                  key={a.label}
                  onClick={() => { updateUpdateRequestStatus(r.id, a.label); toast.success(`Marked as ${a.label}`) }}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-admin-border transition-colors', a.color)}
                >
                  {a.icon} {a.label}
                </button>
              ))}
          </div>

          {/* Admin note / response to client */}
          <div className="pt-2 border-t border-admin-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1">
              <MessageSquare size={10} /> Note to Client
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-admin-border bg-admin-bg text-slate-100 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                placeholder="Leave a note the client can see..."
                value={expanded === r.id ? noteText : ''}
                onChange={(e) => setNoteText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.key === 'Enter' && handleNote(r.id)}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleNote(r.id) }}
                className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Save
              </button>
            </div>
            {r.adminNote && (
              <p className="text-xs text-slate-400 mt-1.5 italic">Current: "{r.adminNote}"</p>
            )}
          </div>
        </div>
      )}
    </DarkCard>
  )

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={16} className="text-brand-400" />
        <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Website Update Requests
        </h2>
        {newReqs.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold">
            {newReqs.length} new
          </span>
        )}
        {inProgress.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
            {inProgress.length} in progress
          </span>
        )}
      </div>
      <div className="space-y-2">
        {newReqs.map(renderRequest)}
        {inProgress.map(renderRequest)}
        {rest.map(renderRequest)}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProjects() {
  const projects    = useProjectStore((s) => s.projects)
  const isDark      = useThemeStore((s) => s.adminTheme) === 'dark'
  const [query,     setQuery]     = useState('')
  const [status,    setStatus]    = useState('All')
  const [newOpen,   setNewOpen]   = useState(false)
  const [profiles,  setProfiles]  = useState([])

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setProfiles(data)
    })
  }, [])

  const clients   = profiles.filter((p) => p.role === 'CLIENT')
  const designers = profiles.filter((p) => p.role === 'DESIGNER' || p.role === 'ADMIN')

  const getProfileName = (id) => profiles.find((u) => u.id === id)?.name || '—'

  const activeCount = projects.filter((p) => p.status === 'In Progress').length

  const filtered = projects.filter((p) => {
    const matchStatus = status === 'All' || p.status === status
    const q = query.toLowerCase()
    const matchQuery = !q
      || p.name.toLowerCase().includes(q)
      || getProfileName(p.clientId).toLowerCase().includes(q)
      || (p.designerIds ?? []).some((id) => getProfileName(id).toLowerCase().includes(q))
    return matchStatus && matchQuery
  })

  const SELECT_CLASS = 'rounded-lg border border-admin-border bg-admin-surface text-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400/30'

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="Projects"
        subtitle={`${projects.length} total · ${activeCount} in progress`}
        actions={
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>
            New Project
          </Button>
        }
        className="mb-6"
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-admin-border bg-admin-surface text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            placeholder="Search projects, clients, designers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className={SELECT_CLASS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Client project requests */}
      <ProjectRequests isDark={isDark} />

      {/* Website update requests */}
      <UpdateRequests isDark={isDark} />

      <div className="space-y-3">
        {filtered.map((p) => <ProjectRow key={p.id} project={p} isDark={isDark} profiles={profiles} clients={clients} designers={designers} />)}
        {filtered.length === 0 && (
          <DarkCard className="p-8 text-center">
            <p className="text-slate-500 text-sm">No projects match your filters.</p>
          </DarkCard>
        )}
      </div>

      {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} isDark={isDark} clients={clients} designers={designers} />}
    </AdminLayout>
  )
}
