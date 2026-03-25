import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { UserPlus, CheckCircle2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', company: '', email: '', service: '', potentialValue: '', source: '', status: 'New' }

function AddLeadModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    onSave({ ...form, potentialValue: parseFloat(form.potentialValue) || 0, submittedAt: new Date().toISOString() })
    toast.success('Lead added')
    onClose()
  }

  const INPUT = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-200 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40'
  const LABEL = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-admin-surface border border-admin-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <p className="text-sm font-semibold text-white">Add Lead</p>
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
              <input className={INPUT} placeholder="Instagram" value={form.source} onChange={(e) => set('source', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select className={INPUT} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {['New', 'Contacted', 'Proposal Sent'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-admin-border text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">Add Lead</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_BADGE = {
  'New':            'brand',
  'Contacted':      'info',
  'Proposal Sent':  'warning',
  'Converted':      'success',
}

export default function AdminLeads() {
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const leads       = useProjectStore((s) => s.leads)
  const addLead     = useProjectStore((s) => s.addLead)
  const convertLead = useProjectStore((s) => s.convertLead)
  const [showAdd, setShowAdd] = useState(false)

  const totalPotential = leads
    .filter((l) => !l.converted)
    .reduce((s, l) => s + l.potentialValue, 0)

  const handleConvert = (leadId) => {
    convertLead(leadId)
    toast.success('Lead converted to project!')
  }

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="Lead Management"
        subtitle={`${leads.filter((l) => !l.converted).length} open leads · ${formatCurrency(totalPotential)} potential revenue`}
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
                {['Contact', 'Service', 'Potential', 'Source', 'Status', 'Submitted', 'Action'].map((h) => (
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
                  <td className="px-5 py-4 text-slate-400">{lead.source}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE[lead.status] ?? 'default'}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(lead.submittedAt)}</td>
                  <td className="px-5 py-4">
                    {!lead.converted ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<CheckCircle2 size={14} />}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                        onClick={() => handleConvert(lead.id)}
                      >
                        Convert
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600">Converted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DarkCard>

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onSave={(lead) => addLead(lead)}
        />
      )}
    </AdminLayout>
  )
}
