import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { UserPlus, Pencil, Trash2, X, ChevronDown, Rocket, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const LEAD_STATUSES = [
  'New',
  'Not Started',
  'Consultation',
  'Project Proposal',
  'Service Agreement',
  'Invoice - Deposit',
  'Deposit Paid',
  'Kick-Off Call',
  'Draft 1',
  'Draft 2',
  'Final Revisions',
  'Invoice - Remainder',
  'Launch',
  'In Progress',
  'Done',
  'Archived',
  'Dead',
]

const LEAD_SOURCES = [
  'Sub-Contracted',
  'Family/Friend',
  'TA Hub',
  'Word of Mouth',
  'Website',
  'Bid',
  'Networking',
  'Social Media',
  'Barter',
  'Referral',
]

const EMPTY_FORM = { name: '', company: '', email: '', service: '', potentialValue: '', source: 'Website', status: 'New' }

function LeadModal({ onClose, onSave, lead }) {
  const isEdit = !!lead
  const [form, setForm] = useState(
    isEdit
      ? { name: lead.name, company: lead.company || '', email: lead.email || '', service: lead.service || '', potentialValue: lead.potentialValue || '', source: lead.source || 'Website', status: lead.status || 'New' }
      : EMPTY_FORM
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const data = { ...form, potentialValue: parseFloat(form.potentialValue) || 0 }
    if (!isEdit) data.submittedAt = new Date().toISOString()
    onSave(data)
    toast.success(isEdit ? 'Lead updated' : 'Lead added')
    onClose()
  }

  const INPUT = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-200 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40'
  const LABEL = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <p className="text-sm font-semibold text-white">{isEdit ? 'Edit Lead' : 'Add Lead'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Name <span className="text-red-400">*</span></label>
              <input className={INPUT} placeholder="Jordan Rivera" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Company</label>
              <input className={INPUT} placeholder="Acme Co" value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Email</label>
              <input className={INPUT} type="email" placeholder="jordan@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Service</label>
              <input className={INPUT} placeholder="Brand Identity" value={form.service} onChange={(e) => set('service', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Potential Value ($)</label>
              <input className={INPUT} type="number" placeholder="2500" value={form.potentialValue} onChange={(e) => set('potentialValue', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Source</label>
              <select className={INPUT} value={form.source} onChange={(e) => set('source', e.target.value)}>
                {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select className={INPUT} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-admin-border text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">{isEdit ? 'Save Changes' : 'Add Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_BADGE = {
  'New':                 'brand',
  'Not Started':         'default',
  'Consultation':        'info',
  'Project Proposal':    'brand',
  'Service Agreement':   'purple',
  'Invoice - Deposit':   'warning',
  'Deposit Paid':        'success',
  'Kick-Off Call':       'brand',
  'Draft 1':             'info',
  'Draft 2':             'info',
  'Final Revisions':     'warning',
  'Invoice - Remainder': 'warning',
  'Launch':              'success',
  'In Progress':         'brand',
  'Done':                'success',
  'Archived':            'dark',
  'Dead':                'danger',
}

export default function AdminLeads() {
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const leads         = useProjectStore((s) => s.leads)
  const projects      = useProjectStore((s) => s.projects)
  const addLead       = useProjectStore((s) => s.addLead)
  const updateLead    = useProjectStore((s) => s.updateLead)
  const deleteLead    = useProjectStore((s) => s.deleteLead)
  const createProject = useProjectStore((s) => s.createProject)
  const [showAdd, setShowAdd] = useState(false)
  const [editingLead, setEditingLead] = useState(null)

  const DONE_STATUSES = ['Done', 'Archived', 'Dead']
  const openLeads = leads.filter((l) => !DONE_STATUSES.includes(l.status))
  const totalPotential = openLeads.reduce((s, l) => s + l.potentialValue, 0)

  const handleStatusChange = (leadId, newStatus) => {
    updateLead(leadId, { status: newStatus })
    toast.success(`Status → ${newStatus}`)
  }

  const handleSourceChange = (leadId, newSource) => {
    updateLead(leadId, { source: newSource })
    toast.success(`Source → ${newSource}`)
  }

  const handlePushToProject = (lead) => {
    const project = createProject({
      name:           `${lead.name} – ${lead.service || 'New Project'}`,
      clientId:       null,
      designerIds:    [],
      status:         'Active',
      startDate:      new Date().toISOString().split('T')[0],
      dueDate:        null,
      projectValue:   lead.potentialValue || 0,
      designerPayout: 0,
      brief:          [lead.company, lead.email, lead.notes].filter(Boolean).join(' · '),
      tags:           lead.service ? [lead.service] : [],
      leadId:         lead.id,
    })
    updateLead(lead.id, { projectId: project.id })
    toast.success('Lead pushed to Projects!')
  }

  const getLinkedProject = (lead) => projects.find((p) => p.id === lead.projectId)

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="Lead Management"
        subtitle={`${openLeads.length} open leads · ${formatCurrency(totalPotential)} potential revenue`}
        actions={
          <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setShowAdd(true)}>
            Add Lead
          </Button>
        }
        className="mb-8"
      />

      <DarkCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Contact', 'Service', 'Potential', 'Source', 'Status', 'Submitted', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-admin-border/50 hover:bg-admin-surface/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="text-slate-100 font-medium">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.company}</p>
                    <p className="text-xs text-slate-600">{lead.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{lead.service}</td>
                  <td className="px-5 py-4 text-slate-200 font-semibold">
                    {formatCurrency(lead.potentialValue)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative inline-flex items-center">
                      <span className="text-slate-400 text-sm pr-5 cursor-pointer">{lead.source || '—'}</span>
                      <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600" />
                      <select
                        value={lead.source}
                        onChange={(e) => handleSourceChange(lead.id, e.target.value)}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      >
                        {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative inline-flex items-center">
                      <Badge variant={STATUS_BADGE[lead.status] ?? 'default'} className="pr-6 cursor-pointer">
                        {lead.status}
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60" />
                      </Badge>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      >
                        {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(lead.submittedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {lead.projectId ? (
                        <button
                          onClick={() => navigate('/admin/projects')}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-900/20 text-emerald-400 text-xs font-medium hover:bg-emerald-900/30 transition-colors"
                          title="View linked project"
                        >
                          <ExternalLink size={11} /> Project
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePushToProject(lead)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-brand-400 hover:bg-brand-900/20 transition-colors"
                          title="Push to Projects"
                        >
                          <Rocket size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingLead(lead)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-admin-border/50 transition-colors"
                        title="Edit lead"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { deleteLead(lead.id); toast.success('Lead deleted') }}
                        className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Delete lead"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DarkCard>

      {showAdd && (
        <LeadModal
          onClose={() => setShowAdd(false)}
          onSave={(lead) => addLead(lead)}
        />
      )}

      {editingLead && (
        <LeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={(data) => updateLead(editingLead.id, data)}
        />
      )}
    </AdminLayout>
  )
}
