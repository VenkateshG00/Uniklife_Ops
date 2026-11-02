export type UserRole =
  | 'super_admin'
  | 'event_manager'
  | 'office_staff'
  | 'onsite_staff'       // legacy — same as office_staff, not assignable
  | 'procurement_staff'  // legacy — same as office_staff, not assignable
  | 'read_only'

// Role groups (legacy roles included so existing users keep access)
export const ADMIN_ROLES:  UserRole[] = ['super_admin', 'event_manager']
export const FIELD_ROLES:  UserRole[] = ['super_admin', 'event_manager', 'office_staff', 'onsite_staff', 'procurement_staff']
export const WRITE_ROLES:  UserRole[] = ['super_admin', 'event_manager', 'office_staff', 'onsite_staff', 'procurement_staff']
export const ALL_ROLES:    UserRole[] = ['super_admin', 'event_manager', 'office_staff', 'onsite_staff', 'procurement_staff', 'read_only']

export function hasRole(userRole: string | undefined | null, allowed: UserRole[]): boolean {
  if (!userRole) return false
  return (allowed as string[]).includes(userRole)
}

// Human-readable labels for display
export const ROLE_LABELS: Record<string, string> = {
  super_admin:       'Super Admin',
  event_manager:     'Event Manager',
  office_staff:      'Staff',
  onsite_staff:      'Staff',
  procurement_staff: 'Staff',
  read_only:         'Read Only',
}

// Only these roles can be assigned to new staff members
export const ASSIGNABLE_ROLES: UserRole[] = [
  'event_manager', 'office_staff', 'read_only',
]
