import { useState } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import useAuthStore, { selectUser } from '../../store/authStore'
import useAgreementStore from '../../store/agreementStore'
import { generateSignedDocHtml } from '../../lib/agreementDocs'
import { cn } from '../../lib/utils'
import {
  FileText, CheckCircle2, ExternalLink, ChevronDown, ChevronUp,
  Pen, ShieldCheck, AlertTriangle, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DOCS = [
  {
    id:      'subcontractor',
    title:   'Sub-Contract Agreement',
    pdfPath: '/agreements/Subcontractor Agreement.pdf',
    desc:    'Covers your independent contractor status, scope of work, IP ownership, confidentiality, and payment terms. Active for one (1) year from the date signed.',
  },
  {
    id:      'nda',
    title:   'Non-Disclosure Agreement',
    pdfPath: '/agreements/Non-Disclosure Agreement.pdf',
    desc:    'Confirms you will keep all client information, project details, financial data, and business strategies strictly confidential. Confidentiality obligations survive termination indefinitely.',
  },
]

function openSignedDoc(record) {
  const html = generateSignedDocHtml(record)
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Revoke after a delay to allow the tab to load
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

function SigningPanel({ doc, signerId, signerName, signerEmail }) {
  const signAgreement   = useAgreementStore((s) => s.signAgreement)
  const isActive        = useAgreementStore((s) => s.isActive)
  const isExpired       = useAgreementStore((s) => s.isExpired)
  const isExpiringSoon  = useAgreementStore((s) => s.isExpiringSoon)
  const getActiveRecord = useAgreementStore((s) => s.getActiveRecord)
  const getLatestRecord = useAgreementStore((s) => s.getLatestRecord)
  const daysRemaining   = useAgreementStore((s) => s.daysRemaining)

  const active    = isActive(signerId, doc.id)
  const expired   = isExpired(signerId, doc.id)
  const expiring  = isExpiringSoon(signerId, doc.id)
  const record    = active ? getActiveRecord(signerId, doc.id) : getLatestRecord(signerId, doc.id)
  const days      = daysRemaining(signerId, doc.id)

  // Default: show form if not signed or if expired (needs renewal)
  const [expanded,   setExpanded]   = useState(!active || expired)
  const [pdfOpen,    setPdfOpen]    = useState(false)
  const [agreed,     setAgreed]     = useState(false)
  const [sig,        setSig]        = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSign = agreed && sig.trim().length >= 2

  const handleSign = () => {
    if (!canSign) return
    setSubmitting(true)
    setTimeout(() => {
      const newRecord = signAgreement({
        docId:         doc.id,
        title:         doc.title,
        pdfPath:       doc.pdfPath,
        signerRole:    'DESIGNER',
        signerId,
        signerName,
        signerEmail,
        signatureText: sig.trim(),
      })
      setSubmitting(false)
      setExpanded(false)
      setAgreed(false)
      setSig('')
      toast.success(`${doc.title} signed!`, {
        icon: '✅',
        style: { background: '#0d1f3c', color: '#e2e8f0', border: '1px solid #1e3a5f' },
      })
      // Auto-open the signed document
      openSignedDoc(newRecord)
    }, 600)
  }

  // Status badge color / label
  let statusLabel, statusCls
  if (expired) {
    statusLabel = 'Expired — Renewal Required'
    statusCls   = 'text-red-500 bg-red-50 border-red-200'
  } else if (expiring) {
    statusLabel = `Expiring in ${days} day${days !== 1 ? 's' : ''}`
    statusCls   = 'text-amber-600 bg-amber-50 border-amber-200'
  } else if (active) {
    statusLabel = `Active · ${days} days remaining`
    statusCls   = 'text-emerald-600 bg-emerald-50 border-emerald-200'
  } else {
    statusLabel = 'Pending — Signature Required'
    statusCls   = 'text-red-500 bg-red-50 border-red-200'
  }

  return (
    <div className={cn(
      'rounded-2xl border transition-all overflow-hidden',
      active && !expiring ? 'border-emerald-200' : expired ? 'border-red-200' : expiring ? 'border-amber-200' : 'border-slate-200'
    )}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center gap-4 px-6 py-4 text-left bg-white',
          'hover:bg-slate-50 transition-colors'
        )}
      >
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          active && !expiring ? 'bg-emerald-100' : expired ? 'bg-red-100' : expiring ? 'bg-amber-100' : 'bg-slate-100'
        )}>
          {active && !expired
            ? <CheckCircle2 size={20} className={expiring ? 'text-amber-500' : 'text-emerald-600'} />
            : expired
              ? <AlertTriangle size={20} className="text-red-500" />
              : <FileText size={20} className="text-slate-500" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{doc.title}</p>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block', statusCls)}>
            {statusLabel}
          </span>
        </div>

        {/* View signed doc button */}
        {record && (
          <button
            onClick={(e) => { e.stopPropagation(); openSignedDoc(record) }}
            className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium shrink-0 mr-2 transition-colors"
          >
            <ExternalLink size={12} />
            View Signed Doc
          </button>
        )}

        {expanded
          ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />
        }
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100 bg-white">
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{doc.desc}</p>

          {/* Renewal warning */}
          {(expired || expiring) && record && (
            <div className={cn(
              'mt-4 flex items-start gap-3 rounded-xl px-4 py-3 border',
              expired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            )}>
              <AlertTriangle size={15} className={cn('shrink-0 mt-0.5', expired ? 'text-red-500' : 'text-amber-500')} />
              <div>
                <p className={cn('text-sm font-medium', expired ? 'text-red-800' : 'text-amber-800')}>
                  {expired ? 'This agreement has expired and must be renewed.' : `This agreement expires in ${days} day${days !== 1 ? 's' : ''}. Please renew soon.`}
                </p>
                <p className={cn('text-xs mt-0.5', expired ? 'text-red-600' : 'text-amber-600')}>
                  Previous version: v{record.version} · Signed {new Date(record.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* Template PDF preview link */}
          <div className="mt-4">
            <button
              onClick={() => setPdfOpen((v) => !v)}
              className="flex items-center gap-2 text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
            >
              <ExternalLink size={13} />
              {pdfOpen ? 'Hide document preview' : 'Preview the agreement template'}
            </button>
            {pdfOpen && (
              <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src={doc.pdfPath}
                  title={doc.title}
                  className="w-full"
                  style={{ height: '500px' }}
                />
              </div>
            )}
          </div>

          {/* Already active — show confirmation */}
          {active && !expired && !expiring && (
            <div className="mt-5 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Signed by <span style={{ fontFamily: '"Dancing Script", cursive', fontSize: '16px' }}>{record.signatureText}</span>
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {new Date(record.signedAt).toLocaleString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })} · {record.ipNote} · v{record.version}
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  Active through {new Date(record.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* Signing form (shown when: never signed, expired, or expiring soon with option to renew early) */}
          {(!active || expired) && (
            <div className="mt-5 space-y-4">
              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-brand-500 h-4 w-4 shrink-0"
                />
                <span className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                  I have read and agree to all terms of the <strong>{doc.title}</strong>.
                </span>
              </label>

              {/* Typed signature */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type your full legal name to sign
                </label>
                <input
                  type="text"
                  value={sig}
                  onChange={(e) => setSig(e.target.value)}
                  placeholder={signerName ?? 'Your full name'}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm transition-colors outline-none',
                    'border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20',
                  )}
                  style={{ fontFamily: '"Dancing Script", "Brush Script MT", cursive', fontSize: '20px', color: '#1a1a1a' }}
                />
                <p className="text-[11px] text-slate-400">
                  By typing your name above you agree this constitutes a legally binding electronic signature under the ESIGN Act.
                </p>
              </div>

              {/* Sign button */}
              <button
                onClick={handleSign}
                disabled={!canSign || submitting}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  canSign && !submitting
                    ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {submitting ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : expired ? (
                  <RefreshCw size={14} />
                ) : (
                  <Pen size={14} />
                )}
                {submitting ? 'Signing…' : expired ? `Renew ${doc.title}` : `Sign ${doc.title}`}
              </button>

              <p className="text-[11px] text-slate-400">
                After signing, your completed document will open automatically so you can save a copy.
              </p>
            </div>
          )}

          {/* Expiring soon — offer early renewal */}
          {active && expiring && !expired && (
            <div className="mt-5 space-y-4">
              <p className="text-xs text-amber-700 font-medium">Renew early by signing below. Your new term will start today.</p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-brand-500 h-4 w-4 shrink-0"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I have read and agree to all terms of the <strong>{doc.title}</strong>.
                </span>
              </label>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type your full legal name to renew
                </label>
                <input
                  type="text"
                  value={sig}
                  onChange={(e) => setSig(e.target.value)}
                  placeholder={signerName ?? 'Your full name'}
                  className="w-full rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 px-4 py-2.5 outline-none"
                  style={{ fontFamily: '"Dancing Script", "Brush Script MT", cursive', fontSize: '20px', color: '#1a1a1a' }}
                />
              </div>

              <button
                onClick={handleSign}
                disabled={!canSign || submitting}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  canSign && !submitting
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {submitting
                  ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <RefreshCw size={14} />
                }
                {submitting ? 'Renewing…' : 'Renew Agreement'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DesignerAgreements() {
  const user     = useAuthStore(selectUser)
  const isActive = useAgreementStore((s) => s.isActive)
  const isExpired = useAgreementStore((s) => s.isExpired)

  const allActive  = DOCS.every((d) => isActive(user?.id, d.id))
  const anyExpired = DOCS.some((d) => isExpired(user?.id, d.id))

  return (
    <PortalLayout>
      <PageHeader
        title="Legal Agreements"
        subtitle="Review and sign all required documents before starting work."
        className="mb-6"
      />

      {anyExpired && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Agreement renewal required</p>
            <p className="text-xs text-red-600 mt-0.5">One or more of your agreements has expired. Please renew to stay active.</p>
          </div>
        </div>
      )}

      {allActive && !anyExpired && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6">
          <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All agreements on file</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              You're fully onboarded. Signed copies are saved on the business side.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {DOCS.map((doc) => (
          <SigningPanel
            key={doc.id}
            doc={doc}
            signerId={user?.id}
            signerName={user?.name}
            signerEmail={user?.email}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-6 leading-relaxed">
        Electronic signatures collected via the EML Portal are legally binding under the ESIGN Act and UETA.
        All agreements are valid for one (1) year from the date signed and will prompt renewal automatically.
      </p>
    </PortalLayout>
  )
}
