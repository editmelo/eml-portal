import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore, { selectIsAuthenticated, selectRole, selectUser } from '../../store/authStore'
import { ROLE_HOME } from '../../routes/ProtectedRoute'
import { supabase } from '../../lib/supabase'
import LoadingScreen from '../../components/ui/LoadingScreen'

/**
 * Landing page after a Supabase OAuth redirect (e.g. Google sign-in).
 * Supabase processes the tokens in the URL automatically on load.
 * The onAuthStateChange listener in authStore.init() picks up the session
 * and updates isAuthenticated + role, which triggers the redirect below.
 */
export default function AuthCallback() {
  const navigate        = useNavigate()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const role            = useAuthStore(selectRole)
  const user            = useAuthStore(selectUser)

  useEffect(() => {
    if (isAuthenticated && role && user) {
      // Ensure profiles row exists for OAuth users
      supabase.from('profiles').upsert({
        id:    user.id,
        email: user.email,
        name:  user.name,
        role:  user.role,
      }).then(() => {
        navigate(ROLE_HOME[role] ?? '/client', { replace: true })
      })
    }
  }, [isAuthenticated, role, user])

  return <LoadingScreen />
}
