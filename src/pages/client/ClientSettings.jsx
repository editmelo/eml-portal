import { useState, useRef } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { cn } from '../../lib/utils'
import {
  User, BookOpen, Bell, Check, Camera, Monitor, Moon, Sun,
  LayoutDashboard, ClipboardList, FolderOpen, Image,
  Receipt, Calendar, ListChecks, ScrollText, Settings,
} from 'lucide-react'

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'display',       label: 'Display',       icon: Monitor },
  { id: 'guide',         label: 'App Guide',     icon: BookOpen },
]

// ── App Guide content ─────────────────────────────────────────────────────────
const GUIDE = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Your home base. See a snapshot of your active project status, progress, pending invoices, and quick links to the most-used sections of the portal.',
  },
  {
    icon: ClipboardList,
    title: 'Onboarding',
    desc: 'Complete your client intake form here. This is how we learn about your business, design preferences, goals, and project scope. This information is shared with your assigned designer to guide the work.',
  },
  {
    icon: FolderOpen,
    title: 'My Project',
    desc: 'Track your project in detail — status, brief, overall progress percentage, and a step-by-step timeline with dates and deadlines. Items marked "Action Needed" require your input to keep things moving.',
  },
  {
    icon: Image,
    title: 'Drafts & Review',
    desc: 'Your designer uploads work-in-progress files here. Click "Open" to view any file full-screen. Use the Notes section below each file to leave feedback, questions, or approval. Notes are visible to your designer.',
  },
  {
    icon: Receipt,
    title: 'Invoices',
    desc: 'View all invoices for your project — issued date, amount, and payment status. Invoices will sync with QuickBooks when that integration is live. Paying outstanding invoices promptly keeps your project on track.',
  },
  {
    icon: Calendar,
    title: 'Schedule',
    desc: 'Book a call with Edit Me Lo directly from the portal. Use this for kickoff meetings, feedback calls, or any check-ins throughout the project.',
  },
  {
    icon: ListChecks,
    title: 'To-Do',
    desc: 'A checklist of things you need to do to keep the project moving. Pre-populated with standard client responsibilities. Check items off as you complete them, and add your own reminders if needed.',
  },
  {
    icon: ScrollText,
    title: 'Agreements',
    desc: 'All your project paperwork in one place — the Project Proposal, Service Agreement, NDA, and any addendums. Review and sign documents here. Signed copies are stored for your records.',
  },
  {
    icon: Settings,
    title: 'Settings',
    desc: 'Update your profile information, manage notification preferences, and find guidance on how to use the portal. You are here!',
  },
]

const NOTIF_ITEMS = [
  { id: 'draft_ready',  label: 'New draft uploaded',       sub: 'When your designer uploads files for review' },
  { id: 'invoice_due',  label: 'Invoice due reminder',     sub: '3 days before an invoice due date' },
  { id: 'status_change',label: 'Project status updates',   sub: 'When your project moves to a new phase' },
  { id: 'message',      label: 'New message from Edit Me Lo', sub: 'Direct communications about your project' },
]

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
        enabled ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-600'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-slate-200 shadow transition-transform',
        enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
      )} />
    </button>
  )
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const updateUser        = useAuthStore((s) => s.updateUser)
  const saveClientProfile = useProjectStore((s) => s.saveClientProfile)
  const existingProfile   = useProjectStore((s) => s.clientProfiles[user?.id])

  const [form, setForm] = useState({
    name:    user?.name    ?? '',
    email:   user?.email   ?? '',
    company: user?.company ?? '',
    phone:   user?.phone   ?? '',
  })
  const [avatar, setAvatar] = useState(existingProfile?.avatar ?? null)
  const [saved, setSaved]   = useState(false)
  const fileRef             = useRef(null)

  const INPUT = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white'
  const LABEL = 'block text-xs font-medium text-slate-500 mb-1.5'

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateUser({ ...form })
    saveClientProfile(user?.id, { avatar, company: form.company, phone: form.phone, name: form.name })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card className="p-5 space-y-5">
      {/* Avatar + name row */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-brand-500/10 flex items-center justify-center text-xl font-bold text-brand-500">
            {avatar
              ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              : (form.name?.charAt(0) ?? 'C')
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow hover:bg-brand-600 transition-colors"
            title="Upload photo or logo"
          >
            <Camera size={11} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{form.name}</p>
          <p className="text-xs text-slate-400">{form.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
            Client
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 -mt-2">Click the camera icon to upload a profile photo or company logo.</p>

      <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Full Name</label>
          <input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className={LABEL}>Email Address</label>
          <input className={INPUT} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className={LABEL}>Company / Business Name</label>
          <input className={INPUT} placeholder="Your company name" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
        </div>
        <div>
          <label className={LABEL}>Phone</label>
          <input className={INPUT} type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          Save Changes
        </button>
        {saved && (
          <span className="text-sm font-medium flex items-center gap-1.5 text-brand-500">
            <Check size={14} /> Saved!
          </span>
        )}
      </div>
    </Card>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [enabled, setEnabled] = useState(() => {
    const init = {}
    NOTIF_ITEMS.forEach((i) => { init[i.id] = true })
    return init
  })

  return (
    <Card className="divide-y divide-slate-100 overflow-hidden">
      {NOTIF_ITEMS.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
          </div>
          <Toggle
            enabled={enabled[item.id]}
            onToggle={() => setEnabled((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
          />
        </div>
      ))}
    </Card>
  )
}

// ── App Guide Tab ─────────────────────────────────────────────────────────────
function AppGuideTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-4">
        A quick guide to every section of your client portal.
      </p>
      {GUIDE.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ── Display Tab ───────────────────────────────────────────────────────────────
function DisplayTab() {
  const portalTheme    = useThemeStore((s) => s.portalTheme)
  const setPortalTheme = useThemeStore((s) => s.setPortalTheme)

  return (
    <Card className="p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Theme</p>
        <p className="text-xs text-slate-400 mt-0.5">Choose how your portal looks.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-xs">
        {/* Light */}
        <button
          onClick={() => setPortalTheme('light')}
          className={cn(
            'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
            portalTheme === 'light'
              ? 'border-brand-500'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          {portalTheme === 'light' && (
            <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-500 flex items-center justify-center">
              <Check size={9} className="text-white" />
            </span>
          )}
          {/* Thumbnail: white bg + dark text bars */}
          <div className="h-14 w-full rounded-lg bg-white border border-slate-200 flex flex-col p-2 gap-1.5">
            <div className="h-1.5 w-9 rounded bg-slate-800" />
            <div className="h-1 w-6 rounded bg-slate-400" />
            <div className="mt-auto flex gap-1">
              <div className="h-4 flex-1 rounded bg-slate-100 border border-slate-200" />
              <div className="h-4 flex-1 rounded bg-slate-100 border border-slate-200" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Sun size={12} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Light</span>
          </div>
        </button>

        {/* Dark */}
        <button
          onClick={() => setPortalTheme('dark')}
          className={cn(
            'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
            portalTheme === 'dark'
              ? 'border-brand-500'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          {portalTheme === 'dark' && (
            <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-500 flex items-center justify-center">
              <Check size={9} className="text-white" />
            </span>
          )}
          {/* Thumbnail: dark bg + light text bars */}
          <div className="h-14 w-full rounded-lg bg-slate-900 border border-slate-700 flex flex-col p-2 gap-1.5">
            <div className="h-1.5 w-9 rounded bg-slate-200" />
            <div className="h-1 w-6 rounded bg-slate-500" />
            <div className="mt-auto flex gap-1">
              <div className="h-4 flex-1 rounded bg-slate-800 border border-slate-700" />
              <div className="h-4 flex-1 rounded bg-slate-800 border border-slate-700" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Moon size={12} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Dark</span>
          </div>
        </button>
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClientSettings() {
  const user      = useAuthStore(selectUser)
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <PortalLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and portal preferences."
        className="mb-6"
      />

      <div className="flex gap-6">
        {/* Tab nav */}
        <nav className="w-40 shrink-0 self-start rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
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
                      isActive
                        ? 'bg-brand-500/10 text-brand-500'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile'       && <ProfileTab user={user} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'display'       && <DisplayTab />}
          {activeTab === 'guide'         && <AppGuideTab />}
        </div>
      </div>
    </PortalLayout>
  )
}
