import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import useAuthStore, { selectIsAuthenticated, selectRole } from '../../store/authStore'
import { ROLE_HOME } from '../../routes/ProtectedRoute'
import { BackgroundBeamsWithCollision } from '../../components/ui/BackgroundBeams'
import { Spotlight, GridBackground } from '../../components/ui/Spotlight'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { logActivity } from '../../store/activityStore'
import toast from 'react-hot-toast'


export default function SignupPage() {
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const register          = useAuthStore((s) => s.register)
  const registerFromInvite = useAuthStore((s) => s.registerFromInvite)
  const clearError = useAuthStore((s) => s.clearError)
  const isLoading       = useAuthStore((s) => s.isLoading)
  const error           = useAuthStore((s) => s.error)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const role            = useAuthStore(selectRole)

  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldError,  setFieldError]  = useState('')
  const [confirmed,   setConfirmed]   = useState(false)

  // Invite-aware signup: look up the invite to get the correct role
  const [inviteRole,  setInviteRole]  = useState(null)   // null = still loading or no invite
  const [inviteReady, setInviteReady] = useState(false)
  const inviteId = searchParams.get('invite')

  useEffect(() => {
    if (!inviteId) { setInviteReady(true); return }
    supabase.from('invites').select('role, email, owner_name').eq('id', inviteId).single()
      .then(({ data }) => {
        if (data) {
          setInviteRole(data.role)          // 'CLIENT' | 'DESIGNER'
          if (data.email)      setEmail(data.email)
          if (data.owner_name) setName(data.owner_name)
        }
        setInviteReady(true)
      })
  }, [inviteId])

  const signupRole = inviteRole ?? 'CLIENT'
  const isDesigner = signupRole === 'DESIGNER'
  const isInvite   = !!inviteId && inviteReady && !!inviteRole

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(ROLE_HOME[role] ?? '/client', { replace: true })
    }
  }, [isAuthenticated, role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldError('')
    clearError()

    if (!isInvite && !name.trim()) { setFieldError('Please enter your name.'); return }
    if (!isInvite && !email.trim()) { setFieldError('Please enter your email.'); return }
    if (password.length < 6) { setFieldError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setFieldError('Passwords do not match.'); return }

    if (isInvite) {
      // Invite flow: use edge function (auto-confirms email, no verification needed)
      const result = await registerFromInvite(inviteId, password)
      if (result.success) {
        logActivity({
          actorId:     'system',
          actorName:   name,
          actorRole:   signupRole,
          action:      'invite_accepted',
          description: `accepted their ${isDesigner ? 'designer' : 'client'} invite and created an account`,
        })
        toast.success('Welcome! Your account has been created.')
        navigate(ROLE_HOME[result.role] ?? '/client', { replace: true })
      }
    } else {
      // Organic signup: normal registration (requires email confirmation)
      const result = await register(name, email, password, signupRole)
      if (result.success) {
        if (result.needsConfirmation) {
          setConfirmed(true)
          return
        }
        logActivity({
          actorId:     'system',
          actorName:   name,
          actorRole:   signupRole,
          action:      'profile_updated',
          description: 'created a new client account',
        })
        toast.success('Welcome! Your account has been created.')
        navigate(ROLE_HOME[result.role] ?? '/client', { replace: true })
      }
    }
  }


  const displayError = fieldError || error

  return (
    <BackgroundBeamsWithCollision
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0a2d6e 0%, #124F98 30%, #1a88c9 65%, #47C9F3 100%)' }}
    >
      <Spotlight />
      <GridBackground />

      <div className="relative z-50 flex flex-col items-center w-full">

        {/* Email confirmation screen (organic signup only) */}
        {confirmed && (
          <div
            className="w-full max-w-sm rounded-2xl p-8 border border-white/20 text-center"
            style={{ background: 'rgba(10, 30, 70, 0.70)', backdropFilter: 'blur(24px)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}
          >
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
            <p className="text-sm text-slate-400 mb-6">
              We sent a confirmation link to <span className="text-[#47C9F3]">{email}</span>. Click it to activate your account.
            </p>
            <Link to="/login" className="text-[#47C9F3] hover:text-white text-sm font-medium transition-colors">
              Back to sign in →
            </Link>
          </div>
        )}

        {!confirmed && (
        <>
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
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isInvite
                ? `Welcome, ${name.split(' ')[0]}!`
                : isDesigner ? 'Create your designer account' : 'Create your client account'
              }
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {isInvite
                ? 'Create a password to get started'
                : isDesigner ? 'Sign up to access your Edit Me Lo designer portal' : 'Sign up to access your Edit Me Lo client portal'
              }
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-sm rounded-2xl p-8 border border-white/20 relative"
          style={{
            background:     'rgba(10, 30, 70, 0.70)',
            backdropFilter: 'blur(24px)',
            boxShadow:      '0 25px 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Cyan hairline */}
          <div
            className="absolute top-0 left-8 right-8 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(71,201,243,0.45), transparent)' }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">

            {isInvite ? (
              /* ── Invite flow: show name & email as read-only info ── */
              <div className="space-y-3 mb-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/10 bg-white/5">
                  <div className="h-9 w-9 rounded-full bg-[#124F9E]/40 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate">{email}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Organic signup: editable name & email fields ── */
              <>
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFieldError('') }}
                    className="admin-input"
                    placeholder="Jordan Rivera"
                  />
                </div>

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
                    onChange={(e) => { setEmail(e.target.value); setFieldError(''); clearError() }}
                    className="admin-input"
                    placeholder="you@example.com"
                  />
                </div>
              </>
            )}

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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldError('') }}
                  className="admin-input pr-10"
                  placeholder="Min. 6 characters"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setFieldError('') }}
                  className="admin-input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#47C9F3] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {displayError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg py-2.5 mt-1',
                'font-semibold text-sm text-white transition-all',
                'bg-[#124F9E] hover:bg-[#0f4089]',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
              style={{ boxShadow: '0 0 20px rgba(18, 79, 158, 0.45)' }}
            >
              {isLoading
                ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserPlus size={16} />
              }
              {isLoading ? 'Creating account…' : isInvite ? 'Get Started' : 'Create Account'}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#47C9F3] hover:text-white font-medium transition-colors">
              Sign in
            </Link>
          </p>

          {!isDesigner && !isInvite && (
            <p className="mt-3 text-center text-[11px] text-slate-600">
              Designers join by invite only.{' '}
              <a href="https://www.editmelo.com" target="_blank" rel="noopener noreferrer" className="text-[#47C9F3]/70 hover:text-[#47C9F3] transition-colors">
                Learn more →
              </a>
            </p>
          )}
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
        </>
        )}
      </div>
    </BackgroundBeamsWithCollision>
  )
}
