import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Users, Wallet, BarChart3,
  ClipboardList, FolderOpen, Image, Receipt, Calendar,
  Upload, DollarSign, FileText, LogOut, Settings,
  ListChecks, ScrollText, CalendarDays, UserCircle, ChevronDown, Mail, X,
} from 'lucide-react'
import useAuthStore, { selectUser, selectRole, selectViewRole } from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { NAV_CONFIG, ROLES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import Avatar from '../ui/Avatar'

const ICONS = {
  LayoutDashboard, FolderKanban, Users, Wallet, BarChart3,
  ClipboardList, FolderOpen, Image, Receipt, Calendar,
  Upload, DollarSign, FileText, ListChecks, ScrollText, CalendarDays, UserCircle, Mail,
}

// ── Admin theme variants (dark / light) ───────────────────────────────────────
const ADMIN_DARK = {
  wrapper:   'bg-admin-bg border-admin-border',
  logoBg:    'bg-admin-surface border border-admin-border',
  roleLabel: 'text-admin-accent',
  roleText:  'text-slate-500',
  navActive: 'bg-white/5 text-admin-accent border-l-2 border-admin-accent',
  navIdle:   'text-slate-400 hover:text-slate-200 hover:bg-white/5',
  divider:   'border-admin-border',
  userBg:    'bg-admin-surface border-admin-border',
  userText:  'text-slate-200',
  userSub:   'text-slate-500',
  logout:    'text-slate-600 hover:text-[#47C9F3] transition-colors',
  close:     'text-slate-500 hover:text-white hover:bg-white/10',
}

const ADMIN_LIGHT = {
  wrapper:   'bg-white border-slate-200',
  logoBg:    'bg-white',
  roleLabel: 'text-brand-500',
  roleText:  'text-slate-400',
  navActive: 'bg-blue-50 text-brand-500 border-l-2 border-brand-500 font-semibold',
  navIdle:   'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
  divider:   'border-slate-100',
  userBg:    'bg-slate-50 border-slate-200',
  userText:  'text-slate-800',
  userSub:   'text-slate-500',
  logout:    'text-slate-400 hover:text-brand-500 transition-colors',
  close:     'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
}

const CLIENT_THEME = {
  wrapper:   'bg-white border-slate-200',
  logoBg:    'bg-white',
  roleLabel: 'text-brand-500',
  roleText:  'text-slate-400',
  navActive: 'bg-blue-50 text-brand-500 border-l-2 border-brand-500 font-semibold',
  navIdle:   'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
  divider:   'border-slate-100',
  userBg:    'bg-slate-50 border-slate-200',
  userText:  'text-slate-800',
  userSub:   'text-slate-500',
  logout:    'text-slate-400 hover:text-brand-500 transition-colors',
  close:     'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
}

const PORTAL_DARK = {
  wrapper:   'bg-slate-900 border-slate-800',
  logoBg:    'bg-slate-900',
  roleLabel: 'text-brand-400',
  roleText:  'text-slate-500',
  navActive: 'bg-white/5 text-brand-400 border-l-2 border-brand-400 font-semibold',
  navIdle:   'text-slate-400 hover:text-slate-200 hover:bg-white/5',
  divider:   'border-slate-800',
  userBg:    'bg-slate-800 border-slate-700',
  userText:  'text-slate-200',
  userSub:   'text-slate-500',
  logout:    'text-slate-600 hover:text-brand-400 transition-colors',
  close:     'text-slate-500 hover:text-white hover:bg-white/10',
}

const ROLE_LABEL = {
  [ROLES.ADMIN]:    'Business',
  [ROLES.CLIENT]:   'Client',
  [ROLES.DESIGNER]: 'Designer',
}

export default function Sidebar({ open, onClose }) {
  const user        = useAuthStore(selectUser)
  const role        = useAuthStore(selectRole)
  const viewRole    = useAuthStore(selectViewRole)
  const setViewRole = useAuthStore((s) => s.setViewRole)
  const logout      = useAuthStore((s) => s.logout)
  const adminTheme  = useThemeStore((s) => s.adminTheme)
  const portalTheme = useThemeStore((s) => s.portalTheme)
  const navigate    = useNavigate()
  const [switchOpen, setSwitchOpen] = useState(false)

  const navItems = NAV_CONFIG[viewRole] ?? []

  let theme = portalTheme === 'dark' ? PORTAL_DARK : CLIENT_THEME
  if (role === ROLES.ADMIN && viewRole === ROLES.ADMIN) {
    theme = adminTheme === 'dark' ? ADMIN_DARK : ADMIN_LIGHT
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSwitch = (newRole) => {
    setViewRole(newRole)
    setSwitchOpen(false)
    navigate(newRole === ROLES.DESIGNER ? '/designer' : '/admin', { replace: true })
  }

  const handleNavClick = () => {
    // Close drawer on mobile when a nav item is tapped
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={cn(
        // Mobile: fixed drawer that slides in from the left
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static in the flex row, always visible
        'md:relative md:translate-x-0 md:z-auto',
        'flex flex-col h-full w-72 md:w-60 shrink-0 border-r',
        theme.wrapper
      )}>

        {/* Brand header */}
        <div className={cn('flex items-center gap-3 px-4 py-4 border-b', theme.divider)}>
          <a
            href="https://www.editmelo.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn('rounded-lg p-1.5 shrink-0 hover:opacity-80 transition-opacity', theme.logoBg)}
          >
            <img src="/Edit Me Lo - Primary Logo.png" alt="Edit Me Lo" className="h-8 w-auto object-contain" />
          </a>

          {role === ROLES.ADMIN ? (
            <div className="relative flex-1">
              <button
                onClick={() => setSwitchOpen((o) => !o)}
                className="flex items-center gap-1.5 text-left w-full group"
              >
                <div>
                  <p className={cn('text-[11px] font-bold uppercase tracking-widest flex items-center gap-1', theme.roleLabel)}>
                    {ROLE_LABEL[viewRole] ?? 'Business'}
                    <ChevronDown size={10} className="mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className={cn('text-[10px]', theme.roleText)}>Portal</p>
                </div>
              </button>
              {switchOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden min-w-[130px]">
                  {[ROLES.ADMIN, ROLES.DESIGNER].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSwitch(r)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        viewRole === r ? 'bg-brand-500/10 text-brand-500 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {ROLE_LABEL[r]} Portal
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              <p className={cn('text-[11px] font-bold uppercase tracking-widest', theme.roleLabel)}>
                {ROLE_LABEL[role]}
              </p>
              <p className={cn('text-[10px]', theme.roleText)}>Portal</p>
            </div>
          )}

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className={cn('p-1.5 rounded-lg md:hidden shrink-0', theme.close)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path.split('/').length === 2}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm transition-all',
                        isActive ? theme.navActive : theme.navIdle
                      )
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom — settings + user */}
        <div className={cn('border-t', theme.divider)}>
          <div className="px-2 pt-2">
            <NavLink
              to={
                viewRole === ROLES.DESIGNER ? '/designer/settings'
                : viewRole === ROLES.CLIENT  ? '/client/settings'
                : '/admin/settings'
              }
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm transition-all w-full',
                  isActive ? theme.navActive : theme.navIdle
                )
              }
            >
              <Settings size={16} className="shrink-0" />
              Settings
            </NavLink>
          </div>

          <div className="p-3">
            <div className={cn('flex items-center gap-3 p-2.5 rounded-xl border', theme.userBg)}>
              <Avatar name={user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-semibold truncate', theme.userText)}>{user?.name}</p>
                <p className={cn('text-[11px] truncate', theme.userSub)}>{user?.email}</p>
              </div>
              <button onClick={handleLogout} title="Sign out" className={cn('shrink-0', theme.logout)}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
