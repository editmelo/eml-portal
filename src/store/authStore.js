import { create } from 'zustand'
import { supabase } from '../lib/supabase'

/** Map a Supabase user object to the app's user shape */
function shapeUser(supabaseUser) {
  if (!supabaseUser) return null
  const meta = supabaseUser.user_metadata ?? {}
  return {
    id:        supabaseUser.id,
    email:     supabaseUser.email,
    name:      meta.name ?? meta.full_name ?? supabaseUser.email,
    role:      meta.role ?? 'CLIENT',
    avatar:    meta.avatar_url ?? null,
    projectId: meta.projectId ?? null,
  }
}

const useAuthStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  user:            null,
  isAuthenticated: false,
  isLoading:       true,   // stays true until init() resolves
  error:           null,
  viewRole:        null,   // admin can switch portal view without re-logging in

  // ── Actions ────────────────────────────────────────────────────────────

  /**
   * Call once on app mount. Restores any existing Supabase session and
   * subscribes to auth state changes (sign-in, sign-out, token refresh,
   * and OAuth callback).
   */
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: shapeUser(session.user), isAuthenticated: true, isLoading: false })
    } else {
      set({ isLoading: false })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: shapeUser(session.user), isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false, viewRole: null })
      }
    })
  },

  /**
   * Sign in with email + password.
   * Returns { success, role?, error? }
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
    const user = shapeUser(data.user)
    set({ user, isAuthenticated: true, isLoading: false, error: null })
    return { success: true, role: user.role }
  },

  /**
   * Initiate Google OAuth. Browser redirects to Google then back to
   * /auth/callback where the session is picked up by onAuthStateChange.
   */
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      set({ isLoading: false, error: error.message })
    }
    // On success the browser navigates away — no further state to set here
  },

  /**
   * Register a new CLIENT account.
   * Returns { success, role?, needsConfirmation?, error? }
   */
  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'CLIENT' } },
    })
    if (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
    // If email confirmation is enabled, session is null until they click the link
    if (!data.session) {
      set({ isLoading: false })
      return { success: true, needsConfirmation: true }
    }
    const user = shapeUser(data.user)
    set({ user, isAuthenticated: true, isLoading: false, error: null })
    return { success: true, role: user.role }
  },

  /** Sign out and clear local session */
  logout: async () => {
    set({ user: null, isAuthenticated: false, error: null, viewRole: null })
    await supabase.auth.signOut()
  },

  /**
   * Admin-only: switch the visible role without re-logging in.
   * Pass null to reset back to the user's real role.
   */
  setViewRole: (role) => set({ viewRole: role }),

  /** Update local user profile fields (name, avatar, etc.) */
  updateUser: (patch) => {
    const current = get().user
    if (!current) return
    set({ user: { ...current, ...patch } })
  },

  /** Clear any displayed auth error */
  clearError: () => set({ error: null }),
}))

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser            = (s) => s.user
export const selectRole            = (s) => s.user?.role ?? null
export const selectViewRole        = (s) => s.viewRole ?? s.user?.role ?? null
export const selectIsAuthenticated = (s) => s.isAuthenticated
export const selectAuthLoading     = (s) => s.isLoading
export const selectAuthError       = (s) => s.error

export default useAuthStore
