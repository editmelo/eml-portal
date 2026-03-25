import { useState, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import useThemeStore from '../../store/themeStore'
import useAgreementStore from '../../store/agreementStore'
import useProposalStore from '../../store/proposalStore'
import { generateSignedDocHtml } from '../../lib/agreementDocs'
import { generateProposalHtml, generateServiceAgreementHtml, generateAddendumHtml } from '../../lib/proposalDocs'
import { cn } from '../../lib/utils'
import {
  ShieldCheck, FileText, Search, ExternalLink, AlertTriangle, RefreshCw,
  Plus, ClipboardList, ScrollText, CheckCircle2, Clock, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react'
import ProposalModal, { AddendumModal } from '../../components/admin/ProposalModal'

const DOC_COLORS = {
  subcontractor: 'text-brand-400 bg-brand-400/10',
  nda:           'text-purple-400 bg-purple-400/10',
  service:       'text-emerald-400 bg-emerald-400/10',
}

const AGREEMENT_TABS = ['All', 'Active', 'Expiring Soon', 'Expired', 'Designers', 'Clients']

const PROPOSAL_STATUS_CONFIG = {
  draft:    { label: 'Draft',             color: 'text-slate-400 bg-slate-400/10' },
  sent:     { label: 'Awaiting Response', color: 'text-amber-400 bg-amber-400/10' },
  accepted: { label: 'Accepted',          color: 'text-emerald-400 bg-emerald-400/10' },
  denied:   { label: 'Revision Requested', color: 'text-red-400 bg-red-400/10' },
}

function openDoc(html) {
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

function getExpiryStatus(expiresAt) {
  const days = Math.floor((new Date(expiresAt) - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0)   return { label: 'Expired',       color: 'text-red-400 bg-red-400/10',     days }
  if (days <= 30) return { label: `${days}d left`,  color: 'text-amber-400 bg-amber-400/10', days }
  return             { label: 'Active',             color: 'text-emerald-400 bg-emerald-400/10', days }
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Proposal Row ──────────────────────────────────────────────────────────────

function ProposalRow({ proposal, isDark, onRevise }) {
  const [open, setOpen] = useState(false)
  const textHead = isDark ? 'text-white'     : 'text-slate-800'
  const textSub  = isDark ? 'text-slate-400' : 'text-slate-500'
  const divider  = isDark ? 'border-admin-border/50' : 'border-slate-100'

  const statusCfg = PROPOSAL_STATUS_CONFIG[proposal.status] ?? PROPOSAL_STATUS_CONFIG.draft

  return (
    <>
      <tr className={cn('border-b transition-colors', isDark ? 'border-admin-border/50 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50')}>
        {/* Client */}
        <td className="px-5 py-4">
          <p className={cn('font-medium text-sm', textHead)}>{proposal.clientName}</p>
          <p className={cn('text-xs', textSub)}>{proposal.clientEmail}</p>
        </td>
        {/* Project + Service */}
        <td className="px-5 py-4">
          <p className={cn('text-sm font-medium', textHead)}>{proposal.projectName}</p>
          <p className={cn('text-xs', textSub)}>{proposal.serviceTitle}</p>
          {proposal.packageTier && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-400/10 text-brand-400 mt-0.5 inline-block">
              {proposal.packageTier}
            </span>
          )}
        </td>
        {/* Version */}
        <td className="px-5 py-4">
          <span className={cn('text-sm', textSub)}>v{proposal.version}</span>
        </td>
        {/* Sent */}
        <td className="px-5 py-4">
          <p className={cn('text-sm', textHead)}>
            {proposal.sentAt ? fmtDate(proposal.sentAt) : <span className={cn('italic', textSub)}>Not sent</span>}
          </p>
        </td>
        {/* Status */}
        <td className="px-5 py-4">
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium w-fit block', statusCfg.color)}>
            {statusCfg.label}
          </span>
        </td>
        {/* Amount */}
        <td className="px-5 py-4">
          <p className={cn('text-sm font-medium', textHead)}>{fmtCurrency(proposal.totalAmount)}</p>
        </td>
        {/* Actions */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            {proposal.status !== 'draft' && (
              <button
                onClick={() => openDoc(generateProposalHtml(proposal))}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium whitespace-nowrap"
              >
                <ExternalLink size={11} /> View
              </button>
            )}
            {proposal.status === 'denied' && (
              <button
                onClick={() => onRevise(proposal)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium whitespace-nowrap"
              >
                <RotateCcw size={11} /> Revise
              </button>
            )}
            {proposal.revisions?.length > 0 && (
              <button
                onClick={() => setOpen((s) => !s)}
                className={cn('flex items-center gap-1 text-xs transition-colors', textSub)}
              >
                {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        </td>
      </tr>
      {open && proposal.revisions?.map((rev) => (
        <tr key={rev.round} className={cn('border-b', divider, isDark ? 'bg-white/2' : 'bg-slate-50/80')}>
          <td colSpan={7} className="px-8 py-3">
            <div className={cn('text-xs', textSub)}>
              <span className="font-semibold text-amber-400 mr-2">Round {rev.round} revision</span>
              <span className="mr-3">Denied {fmtDate(rev.deniedAt)}</span>
              {rev.denialNotes && <span className="italic">"{rev.denialNotes}"</span>}
              {rev.revisedAt && <span className="ml-3 text-emerald-400">→ Revised {fmtDate(rev.revisedAt)}</span>}
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAgreements() {
  const adminTheme = useThemeStore((s) => s.adminTheme)
  const isDark     = adminTheme === 'dark'

  const agreements         = useAgreementStore((s) => s.agreements)
  const proposals          = useProposalStore((s) => s.proposals)
  const serviceAgreements  = useProposalStore((s) => s.serviceAgreements)
  const addendums          = useProposalStore((s) => s.addendums)


  const [section,          setSection]          = useState('Agreements') // 'Agreements' | 'Proposals'
  const [agrTab,           setAgrTab]           = useState('All')
  const [search,           setSearch]           = useState('')
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showAddendumModal,  setShowAddendumModal]  = useState(false)
  const [revisingProposal,  setRevisingProposal]  = useState(null)

  // ── Agreements filter ──────────────────────────────────────────────────────
  const filteredAgreements = useMemo(() => {
    let list = [...agreements]
    if (agrTab === 'Active')        list = list.filter((a) => new Date(a.expiresAt) > new Date())
    if (agrTab === 'Expired')       list = list.filter((a) => new Date(a.expiresAt) <= new Date())
    if (agrTab === 'Expiring Soon') {
      list = list.filter((a) => {
        const days = Math.floor((new Date(a.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24))
        return days >= 0 && days <= 30
      })
    }
    if (agrTab === 'Designers') list = list.filter((a) => a.signerRole === 'DESIGNER')
    if (agrTab === 'Clients')   list = list.filter((a) => a.signerRole === 'CLIENT')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        a.signerName.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.signerEmail?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt))
  }, [agreements, agrTab, search])

  // ── Agreement stats ────────────────────────────────────────────────────────
  const total    = agreements.length
  const active   = agreements.filter((a) => new Date(a.expiresAt) > new Date()).length
  const expired  = agreements.filter((a) => new Date(a.expiresAt) <= new Date()).length
  const expiring = agreements.filter((a) => {
    const d = Math.floor((new Date(a.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24))
    return d >= 0 && d <= 30
  }).length

  const agrStats = [
    { label: 'Total Signed',  value: total,    color: 'text-brand-400' },
    { label: 'Active',        value: active,   color: 'text-emerald-400' },
    { label: 'Expiring Soon', value: expiring, color: 'text-amber-400' },
    { label: 'Expired',       value: expired,  color: 'text-red-400' },
  ]

  // ── Proposal stats ─────────────────────────────────────────────────────────
  const propStats = [
    { label: 'Total Proposals',  value: proposals.length,                                          color: 'text-brand-400' },
    { label: 'Awaiting Response', value: proposals.filter((p) => p.status === 'sent').length,      color: 'text-amber-400' },
    { label: 'Accepted',          value: proposals.filter((p) => p.status === 'accepted').length,  color: 'text-emerald-400' },
    { label: 'Service Agreements Signed', value: serviceAgreements.filter((s) => s.status === 'signed').length, color: 'text-purple-400' },
  ]

  const textHead = isDark ? 'text-white'     : 'text-slate-800'
  const textSub  = isDark ? 'text-slate-400' : 'text-slate-500'
  const divider  = isDark ? 'border-admin-border' : 'border-slate-200'

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          dark={isDark}
          title="Agreements Vault"
          subtitle="Signed agreements, proposals, service contracts, and addendums."
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddendumModal(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
              isDark ? 'border-admin-border text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Plus size={13} /> New Addendum
          </button>
          <button
            onClick={() => setShowProposalModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
          >
            <ClipboardList size={13} /> New Proposal
          </button>
        </div>
      </div>

      {/* Section toggle */}
      <div className={cn('inline-flex rounded-xl p-1 border mb-6', isDark ? 'bg-admin-bg border-admin-border' : 'bg-slate-100 border-slate-200')}>
        {['Agreements', 'Proposals & Contracts'].map((s) => (
          <button
            key={s}
            onClick={() => setSection(s === 'Proposals & Contracts' ? 'Proposals' : s)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              (section === 'Agreements' ? s === 'Agreements' : s === 'Proposals & Contracts')
                ? 'bg-brand-500 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── AGREEMENTS SECTION ── */}
      {section === 'Agreements' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {agrStats.map((s) => (
              <DarkCard key={s.label} className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
                <p className={cn('text-3xl font-bold', s.color)}>{s.value}</p>
              </DarkCard>
            ))}
          </div>

          <DarkCard>
            {/* Toolbar */}
            <div className={cn('flex flex-wrap items-center gap-3 px-6 py-4 border-b', divider)}>
              <div className="flex items-center gap-1 flex-wrap">
                {AGREEMENT_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setAgrTab(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      agrTab === t
                        ? 'bg-brand-500 text-white'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="admin-input pl-8 py-1.5 text-xs w-52"
                  placeholder="Search name, doc, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredAgreements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <ShieldCheck size={36} className="text-slate-600 mb-3" />
                <p className={cn('text-sm font-medium mb-1', textHead)}>No agreements found</p>
                <p className={cn('text-xs', textSub)}>
                  {agreements.length === 0
                    ? 'Signed agreements will appear here once designers or clients sign them.'
                    : 'Try adjusting your filter or search.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', divider)}>
                      {['Signer', 'Document', 'Signed', 'Expires', 'Status', 'Signature', 'Signed Document'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgreements.map((agr) => {
                      const expiry = getExpiryStatus(agr.expiresAt)
                      return (
                        <tr key={agr.id} className={cn('border-b transition-colors', isDark ? 'border-admin-border/50 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50')}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', agr.signerRole === 'DESIGNER' ? 'bg-brand-400/10 text-brand-400' : 'bg-emerald-400/10 text-emerald-400')}>
                                {agr.signerRole === 'DESIGNER' ? 'Designer' : 'Client'}
                              </span>
                            </div>
                            <p className={cn('font-medium text-sm mt-1', textHead)}>{agr.signerName}</p>
                            {agr.signerEmail && <p className={cn('text-xs', textSub)}>{agr.signerEmail}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn('p-1 rounded-md', DOC_COLORS[agr.docId] ?? 'text-slate-400 bg-slate-400/10')}>
                                <FileText size={13} />
                              </span>
                              <div>
                                <p className={cn('text-sm', textHead)}>{agr.title}</p>
                                <p className={cn('text-[10px]', textSub)}>v{agr.version}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className={cn('text-sm', textHead)}>
                              {new Date(agr.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className={cn('text-xs', textSub)}>
                              {new Date(agr.signedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className={cn('text-sm', textHead)}>
                              {new Date(agr.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit', expiry.color)}>
                              {expiry.days < 0 ? <AlertTriangle size={11} /> : expiry.days <= 30 ? <RefreshCw size={11} /> : <ShieldCheck size={11} />}
                              {expiry.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-slate-300 text-lg" style={{ fontFamily: '"Dancing Script", "Brush Script MT", cursive' }}>
                              {agr.signatureText}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => openDoc(generateSignedDocHtml(agr))}
                              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium whitespace-nowrap"
                            >
                              <ExternalLink size={12} /> Open & Save
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredAgreements.length > 0 && (
              <div className={cn('px-6 py-3 border-t', divider)}>
                <p className={cn('text-xs', textSub)}>
                  {filteredAgreements.length} record{filteredAgreements.length !== 1 ? 's' : ''}
                  {agrTab !== 'All' || search ? ' matching current filter' : ' total'}
                </p>
              </div>
            )}
          </DarkCard>
        </>
      )}

      {/* ── PROPOSALS & CONTRACTS SECTION ── */}
      {section === 'Proposals' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {propStats.map((s) => (
              <DarkCard key={s.label} className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
                <p className={cn('text-3xl font-bold', s.color)}>{s.value}</p>
              </DarkCard>
            ))}
          </div>

          {/* Proposals table */}
          <DarkCard className="mb-6">
            <div className={cn('px-6 py-4 border-b flex items-center justify-between', divider)}>
              <p className={cn('text-sm font-semibold', textHead)}>Project Proposals</p>
              <span className={cn('text-xs', textSub)}>{proposals.length} total</span>
            </div>
            {proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardList size={32} className="text-slate-600 mb-3" />
                <p className={cn('text-sm font-medium mb-1', textHead)}>No proposals yet</p>
                <p className={cn('text-xs', textSub)}>Click "New Proposal" to create and send one to a client.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', divider)}>
                      {['Client', 'Project / Service', 'Version', 'Sent', 'Status', 'Amount', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map((p) => (
                      <ProposalRow
                        key={p.id}
                        proposal={p}
                        isDark={isDark}
                        onRevise={(prop) => setRevisingProposal(prop)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DarkCard>

          {/* Service Agreements table */}
          <DarkCard className="mb-6">
            <div className={cn('px-6 py-4 border-b flex items-center justify-between', divider)}>
              <p className={cn('text-sm font-semibold', textHead)}>Service Agreements</p>
              <span className={cn('text-xs', textSub)}>{serviceAgreements.length} total</span>
            </div>
            {serviceAgreements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ScrollText size={28} className="text-slate-600 mb-3" />
                <p className={cn('text-xs', textSub)}>Service agreements appear here once a client accepts a proposal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', divider)}>
                      {['Client', 'Project', 'Service', 'Amount', 'Status', 'Signature', 'Document'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {serviceAgreements.map((sa) => (
                      <tr key={sa.id} className={cn('border-b transition-colors', isDark ? 'border-admin-border/50 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50')}>
                        <td className="px-5 py-4">
                          <p className={cn('font-medium text-sm', textHead)}>{sa.clientName}</p>
                          <p className={cn('text-xs', textSub)}>{sa.clientEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className={cn('text-sm', textHead)}>{sa.projectName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className={cn('text-sm', textHead)}>{sa.serviceTitle}</p>
                          {sa.packageTier && <p className={cn('text-xs', textSub)}>{sa.packageTier}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className={cn('text-sm font-medium', textHead)}>{fmtCurrency(sa.totalAmount)}</p>
                        </td>
                        <td className="px-5 py-4">
                          {sa.status === 'signed' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit text-emerald-400 bg-emerald-400/10">
                              <CheckCircle2 size={11} /> Signed
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit text-amber-400 bg-amber-400/10">
                              <Clock size={11} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {sa.signatureText && (
                            <p className="text-slate-300 text-lg" style={{ fontFamily: '"Dancing Script", "Brush Script MT", cursive' }}>
                              {sa.signatureText}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {sa.status === 'signed' && (
                            <button
                              onClick={() => openDoc(generateServiceAgreementHtml(sa))}
                              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium whitespace-nowrap"
                            >
                              <ExternalLink size={12} /> Open & Save
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DarkCard>

          {/* Addendums table */}
          {addendums.length > 0 && (
            <DarkCard>
              <div className={cn('px-6 py-4 border-b flex items-center justify-between', divider)}>
                <p className={cn('text-sm font-semibold', textHead)}>Addendums</p>
                <span className={cn('text-xs', textSub)}>{addendums.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', divider)}>
                      {['Client', 'Project', 'Title', 'Extra Cost', 'Status', 'Document'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addendums.map((add) => (
                      <tr key={add.id} className={cn('border-b transition-colors', isDark ? 'border-admin-border/50 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50')}>
                        <td className="px-5 py-4">
                          <p className={cn('font-medium text-sm', textHead)}>{add.clientName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className={cn('text-sm', textHead)}>{add.projectName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className={cn('text-sm', textHead)}>{add.title}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className={cn('text-sm', textHead)}>
                            {add.additionalCost > 0 ? fmtCurrency(add.additionalCost) : '—'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {add.status === 'signed' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit text-emerald-400 bg-emerald-400/10">
                              <CheckCircle2 size={11} /> Signed
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit text-amber-400 bg-amber-400/10">
                              <Clock size={11} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {add.status === 'signed' && (
                            <button
                              onClick={() => openDoc(generateAddendumHtml(add))}
                              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium whitespace-nowrap"
                            >
                              <ExternalLink size={12} /> Open & Save
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DarkCard>
          )}
        </>
      )}

      {/* Modals */}
      {showProposalModal && (
        <ProposalModal
          isDark={isDark}
          onClose={() => setShowProposalModal(false)}
        />
      )}
      {revisingProposal && (
        <ProposalModal
          isDark={isDark}
          existingProposal={revisingProposal}
          onClose={() => setRevisingProposal(null)}
        />
      )}
      {showAddendumModal && (
        <AddendumModal
          isDark={isDark}
          onClose={() => setShowAddendumModal(false)}
        />
      )}
    </AdminLayout>
  )
}
