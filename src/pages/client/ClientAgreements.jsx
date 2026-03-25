import { useState } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import {
  FileText, CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp,
  ScrollText, AlertCircle, Send, ShieldCheck, ClipboardList,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useAuthStore from '../../store/authStore'
import useProposalStore from '../../store/proposalStore'
import { generateProposalHtml, generateServiceAgreementHtml, generateAddendumHtml } from '../../lib/proposalDocs'
import toast from 'react-hot-toast'

function openDoc(html) {
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

function fmt(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Proposal Card ─────────────────────────────────────────────────────────────

function ProposalCard({ proposal, onAccept, onDeny }) {
  const [showDetails, setShowDetails]   = useState(false)
  const [denyMode,    setDenyMode]      = useState(false)
  const [denyNotes,   setDenyNotes]     = useState('')
  const [confirming,  setConfirming]    = useState(false)

  const fee     = Math.round(proposal.totalAmount * 0.03 * 100) / 100
  const deposit = proposal.depositAmount ?? Math.round(proposal.totalAmount * 0.5 * 100) / 100
  const total   = proposal.totalAmount + fee

  const isSent   = proposal.status === 'sent'
  const isDenied = proposal.status === 'denied'
  const isAccepted = proposal.status === 'accepted'

  const latestRevision = proposal.revisions?.[proposal.revisions.length - 1]

  const handleDenySubmit = () => {
    if (!denyNotes.trim()) { toast.error('Please tell us what you would like updated'); return }
    onDeny(proposal.id, denyNotes.trim())
    setDenyMode(false)
    setDenyNotes('')
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-800">{proposal.serviceTitle}</span>
            {proposal.packageTier && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600">
                {proposal.packageTier}
              </span>
            )}
            {proposal.version > 1 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                v{proposal.version}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isSent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-200">
                <Clock size={10} /> Awaiting Your Response
              </span>
            )}
            {isDenied && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-slate-600 bg-slate-50 border-slate-200">
                <Clock size={10} /> Revision Requested
              </span>
            )}
            {isAccepted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">
                <CheckCircle2 size={10} /> Accepted
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              Issued {proposal.sentAt ? fmt(proposal.sentAt) : ''}
              {proposal.validUntil && isSent && ` · Valid until ${fmt(proposal.validUntil)}`}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowDetails((s) => !s)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Denied — show client's revision notes */}
      {isDenied && latestRevision && (
        <div className="mx-5 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-800 mb-1">Your revision request</p>
          <p className="text-xs text-amber-700 leading-relaxed">{latestRevision.denialNotes}</p>
          <p className="text-[10px] text-amber-500 mt-1">
            Edit Me Lo will update the proposal and resend it shortly.
          </p>
        </div>
      )}

      {/* Expandable details */}
      {showDetails && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {/* Deliverables */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deliverables</p>
            <ul className="space-y-1">
              {(proposal.scopeItems ?? []).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={13} className="text-brand-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline + Investment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Timeline</p>
              <p className="text-sm text-slate-700">{proposal.timeline}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Investment</p>
              <p className="text-sm font-semibold text-slate-800">{fmtCurrency(total)} total</p>
              <p className="text-xs text-slate-500">
                {fmtCurrency(deposit * 1.03)} deposit · {fmtCurrency((proposal.totalAmount - deposit) * 1.03)} balance
              </p>
            </div>
          </div>

          {/* Notes */}
          {proposal.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-600 leading-relaxed">{proposal.notes}</p>
            </div>
          )}

          {/* View full proposal */}
          <button
            onClick={() => openDoc(generateProposalHtml(proposal))}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            <ExternalLink size={12} /> View Full Proposal Document
          </button>
        </div>
      )}

      {/* Action row — only for 'sent' proposals */}
      {isSent && !denyMode && !confirming && (
        <div className="border-t border-slate-100 px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => setConfirming(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            <CheckCircle2 size={15} /> Accept Proposal
          </button>
          <button
            onClick={() => setDenyMode(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Request Revisions
          </button>
        </div>
      )}

      {/* Accept confirmation */}
      {isSent && confirming && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
            <p className="text-sm font-semibold text-emerald-800 mb-1">Confirm Acceptance</p>
            <p className="text-xs text-emerald-700">
              By accepting this proposal, you agree to the scope, timeline, and investment outlined above.
              A Service Agreement will be generated for your signature.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Go back
            </button>
            <button
              onClick={() => { onAccept(proposal.id); setConfirming(false) }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <CheckCircle2 size={13} /> Yes, Accept Proposal
            </button>
          </div>
        </div>
      )}

      {/* Deny form */}
      {isSent && denyMode && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">What would you like us to update?</p>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none mb-3"
            placeholder="Please describe what changes or updates you would like to the proposal…"
            value={denyNotes}
            onChange={(e) => setDenyNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setDenyMode(false); setDenyNotes('') }}
              className="px-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDenySubmit}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <Send size={13} /> Submit Revision Request
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Service Agreement Signing Panel ──────────────────────────────────────────

function ServiceAgreementPanel({ sa }) {
  const signServiceAgreement = useProposalStore((s) => s.signServiceAgreement)
  const [agreed,     setAgreed]     = useState(false)
  const [sigName,    setSigName]    = useState('')
  const [showTerms,  setShowTerms]  = useState(false)
  const [signing,    setSigning]    = useState(false)

  const isSigned = sa.status === 'signed'

  const handleSign = () => {
    if (!agreed)           { toast.error('Please check the agreement checkbox'); return }
    if (!sigName.trim())   { toast.error('Please type your full name to sign'); return }
    if (sigName.trim().length < 2) { toast.error('Please enter your full name'); return }

    setSigning(true)
    signServiceAgreement(sa.id, sigName.trim())
    toast.success('Service Agreement signed!')
    // Open the signed doc
    const html = generateServiceAgreementHtml({ ...sa, signatureText: sigName.trim(), signedAt: new Date().toISOString(), status: 'signed' })
    openDoc(html)
    setSigning(false)
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          isSigned ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
        )}>
          {isSigned
            ? <ShieldCheck size={18} className="text-emerald-500" />
            : <ScrollText size={18} className="text-amber-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">Service Agreement</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600">
              Contract
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isSigned ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">
                <CheckCircle2 size={10} /> Signed {fmt(sa.signedAt)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-200">
                <Clock size={10} /> Signature Required
              </span>
            )}
            <span className="text-[11px] text-slate-400">{sa.serviceTitle}</span>
          </div>
        </div>
        {isSigned && (
          <button
            onClick={() => openDoc(generateServiceAgreementHtml(sa))}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors whitespace-nowrap"
          >
            <ExternalLink size={12} /> Open & Save
          </button>
        )}
      </div>

      {/* Key terms summary (always visible) */}
      <div className="border-t border-slate-100 px-5 py-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Service</p>
            <p className="text-xs text-slate-700 font-medium">{sa.serviceTitle}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
            <p className="text-xs text-slate-700 font-medium">{fmtCurrency(sa.totalAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Timeline</p>
            <p className="text-xs text-slate-700 font-medium">{sa.timeline}</p>
          </div>
        </div>

        {/* View full agreement toggle */}
        <button
          onClick={() => setShowTerms((s) => !s)}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <FileText size={12} />
          {showTerms ? 'Hide agreement terms' : 'Read the full agreement'}
          {showTerms ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Full agreement preview (scrollable) */}
      {showTerms && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto space-y-3">
            <p className="font-semibold text-slate-800">SERVICE AGREEMENT — KEY TERMS</p>
            <p>This Service Agreement governs the creative services provided by <strong>Edit Me Lo, LLC</strong> to you (<strong>{sa.clientName}</strong>) for the project: <strong>{sa.projectName}</strong>.</p>
            <p><strong>Scope:</strong> All deliverables are outlined in Exhibit A (Statement of Work) attached to the full agreement.</p>
            <p><strong>Payment:</strong> A 50% non-refundable deposit of {fmtCurrency(sa.depositAmount)} is due upon signing. The remaining balance of {fmtCurrency(sa.totalAmount - sa.depositAmount)} is due upon final delivery. A 3% processing fee applies to all payments.</p>
            <p><strong>Revisions:</strong> Revision rounds are as specified in the Statement of Work. Additional revisions will be quoted separately.</p>
            <p><strong>Intellectual Property:</strong> Upon receipt of full payment, you receive full ownership of all final deliverables. Edit Me Lo retains the right to display the work in its portfolio.</p>
            <p><strong>Confidentiality:</strong> Both parties agree to keep all shared business information confidential for 2 years following project completion.</p>
            <p><strong>Termination:</strong> Either party may terminate with 14 days' written notice. The deposit is non-refundable.</p>
            <p><strong>Independent Contractor:</strong> Edit Me Lo is an independent contractor, not an employee or partner.</p>
            <p><strong>Governing Law:</strong> This agreement is governed by the laws of the State of Florida.</p>
            <p><strong>Electronic Signatures:</strong> Your typed name constitutes a legally binding e-signature under the ESIGN Act and UETA.</p>
            <p className="text-brand-600 font-medium cursor-pointer" onClick={() => openDoc(generateServiceAgreementHtml(sa))}>
              → Click to view and print the full agreement document
            </p>
          </div>
        </div>
      )}

      {/* Signing form */}
      {!isSigned && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3 mb-4">
            <input
              id="sa-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-500 cursor-pointer"
            />
            <label htmlFor="sa-agree" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
              I have read and agree to the <button onClick={() => setShowTerms(true)} className="text-brand-600 underline underline-offset-2">Service Agreement</button> and the Statement of Work in Exhibit A. I understand the payment terms and that my typed name below serves as a legally binding electronic signature.
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Type your full legal name to sign *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-base"
              style={{ fontFamily: '"Dancing Script", cursive', fontSize: '18px', color: '#0a2d6e' }}
              placeholder="Your full name"
              value={sigName}
              onChange={(e) => setSigName(e.target.value)}
            />
          </div>

          <button
            onClick={handleSign}
            disabled={!agreed || !sigName.trim() || signing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            <ShieldCheck size={16} />
            Sign Service Agreement
          </button>
        </div>
      )}
    </Card>
  )
}

// ─── Addendum Card ─────────────────────────────────────────────────────────────

function AddendumCard({ addendum }) {
  const signAddendum = useProposalStore((s) => s.signAddendum)
  const [agreed,   setAgreed]   = useState(false)
  const [sigName,  setSigName]  = useState('')
  const [open,     setOpen]     = useState(false)
  const isSigned = addendum.status === 'signed'

  const handleSign = () => {
    if (!agreed)          { toast.error('Please check the agreement checkbox'); return }
    if (!sigName.trim())  { toast.error('Please type your full name to sign'); return }
    signAddendum(addendum.id, sigName.trim())
    toast.success('Addendum signed!')
    const html = generateAddendumHtml({ ...addendum, signatureText: sigName.trim(), signedAt: new Date().toISOString(), status: 'signed' })
    openDoc(html)
  }

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
        onClick={() => setOpen((s) => !s)}
      >
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          isSigned ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
        )}>
          <FileText size={18} className={isSigned ? 'text-emerald-500' : 'text-amber-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">{addendum.title}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Addendum
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSigned ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">
                <CheckCircle2 size={10} /> Signed {fmt(addendum.signedAt)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-200">
                <Clock size={10} /> Signature Required
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{addendum.description}</p>

          {(addendum.additionalItems ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Additional Items</p>
              <ul className="space-y-1">
                {addendum.additionalItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={13} className="text-brand-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {addendum.additionalCost > 0 && (
            <p className="text-sm text-slate-700">
              <strong>Additional cost:</strong> {fmtCurrency(addendum.additionalCost)}
            </p>
          )}

          {isSigned ? (
            <button
              onClick={() => openDoc(generateAddendumHtml(addendum))}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              <ExternalLink size={12} /> Open & Save Addendum
            </button>
          ) : (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <input
                  id={`add-agree-${addendum.id}`}
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-500 cursor-pointer"
                />
                <label htmlFor={`add-agree-${addendum.id}`} className="text-sm text-slate-700 cursor-pointer">
                  I agree to the terms of this addendum and authorize the additional scope described above.
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Type your full name to sign</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  style={{ fontFamily: '"Dancing Script", cursive', fontSize: '18px', color: '#0a2d6e' }}
                  placeholder="Your full name"
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                />
              </div>
              <button
                onClick={handleSign}
                disabled={!agreed || !sigName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
              >
                <ShieldCheck size={14} /> Sign Addendum
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ClientAgreements() {
  const user = useAuthStore((s) => s.user)
  const uid  = user?.id ?? ''

  const _proposals         = useProposalStore((s) => s.proposals)
  const _serviceAgreements = useProposalStore((s) => s.serviceAgreements)
  const _addendums         = useProposalStore((s) => s.addendums)
  const acceptProposal     = useProposalStore((s) => s.acceptProposal)
  const denyProposal       = useProposalStore((s) => s.denyProposal)

  const proposals         = _proposals.filter((p) => p.clientId === uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const serviceAgreements = _serviceAgreements.filter((sa) => sa.clientId === uid).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
  const addendums         = _addendums.filter((a) => a.clientId === uid).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

  // Most recent non-draft proposal
  const activeProposal = proposals.find((p) => p.status !== 'draft') ?? null

  // SA linked to the accepted proposal
  const activeSA = activeProposal?.status === 'accepted'
    ? serviceAgreements.find((sa) => sa.proposalId === activeProposal.id) ?? null
    : null

  const pendingItems = [
    activeProposal?.status === 'sent' ? 1 : 0,
    activeSA?.status === 'pending' ? 1 : 0,
    addendums.filter((a) => a.status === 'pending').length,
  ].reduce((a, b) => a + b, 0)

  return (
    <PortalLayout>
      <PageHeader
        title="Agreements"
        subtitle="Your project paperwork — proposals, contracts, and addendums."
        className="mb-8"
      />

      {/* Action prompt */}
      {pendingItems > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Action required:</span>{' '}
            {pendingItems === 1
              ? 'You have 1 document that needs your attention.'
              : `You have ${pendingItems} documents that need your attention.`}
          </p>
        </div>
      )}

      {/* No proposal yet */}
      {!activeProposal && (
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <ClipboardList size={36} className="text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">No proposal yet</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Your project proposal will appear here once Edit Me Lo sends it to you. Check back soon!
          </p>
        </Card>
      )}

      {/* Proposal card */}
      {activeProposal && (
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Project Proposal</h2>
          <ProposalCard
            proposal={activeProposal}
            onAccept={acceptProposal}
            onDeny={denyProposal}
          />
        </div>
      )}

      {/* Service Agreement */}
      {activeSA && (
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Service Agreement</h2>
          {activeSA.status === 'pending' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-50 border border-brand-200 mb-3">
              <ScrollText size={16} className="text-brand-500 shrink-0 mt-0.5" />
              <p className="text-sm text-brand-800">
                <span className="font-semibold">Your proposal has been accepted!</span>{' '}
                Please review and sign your Service Agreement below to officially kick off the project.
              </p>
            </div>
          )}
          <ServiceAgreementPanel sa={activeSA} />
        </div>
      )}

      {/* Addendums */}
      {addendums.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Addendums</h2>
          {addendums.map((a) => (
            <AddendumCard key={a.id} addendum={a} />
          ))}
        </div>
      )}

      {(activeProposal || addendums.length > 0) && (
        <p className="text-xs text-slate-400 mt-6 text-center">
          Documents are managed by Edit Me Lo. Questions? Email hello@editmelo.com
        </p>
      )}
    </PortalLayout>
  )
}
