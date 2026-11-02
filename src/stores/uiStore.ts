import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  activeEventId: string | null
  pendingSyncCount: number
  isOnline: boolean

  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (v: boolean) => void
  setActiveEventId: (id: string | null) => void
  setPendingSyncCount: (n: number) => void
  setIsOnline: (v: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      activeEventId: null,
      pendingSyncCount: 0,
      isOnline: navigator.onLine,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleMobileSidebar: () =>
        set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
      setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
      setActiveEventId: (id) => set({ activeEventId: id }),
      setPendingSyncCount: (n) => set({ pendingSyncCount: n }),
      setIsOnline: (v) => set({ isOnline: v }),
    }),
    {
      name: 'uniklife-ops-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
