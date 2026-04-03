import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import ProtectedRoute, { ROLE_HOME } from './routes/ProtectedRoute'
import useAuthStore, { selectIsAuthenticated, selectViewRole, selectAuthLoading } from './store/authStore'
import { ROLES } from './lib/constants'
import LoadingScreen from './components/ui/LoadingScreen'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage  = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))

// Admin
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProjects     = lazy(() => import('./pages/admin/AdminProjects'))
const AdminPeople       = lazy(() => import('./pages/admin/AdminPeople'))
const AdminTimeline     = lazy(() => import('./pages/admin/AdminTimeline'))
const AdminTodo         = lazy(() => import('./pages/admin/AdminTodo'))
const AdminLeads        = lazy(() => import('./pages/admin/AdminLeads'))
const AdminPayroll      = lazy(() => import('./pages/admin/AdminPayroll'))
const AdminFinancials   = lazy(() => import('./pages/admin/AdminFinancials'))
const AdminInvoices     = lazy(() => import('./pages/admin/AdminInvoices'))
const AdminMeetingNotes = lazy(() => import('./pages/admin/AdminMeetingNotes'))
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings'))
const AdminInbox        = lazy(() => import('./pages/admin/AdminInbox'))
const AdminAgreements   = lazy(() => import('./pages/admin/AdminAgreements'))

// Client
const ClientDashboard   = lazy(() => import('./pages/client/ClientDashboard'))
const ClientOnboarding  = lazy(() => import('./pages/client/ClientOnboarding'))
const ClientProject     = lazy(() => import('./pages/client/ClientProject'))
const ClientDrafts      = lazy(() => import('./pages/client/ClientDrafts'))
const ClientInvoices    = lazy(() => import('./pages/client/ClientInvoices'))
const ClientSchedule    = lazy(() => import('./pages/client/ClientSchedule'))
const ClientTodo        = lazy(() => import('./pages/client/ClientTodo'))
const ClientAgreements  = lazy(() => import('./pages/client/ClientAgreements'))
const ClientSettings    = lazy(() => import('./pages/client/ClientSettings'))
const ClientInbox       = lazy(() => import('./pages/client/ClientInbox'))

// Designer
const DesignerDashboard  = lazy(() => import('./pages/designer/DesignerDashboard'))
const DesignerProjects   = lazy(() => import('./pages/designer/DesignerProjects'))
const DesignerUpload     = lazy(() => import('./pages/designer/DesignerUpload'))
const DesignerEarnings   = lazy(() => import('./pages/designer/DesignerEarnings'))
const DesignerAgreements = lazy(() => import('./pages/designer/DesignerAgreements'))
const DesignerTodo       = lazy(() => import('./pages/designer/DesignerTodo'))
const DesignerTimeline   = lazy(() => import('./pages/designer/DesignerTimeline'))
const DesignerSettings   = lazy(() => import('./pages/designer/DesignerSettings'))
const DesignerInbox      = lazy(() => import('./pages/designer/DesignerInbox'))

const NotFound     = lazy(() => import('./pages/NotFound'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const viewRole        = useAuthStore(selectViewRole)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[viewRole] ?? '/login'} replace />
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const init      = useAuthStore((s) => s.init)
  const isLoading = useAuthStore(selectAuthLoading)

  useEffect(() => { init() }, [])

  if (isLoading) return <LoadingScreen />

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<RootRedirect />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/signup"        element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* ── Admin (Business) ───────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leads"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLeads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payroll"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminPayroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/meetings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminMeetingNotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/invoices"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/financials"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminFinancials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/people"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminPeople />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timeline"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminTimeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/todo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminTodo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inbox"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminInbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/agreements"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminAgreements />
            </ProtectedRoute>
          }
        />

        {/* ── Client ─────────────────────────────────────────────────────── */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/onboarding"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/project"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/drafts"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientDrafts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/invoices"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/schedule"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientSchedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/todo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientTodo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/agreements"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientAgreements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/inbox"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
              <ClientInbox />
            </ProtectedRoute>
          }
        />

        {/* ── Designer ───────────────────────────────────────────────────── */}
        <Route
          path="/designer"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/projects"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/upload"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/earnings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/agreements"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerAgreements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/designer/todo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerTodo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/timeline"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerTimeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designer/inbox"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
              <DesignerInbox />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
