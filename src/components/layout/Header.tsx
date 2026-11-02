import { Bell, Search, Wifi, WifiOff, LogOut, RefreshCw, AlertTriangle, Package, Clock, X, Menu, ClipboardCheck, PenLine, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { cn } from '../../lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, type NotificationItem } from '../../hooks/useNotifications'

interface HeaderProps {
  title?: string
  subtitle?: string
}

const typeIcon = {
  issue:             <AlertTriangle  className="w-3.5 h-3.5 text-red-500 shrink-0" />,
  shortage:          <Package        className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  overdue_task:      <Clock          className="w-3.5 h-3.5 text-orange-500 shrink-0" />,
  assigned_task:     <ClipboardCheck className="w-3.5 h-3.5 text-brand-500 shrink-0" />,
  task_updated:      <PenLine        className="w-3.5 h-3.5 text-violet-500 shrink-0" />,
  shortage_approved: <CheckCircle2   className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
  shortage_rejected: <XCircle        className="w-3.5 h-3.5 text-red-400 shrink-0" />,
}

const typeColor: Record<NotificationItem['type'], string> = {
  issue:             'bg-red-50 border-red-100',
  shortage:          'bg-amber-50 border-amber-100',
  overdue_task:      'bg-orange-50 border-orange-100',
  assigned_task:     'bg-brand-50 border-brand-100',
  task_updated:      'bg-violet-50 border-violet-100',
  shortage_approved: 'bg-emerald-50 border-emerald-100',
  shortage_rejected: 'bg-red-50 border-red-100',
}

export function Header({ title, subtitle }: HeaderProps) {
  const { profile, signOut } = useAuthStore()
  const { pendingSyncCount, isOnline, toggleMobileSidebar } = useUiStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef  = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: notifications = [], isLoading: notifsLoading } = useNotifications()

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleNotifClick(n: NotificationItem) {
    setShowNotifs(false)
    if (n.planId) {
      if (n.type === 'shortage') navigate(`/operations/${n.planId}`)
      else navigate(`/operations/${n.planId}`)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden btn-icon btn-ghost -ml-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex flex-col">
          {title    && <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Search (desktop) */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-72">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search events, items, staff…"
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none flex-1"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Sync indicator */}
        {pendingSyncCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {pendingSyncCount} pending
          </div>
        )}

        {/* Online indicator */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium',
            isOnline ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          )}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowUserMenu(false) }}
            className="relative btn-icon btn-ghost"
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {notifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">Alerts</span>
                <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Colour legend */}
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /> Issue
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" /> Shortage
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" /> Overdue
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" /> Assigned to you
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" /> Task updated
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Shortage approved
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" /> Shortage rejected
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifsLoading && (
                  <p className="text-xs text-slate-400 text-center py-6">Loading…</p>
                )}
                {!notifsLoading && notifications.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium text-slate-600">All clear</p>
                    <p className="text-xs mt-0.5">No active issues or pending items</p>
                  </div>
                )}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors text-left',
                      typeColor[n.type]
                    )}
                  >
                    <span className="mt-0.5">{typeIcon[n.type]}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 truncate">{n.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100">
                  <button
                    onClick={() => { setShowNotifs(false); navigate('/reports?tab=issues') }}
                    className="text-xs text-brand-600 font-semibold hover:underline"
                  >
                    View all in Reports →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(v => !v); setShowNotifs(false) }}
            className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-slate-800 leading-tight">{profile?.full_name}</div>
              <div className="text-xs text-slate-500 capitalize">{profile?.role?.replace('_', ' ')}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 py-1 z-50">
              <button
                onClick={() => { setShowUserMenu(false); signOut() }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
