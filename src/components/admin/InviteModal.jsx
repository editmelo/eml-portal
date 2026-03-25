import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Send, UserPlus, Palette } from 'lucide-react'
import { cn } from '../../lib/utils'
import useInviteStore from '../../store/inviteStore'
import { sendInviteEmail, INVITE_TEMPLATES } from '../../lib/emailService'
import toast from 'react-hot-toast'

const FOUND_US_OPTIONS = [
  'Google Search',
  'Social Media',
  'Referral',
  'Word of Mouth',
  'LinkedIn',
  'Other',
]

const TEMPLATE_LABELS = {
  standard: 'Standard',
  warm:     'Warm & Personal',
  brief:    'Brief',
}

export default function InviteModal({ onClose, isDark, defaultRole = 'CLIENT' }) {
  const addInvite = useInviteStore((s) => s.addInvite)

  const [role,        setRole]        = useState(defaultRole) // 'CLIENT' | 'DESIGNER'
  const [companyName, setCompanyName] = useState('')
  const [ownerName,   setOwnerName]   = useState('')
  const [email,       setEmail]       = useState('')

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [displayName,  setDisplayName]  = useState('')
  const [jobTitle,     setJobTitle]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [location,     setLocation]     = useState('')
  const [foundUs,      setFoundUs]      = useState('')

  // Message
  const [templateKey, setTemplateKey] = useState('standard')
  const [message,     setMessage]     = useState(
    INVITE_TEMPLATES[defaultRole].standard(ownerName || 'there')
  )

  const [sending, setSending] = useState(false)

  // When name or role changes, refresh message if still matching a template
  const applyTemplate = (key, forRole = role, forName = ownerName) => {
    setTemplateKey(key)
    setMessage(INVITE_TEMPLATES[forRole][key](forName || 'there'))
  }

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    applyTemplate(templateKey, newRole, ownerName)
  }

  const handleNameBlur = () => {
    if (templateKey) applyTemplate(templateKey, role, ownerName)
  }

  const handleSend = async () => {
    if (!ownerName.trim()) { toast.error('Owner name is required'); return }
    if (!email.trim())     { toast.error('Email address is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Enter a valid email address'); return }

    setSending(true)
    try {
      await addInvite({ role, companyName, ownerName, email, displayName, jobTitle, phone, location, foundUs, message })
      await sendInviteEmail({ role, ownerName, email, companyName, message })
      onClose()
    } finally {
      setSending(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const surface    = isDark ? 'bg-admin-surface border-admin-border' : 'bg-white border-slate-200'
  const inputCls   = cn(
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
    isDark
      ? 'bg-admin-bg border-admin-border text-slate-200 placeholder-slate-600 focus:ring-brand-400/40'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-brand-500/30'
  )
  const labelCls   = cn('block text-xs font-medium mb-1.5', isDark ? 'text-slate-400' : 'text-slate-500')
  const headText   = isDark ? 'text-white' : 'text-slate-800'
  const subText    = isDark ? 'text-slate-400' : 'text-slate-500'
  const divider    = isDark ? 'border-admin-border' : 'border-slate-100'
  const sectionLbl = cn('text-[10px] font-bold uppercase tracking-widest mb-3', subText)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={cn(
        'w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden',
        'max-h-[92vh]',
        surface
      )}>

        {/* ── Header ── */}
        <div className={cn('flex items-center justify-between px-6 py-4 border-b shrink-0', divider)}>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center',
              isDark ? 'bg-brand-500/15' : 'bg-brand-500/10'
            )}>
              <UserPlus size={15} className="text-brand-500" />
            </div>
            <p className={cn('text-sm font-semibold', headText)}>Send Invite</p>
          </div>
          <button
            onClick={onClose}
            className={cn('h-7 w-7 rounded-full flex items-center justify-center transition-colors', isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Role toggle */}
          <div>
            <p className={sectionLbl}>Inviting as</p>
            <div className={cn('inline-flex rounded-xl p-1 border', isDark ? 'bg-admin-bg border-admin-border' : 'bg-slate-100 border-slate-200')}>
              {[['CLIENT', 'Client', 'emerald'], ['DESIGNER', 'Designer', 'brand']].map(([val, label, color]) => (
                <button
                  key={val}
                  onClick={() => handleRoleChange(val)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                    role === val
                      ? color === 'emerald'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-brand-500 text-white shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div>
            <p className={sectionLbl}>Basic Info</p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Business / Company Name</label>
                <input className={inputCls} placeholder="Acme Studio" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Owner / Person Name <span className="text-red-400">*</span></label>
                <input className={inputCls} placeholder="Jordan Rivera" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} onBlur={handleNameBlur} />
              </div>
              <div>
                <label className={labelCls}>Email Address <span className="text-red-400">*</span></label>
                <input className={inputCls} type="email" placeholder="jordan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Advanced toggle */}
          <div className={cn('border rounded-xl overflow-hidden', divider)}>
            <button
              onClick={() => setShowAdvanced((o) => !o)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
              )}
            >
              <span className={cn('text-sm font-medium', headText)}>More Info <span className={cn('text-xs font-normal', subText)}>(optional)</span></span>
              {showAdvanced
                ? <ChevronUp size={15} className={subText} />
                : <ChevronDown size={15} className={subText} />
              }
            </button>

            {showAdvanced && (
              <div className={cn('px-4 pb-4 border-t space-y-3', divider)}>
                <div className="pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Display Name</label>
                    <input className={inputCls} placeholder="Jordan" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Job Title</label>
                    <input className={inputCls} placeholder="Founder & CEO" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input className={inputCls} type="tel" placeholder="(555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Location</label>
                    <input className={inputCls} placeholder="Austin, TX" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>How did they find us?</label>
                  <select
                    className={cn(inputCls, 'cursor-pointer')}
                    value={foundUs}
                    onChange={(e) => setFoundUs(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {FOUND_US_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={sectionLbl} style={{ marginBottom: 0 }}>Message</p>
              <div className="flex items-center gap-1">
                <Palette size={11} className={subText} />
                <span className={cn('text-[10px]', subText)}>Templates</span>
              </div>
            </div>

            {/* Template chips */}
            <div className="flex gap-1.5 mb-2.5 flex-wrap">
              {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                    templateKey === key
                      ? 'bg-brand-500 text-white border-brand-500'
                      : isDark
                        ? 'border-admin-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              className={cn(inputCls, 'resize-none leading-relaxed')}
              placeholder="Write a personal message…"
              value={message}
              onChange={(e) => { setMessage(e.target.value); setTemplateKey(null) }}
            />
            <p className={cn('text-[10px] mt-1', subText)}>This message will be included in the invite email.</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={cn('flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0', divider)}>
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              isDark
                ? 'border-admin-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
                : 'border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors',
              'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50'
            )}
          >
            {sending
              ? <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={13} />
            }
            {sending ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
