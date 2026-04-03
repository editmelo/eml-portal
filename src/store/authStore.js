import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { LS_KEYS } from '../lib/constants'

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
    phone:     meta.phone    ?? null,
    business:  meta.business ?? null,
    nickname:  meta.nickname ?? null,
  }
}

const useAuthStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  user:            null,
  isAuthenticated: false,
  isLoading:       true,   // stays true until init() resolves
  error:           null,
  viewRole:        localStorage.getItem(LS_KEYS.VIEW_ROLE) || null,   // admin can switch portal view without re-logging in

  // ── Actions ────────────────────────────────────────────────────────────

  /**
   * Call once on app mount. Restores any existing Supabase session and
   * subscribes to auth state changes (sign-in, sign-out, token refresh,
   * and OAuth callback).
   */
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      // getUser() fetches server-fresh metadata — avoids stale JWT cache on other devices
      const { data: { user: freshUser } } = await supabase.auth.getUser()
      const resolved = freshUser ?? session.user
      const shaped = shapeUser(resolved)
      set({ user: shaped, isAuthenticated: true, isLoading: false })
      // Ensure profiles row exists (back-fills users who signed up before profiles sync)
      supabase.from('profiles').upsert({
        id:    resolved.id,
        email: resolved.email,
        name:  shaped.name,
        role:  shaped.role,
      }).then(({ error: pErr }) => {
        if (pErr) console.error('[authStore] profiles upsert on init:', pErr.message)
      })
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
    // Ensure profiles row exists (back-fills users who signed up before this fix)
    if (data.user) {
      supabase.from('profiles').upsert({
        id:    data.user.id,
        email: data.user.email,
        name:  user.name,
        role:  user.role,
      }).then(({ error: pErr }) => {
        if (pErr) console.error('[authStore] profiles upsert on login:', pErr.message)
      })
    }
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
   * Register from an invite — calls the accept-invite edge function which
   * creates a pre-confirmed user (no email verification needed).
   * Returns { success, role?, email?, error? }
   */
  registerFromInvite: async (inviteId, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('accept-invite', {
        body: { inviteId, password },
      })
      if (fnErr) {
        const msg = fnErr.message || 'Failed to create account'
        set({ isLoading: false, error: msg })
        return { success: false, error: msg }
      }
      if (data?.error) {
        set({ isLoading: false, error: data.error })
        return { success: false, error: data.error }
      }
      // Sign in immediately with the new credentials
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      })
      if (signInErr) {
        set({ isLoading: false, error: signInErr.message })
        return { success: false, error: signInErr.message }
      }
      const user = shapeUser(signInData.user)
      set({ user, isAuthenticated: true, isLoading: false, error: null })
      return { success: true, role: user.role, email: data.email }
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      set({ isLoading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  /**
   * Register a new account (organic signup — requires email confirmation).
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} [role='CLIENT'] — passed from invite lookup or defaults to CLIENT
   * Returns { success, role?, needsConfirmation?, error? }
   */
  register: async (name, email, password, role = 'CLIENT') => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })
    if (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
    // Create profiles row so AdminPeople + Inbox contacts can find this user
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:    data.user.id,
        email: data.user.email,
        name,
        role,
      }).then(({ error: pErr }) => {
        if (pErr) console.error('[authStore] profiles upsert on register:', pErr.message)
      })
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
    localStorage.removeItem(LS_KEYS.VIEW_ROLE)
    set({ user: null, isAuthenticated: false, error: null, viewRole: null })
    await supabase.auth.signOut()
  },

  /**
   * Admin-only: switch the visible role without re-logging in.
   * Pass null to reset back to the user's real role.
   */
  setViewRole: (role) => {
    if (role) {
      localStorage.setItem(LS_KEYS.VIEW_ROLE, role)
    } else {
      localStorage.removeItem(LS_KEYS.VIEW_ROLE)
    }
    set({ viewRole: role })
  },

  /**
   * Save profile changes to Supabase user_metadata so they persist across sessions.
   * Returns { success, error? }
   */
  saveProfile: async (patch) => {
    const current = get().user
    if (!current) return { success: false }
    const { error } = await supabase.auth.updateUser({
      data: {
        name:       patch.name     ?? current.name,
        business:   patch.business ?? current.business,
        phone:      patch.phone    ?? current.phone,
        nickname:   patch.nickname ?? current.nickname,
        avatar_url: patch.avatar   ?? current.avatar,
      },
    })
    if (error) return { success: false, error: error.message }
    // Sync to profiles table so admin People tab stays current
    await supabase.from('profiles').upsert({
      id:         current.id,
      name:       patch.name     ?? current.name,
      business:   patch.business ?? current.business,
      phone:      patch.phone    ?? current.phone,
      nickname:   patch.nickname ?? current.nickname,
      avatar_url: patch.avatar   ?? current.avatar,
    })
    // Fetch server-fresh user so metadata is up-to-date in the store
    const { data: { user: freshUser } } = await supabase.auth.getUser()
    set({ user: freshUser ? shapeUser(freshUser) : { ...current, ...patch } })
    return { success: true }
  },

  /**
   * Update password via Supabase (no current password required — trusts active session).
   * Returns { success, error? }
   */
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  /** Update local user fields only (for non-persisted in-session changes) */
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
