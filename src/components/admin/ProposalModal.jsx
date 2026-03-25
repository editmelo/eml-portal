import { useState } from 'react'
import { X, Plus, Trash2, Send, FileText, ClipboardList } from 'lucide-react'
import { cn } from '../../lib/utils'
import useProposalStore from '../../store/proposalStore'
import useProjectStore from '../../store/projectStore'
import toast from 'react-hot-toast'

const PACKAGE_TIERS = ['Starter', 'Growth', 'Premium', 'Custom']

function field(isDark) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
    isDark
      ? 'bg-admin-bg border-admin-border text-slate-200 placeholder-slate-600 focus:ring-brand-400/40'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-brand-500/30'
  )
}

function label(isDark) {
  return cn('block text-xs font-medium mb-1.5', isDark ? 'text-slate-400' : 'text-slate-500')
}

// ─── Proposal Modal ────────────────────────────────────────────────────────────
// Used for both creating and revising proposals.
// Pass existingProposal to pre-populate for revision mode.

export default function ProposalModal({ onClose, isDark, existingProposal = null }) {
  const projects          = useProjectStore((s) => s.projects)
  const createProposal    = useProposalStore((s) => s.createProposal)
  const sendProposal      = useProposalStore((s) => s.sendProposal)
  const reviseProposal    = useProposalStore((s) => s.reviseProposal)

  const isRevision = !!existingProposal

  // Pre-populate from existing if revising
  const [projectId,    setProjectId]    = useState(existingProposal?.projectId ?? '')
  const [clientName,   setClientName]   = useState(existingProposal?.clientName ?? '')
  const [clientEmail,  setClientEmail]  = useState(existingProposal?.clientEmail ?? '')
  const [serviceTitle, setServiceTitle] = useState(existingProposal?.serviceTitle ?? '')
  const [packageTier,  setPackageTier]  = useState(existingProposal?.packageTier ?? 'Custom')
  const [scopeItems,   setScopeItems]   = useState(existingProposal?.scopeItems ?? [''])
  const [timeline,     setTimeline]     = useState(existingProposal?.timeline ?? '')
  const [totalAmount,  setTotalAmount]  = useState(existingProposal?.totalAmount?.toString() ?? '')
  const [notes,        setNotes]        = useState(existingProposal?.notes ?? '')
  const [submitting,   setSubmitting]   = useState(false)

  // Auto-fill project details when project is selected
  const handleProjectChange = (pid) => {
    setProjectId(pid)
    const proj = projects.find((p) => p.id === pid)
    if (proj && !isRevision) {
      // Pre-fill project name context — admin still fills client name/email
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId)

  const addScopeItem  = () => setScopeItems((prev) => [...prev, ''])
  const removeScopeItem = (i) => setScopeItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateScopeItem = (i, val) =>
    setScopeItems((prev) => prev.map((item, idx) => (idx === i ? val : item)))

  const handleSubmit = async (sendNow) => {
    if (!projectId)                 { toast.error('Select a project'); return }
    if (!clientName.trim())         { toast.error('Client name is required'); return }
    if (!clientEmail.trim())        { toast.error('Client email is required'); return }
    if (!serviceTitle.trim())       { toast.error('Service title is required'); return }
    if (!timeline.trim())           { toast.error('Timeline is required'); return }
    const amount = parseFloat(totalAmount)
    if (!totalAmount || isNaN(amount) || amount <= 0) { toast.error('Enter a valid total amount'); return }

    const cleanScope = scopeItems.map((s) => s.trim()).filter(Boolean)
    if (!cleanScope.length) { toast.error('Add at least one deliverable'); return }

    setSubmitting(true)
    try {
      if (isRevision) {
        reviseProposal(existingProposal.id, {
          projectId,
          clientName:    clientName.trim(),
          clientEmail:   clientEmail.trim(),
          projectName:   selectedProject?.name ?? existingProposal.projectName,
          serviceTitle:  serviceTitle.trim(),
          packageTier,
          scopeItems:    cleanScope,
          timeline:      timeline.trim(),
          totalAmount:   amount,
          depositAmount: Math.round(amount * 0.5 * 100) / 100,
          notes:         notes.trim(),
        })
        toast.success('Proposal revised and resent to client')
      } else {
        const proposal = createProposal({
          projectId,
          clientId:      selectedProject?.clientId ?? '',
          clientName:    clientName.trim(),
          clientEmail:   clientEmail.trim(),
          projectName:   selectedProject?.name ?? '',
          serviceTitle:  serviceTitle.trim(),
          packageTier,
          scopeItems:    cleanScope,
          timeline:      timeline.trim(),
          totalAmount:   amount,
          depositAmount: Math.round(amount * 0.5 * 100) / 100,
          notes:         notes.trim(),
        })
        if (sendNow) {
          sendProposal(proposal.id)
          toast.success('Proposal sent to client!')
        } else {
          toast.success('Proposal saved as draft')
        }
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const surface  = isDark ? 'bg-admin-surface border-admin-border' : 'bg-white border-slate-200'
  const divider  = isDark ? 'border-admin-border' : 'border-slate-100'
  const headText = isDark ? 'text-white' : 'text-slate-800'
  const subText  = isDark ? 'text-slate-400' : 'text-slate-500'
  const secLabel = cn('text-[10px] font-bold uppercase tracking-widest mb-3', subText)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={cn(
        'w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[92vh]',
        surface
      )}>
        {/* Header */}
        <div className={cn('flex items-center justify-between px-6 py-4 border-b shrink-0', divider)}>
          <div className="flex items-center gap-2.5">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', isDark ? 'bg-brand-500/15' : 'bg-brand-500/10')}>
              <ClipboardList size={15} className="text-brand-500" />
            </div>
            <p className={cn('text-sm font-semibold', headText)}>
              {isRevision ? `Revise Proposal — v${(existingProposal.version ?? 1) + 1}` : 'New Project Proposal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn('h-7 w-7 rounded-full flex items-center justify-center transition-colors', isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Project */}
          <div>
            <p className={secLabel}>Project</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={label(isDark)}>Project *</label>
                <select
                  className={field(isDark)}
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <option value="">— Select project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label(isDark)}>Client Name *</label>
                  <input
                    className={field(isDark)}
                    placeholder="e.g. Jordan Rivera"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={label(isDark)}>Client Email *</label>
                  <input
                    className={field(isDark)}
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service */}
          <div>
            <p className={secLabel}>Service Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label(isDark)}>Service Title *</label>
                <input
                  className={field(isDark)}
                  placeholder="e.g. Brand Identity Package"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                />
              </div>
              <div>
                <label className={label(isDark)}>Package Tier</label>
                <select
                  className={field(isDark)}
                  value={packageTier}
                  onChange={(e) => setPackageTier(e.target.value)}
                >
                  {PACKAGE_TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div>
            <p className={secLabel}>Scope of Work / Deliverables</p>
            <div className="space-y-2">
              {scopeItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={cn(field(isDark), 'flex-1')}
                    placeholder={`Deliverable ${i + 1}`}
                    value={item}
                    onChange={(e) => updateScopeItem(i, e.target.value)}
                  />
                  {scopeItems.length > 1 && (
                    <button
                      onClick={() => removeScopeItem(i)}
                      className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0', isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50')}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addScopeItem}
                className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors', isDark ? 'text-brand-400 hover:bg-brand-400/10' : 'text-brand-600 hover:bg-brand-50')}
              >
                <Plus size={13} /> Add item
              </button>
            </div>
          </div>

          {/* Timeline + Investment */}
          <div>
            <p className={secLabel}>Timeline &amp; Investment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label(isDark)}>Timeline *</label>
                <input
                  className={field(isDark)}
                  placeholder="e.g. 4–6 weeks"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                />
              </div>
              <div>
                <label className={label(isDark)}>Total Amount (USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  className={field(isDark)}
                  placeholder="e.g. 3500"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
            </div>
            {totalAmount && !isNaN(parseFloat(totalAmount)) && (
              <div className={cn('mt-2 p-3 rounded-lg text-xs font-medium space-y-1', isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500')}>
                <div className="flex justify-between">
                  <span>Processing fee (3%)</span>
                  <span>${(parseFloat(totalAmount) * 0.03).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total with fee</span>
                  <span>${(parseFloat(totalAmount) * 1.03).toFixed(2)}</span>
                </div>
                <div className={cn('flex justify-between font-bold pt-1 border-t', divider)}>
                  <span>50% deposit due at signing</span>
                  <span>${(parseFloat(totalAmount) * 1.03 * 0.5).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className={secLabel}>Additional Notes (optional)</p>
            <textarea
              rows={3}
              className={cn(field(isDark), 'resize-none')}
              placeholder="Any additional context, special terms, or notes for the client…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={cn('flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0', divider)}>
          <button
            onClick={onClose}
            className={cn('px-4 py-2 text-xs font-medium rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100')}
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {!isRevision && (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium transition-colors', isDark ? 'border-admin-border text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
              >
                <FileText size={13} /> Save Draft
              </button>
            )}
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Send size={13} />
              {isRevision ? 'Revise & Resend' : 'Send to Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Addendum Modal ────────────────────────────────────────────────────────────

export function AddendumModal({ onClose, isDark }) {
  const projects        = useProjectStore((s) => s.projects)
  const createAddendum  = useProposalStore((s) => s.createAddendum)

  const [projectId,        setProjectId]        = useState('')
  const [clientName,       setClientName]       = useState('')
  const [clientEmail,      setClientEmail]      = useState('')
  const [title,            setTitle]            = useState('')
  const [description,      setDescription]      = useState('')
  const [additionalItems,  setAdditionalItems]  = useState([''])
  const [additionalCost,   setAdditionalCost]   = useState('')
  const [submitting,       setSubmitting]       = useState(false)

  const selectedProject = projects.find((p) => p.id === projectId)

  const addItem    = () => setAdditionalItems((prev) => [...prev, ''])
  const removeItem = (i) => setAdditionalItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, val) =>
    setAdditionalItems((prev) => prev.map((item, idx) => (idx === i ? val : item)))

  const handleSend = () => {
    if (!projectId)           { toast.error('Select a project'); return }
    if (!clientName.trim())   { toast.error('Client name is required'); return }
    if (!clientEmail.trim())  { toast.error('Client email is required'); return }
    if (!title.trim())        { toast.error('Title is required'); return }
    if (!description.trim())  { toast.error('Description is required'); return }

    setSubmitting(true)
    const cleanItems = additionalItems.map((s) => s.trim()).filter(Boolean)
    const cost       = parseFloat(additionalCost) || 0
    createAddendum({
      projectId,
      clientId:         selectedProject?.clientId ?? '',
      clientName:       clientName.trim(),
      clientEmail:      clientEmail.trim(),
      projectName:      selectedProject?.name ?? '',
      title:            title.trim(),
      description:      description.trim(),
      additionalItems:  cleanItems,
      additionalCost:   cost,
    })
    toast.success('Addendum sent to client')
    setSubmitting(false)
    onClose()
  }

  const surface  = isDark ? 'bg-admin-surface border-admin-border' : 'bg-white border-slate-200'
  const divider  = isDark ? 'border-admin-border' : 'border-slate-100'
  const headText = isDark ? 'text-white' : 'text-slate-800'
  const subText  = isDark ? 'text-slate-400' : 'text-slate-500'
  const secLabel = cn('text-[10px] font-bold uppercase tracking-widest mb-3', subText)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={cn(
        'w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[92vh]',
        surface
      )}>
        <div className={cn('flex items-center justify-between px-6 py-4 border-b shrink-0', divider)}>
          <div className="flex items-center gap-2.5">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', isDark ? 'bg-amber-400/15' : 'bg-amber-400/10')}>
              <FileText size={15} className="text-amber-500" />
            </div>
            <p className={cn('text-sm font-semibold', headText)}>New Addendum</p>
          </div>
          <button onClick={onClose} className={cn('h-7 w-7 rounded-full flex items-center justify-center transition-colors', isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')}>
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className={secLabel}>Project</p>
            <div className="space-y-3">
              <div>
                <label className={label(isDark)}>Project *</label>
                <select className={field(isDark)} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">— Select project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label(isDark)}>Client Name *</label>
                  <input className={field(isDark)} placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <label className={label(isDark)}>Client Email *</label>
                  <input className={field(isDark)} placeholder="client@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className={secLabel}>Addendum Details</p>
            <div className="space-y-3">
              <div>
                <label className={label(isDark)}>Title *</label>
                <input className={field(isDark)} placeholder="e.g. Additional Social Media Templates" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className={label(isDark)}>Description *</label>
                <textarea rows={3} className={cn(field(isDark), 'resize-none')} placeholder="Describe what is being added or changed…" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <p className={secLabel}>Additional Deliverables (optional)</p>
            <div className="space-y-2">
              {additionalItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={cn(field(isDark), 'flex-1')} placeholder={`Item ${i + 1}`} value={item} onChange={(e) => updateItem(i, e.target.value)} />
                  {additionalItems.length > 1 && (
                    <button onClick={() => removeItem(i)} className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0', isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50')}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addItem} className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors', isDark ? 'text-brand-400 hover:bg-brand-400/10' : 'text-brand-600 hover:bg-brand-50')}>
                <Plus size={13} /> Add item
              </button>
            </div>
          </div>

          <div>
            <p className={secLabel}>Additional Cost (optional)</p>
            <div>
              <label className={label(isDark)}>Additional Amount (USD)</label>
              <input type="number" min="0" step="50" className={field(isDark)} placeholder="0 if no additional charge" value={additionalCost} onChange={(e) => setAdditionalCost(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0', divider)}>
          <button onClick={onClose} className={cn('px-4 py-2 text-xs font-medium rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100')}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <Send size={13} /> Send Addendum
          </button>
        </div>
      </div>
    </div>
  )
}
