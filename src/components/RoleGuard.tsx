import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { hasRole, type UserRole } from '../lib/rbac'

interface Props {
  roles: UserRole[]
  children: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ roles, children, redirectTo = '/' }: Props) {
  const role = useAuthStore(s => s.profile?.role)
  if (!hasRole(role, roles)) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
