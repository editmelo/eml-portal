import { useNavigate } from 'react-router-dom'
import useAuthStore, { selectIsAuthenticated, selectRole } from '../store/authStore'
import { ROLE_HOME } from '../routes/ProtectedRoute'

export default function NotFound() {
  const navigate        = useNavigate()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const role            = useAuthStore(selectRole)

  const home = isAuthenticated && role ? ROLE_HOME[role] : '/login'

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl font-bold text-brand-500 mb-2">404</p>
      <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
      <p className="text-slate-400 mb-8 max-w-xs">
        This page doesn't exist or you don't have permission to view it.
      </p>
      <button
        onClick={() => navigate(home)}
        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Go home
      </button>
    </div>
  )
}
