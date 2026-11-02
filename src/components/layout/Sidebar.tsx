import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, CreditCard,
  UserCheck, ClipboardList, Package, CheckSquare,
  BarChart2, Settings, ChevronLeft, ChevronRight, Zap,
  ShoppingCart, BookOpen, ExternalLink, LogOut, X, AlertTriangle
} from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useShortagesByOrg } from '../../hooks/useShortages'
import { hasRole, ADMIN_ROLES, ALL_ROLES, FIELD_ROLES, type UserRole } from '../../lib/rbac'
import { cn } from '../../lib/utils'

const navItems: Array<
  | { to: string; label: string; icon: React.ElementType; roles: UserRole[]; badge?: 'shortages' }
  | { divider: true; label: string }
> = [
  { to: '/',           label: 'Dashboard',        icon: LayoutDashboard, roles: ALL_ROLES },
  { to: '/events',     label: 'Events',           icon: Calendar,        roles: ALL_ROLES },
  { to: '/payments',   label: 'Expenses',         icon: CreditCard,      roles: ['super_admin','event_manager','office_staff'] },
  { to: '/staff',      label: 'Staff',            icon: UserCheck,       roles: ADMIN_ROLES },
  { divider: true, label: 'Operations' },
  { to: '/operations', label: 'Event Operations', icon: ClipboardList,   roles: ALL_ROLES },
  { to: '/tasks',      label: 'Tasks',            icon: CheckSquare,     roles: ALL_ROLES },
  { to: '/shortages',  label: 'Shortages',        icon: AlertTriangle,   roles: FIELD_ROLES, badge: 'shortages' },
  { to: '/office',     label: 'Office Prep',      icon: Package,         roles: ['super_admin','event_manager','office_staff'] },
  { to: '/inventory',  label: 'Inventory',        icon: ShoppingCart,    roles: FIELD_ROLES },
  { divider: true, label: 'Management' },
  { to: '/templates',  label: 'Templates',        icon: BookOpen,        roles: ADMIN_ROLES },
  { to: '/reports',    label: 'Reports',          icon: BarChart2,       roles: ['super_admin','event_manager','office_staff'] },
  { to: '/settings',   label: 'Settings',         icon: Settings,        roles: ALL_ROLES },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore()
  const { profile } = useAuthStore()
  const location = useLocation()
  const { data: allShortages = [] } = useShortagesByOrg()
  const pendingShortages = (allShortages as any[]).filter((s: any) => s.status === 'pending').length

  const visibleItems = navItems.filter(item => {
    if ('divider' in item) return true
    return hasRole(profile?.role, item.roles)
  })

  return (
    <aside
      className={cn(
        'sidebar fixed top-0 left-0 z-40 h-[100dvh] flex flex-col transition-all duration-200',
        // Desktop: always visible, collapsible
        'md:translate-x-0',
        sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[256px]',
        // Mobile: full-width drawer, hidden off-screen when closed
        mobileSidebarOpen ? 'translate-x-0 w-[256px]' : '-translate-x-full w-[256px]',
      )}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
        {(!sidebarCollapsed || mobileSidebarOpen) && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">UniklifeOps</div>
              <div className="text-slate-400 text-[10px] leading-tight">Ops Control Center</div>
            </div>
          </div>
        )}
        {sidebarCollapsed && !mobileSidebarOpen && (
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'hidden md:flex text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10',
            sidebarCollapsed && 'absolute -right-3 top-5 bg-slate-700 rounded-full border border-slate-600 shadow-lg'
          )}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft  className="w-4 h-4" />
          }
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-1.5">
        {visibleItems.map((item, i) => {
          if ('divider' in item) {
            if (sidebarCollapsed && !mobileSidebarOpen) {
              return <div key={i} className="my-2 mx-3 border-t border-white/10" />
            }
            return (
              <div key={i} className="px-4 pt-4 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {item.label}
                </span>
              </div>
            )
          }

          const Icon = item.icon
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)
          const collapsed = sidebarCollapsed && !mobileSidebarOpen

          const badgeCount = item.badge === 'shortages' ? pendingShortages : 0

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn('nav-item', isActive && 'active')}
              title={collapsed ? item.label : undefined}
            >
              <span className="relative">
                <Icon className="icon" />
                {badgeCount > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                )}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && badgeCount > 0 && (
                <span className="min-w-[20px] h-5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold flex items-center justify-center px-1">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* UnikScan external link */}
      <div className="px-1.5 pb-1 shrink-0">
        <a
          href="https://qr.venukalyan.ai"
          target="_blank"
          rel="noopener noreferrer"
          className={cn('nav-item group')}
          title={(sidebarCollapsed && !mobileSidebarOpen) ? 'UnikScan' : undefined}
        >
          <Zap className="icon text-brand-400" />
          {(!sidebarCollapsed || mobileSidebarOpen) && (
            <>
              <span className="flex-1 text-brand-300">UnikScan</span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-brand-400 transition-colors" />
            </>
          )}
        </a>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-white/10 shrink-0">
        {(!sidebarCollapsed || mobileSidebarOpen) && profile && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.full_name?.charAt(0) ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{profile.full_name}</div>
              <div className="text-slate-400 text-[10px] capitalize truncate">{profile.role?.replace(/_/g, ' ')}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => useAuthStore.getState().signOut()}
          className={cn(
            'nav-item w-full mt-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10',
            (sidebarCollapsed && !mobileSidebarOpen) && 'justify-center'
          )}
          title={(sidebarCollapsed && !mobileSidebarOpen) ? 'Logout' : undefined}
        >
          <LogOut className="icon" />
          {(!sidebarCollapsed || mobileSidebarOpen) && <span className="flex-1 text-left">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
