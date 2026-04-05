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
    business:    meta.business ?? null,
    businesses:  meta.businesses ?? [],
    nickname:    meta.nickname ?? null,
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
      const resolved = session.user
      let shaped = shapeUser(resolved)
      set({ user: shaped, isAuthenticated: true, isLoading: false })

      // Load profile data from profiles table (source of truth, not auth metadata)
      supabase.from('profiles').select('*').eq('id', resolved.id).single().then(async ({ data: profile, error: pErr }) => {
        if (pErr) {
          // Profile doesn't exist — create it
          await supabase.from('profiles').upsert({
            id:    resolved.id,
            email: resolved.email,
            name:  shaped.name,
            role:  shaped.role,
          })
          return
        }

        // Merge profile table data into user state
        if (profile) {
          const merged = {
            ...shaped,
            name:     profile.name     || shaped.name,
            phone:    profile.phone    || shaped.phone,
            nickname: profile.nickname || shaped.nickname,
            avatar:   profile.avatar_url || shaped.avatar,
            business: profile.business || shaped.business,
            businesses: profile.businesses?.length ? profile.businesses : shaped.businesses,
          }
          set({ user: merged })

          // Sync businesses into projectStore for sidebar
          if (profile.businesses?.length) {
            const { default: useProjectStore } = await import('./projectStore')
            const existing = useProjectStore.getState().clientProfiles[resolved.id] ?? {}
            useProjectStore.getState().saveClientProfile(resolved.id, {
              ...existing,
              businesses: profile.businesses,
              activeBusinessId: existing.activeBusinessId ?? profile.businesses[0]?.id,
            })
          }
        }
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
   * Save profile changes to the profiles table (source of truth).
   * No longer depends on auth.updateUser() — avoids Bearer token issues.
   * Returns { success, error? }
   */
  saveProfile: async (patch) => {
    const current = get().user
    if (!current) return { success: false }

    const payload = {
      name:       patch.name       ?? current.name,
      business:   patch.business   ?? current.business,
      businesses: patch.businesses ?? current.businesses ?? [],
      phone:      patch.phone      ?? current.phone,
      nickname:   patch.nickname   ?? current.nickname,
      avatar_url: patch.avatar     ?? current.avatar,
    }

    // Check we have an active session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Session expired — please log out and log back in' }
    }

    // Write directly to profiles table — this is the source of truth
    const { error, count } = await supabase.from('profiles').update({
      name:       payload.name,
      business:   payload.business,
      businesses: payload.businesses,
      phone:      payload.phone,
      nickname:   payload.nickname,
      avatar_url: payload.avatar_url,
    }).eq('id', current.id)

    if (error) {
      console.error('[authStore] profiles update failed:', error.message, error)
      return { success: false, error: error.message }
    }

    // Update local user state immediately
    set({ user: { ...current, ...patch, name: payload.name, phone: payload.phone, nickname: payload.nickname, avatar: payload.avatar_url } })
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
