import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore, { selectIsAuthenticated, selectRole } from '../store/authStore'
import { ROLES } from '../lib/constants'

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Props:
 *   allowedRoles  string[]   If provided, only users with those roles can enter.
 *   children      ReactNode  The route content to render.
 *   redirectTo    string     Override the fallback redirect path.
 *
 * Behaviour:
 *   1. Not logged in        → /login  (preserving intended destination)
 *   2. Wrong role           → their own dashboard root
 *   3. Authenticated + ok   → render children
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const role            = useAuthStore(selectRole)
  const location        = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Admin (Lo) can access any route — she's the owner and switches between portals
  if (allowedRoles.length > 0 && !allowedRoles.includes(role) && role !== ROLES.ADMIN) {
    // Send user to their own portal root
    const fallback = ROLE_HOME[role] ?? '/login'
    return <Navigate to={fallback} replace />
  }

  return children
}

/** Where each role lands after login (also used as fallback for wrong-role access) */
export const ROLE_HOME = {
  ADMIN:    '/admin',
  CLIENT:   '/client',
  DESIGNER: '/designer',
}
