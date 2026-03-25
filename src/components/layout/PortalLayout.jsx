import Sidebar from './Sidebar'
import useThemeStore from '../../store/themeStore'
import { cn } from '../../lib/utils'

export default function PortalLayout({ children }) {
  const portalTheme = useThemeStore((s) => s.portalTheme)
  const isDark      = portalTheme === 'dark'

  return (
    <div className={cn('flex h-screen overflow-hidden', isDark ? 'dark bg-slate-900' : 'bg-slate-50')}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
