import { useAuthStore } from '../stores/authStore'
import { hasRole, ADMIN_ROLES, WRITE_ROLES, ALL_ROLES, type UserRole } from '../lib/rbac'

export function useRole() {
  const role = useAuthStore(s => s.profile?.role)

  return {
    role,
    /** super_admin only */
    isSuperAdmin: () => role === 'super_admin',
    /** super_admin or event_manager */
    isAdmin:    () => hasRole(role, ADMIN_ROLES),
    /** everyone except read_only */
    canWrite:   () => hasRole(role, WRITE_ROLES),
    /** any authenticated role */
    isAny:      () => hasRole(role, ALL_ROLES),
    /** arbitrary role check */
    can:        (allowed: UserRole[]) => hasRole(role, allowed),
  }
}
