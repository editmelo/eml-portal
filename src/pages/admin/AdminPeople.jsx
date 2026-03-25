import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import FolderPanel from '../../components/ui/FolderPanel'
import InviteModal from '../../components/admin/InviteModal'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import useInviteStore from '../../store/inviteStore'
import { MOCK_USERS } from '../../lib/mockData'
import { ROLES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import {
  Search, X, User, Mail, Phone, Building2,
  Cake, Heart, Star, FileText, FolderKanban,
  ClipboardList, Save, Edit2, Clock,
  UserPlus, MailCheck, RefreshCw, Ban,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { sendInviteEmail } from '../../lib/emailService'

const CLIENTS   = MOCK_USERS.filter((u) => u.role === ROLES.CLIENT)
const DESIGNERS = MOCK_USERS.filter((u) => u.role === ROLES.DESIGNER)

function getProjects(userId, projects) {
  return projects.filter(
    (p) => p.clientId === userId || (p.designerIds ?? []).includes(userId)
  )
}

// ── Client Profile Modal ──────────────────────────────────────────────────────
function ClientModal({ client, onClose, isDark }) {
  const projects       = useProjectStore((s) => s.projects)
  const clientProfile  = useProjectStore((s) => s.clientProfiles[client.id])
  const saveClientProfile = useProjectStore((s) => s.saveClientProfile)
  const intakeForms    = useProjectStore((s) => s.intakeForms)
  const projectBriefs  = useProjectStore((s) => s.projectBriefs)

  // Folders
  const folders              = useProjectStore((s) => s.folders)
  const deleteFolder         = useProjectStore((s) => s.deleteFolder)
  const renameFolder         = useProjectStore((s) => s.renameFolder)
  const addFileToFolder      = useProjectStore((s) => s.addFileToFolder)
  const removeFileFromFolder = useProjectStore((s) => s.removeFileFromFolder)

  const clientProjects    = getProjects(client.id, projects)
  const clientProjectIds  = clientProjects.map((p) => p.id)
  const clientFolders     = folders.filter(
    (f) => f.context === 'profile' && f.contextId === client.id
  )
  const projectFolders    = folders.filter(
    (f) => f.context === 'project' && clientProjectIds.includes(f.contextId)
  )
  const avatar         = clientProfile?.avatar ?? null
  const displayName    = clientProfile?.name ?? client.name
  const company        = clientProfile?.company ?? client.company ?? null
  const phone          = clientProfile?.phone ?? client.phone ?? null

  const [activeTab, setActiveTab] = useState('profile')
  const [editing,   setEditing]   = useState(false)
  const [form, setForm] = useState({
    name:    displayName,
    email:   client.email ?? '',
    company: company ?? '',
    phone:   phone ?? '',
  })

  const handleSave = () => {
    saveClientProfile(client.id, { ...form })
    toast.success('Client profile updated')
    setEditing(false)
  }

  const INPUT = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-200 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40'

  const TABS = [
    { id: 'profile',  label: 'Profile' },
    { id: 'intake',   label: 'Intake Form' },
    { id: 'brief',    label: 'Project Brief' },
    { id: 'files',    label: 'Files' },
    { id: 'projects', label: 'Projects' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-brand-500/10 flex items-center justify-center text-base font-bold text-brand-400 shrink-0">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0)}
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayName}</p>
              <p className="text-xs text-slate-500">{company ?? client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing((o) => !o)} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-admin-border text-xs text-slate-400 hover:text-brand-400 hover:border-brand-400/50 transition-colors">
              <Edit2 size={11} /> {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-4 pt-3 border-b border-admin-border">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
                activeTab === t.id ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {activeTab === 'profile' && (
            editing ? (
              <div className="space-y-3">
                {[['name','Full Name','text'],['email','Email','email'],['company','Company','text'],['phone','Phone','tel']].map(([f, lbl, type]) => (
                  <div key={f}>
                    <label className="block text-xs text-slate-500 mb-1">{lbl}</label>
                    <input className={INPUT} type={type} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
                  <Save size={13} /> Save
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: Mail, label: 'Email',   value: client.email },
                  { icon: Phone,     label: 'Phone',   value: phone },
                  { icon: Building2, label: 'Company', value: company },
                ].filter((f) => f.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-admin-bg border border-admin-border flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-slate-300">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'intake' && (() => {
            const intake = Object.values(intakeForms).find((f, _, arr) => {
              const proj = clientProjects.find((p) => intakeForms[p.id])
              return proj && intakeForms[proj.id] === f
            }) ?? (clientProjects.length > 0 ? intakeForms[clientProjects[0]?.id] : null)
            return !intake ? (
              <p className="text-slate-500 text-sm text-center py-6">No intake form submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(intake).filter(([k]) => k !== 'submittedAt').map(([key, val]) => {
                  if (!val || (Array.isArray(val) && val.length === 0)) return null
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
                  return (
                    <div key={key}>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm text-slate-300">{Array.isArray(val) ? val.join(', ') : val}</p>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {activeTab === 'brief' && (() => {
            const brief = clientProjects.map((p) => projectBriefs[p.id]).find(Boolean)
            return !brief ? (
              <p className="text-slate-500 text-sm text-center py-6">No project brief generated yet. Brief is auto-created when the client submits their intake form.</p>
            ) : (
              <div className="space-y-3">
                <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 space-y-2">
                  {Object.entries(brief).filter(([k]) => !['updatedAt'].includes(k)).map(([key, val]) => {
                    if (!val || (Array.isArray(val) && val.length === 0)) return null
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
                    return (
                      <div key={key}>
                        <p className="text-[10px] text-brand-400/70 uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm text-slate-300">{Array.isArray(val) ? val.join(', ') : val}</p>
                      </div>
                    )
                  })}
                </div>
                {brief.updatedAt && (
                  <p className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock size={9} /> Generated {formatDate(brief.updatedAt.split('T')[0])}
                  </p>
                )}
              </div>
            )
          })()}

          {activeTab === 'files' && (
            <div className="space-y-5">
              {/* Client profile folders */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Client Folders</p>
                <FolderPanel
                  folders={clientFolders}
                  onDeleteFolder={deleteFolder}
                  onRenameFolder={renameFolder}
                  onAddFile={addFileToFolder}
                  onRemoveFile={removeFileFromFolder}
                  isAdmin
                  isDark={isDark}
                  emptyMessage="Client hasn't created any folders yet."
                />
              </div>
              {/* Designer project folders */}
              {projectFolders.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Designer Project Folders</p>
                  <FolderPanel
                    folders={projectFolders}
                    onDeleteFolder={deleteFolder}
                    onRenameFolder={renameFolder}
                    onAddFile={addFileToFolder}
                    onRemoveFile={removeFileFromFolder}
                    isAdmin
                    isDark={isDark}
                    emptyMessage="No project folders yet."
                  />
                </div>
              )}
              {clientFolders.length === 0 && projectFolders.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">No folders created yet for this client.</p>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-2">
              {clientProjects.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No projects linked to this client.</p>
              ) : (
                clientProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-admin-bg border border-admin-border">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">Due {formatDate(p.dueDate)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Designer Profile Modal ─────────────────────────────────────────────────────
function DesignerModal({ designer, onClose, isDark }) {
  const projects         = useProjectStore((s) => s.projects)
  const designerProfile  = useProjectStore((s) => s.designerProfiles[designer.id])
  const saveDesignerProfile = useProjectStore((s) => s.saveDesignerProfile)

  const designerProjects = getProjects(designer.id, projects)
  const payroll          = useProjectStore((s) => s.payroll)
  const myPayroll        = payroll.filter((p) => p.designerId === designer.id)
  const earned           = myPayroll.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const pending          = myPayroll.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)

  const [editing,  setEditing]  = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({
    specialty:  designerProfile?.specialty  ?? designer.specialty  ?? '',
    portfolio:  designerProfile?.portfolio  ?? designer.portfolio  ?? '',
    phone:      designerProfile?.phone      ?? designer.phone      ?? '',
    birthday:   designerProfile?.birthday   ?? '',
    favFood:    designerProfile?.favFood    ?? '',
    funFact:    designerProfile?.funFact    ?? '',
  })

  const handleSave = () => {
    saveDesignerProfile(designer.id, { ...form })
    toast.success('Designer profile updated')
    setEditing(false)
  }

  const INPUT = 'w-full rounded-lg border border-admin-border bg-admin-bg text-slate-200 px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40'

  const TABS = [{ id: 'profile', label: 'Profile' }, { id: 'fun', label: 'Fun Facts' }, { id: 'projects', label: 'Projects' }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-base font-bold text-brand-400 shrink-0">
              {designer.name.charAt(0)}
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{designer.name}</p>
              <p className="text-xs text-slate-500">{form.specialty || 'Designer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing((o) => !o)} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-admin-border text-xs text-slate-400 hover:text-brand-400 hover:border-brand-400/50 transition-colors">
              <Edit2 size={11} /> {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Earnings row */}
        <div className="grid grid-cols-2 gap-px border-b border-admin-border">
          <div className="px-5 py-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Earned</p>
            <p className="text-lg font-bold text-emerald-400">${earned.toLocaleString()}</p>
          </div>
          <div className="px-5 py-3 text-center border-l border-admin-border">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pending</p>
            <p className="text-lg font-bold text-amber-400">${pending.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-4 pt-3 border-b border-admin-border">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
                activeTab === t.id ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {activeTab === 'profile' && (
            editing ? (
              <div className="space-y-3">
                {[
                  ['phone',     'Phone',      'tel'],
                  ['specialty', 'Specialty',  'text'],
                  ['portfolio', 'Portfolio URL', 'url'],
                ].map(([f, lbl, type]) => (
                  <div key={f}>
                    <label className="block text-xs text-slate-500 mb-1">{lbl}</label>
                    <input className={INPUT} type={type} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
                  <Save size={13} /> Save
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: Mail,     label: 'Email',     value: designer.email },
                  { icon: Phone,    label: 'Phone',     value: form.phone },
                  { icon: Star,     label: 'Specialty', value: form.specialty },
                  { icon: FileText, label: 'Portfolio', value: form.portfolio },
                ].filter((f) => f.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-admin-bg border border-admin-border flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-slate-300 break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'fun' && (
            editing ? (
              <div className="space-y-3">
                {[
                  ['birthday', 'Birthday', 'date'],
                  ['favFood',  'Favorite Food / Snack', 'text'],
                  ['funFact',  'Fun Fact', 'text'],
                ].map(([f, lbl, type]) => (
                  <div key={f}>
                    <label className="block text-xs text-slate-500 mb-1">{lbl}</label>
                    <input className={INPUT} type={type} placeholder={`Enter ${lbl.toLowerCase()}…`} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
                  <Save size={13} /> Save
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: Cake,  label: 'Birthday',           value: form.birthday ? formatDate(form.birthday) : null },
                  { icon: Heart, label: 'Favorite Food/Snack', value: form.favFood },
                  { icon: Star,  label: 'Fun Fact',            value: form.funFact },
                ].filter((f) => f.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-admin-bg border border-admin-border">
                    <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-slate-200">{value}</p>
                    </div>
                  </div>
                ))}
                {!form.birthday && !form.favFood && !form.funFact && (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-sm">No fun facts yet.</p>
                    <button onClick={() => setEditing(true)} className="mt-2 text-xs text-brand-400 hover:underline">Add some ✨</button>
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === 'projects' && (
            <div className="space-y-2">
              {designerProjects.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No projects assigned to this designer.</p>
              ) : (
                designerProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-admin-bg border border-admin-border">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">Due {formatDate(p.dueDate)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Person Card ───────────────────────────────────────────────────────────────
function PersonCard({ person, type, isDark }) {
  const projects        = useProjectStore((s) => s.projects)
  const clientProfile   = useProjectStore((s) => s.clientProfiles[person.id])
  const designerProfile = useProjectStore((s) => s.designerProfiles[person.id])
  const [modalOpen, setModalOpen] = useState(false)

  const personProjects = getProjects(person.id, projects)
  const avatar  = clientProfile?.avatar ?? null
  const displayName = clientProfile?.name ?? designerProfile?.name ?? person.name
  const company = clientProfile?.company ?? person.company ?? null
  const specialty = designerProfile?.specialty ?? person.specialty ?? null

  return (
    <>
      <DarkCard
        className="p-4 cursor-pointer hover:bg-admin-surface/80 transition-colors"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-brand-500/10 flex items-center justify-center text-base font-bold text-brand-400 shrink-0">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{company ?? specialty ?? person.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
                type === 'client' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-500/10 text-brand-400'
              )}>
                {type}
              </span>
              {personProjects.length > 0 && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <FolderKanban size={10} /> {personProjects.length} project{personProjects.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </DarkCard>

      {modalOpen && type === 'client'   && <ClientModal   client={person}   onClose={() => setModalOpen(false)} isDark={isDark} />}
      {modalOpen && type === 'designer' && <DesignerModal designer={person} onClose={() => setModalOpen(false)} isDark={isDark} />}
    </>
  )
}

// ── Pending Invites Section ───────────────────────────────────────────────────
function PendingInvites({ isDark }) {
  const invites      = useInviteStore((s) => s.invites)
  const cancelInvite = useInviteStore((s) => s.cancelInvite)
  const resendInvite = useInviteStore((s) => s.resendInvite)

  const pending = invites.filter((i) => i.status === 'pending')
  if (pending.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
        Pending Invites <span className="ml-1 text-amber-400">({pending.length})</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pending.map((inv) => (
          <DarkCard key={inv.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                inv.role === 'DESIGNER' ? 'bg-brand-500/10 text-brand-400' : 'bg-emerald-500/10 text-emerald-400'
              )}>
                {inv.ownerName?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-800')}>
                  {inv.ownerName}
                </p>
                <p className="text-xs text-slate-500 truncate">{inv.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
                    inv.role === 'DESIGNER' ? 'bg-brand-500/10 text-brand-400' : 'bg-emerald-500/10 text-emerald-400'
                  )}>
                    {inv.role === 'DESIGNER' ? 'Designer' : 'Client'}
                  </span>
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <MailCheck size={10} /> Invite sent
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3">
              <button
                onClick={async () => {
                  resendInvite(inv.id)
                  await sendInviteEmail({ role: inv.role, ownerName: inv.ownerName, email: inv.email, companyName: inv.companyName, message: inv.message })
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-admin-border text-[11px] text-slate-400 hover:text-brand-400 hover:border-brand-400/50 transition-colors"
              >
                <RefreshCw size={10} /> Resend
              </button>
              <button
                onClick={() => { cancelInvite(inv.id); toast.success('Invite cancelled') }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-admin-border text-[11px] text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                <Ban size={10} /> Cancel
              </button>
            </div>
          </DarkCard>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPeople() {
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const [query,       setQuery]       = useState('')
  const [filter,      setFilter]      = useState('all') // all | clients | designers
  const [showInvite,  setShowInvite]  = useState(false)
  const [inviteRole,  setInviteRole]  = useState('CLIENT')

  const openInvite = (role = 'CLIENT') => { setInviteRole(role); setShowInvite(true) }

  const allPeople = [
    ...CLIENTS.map((c)   => ({ ...c, _type: 'client' })),
    ...DESIGNERS.map((d) => ({ ...d, _type: 'designer' })),
  ]

  const filtered = allPeople.filter((p) => {
    const matchFilter = filter === 'all' || p._type === filter.replace(/s$/, '')
    const q = query.toLowerCase()
    return matchFilter && (!q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
  })

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          dark={isDark}
          title="People"
          subtitle={`${CLIENTS.length} client${CLIENTS.length !== 1 ? 's' : ''} · ${DESIGNERS.length} designer${DESIGNERS.length !== 1 ? 's' : ''}`}
        />
        <button
          onClick={() => openInvite('CLIENT')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shrink-0 mt-1"
        >
          <UserPlus size={14} /> Send Invite
        </button>
      </div>

      {/* Pending invites */}
      <PendingInvites isDark={isDark} />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-admin-border bg-admin-surface text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-admin-surface border border-admin-border rounded-lg">
          {[['all','All'], ['clients','Clients'], ['designers','Designers']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === id ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section: Clients */}
      {(filter === 'all' || filter === 'clients') && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Clients</p>
            <button
              onClick={() => openInvite('CLIENT')}
              className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
            >
              <UserPlus size={11} /> Invite Client
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter((p) => p._type === 'client').map((p) => (
              <PersonCard key={p.id} person={p} type="client" isDark={isDark} />
            ))}
            {filtered.filter((p) => p._type === 'client').length === 0 && (
              <p className="text-slate-600 text-sm col-span-3">No clients match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Section: Designers */}
      {(filter === 'all' || filter === 'designers') && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Designers</p>
            <button
              onClick={() => openInvite('DESIGNER')}
              className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
            >
              <UserPlus size={11} /> Invite Designer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter((p) => p._type === 'designer').map((p) => (
              <PersonCard key={p.id} person={p} type="designer" isDark={isDark} />
            ))}
            {filtered.filter((p) => p._type === 'designer').length === 0 && (
              <p className="text-slate-600 text-sm col-span-3">No designers match your search.</p>
            )}
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          isDark={isDark}
          defaultRole={inviteRole}
          onClose={() => setShowInvite(false)}
        />
      )}
    </AdminLayout>
  )
}
