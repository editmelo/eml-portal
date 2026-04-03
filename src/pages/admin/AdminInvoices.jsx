import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useThemeStore from '../../store/themeStore'
import useProjectStore from '../../store/projectStore'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import {
  createInvoice,
  fetchInvoicesFromDB,
  syncInvoiceStatuses,
  sendInvoice,
  getQBConnectionStatus,
} from '../../lib/quickbooks'
import {
  Plus, RefreshCw, Send, CreditCard, CheckCircle2,
  Clock, AlertCircle, X, FileText, ExternalLink,
  Loader2, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_VARIANT = { Paid: 'success', Pending: 'warning', Overdue: 'danger', Draft: 'default' }
const STATUS_ICON    = { Paid: CheckCircle2, Pending: Clock, Overdue: AlertCircle, Draft: FileText }

export default function AdminInvoices() {
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const projects = useProjectStore((s) => s.projects)

  const [invoices, setInvoices]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const [qbConnected, setQbConnected] = useState(false)
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')

  // Load invoices from Supabase
  const loadInvoices = async () => {
    try {
      const data = await fetchInvoicesFromDB()
      setInvoices(data)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      // Fallback to Zustand store (mock data) if Supabase table doesn't exist yet
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
    getQBConnectionStatus()
      .then((s) => setQbConnected(s.connected))
      .catch(() => {})
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncInvoiceStatuses()
      toast.success(`Synced ${result.synced} invoice(s) from QuickBooks`)
      await loadInvoices()
    } catch {
      toast.error('Sync failed — is QuickBooks connected?')
    } finally {
      setSyncing(false)
    }
  }

  const handleSend = async (inv) => {
    try {
      await sendInvoice(inv.id)
      toast.success(`Invoice sent to ${inv.client_email}`)
    } catch {
      toast.error('Failed to send invoice')
    }
  }

  // Stats
  const totalPaid    = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = invoices.filter((i) => i.status === 'Pending').reduce((s, i) => s + Number(i.amount), 0)
  const totalOverdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + Number(i.amount), 0)

  // Filter + search
  const filtered = invoices
    .filter((inv) => filter === 'all' || inv.status === filter)
    .filter((inv) =>
      !search ||
      inv.description?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase())
    )

  const text    = isDark ? 'text-white' : 'text-slate-800'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
    isDark
      ? 'bg-admin-bg border-admin-border text-slate-200 placeholder-slate-600 focus:ring-admin-accent/40'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-brand-500/30'
  )

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader dark={isDark} title="Invoices" subtitle="Create, send, and track client invoices" />
        <div className="flex items-center gap-2">
          {qbConnected && (
            <Button
              variant={isDark ? 'outline' : 'secondary'}
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className={cn(isDark && 'border-admin-border text-slate-300 hover:bg-admin-surface')}
            >
              <RefreshCw size={14} className={cn(syncing && 'animate-spin')} />
              Sync QB
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Paid', value: totalPaid, color: 'emerald' },
          { label: 'Outstanding', value: totalPending, color: 'amber' },
          { label: 'Overdue', value: totalOverdue, color: 'red' },
        ].map((stat) => (
          <DarkCard key={stat.label} className="p-5">
            <p className={cn('text-xs uppercase tracking-wider mb-1', subText)}>{stat.label}</p>
            <p className={cn(
              'text-2xl font-bold',
              stat.color === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') :
              stat.color === 'amber'   ? (isDark ? 'text-amber-400'   : 'text-amber-700') :
                                          (isDark ? 'text-red-400'     : 'text-red-700')
            )}>
              {formatCurrency(stat.value)}
            </p>
          </DarkCard>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', subText)} />
          <input
            className={cn(inputCls, 'pl-9')}
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {['all', 'Pending', 'Paid', 'Overdue', 'Draft'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === f
                  ? isDark ? 'bg-admin-accent/15 text-admin-accent' : 'bg-brand-500/10 text-brand-500'
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      <DarkCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className={cn('animate-spin', subText)} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={32} className={cn('mx-auto mb-3', subText)} />
            <p className={cn('text-sm', subText)}>
              {invoices.length === 0
                ? 'No invoices yet. Create your first invoice to get started.'
                : 'No invoices match your filter.'}
            </p>
          </div>
        ) : (
          <div className={cn('divide-y', isDark ? 'divide-admin-border' : 'divide-slate-100')}>
            {filtered.map((inv) => {
              const Icon = STATUS_ICON[inv.status] ?? FileText
              return (
                <div key={inv.id} className={cn(
                  'flex items-center justify-between px-6 py-4',
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                )}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      'p-2.5 rounded-lg shrink-0',
                      inv.status === 'Paid'    ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600') :
                      inv.status === 'Pending' ? (isDark ? 'bg-amber-900/30 text-amber-400'    : 'bg-amber-100 text-amber-600') :
                      inv.status === 'Overdue' ? (isDark ? 'bg-red-900/30 text-red-400'        : 'bg-red-100 text-red-600') :
                                                  (isDark ? 'bg-slate-800 text-slate-400'       : 'bg-slate-100 text-slate-500')
                    )}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-medium truncate', text)}>{inv.description}</p>
                      <p className={cn('text-xs mt-0.5', subText)}>
                        {inv.client_name ?? 'Unknown client'}
                        {inv.issued_at ? ` · Issued ${formatDate(inv.issued_at)}` : ''}
                        {inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ''}
                        {inv.paid_at ? ` · Paid ${formatDate(inv.paid_at)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className={cn('text-sm font-semibold', text)}>{formatCurrency(Number(inv.amount))}</p>
                    <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>

                    {inv.payment_link && (
                      <a
                        href={inv.payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                        )}
                        title="Payment link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}

                    {inv.qb_invoice_id && inv.status !== 'Paid' && (
                      <button
                        onClick={() => handleSend(inv)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                        )}
                        title="Send invoice email"
                      >
                        <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DarkCard>

      {/* Create Invoice Modal */}
      {showCreate && (
        <CreateInvoiceModal
          isDark={isDark}
          projects={projects}
          qbConnected={qbConnected}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadInvoices()
          }}
        />
      )}
    </AdminLayout>
  )
}

// ── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateInvoiceModal({ isDark, projects, qbConnected, onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    clientName:  '',
    clientEmail: '',
    description: '',
    amount:      '',
    dueDate:     '',
    projectId:   '',
  })

  const text    = isDark ? 'text-white'     : 'text-slate-800'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2',
    isDark
      ? 'bg-admin-bg border-admin-border text-slate-200 placeholder-slate-600 focus:ring-admin-accent/40'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-brand-500/30'
  )
  const labelCls = cn('block text-xs font-medium mb-1.5', subText)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientEmail || !form.description || !form.amount || !form.dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      await createInvoice({
        clientName:  form.clientName,
        clientEmail: form.clientEmail,
        description: form.description,
        amount:      parseFloat(form.amount),
        dueDate:     form.dueDate,
        projectId:   form.projectId || null,
      })
      toast.success(
        qbConnected
          ? 'Invoice created and synced to QuickBooks!'
          : 'Invoice created! Connect QuickBooks in Settings to sync.'
      )
      onCreated()
    } catch (err) {
      toast.error(err.message ?? 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  // Auto-fill client info when project is selected
  const handleProjectSelect = (projectId) => {
    setForm((f) => ({ ...f, projectId }))
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setForm((f) => ({
        ...f,
        projectId,
        clientName:  project.clientName ?? f.clientName,
        clientEmail: project.clientEmail ?? f.clientEmail,
        description: `${project.name ?? project.type ?? ''} — `,
      }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-lg mx-4 rounded-2xl border shadow-2xl',
        isDark ? 'bg-admin-surface border-admin-border' : 'bg-white border-slate-200'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-6 py-4 border-b',
          isDark ? 'border-admin-border' : 'border-slate-100'
        )}>
          <h2 className={cn('text-lg font-semibold', text)}>Create Invoice</h2>
          <button onClick={onClose} className={cn('p-1 rounded-lg', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}>
            <X size={18} className={subText} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project selector */}
          {projects.length > 0 && (
            <div>
              <label className={labelCls}>Link to Project (optional)</label>
              <select
                className={inputCls}
                value={form.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
              >
                <option value="">No project linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? p.type} — {p.clientName ?? 'Unknown client'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Client Name *</label>
              <input
                className={inputCls}
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Client Email *</label>
              <input
                className={inputCls}
                type="email"
                value={form.clientEmail}
                onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                placeholder="jane@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description *</label>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brand Identity — 50% deposit"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Amount ($) *</label>
              <input
                className={inputCls}
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="1,750.00"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Due Date *</label>
              <input
                className={inputCls}
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {!qbConnected && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg text-xs',
              isDark ? 'bg-amber-900/20 text-amber-400 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
            )}>
              <AlertCircle size={14} className="shrink-0" />
              QuickBooks not connected. Invoice will be saved locally but won't generate a payment link. Connect in Settings.
            </div>
          )}

          {/* Actions */}
          <div className={cn(
            'flex items-center justify-end gap-3 pt-2 border-t mt-6',
            isDark ? 'border-admin-border' : 'border-slate-100'
          )}>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2',
                isDark
                  ? 'bg-admin-accent text-admin-bg hover:bg-[#3ab8e0]'
                  : 'bg-brand-500 text-white hover:bg-brand-600',
                saving && 'opacity-60 cursor-not-allowed'
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              {saving ? 'Creating...' : qbConnected ? 'Create & Sync to QB' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
