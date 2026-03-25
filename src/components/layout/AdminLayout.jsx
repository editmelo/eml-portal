import Sidebar from './Sidebar'
import useThemeStore from '../../store/themeStore'
import { cn } from '../../lib/utils'

export default function AdminLayout({ children }) {
  const adminTheme = useThemeStore((s) => s.adminTheme)
  const isDark = adminTheme === 'dark'

  return (
    <div className={cn(
      'flex h-screen overflow-hidden',
      isDark ? 'bg-admin-bg admin-dark' : 'bg-slate-50 admin-light'
    )}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
