import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { MOCK_USERS } from '../../lib/mockData'
import { PROJECT_STATUS, ROLES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import {
  Plus, Search, ChevronDown, ChevronUp, X, Edit2,
  User, Calendar, DollarSign, Save, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = Object.values(PROJECT_STATUS)

const CLIENTS   = MOCK_USERS.filter((u) => u.role === ROLES.CLIENT)
const DESIGNERS = MOCK_USERS.filter((u) => u.role === ROLES.DESIGNER || u.role === ROLES.ADMIN)

function getClientName(clientId)    { return MOCK_USERS.find((u) => u.id === clientId)?.name ?? '—' }
function getDesignerName(designerId){ return MOCK_USERS.find((u) => u.id === designerId)?.name ?? 'Unknown' }

// ── New Project Modal ─────────────────────────────────────────────────────────
function NewProjectModal({ onClose, isDark }) {
  const createProject = useProjectStore((s) => s.createProject)
  const [form, setForm] = useState({
    name:           '',
    clientId:       '',
    designerIds:    [],
    status:         PROJECT_STATUS.ACTIVE,
    startDate:      '',
    dueDate:        '',
    projectValue:   '',
    designerPayout: '',
    brief:          '',
    tags:           '',
  })

  const set_ = (field, val) => setForm((f) => ({ ...f, [field]: val }))
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
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
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
                {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                {DESIGNERS.map((d) => (
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
                    <User size={10} /> {d.name}{d.role === ROLES.ADMIN ? ' (You)' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Project Brief</label>
              <textarea className={cn(INPUT, 'resize-none')} rows={3} placeholder="Short description of the project scope…" value={form.brief} onChange={(e) => set_('brief', e.target.value)} />
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
function EditProjectModal({ project, onClose, isDark }) {
  const updateProject = useProjectStore((s) => s.updateProject)
  const [form, setForm] = useState({
    name:           project.name,
    clientId:       project.clientId ?? '',
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

  const set_ = (field, val) => setForm((f) => ({ ...f, [field]: val }))
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
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
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
                {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                {DESIGNERS.map((d) => (
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
                    <User size={10} /> {d.name}{d.role === ROLES.ADMIN ? ' (You)' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Project Brief</label>
              <textarea className={cn(INPUT, 'resize-none')} rows={3} value={form.brief} onChange={(e) => set_('brief', e.target.value)} />
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

// ── Project Row ───────────────────────────────────────────────────────────────
function ProjectRow({ project, isDark }) {
  const [expanded,  setExpanded]  = useState(false)
  const [editOpen,  setEditOpen]  = useState(false)
  const intakeForm = useProjectStore((s) => s.intakeForms[project.id])
  const brief      = useProjectStore((s) => s.projectBriefs[project.id])

  const clientName    = getClientName(project.clientId)
  const designerNames = (project.designerIds ?? []).map(getDesignerName).join(', ') || 'Unassigned'

  return (
    <>
      <DarkCard className="overflow-hidden">
        <button className="w-full text-left" onClick={() => setExpanded((o) => !o)}>
          <div className="flex items-start gap-4 p-5 hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-slate-100 font-semibold">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><User size={11} /> {clientName}</span>
                <span className="flex items-center gap-1"><Users size={11} /> Designer: {designerNames}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> Due {formatDate(project.dueDate)}</span>
              </div>
              <div className="mt-3 max-w-xs">
                <ProgressBar value={project.progress} color="brand" className="bg-admin-bg" />
                <p className="text-xs text-slate-600 mt-1">{project.progress}% complete</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(project.projectValue)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Payout: {formatCurrency(project.designerPayout)}</p>
              <div className="flex items-center gap-2 mt-2 justify-end">
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
          <div className="border-t border-admin-border px-5 py-4 space-y-4">
            {/* Brief */}
            {project.brief && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Project Brief</p>
                <p className="text-sm text-slate-300 leading-relaxed">{project.brief}</p>
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

            {/* Drafts count */}
            <p className="text-xs text-slate-600">
              {(project.drafts?.length ?? 0)} draft{project.drafts?.length !== 1 ? 's' : ''} uploaded
              {intakeForm ? ' · Intake form on file' : ''}
            </p>
          </div>
        )}
      </DarkCard>

      {editOpen && <EditProjectModal project={project} onClose={() => setEditOpen(false)} isDark={isDark} />}
    </>
  )
}


// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProjects() {
  const projects    = useProjectStore((s) => s.projects)
  const isDark      = useThemeStore((s) => s.adminTheme) === 'dark'
  const [query,     setQuery]     = useState('')
  const [status,    setStatus]    = useState('All')
  const [newOpen,   setNewOpen]   = useState(false)

  const filtered = projects.filter((p) => {
    const matchStatus = status === 'All' || p.status === status
    const q = query.toLowerCase()
    const matchQuery = !q
      || p.name.toLowerCase().includes(q)
      || getClientName(p.clientId).toLowerCase().includes(q)
      || (p.designerIds ?? []).some((id) => getDesignerName(id).toLowerCase().includes(q))
    return matchStatus && matchQuery
  })

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="Projects"
        subtitle={`${projects.length} total · ${projects.filter((p) => p.status === 'Active').length} active`}
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
        <div className="flex gap-1 p-1 bg-admin-surface border border-admin-border rounded-lg">
          {['All', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                status === s ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => <ProjectRow key={p.id} project={p} isDark={isDark} />)}
        {filtered.length === 0 && (
          <DarkCard className="p-8 text-center">
            <p className="text-slate-500 text-sm">No projects match your filters.</p>
          </DarkCard>
        )}
      </div>

      {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} isDark={isDark} />}
    </AdminLayout>
  )
}
