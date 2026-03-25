import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme Store — controls dark/light mode for the admin portal.
 * Persisted to localStorage so the preference survives refresh.
 *
 * 'dark'  = current navy/dark aesthetic (default)
 * 'light' = clean white/slate admin surface
 */
const useThemeStore = create(
  persist(
    (set, get) => ({
      adminTheme:  'dark',   // 'dark' | 'light'  — business portal
      portalTheme: 'light',  // 'dark' | 'light'  — client & designer portals

      toggleAdminTheme: () =>
        set((s) => ({ adminTheme: s.adminTheme === 'dark' ? 'light' : 'dark' })),

      setAdminTheme: (theme) => set({ adminTheme: theme }),

      setPortalTheme: (theme) => set({ portalTheme: theme }),

      isDark: () => get().adminTheme === 'dark',
    }),
    { name: 'eml_theme', partialize: (s) => ({ adminTheme: s.adminTheme, portalTheme: s.portalTheme }) }
  )
)

export default useThemeStore
