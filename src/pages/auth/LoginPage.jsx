import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import useAuthStore, { selectIsAuthenticated, selectRole } from '../../store/authStore'
import { ROLE_HOME } from '../../routes/ProtectedRoute'
import { BackgroundBeamsWithCollision } from '../../components/ui/BackgroundBeams'
import { Spotlight, GridBackground } from '../../components/ui/Spotlight'
import { cn } from '../../lib/utils'


export default function LoginPage() {
  const navigate   = useNavigate()
  const location   = useLocation()

  const login      = useAuthStore((s) => s.login)
  const clearError = useAuthStore((s) => s.clearError)
  const isLoading       = useAuthStore((s) => s.isLoading)
  const error           = useAuthStore((s) => s.error)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const role            = useAuthStore(selectRole)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Handle redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && role) {
      const intended = location.state?.from?.pathname ?? ROLE_HOME[role]
      navigate(intended, { replace: true })
    }
  }, [isAuthenticated, role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const result = await login(email, password)
    // Use role returned directly from login() — avoids stale React state on first click
    if (result.success) {
      const intended = location.state?.from?.pathname ?? ROLE_HOME[result.role]
      navigate(intended, { replace: true })
    }
  }

  return (
    <BackgroundBeamsWithCollision
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0a2d6e 0%, #124F98 30%, #1a88c9 65%, #47C9F3 100%)' }}
    >
      {/* Layer 1 — subtle moving spotlights */}
      <Spotlight />

      {/* Layer 2 — EML cyan grid */}
      <GridBackground />

      {/* ── Login content (above beams z-50) ── */}
      <div className="relative z-50 flex flex-col items-center w-full">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <a href="https://www.editmelo.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img
              src="/Edit Me Lo - Primary Logo.png"
              alt="Edit Me Lo"
              className="h-20 w-auto object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
          </a>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">Portal</h1>
            <p className="text-sm text-slate-400 mt-0.5">Sign in to your workspace</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-sm rounded-2xl p-8 border border-white/20"
          style={{
            background:    'rgba(10, 30, 70, 0.70)',
            backdropFilter: 'blur(24px)',
            boxShadow:     '0 25px 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Cyan hairline at top */}
          <div
            className="absolute top-0 left-8 right-8 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(71,201,243,0.45), transparent)' }}
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
                placeholder="you@editmelo.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#47C9F3] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg py-2.5',
                'font-semibold text-sm text-white transition-all',
                'bg-[#124F9E] hover:bg-[#0f4089]',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
              style={{ boxShadow: '0 0 20px rgba(18, 79, 158, 0.45)' }}
            >
              {isLoading
                ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <LogIn size={16} />
              }
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#47C9F3] hover:text-white font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <a
            href="https://www.editmelo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-sm text-white/70 hover:text-white hover:border-[#47C9F3] hover:bg-white/5 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Visit Website
          </a>
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} Edit Me Lo · All rights reserved
          </p>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  )
}
