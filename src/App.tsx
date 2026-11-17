import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthInit } from './hooks/useAuth'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { RoleGuard } from './components/RoleGuard'
import { ADMIN_ROLES, FIELD_ROLES } from './lib/rbac'

// Layouts
import { AppLayout } from './components/layout/AppLayout'

// Auth
import { LoginPage } from './pages/auth/LoginPage'
import { JoinPage }  from './pages/join/JoinPage'

// Eager: pages needed immediately
import { DashboardPage }           from './pages/dashboard/DashboardPage'
import { CreateOperationPlanModal }from './pages/operations/CreateOperationPlanModal'

// Lazy-loaded pages
const EventsPage            = React.lazy(() => import('./pages/events/EventsPage').then(m => ({ default: m.EventsPage })))
const OperationsListPage    = React.lazy(() => import('./pages/operations/OperationsListPage').then(m => ({ default: m.OperationsListPage })))
const EventControlCenter    = React.lazy(() => import('./pages/operations/EventControlCenter').then(m => ({ default: m.EventControlCenter })))
const TourPnLPage           = React.lazy(() => import('./pages/operations/TourPnLPage').then(m => ({ default: m.TourPnLPage })))
const ShortageRequestPage   = React.lazy(() => import('./pages/operations/ShortageRequestPage').then(m => ({ default: m.ShortageRequestPage })))
const ChecklistManagerPage  = React.lazy(() => import('./pages/operations/ChecklistManagerPage').then(m => ({ default: m.ChecklistManagerPage })))
const OperationTasksPage    = React.lazy(() => import('./pages/operations/OperationTasksPage').then(m => ({ default: m.OperationTasksPage })))
const OfficePage            = React.lazy(() => import('./pages/office/OfficePage').then(m => ({ default: m.OfficePage })))
const InventoryPage         = React.lazy(() => import('./pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })))
const StaffPage             = React.lazy(() => import('./pages/staff/StaffPage').then(m => ({ default: m.StaffPage })))
const TasksPage             = React.lazy(() => import('./pages/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const AttendeesPage         = React.lazy(() => import('./pages/attendees/AttendeesPage').then(m => ({ default: m.AttendeesPage })))
const QRScannerPage         = React.lazy(() => import('./pages/scanner/QRScannerPage').then(m => ({ default: m.QRScannerPage })))
const PaymentsPage          = React.lazy(() => import('./pages/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const SettingsPage          = React.lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const TemplatesPage         = React.lazy(() => import('./pages/templates/TemplatesPage').then(m => ({ default: m.TemplatesPage })))
const TaskTemplatesPage     = React.lazy(() => import('./pages/tasks/TaskTemplatesPage').then(m => ({ default: m.TaskTemplatesPage })))
const VendorsPage           = React.lazy(() => import('./pages/vendors/VendorsPage').then(m => ({ default: m.VendorsPage })))
const ReportsPage           = React.lazy(() => import('./pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const ProgramHistoryPage    = React.lazy(() => import('./pages/reports/ProgramHistoryPage').then(m => ({ default: m.ProgramHistoryPage })))
const ShortagesPage         = React.lazy(() => import('./pages/shortages/ShortagesPage').then(m => ({ default: m.ShortagesPage })))

// Role-based landing redirect
function RoleLanding() {
  const role = useAuthStore(s => s.profile?.role)
  if (role === 'office_staff' || role === 'onsite_staff' || role === 'procurement_staff') return <Navigate to="/office" replace />
  return <DashboardPage />
}

// /operations/new modal
function NewOperationPlanRedirect() {
  const [open, setOpen] = React.useState(true)
  const navigate = useNavigate()
  return (
    <CreateOperationPlanModal
      open={open}
      onClose={() => { setOpen(false); navigate('/operations', { replace: true }) }}
      onCreated={(id) => { setOpen(false); navigate(`/operations/${id}`, { replace: true }) }}
    />
  )
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function AuthGate({ children }: { children: React.ReactNode }) {
  useAuthInit()
  const { loading, initialized, isAuthenticated } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join"  element={<JoinPage />} />

          {/* /onsite legacy redirect → office prep */}
          <Route path="/onsite" element={<Navigate to="/office" replace />} />

          {/* Main app */}
          <Route element={<AuthGate><React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}><AppLayout /></React.Suspense></AuthGate>}>
            {/* Index: role-based landing */}
            <Route index element={<RoleLanding />} />

            <Route path="events" element={<EventsPage />} />

            <Route path="operations">
              <Route index element={<OperationsListPage />} />
              <Route path="new" element={<NewOperationPlanRedirect />} />
              <Route path=":id" element={<EventControlCenter />} />
              <Route path=":id/shortage" element={<ShortageRequestPage />} />
              <Route path=":id/checklist" element={<ChecklistManagerPage />} />
              <Route path=":id/tasks" element={<OperationTasksPage />} />
            </Route>

            <Route path="tours/:tourId" element={<RoleGuard roles={ADMIN_ROLES}><TourPnLPage /></RoleGuard>} />

            <Route path="office"    element={<RoleGuard roles={FIELD_ROLES}><OfficePage /></RoleGuard>} />
            <Route path="inventory" element={<RoleGuard roles={FIELD_ROLES}><InventoryPage /></RoleGuard>} />
            <Route path="staff"     element={<RoleGuard roles={ADMIN_ROLES}><StaffPage /></RoleGuard>} />
            <Route path="payments"  element={<RoleGuard roles={['super_admin','event_manager','office_staff','onsite_staff']}><PaymentsPage /></RoleGuard>} />

            <Route path="attendees" element={<AttendeesPage />} />
            <Route path="scanner"   element={<QRScannerPage />} />
            <Route path="tasks"          element={<TasksPage />} />
            <Route path="task-templates" element={<RoleGuard roles={ADMIN_ROLES}><TaskTemplatesPage /></RoleGuard>} />
            <Route path="vendors"        element={<RoleGuard roles={ADMIN_ROLES}><VendorsPage /></RoleGuard>} />
            <Route path="templates" element={<RoleGuard roles={ADMIN_ROLES}><TemplatesPage /></RoleGuard>} />
            <Route path="shortages" element={<RoleGuard roles={FIELD_ROLES}><ShortagesPage /></RoleGuard>} />
            <Route path="reports"   element={<RoleGuard roles={['super_admin','event_manager','office_staff','onsite_staff']}><ReportsPage /></RoleGuard>} />
            <Route path="reports/program-history" element={<RoleGuard roles={['super_admin','event_manager','office_staff','onsite_staff']}><ProgramHistoryPage /></RoleGuard>} />
            <Route path="settings"  element={<SettingsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-slate-300">404</h1>
                <p className="text-slate-500 mt-2">Page not found</p>
                <a href="/" className="mt-4 inline-block text-brand-600 hover:underline text-sm">Go to Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontSize: '14px', fontFamily: 'Urbanist, sans-serif' },
        }}
      />
      <PwaUpdatePrompt />
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
