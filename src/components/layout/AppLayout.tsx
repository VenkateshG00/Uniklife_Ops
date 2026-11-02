import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUiStore } from '../../stores/uiStore'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { cn } from '../../lib/utils'
import { useEffect } from 'react'

export function AppLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, setIsOnline } = useUiStore()
  useRealtimeSync()
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname, setMobileSidebarOpen])

  useEffect(() => {
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setIsOnline])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <div
        className={cn(
          'flex flex-col flex-1 overflow-hidden transition-all duration-200',
          // Desktop: offset by sidebar width
          'md:ml-[256px]',
          sidebarCollapsed && 'md:ml-[72px]',
          // Mobile: full width (sidebar is an overlay)
          'ml-0'
        )}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
