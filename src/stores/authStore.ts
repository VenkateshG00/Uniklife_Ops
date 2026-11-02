import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '../types'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean

  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (v: boolean) => void
  setInitialized: (v: boolean) => void
  signOut: () => Promise<void>

  // Helpers
  isAuthenticated: () => boolean
  hasRole: (roles: UserRole[]) => boolean
  canManageEvents: () => boolean
  canEditChecklist: () => boolean
  canApproveShortages: () => boolean
  isOfficeStaff: () => boolean
  isOnsiteStaff: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      profile: null,
      loading: true,
      initialized: false,

      setSession: (session) =>
        set({ session, user: session?.user ?? null }),

      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null, user: null, profile: null })
      },

      isAuthenticated: () => !!get().session,

      hasRole: (roles) => {
        const role = get().profile?.role
        return role ? roles.includes(role) : false
      },

      canManageEvents: () =>
        get().hasRole(['super_admin', 'event_manager']),

      canEditChecklist: () =>
        get().hasRole(['super_admin', 'event_manager', 'office_staff', 'onsite_staff']),

      canApproveShortages: () =>
        get().hasRole(['super_admin', 'event_manager']),

      isOfficeStaff: () =>
        get().hasRole(['office_staff', 'onsite_staff', 'event_manager', 'super_admin']),

      isOnsiteStaff: () =>
        get().hasRole(['office_staff', 'onsite_staff', 'event_manager', 'super_admin']),
    }),
    {
      name: 'uniklife-ops-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
