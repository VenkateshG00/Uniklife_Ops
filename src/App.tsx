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

// Pages
import { DashboardPage }           from './pages/dashboard/DashboardPage'
import { EventsPage }              from './pages/events/EventsPage'
import { OperationsListPage }      from './pages/operations/OperationsListPage'
import { CreateOperationPlanModal }from './pages/operations/CreateOperationPlanModal'
import { EventControlCenter }      from './pages/operations/EventControlCenter'
import { ShortageRequestPage }     from './pages/operations/ShortageRequestPage'
import { ChecklistManagerPage }    from './pages/operations/ChecklistManagerPage'
import { OperationTasksPage }      from './pages/operations/OperationTasksPage'
import { OfficePage }              from './pages/office/OfficePage'
import { InventoryPage }           from './pages/inventory/InventoryPage'
import { StaffPage }               from './pages/staff/StaffPage'
import { TasksPage }               from './pages/tasks/TasksPage'
import { AttendeesPage }           from './pages/attendees/AttendeesPage'
import { QRScannerPage }           from './pages/scanner/QRScannerPage'
import { PaymentsPage }            from './pages/payments/PaymentsPage'
import { SettingsPage }            from './pages/settings/SettingsPage'
import { TemplatesPage }           from './pages/templates/TemplatesPage'
import { ReportsPage }             from './pages/reports/ReportsPage'
import { ShortagesPage }           from './pages/shortages/ShortagesPage'

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
          <Route element={<AuthGate><AppLayout /></AuthGate>}>
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

            <Route path="office"    element={<RoleGuard roles={FIELD_ROLES}><OfficePage /></RoleGuard>} />
            <Route path="inventory" element={<RoleGuard roles={FIELD_ROLES}><InventoryPage /></RoleGuard>} />
            <Route path="staff"     element={<RoleGuard roles={ADMIN_ROLES}><StaffPage /></RoleGuard>} />
            <Route path="payments"  element={<RoleGuard roles={['super_admin','event_manager','office_staff','onsite_staff']}><PaymentsPage /></RoleGuard>} />

            <Route path="attendees" element={<AttendeesPage />} />
            <Route path="scanner"   element={<QRScannerPage />} />
            <Route path="tasks"     element={<TasksPage />} />
            <Route path="templates" element={<RoleGuard roles={ADMIN_ROLES}><TemplatesPage /></RoleGuard>} />
            <Route path="shortages" element={<RoleGuard roles={FIELD_ROLES}><ShortagesPage /></RoleGuard>} />
            <Route path="reports"   element={<RoleGuard roles={['super_admin','event_manager','office_staff','onsite_staff']}><ReportsPage /></RoleGuard>} />
            <Route path="settings"  element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
