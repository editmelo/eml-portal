import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import useThemeStore from '../../store/themeStore'
import { cn } from '../../lib/utils'

export default function PortalLayout({ children }) {
  const portalTheme  = useThemeStore((s) => s.portalTheme)
  const isDark       = portalTheme === 'dark'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={cn('flex h-screen overflow-hidden', isDark ? 'dark bg-slate-900' : 'bg-slate-50')}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className={cn(
          'flex items-center gap-3 px-4 h-14 border-b shrink-0 md:hidden',
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        )}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            )}
          >
            <Menu size={20} />
          </button>
          <img
            src="/Edit Me Lo - Primary Logo.png"
            alt="Edit Me Lo"
            className="h-7 w-auto object-contain"
            style={{ mixBlendMode: isDark ? 'normal' : 'multiply' }}
          />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
