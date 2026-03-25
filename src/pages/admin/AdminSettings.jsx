import { useState, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import useAuthStore, { selectUser } from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { cn } from '../../lib/utils'
import {
  User, Bell, Monitor, BookOpen, Camera,
  Sun, Moon, ChevronDown, ChevronUp,
  Check, LayoutDashboard, FolderKanban, Users,
  Wallet, BarChart3, ClipboardList, Upload,
} from 'lucide-react'

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'display',       label: 'Display',       icon: Monitor },
  { id: 'guide',         label: 'App Guide',     icon: BookOpen },
]

// ── App Guide content ─────────────────────────────────────────────────────────
const GUIDE_SECTIONS = [
  {
    title: 'Business Portal Overview',
    icon: LayoutDashboard,
    items: [
      {
        term: 'At a Glance (Dashboard)',
        desc: 'Your home base. See a snapshot of monthly revenue, YTD revenue, active projects, and open leads at a glance. A daily motivational quote refreshes each morning to keep you inspired.',
      },
      {
        term: 'Revenue Goal Progress',
        desc: 'Each stat card on the dashboard shows a progress bar toward your monthly or annual goal. These are set in your financial records and update in real time as invoices are paid.',
      },
    ],
  },
  {
    title: 'Projects',
    icon: FolderKanban,
    items: [
      {
        term: 'Project Status: Lead',
        desc: 'A potential client who has expressed interest but has not yet signed or paid. Leads can be converted to Active projects once onboarding begins.',
      },
      {
        term: 'Project Status: Active',
        desc: 'Work is currently in progress. The designer is working on deliverables and the client has been onboarded.',
      },
      {
        term: 'Project Status: Review',
        desc: 'Drafts have been uploaded by the designer and are awaiting client feedback or approval. The client can leave pinned comments directly on the draft images.',
      },
      {
        term: 'Project Status: Offboarding',
        desc: 'The project has been approved and is in its final wrap-up phase — final files are being delivered and the relationship is being closed gracefully.',
      },
      {
        term: 'Project Status: Lost',
        desc: 'The lead or project did not convert or was cancelled. Kept for record-keeping and reporting purposes.',
      },
      {
        term: 'Progress Bar',
        desc: 'Each project shows a percentage complete. This reflects milestones like onboarding, draft delivery, revisions, and final approval.',
      },
    ],
  },
  {
    title: 'Lead Management',
    icon: Users,
    items: [
      {
        term: 'Lead',
        desc: 'A prospective client in the pipeline. Leads include their name, contact info, budget, and current status. Once a deal is confirmed, you can convert a lead directly into an active project.',
      },
      {
        term: 'Convert to Project',
        desc: 'One-click action that moves a lead into the Projects list with Active status and archives them from the leads view.',
      },
    ],
  },
  {
    title: 'Designer Payroll',
    icon: Wallet,
    items: [
      {
        term: 'Designer Payroll',
        desc: 'Track what each subcontractor designer is owed per project. Payout amounts can be edited inline. This is separate from client invoices — it reflects your cost side of the business.',
      },
      {
        term: 'Payout Status',
        desc: 'Each payroll entry shows Pending or Paid. Update status once a designer has been compensated via your preferred payment method.',
      },
    ],
  },
  {
    title: 'Financials',
    icon: BarChart3,
    items: [
      {
        term: 'Revenue Overview',
        desc: 'View current month and year-to-date revenue totals, broken down by paid invoices. Compare against your monthly and annual goals.',
      },
      {
        term: 'Expenses',
        desc: 'Costs associated with running the business — software, contractor payouts, marketing, etc. Tracked against revenue to show net profit.',
      },
      {
        term: 'Net Profit',
        desc: 'Revenue minus expenses for a given period. This is what the business actually keeps after paying costs.',
      },
      {
        term: 'Invoice Statuses',
        desc: 'Draft: not yet sent. Pending: sent and awaiting payment. Paid: received. Overdue: past due date with no payment.',
      },
    ],
  },
  {
    title: 'Client Portal',
    icon: ClipboardList,
    items: [
      {
        term: 'Onboarding',
        desc: 'New clients fill out a questionnaire covering their brand, goals, design preferences, and deliverable expectations. This populates their project brief.',
      },
      {
        term: 'My Project',
        desc: "Client's view of their active project — status, timeline, assigned designer, and progress milestones.",
      },
      {
        term: 'Drafts & Review',
        desc: 'Clients can view uploaded draft images and leave pinned comments by clicking anywhere on the image. Each comment is anchored to a specific spot on the design.',
      },
      {
        term: 'Invoices (Client)',
        desc: 'Clients see their billing history — amounts, due dates, and payment status. They can pay directly from this view (when connected to a payment processor).',
      },
      {
        term: 'Schedule',
        desc: 'Book a call or check-in directly from the portal. Opens the Edit Me Lo scheduling calendar so clients can find an available time.',
      },
    ],
  },
  {
    title: 'Designer Portal',
    icon: Upload,
    items: [
      {
        term: 'My Projects (Designer)',
        desc: 'Designers see only the projects they are assigned to. Each project shows the brief, client info, and current status.',
      },
      {
        term: 'Upload Drafts',
        desc: 'Drag-and-drop file upload for design deliverables. Once submitted, the project status automatically updates to "Review" so Lo and the client are notified.',
      },
      {
        term: 'Earnings',
        desc: "Designer's view of their payout history — which projects they've completed, expected payment amounts, and whether they've been paid.",
      },
      {
        term: 'Agreements',
        desc: 'Access to the subcontractor agreement and any active NDAs or project-specific contracts between the designer and Edit Me Lo.',
      },
    ],
  },
]

// ── Reusable styled components ────────────────────────────────────────────────
function SettingCard({ children, className, isDark }) {
  return (
    <div className={cn(
      'rounded-xl border p-5',
      isDark
        ? 'bg-admin-surface border-admin-border'
        : 'bg-white border-slate-200 shadow-sm',
      className
    )}>
      {children}
    </div>
  )
}

function SectionLabel({ children, isDark }) {
  return (
    <p className={cn(
      'text-[11px] font-bold uppercase tracking-widest mb-3',
      isDark ? 'text-slate-500' : 'text-slate-600'
    )}>
      {children}
    </p>
  )
}

function Divider({ isDark }) {
  return <div className={cn('my-4 border-t', isDark ? 'border-admin-border' : 'border-slate-100')} />
}

function Toggle({ enabled, onToggle, isDark }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
        enabled
          ? isDark ? 'bg-admin-accent' : 'bg-brand-500'
          : isDark ? 'bg-slate-700' : 'bg-slate-200'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
        enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
      )} />
    </button>
  )
}

// ── Tab: Profile ──────────────────────────────────────────────────────────────
function ProfileTab({ user, isDark }) {
  const saveProfile    = useAuthStore((s) => s.saveProfile)
  const updatePassword = useAuthStore((s) => s.updatePassword)

  const [form, setForm] = useState({
    name:     user?.name     ?? '',
    email:    user?.email    ?? '',
    business: user?.business ?? 'Edit Me Lo',
    phone:    user?.phone    ?? '',
  })
  const [avatar, setAvatar]     = useState(user?.avatar ?? null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveErr, setSaveErr]   = useState('')
  const [pwForm, setPwForm]     = useState({ current: '', next: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved]   = useState(false)
  const [pwError, setPwError]   = useState('')
  const fileRef                 = useRef(null)

  const text    = isDark ? 'text-white'     : 'text-slate-800'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
    isDark
      ? 'bg-admin-bg border-admin-border text-slate-200 placeholder-slate-600 focus:ring-admin-accent/40'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-brand-500/30'
  )
  const btnCls = cn(
    'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
    isDark
      ? 'bg-admin-accent text-admin-bg hover:bg-[#3ab8e0]'
      : 'bg-brand-500 text-white hover:bg-brand-600'
  )

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 120
        const canvas = document.createElement('canvas')
        canvas.width  = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        // Center-crop to square then scale down
        const min = Math.min(img.width, img.height)
        const sx  = (img.width  - min) / 2
        const sy  = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE)
        setAvatar(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveErr('')
    const result = await saveProfile({ name: form.name, business: form.business, phone: form.phone, avatar })
    setSaving(false)
    if (!result.success) { setSaveErr(result.error ?? 'Failed to save.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePasswordUpdate = async () => {
    setPwError('')
    if (!pwForm.next) { setPwError('Please enter a new password.'); return }
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    setPwSaving(true)
    const result = await updatePassword(pwForm.next)
    setPwSaving(false)
    if (!result.success) { setPwError(result.error ?? 'Failed to update password.'); return }
    setPwSaved(true)
    setPwForm({ current: '', next: '' })
    setTimeout(() => setPwSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      <SettingCard isDark={isDark}>
        <SectionLabel isDark={isDark}>Account Info</SectionLabel>

        <div className="flex items-start gap-4 mb-5">
          <div className="relative shrink-0">
            <div className={cn(
              'h-16 w-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold',
              isDark ? 'bg-admin-accent/20 text-admin-accent' : 'bg-brand-500/10 text-brand-500'
            )}>
              {avatar
                ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                : (form.name?.charAt(0) ?? 'A')
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className={cn(
                'absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center shadow hover:opacity-90 transition-opacity',
                isDark ? 'bg-admin-accent text-admin-bg' : 'bg-brand-500 text-white'
              )}
              title="Upload photo"
            >
              <Camera size={11} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <p className={cn('font-semibold text-sm truncate', text)}>{form.name}</p>
            <p className={cn('text-xs truncate', subText)}>{form.email}</p>
            <span className={cn(
              'inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded',
              isDark ? 'bg-admin-accent/15 text-admin-accent' : 'bg-brand-500/10 text-brand-500'
            )}>
              Business Owner
            </span>
            <p className={cn('text-[10px] mt-1.5', subText)}>Tap camera to change photo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', subText)}>Full Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', subText)}>Email Address</label>
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              type="email"
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', subText)}>Business Name</label>
            <input
              className={inputCls}
              value={form.business}
              onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))}
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', subText)}>Phone</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(555) 000-0000"
              type="tel"
            />
          </div>
        </div>

        <Divider isDark={isDark} />

        <div className="flex flex-wrap items-center gap-3">
          <button className={cn(btnCls, saving && 'opacity-60 cursor-not-allowed')} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className={cn('text-sm font-medium flex items-center gap-1.5', isDark ? 'text-admin-accent' : 'text-brand-500')}><Check size={14} /> Saved!</span>}
          {saveErr && <span className="text-sm text-red-400">{saveErr}</span>}
        </div>
      </SettingCard>

      <SettingCard isDark={isDark}>
        <SectionLabel isDark={isDark}>Password</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', subText)}>Current Password</label>
            <input className={inputCls} type="password" placeholder="••••••••" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', subText)}>New Password</label>
            <input className={inputCls} type="password" placeholder="Min. 6 characters" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} />
          </div>
        </div>
        {pwError && <p className="mt-2 text-xs text-red-400">{pwError}</p>}
        <Divider isDark={isDark} />
        <div className="flex flex-wrap items-center gap-3">
          <button className={cn(btnCls, pwSaving && 'opacity-60 cursor-not-allowed')} onClick={handlePasswordUpdate} disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
          {pwSaved && <span className={cn('text-sm font-medium flex items-center gap-1.5', isDark ? 'text-admin-accent' : 'text-brand-500')}><Check size={14} /> Updated!</span>}
        </div>
      </SettingCard>
    </div>
  )
}

// ── Tab: Notifications ────────────────────────────────────────────────────────
const NOTIF_GROUPS = [
  {
    group: 'Projects',
    items: [
      { id: 'proj_status',   label: 'Project status changes',        sub: 'When a project moves to Review, Offboarding, etc.' },
      { id: 'draft_upload',  label: 'New draft uploaded',            sub: 'When a designer submits files for a project' },
      { id: 'client_comment',label: 'Client leaves a comment',       sub: 'Pinned feedback on draft images' },
    ],
  },
  {
    group: 'Financials',
    items: [
      { id: 'invoice_paid',  label: 'Invoice marked as paid',        sub: 'When a client payment is received' },
      { id: 'invoice_overdue', label: 'Invoice overdue',             sub: 'When a payment passes its due date unpaid' },
      { id: 'payroll_due',   label: 'Designer payout due',           sub: 'Reminder when a designer payout is pending' },
    ],
  },
  {
    group: 'Leads',
    items: [
      { id: 'new_lead',      label: 'New lead submitted',            sub: 'When a prospect fills out your inquiry form' },
      { id: 'lead_converted',label: 'Lead converted to project',     sub: 'Confirmation when you close a deal' },
    ],
  },
]

function NotificationsTab({ isDark }) {
  const [enabled, setEnabled] = useState(() => {
    const init = {}
    NOTIF_GROUPS.forEach((g) => g.items.forEach((i) => { init[i.id] = true }))
    return init
  })
  const text    = isDark ? 'text-slate-200' : 'text-slate-800'
  const subText = isDark ? 'text-slate-500' : 'text-slate-500'

  return (
    <div className="space-y-5">
      {NOTIF_GROUPS.map((g) => (
        <SettingCard key={g.group} isDark={isDark}>
          <SectionLabel isDark={isDark}>{g.group}</SectionLabel>
          <ul className="space-y-4">
            {g.items.map((item, idx) => (
              <li key={item.id}>
                {idx > 0 && <Divider isDark={isDark} />}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div>
                    <p className={cn('text-sm font-medium', text)}>{item.label}</p>
                    <p className={cn('text-xs mt-0.5', subText)}>{item.sub}</p>
                  </div>
                  <Toggle
                    enabled={enabled[item.id]}
                    onToggle={() => setEnabled((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    isDark={isDark}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SettingCard>
      ))}
    </div>
  )
}

// ── Tab: Display ──────────────────────────────────────────────────────────────
function DisplayTab({ isDark, adminTheme, toggleAdminTheme }) {
  const text    = isDark ? 'text-slate-200' : 'text-slate-800'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="space-y-5">
      <SettingCard isDark={isDark}>
        <SectionLabel isDark={isDark}>Theme</SectionLabel>
        <p className={cn('text-sm mb-4', subText)}>
          Choose how the Business portal looks. Client and Designer portals have their own theme setting in their respective Settings pages.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {/* Dark option */}
          <button
            onClick={() => adminTheme !== 'dark' && toggleAdminTheme()}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              adminTheme === 'dark'
                ? 'border-admin-accent bg-admin-bg'
                : isDark
                  ? 'border-admin-border bg-admin-bg/50 hover:border-admin-border/80'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            )}
          >
            {adminTheme === 'dark' && (
              <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-admin-accent flex items-center justify-center">
                <Check size={9} className="text-admin-bg" />
              </span>
            )}
            <div className="h-16 w-full rounded-lg bg-[#07101f] border border-[#193561] flex flex-col p-2 gap-1">
              <div className="h-1.5 w-10 rounded bg-[#193561]" />
              <div className="h-1 w-7 rounded bg-[#193561]" />
              <div className="mt-auto h-1.5 w-full rounded bg-[#0d1f3c]" />
            </div>
            <div className="flex items-center gap-1.5">
              <Moon size={12} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              <span className={cn('text-xs font-medium', text)}>Dark</span>
            </div>
          </button>

          {/* Light option */}
          <button
            onClick={() => adminTheme !== 'light' && toggleAdminTheme()}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              adminTheme === 'light'
                ? 'border-brand-500 bg-blue-50'
                : isDark
                  ? 'border-admin-border bg-admin-bg/50 hover:border-admin-border/80'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            )}
          >
            {adminTheme === 'light' && (
              <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-500 flex items-center justify-center">
                <Check size={9} className="text-white" />
              </span>
            )}
            <div className="h-16 w-full rounded-lg bg-white border border-slate-200 flex flex-col p-2 gap-1">
              <div className="h-1.5 w-10 rounded bg-slate-100" />
              <div className="h-1 w-7 rounded bg-slate-100" />
              <div className="mt-auto h-1.5 w-full rounded bg-slate-50 border border-slate-100" />
            </div>
            <div className="flex items-center gap-1.5">
              <Sun size={12} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              <span className={cn('text-xs font-medium', text)}>Light</span>
            </div>
          </button>
        </div>
      </SettingCard>

      <SettingCard isDark={isDark}>
        <SectionLabel isDark={isDark}>Typography & Density</SectionLabel>
        <p className={cn('text-sm', subText)}>
          The portal uses <strong className={text}>Open Sans</strong> throughout for clean readability. Layout density is optimized for desktop use on all views.
        </p>
      </SettingCard>
    </div>
  )
}

// ── Tab: App Guide ────────────────────────────────────────────────────────────
function AccordionItem({ section, isDark }) {
  const [open, setOpen] = useState(false)
  const Icon = section.icon
  const headText = isDark ? 'text-slate-200' : 'text-slate-800'
  const subText  = isDark ? 'text-slate-400' : 'text-slate-500'
  const termText = isDark ? 'text-admin-accent' : 'text-brand-500'

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      isDark ? 'border-admin-border bg-admin-surface' : 'border-slate-200 bg-white shadow-sm'
    )}>
      <button
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 text-left transition-colors',
          isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
            isDark ? 'bg-admin-accent/15' : 'bg-brand-500/10'
          )}>
            <Icon size={15} className={isDark ? 'text-admin-accent' : 'text-brand-500'} />
          </div>
          <span className={cn('text-sm font-semibold', headText)}>{section.title}</span>
        </div>
        {open
          ? <ChevronUp size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          : <ChevronDown size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        }
      </button>

      {open && (
        <div className={cn(
          'px-5 pb-5 border-t space-y-4',
          isDark ? 'border-admin-border' : 'border-slate-100'
        )}>
          {section.items.map((item) => (
            <div key={item.term} className="pt-4">
              <p className={cn('text-sm font-semibold mb-1', termText)}>{item.term}</p>
              <p className={cn('text-sm leading-relaxed', subText)}>{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AppGuideTab({ isDark }) {
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'
  return (
    <div className="space-y-3">
      <p className={cn('text-sm mb-4', subText)}>
        Everything you need to know about the Edit Me Lo Portal — what each section does and what the terminology means.
      </p>
      {GUIDE_SECTIONS.map((section) => (
        <AccordionItem key={section.title} section={section} isDark={isDark} />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const user           = useAuthStore(selectUser)
  const adminTheme     = useThemeStore((s) => s.adminTheme)
  const toggleAdminTheme = useThemeStore((s) => s.toggleAdminTheme)
  const isDark         = adminTheme === 'dark'

  const [activeTab, setActiveTab] = useState('profile')

  const tabBg    = isDark ? 'bg-admin-surface border-admin-border' : 'bg-white border-slate-200 shadow-sm'
  const tabText  = isDark ? 'text-slate-400' : 'text-slate-500'
  const tabActive = isDark
    ? 'bg-admin-accent/15 text-admin-accent'
    : 'bg-brand-500/10 text-brand-500'
  const tabHover = isDark ? 'hover:text-slate-200 hover:bg-white/5' : 'hover:text-slate-700 hover:bg-slate-50'

  return (
    <AdminLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, preferences, and portal configuration"
        dark={isDark}
        className="mb-6"
      />

      {/* ── Mobile: horizontal scrollable tab pills ── */}
      <div className={cn('flex md:hidden gap-2 overflow-x-auto no-scrollbar pb-1 mb-4')}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors border',
                isActive
                  ? isDark ? 'bg-admin-accent/15 text-admin-accent border-admin-accent/30' : 'bg-brand-500/10 text-brand-500 border-brand-500/20'
                  : isDark ? 'border-admin-border text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={14} className="shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Desktop: sidebar + content side by side ── */}
      <div className="flex gap-6">
        <nav className={cn('hidden md:block w-44 shrink-0 rounded-xl border overflow-hidden self-start', tabBg)}>
          <ul className="py-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left',
                      isActive ? tabActive : cn(tabText, tabHover)
                    )}
                  >
                    <Icon size={15} className="shrink-0" />
                    {tab.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === 'profile'       && <ProfileTab       user={user} isDark={isDark} />}
          {activeTab === 'notifications' && <NotificationsTab isDark={isDark} />}
          {activeTab === 'display'       && <DisplayTab isDark={isDark} adminTheme={adminTheme} toggleAdminTheme={toggleAdminTheme} />}
          {activeTab === 'guide'         && <AppGuideTab isDark={isDark} />}
        </div>
      </div>
    </AdminLayout>
  )
}
