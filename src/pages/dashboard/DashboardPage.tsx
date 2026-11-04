import { Header } from '../../components/layout/Header'
import { KpiCard } from '../../components/ui/KpiCard'
import { ReadinessBar } from '../../components/ui/ReadinessGauge'
import { ActivityFeed } from '../../components/ui/ActivityFeed'
import {
  Calendar, AlertTriangle, CheckCircle2, Zap, Package,
  Loader2, ClipboardList, Clock, Users, ChevronRight
} from 'lucide-react'
import { formatDate, cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useOperationPlans } from '../../hooks/useEvents'
import { useRecentActivity } from '../../hooks/useRealtime'
import { useTasksByOrg, useUpdateTaskStatus } from '../../hooks/useTasks'
import { useShortagesByOrg } from '../../hooks/useShortages'
import { useAuthStore } from '../../stores/authStore'

function calcReadiness(items: Array<{ status: string; is_critical: boolean }>) {
  if (!items.length) return 0
  const done = items.filter(i => i.status === 'at_venue')
  const critical = items.filter(i => i.is_critical)
  const critDone = critical.filter(i => i.status === 'at_venue')
  return Math.round(
    0.6 * (done.length / items.length) * 100 +
    0.4 * (critical.length ? (critDone.length / critical.length) * 100 : 100)
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const userId = useAuthStore(s => s.user?.id)

  const { data: plans, isLoading } = useOperationPlans()
  const { data: activity = [] } = useRecentActivity()
  const { data: allTasks = [] } = useTasksByOrg()
  const { data: allShortages = [] } = useShortagesByOrg()
  const updateStatus = useUpdateTaskStatus('')

  // Upcoming events
  const upcoming = (plans ?? [])
    .filter(p => {
      const ev = (p as any).events
      return ev && new Date(ev.start_datetime) >= new Date()
    })
    .sort((a, b) =>
      new Date((a as any).events?.start_datetime ?? 0).getTime() -
      new Date((b as any).events?.start_datetime ?? 0).getTime()
    )
    .slice(0, 5)

  // KPI metrics
  const openShortages = (allShortages as any[]).filter(s => s.status === 'pending').length
  const pendingTasks = (allTasks as any[]).filter(t => ['pending', 'in_progress'].includes(t.status)).length
  const totalCompleted = (plans ?? []).reduce((n, p) =>
    n + ((p as any).event_checklist_items ?? []).filter((i: any) => i.status === 'at_venue').length, 0)
  const totalUpcoming = upcoming.length

  // My tasks (assigned to me, not completed/cancelled)
  const myTasks = (allTasks as any[])
    .filter(t => t.assigned_to_id === userId && !['completed', 'cancelled'].includes(t.status))
    .sort((a, b) => {
      const aOver = a.deadline && new Date(a.deadline) < new Date()
      const bOver = b.deadline && new Date(b.deadline) < new Date()
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      return 0
    })
    .slice(0, 5)

  // Attention: overdue tasks + open shortages
  const overdueTasks = (allTasks as any[]).filter(t =>
    t.deadline && !['completed', 'cancelled'].includes(t.status) && new Date(t.deadline) < new Date()
  )
  const needsAttention = openShortages > 0 || overdueTasks.length > 0

  return (
    <>
      <Header title="Dashboard" subtitle="Event Operations Overview" />

      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Upcoming Events" value={totalUpcoming}  icon={Calendar}       iconBg="bg-brand-50"   iconColor="text-brand-600"   accent="border-brand-500" />
          <KpiCard label="Open Shortages"  value={openShortages}  icon={AlertTriangle}  iconBg="bg-red-50"     iconColor="text-red-600"     accent="border-red-500" />
          <KpiCard label="Pending Tasks"   value={pendingTasks}   icon={ClipboardList}  iconBg="bg-amber-50"   iconColor="text-amber-600"   accent="border-amber-500" />
          <KpiCard label="Items Verified"  value={totalCompleted} icon={CheckCircle2}   iconBg="bg-emerald-50" iconColor="text-emerald-600" accent="border-emerald-500" />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upcoming Events */}
          <div className="lg:col-span-2 card p-6">
            <div className="section-header">
              <h2 className="section-title">Upcoming Events</h2>
              <button onClick={() => navigate('/events')} className="btn btn-ghost btn-sm">View all</button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            )}

            {!isLoading && upcoming.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Zap className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No upcoming events</p>
                <p className="text-xs mt-1">Create an event to get started</p>
                <button onClick={() => navigate('/events')} className="btn btn-primary btn-sm mt-4">
                  Create Event
                </button>
              </div>
            )}

            <div className="space-y-3">
              {upcoming.map((plan) => {
                const ev = (plan as any).events
                const items = (plan as any).event_checklist_items ?? []
                const shortages = (plan as any).shortage_requests ?? []
                const readiness = calcReadiness(items)
                const openSr = shortages.filter((s: any) => s.status === 'pending').length
                const managerName = ev?.profiles?.full_name

                return (
                  <div
                    key={plan.id}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 cursor-pointer transition-all"
                    onClick={() => navigate(`/operations/${plan.id}`)}
                  >
                    <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">{ev?.title ?? '—'}</h3>
                        {openSr > 0 && <span className="badge badge-shortage">{openSr} shortage</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ev?.venue_name} · {ev?.start_datetime ? formatDate(ev.start_datetime) : '—'}
                        {managerName && <span className="ml-2 text-brand-600 font-medium">· {managerName}</span>}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <ReadinessBar pct={readiness} className="flex-1" />
                        <span className="text-xs font-bold text-slate-700 shrink-0">{readiness}%</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev?.expected_attendees ?? 0}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {items.length} items</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm shrink-0"
                      onClick={e => { e.stopPropagation(); navigate(`/operations/${plan.id}`) }}
                    >
                      Manage
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* My Tasks */}
            <div className="card p-5">
              <div className="section-header mb-3">
                <h2 className="section-title flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-brand-500" /> My Tasks
                </h2>
                <button onClick={() => navigate('/tasks')} className="btn btn-ghost btn-sm text-xs">
                  All <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {myTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No tasks assigned to you</p>
              ) : (
                <div className="space-y-2">
                  {myTasks.map((task: any) => {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date()
                    return (
                      <div key={task.id} className={cn(
                        'flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors',
                        isOverdue ? 'border-red-100 bg-red-50/40' : 'border-slate-100 hover:bg-slate-50'
                      )}>
                        <button
                          onClick={() => updateStatus.mutate({ id: task.id, status: 'completed' })}
                          className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-brand-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-1.5 rounded">
                              {task.category}
                            </span>
                            {task.deadline && (
                              <span className={cn('flex items-center gap-0.5 text-[10px]', isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400')}>
                                <Clock className="w-2.5 h-2.5" />
                                {isOverdue ? 'Overdue' : formatDate(task.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Live Activity */}
            <div className="card p-5 flex-1">
              <div className="section-header mb-3">
                <h2 className="section-title">Live Activity</h2>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
              ) : (
                <ActivityFeed items={activity} />
              )}
            </div>
          </div>
        </div>

        {/* Attention Required */}
        {needsAttention && (
          <div className="card p-6">
            <div className="section-header mb-4">
              <h2 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Attention Required
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Overdue tasks */}
              {overdueTasks.slice(0, 3).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-orange-800 truncate">{t.title}</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Overdue · {t.profiles?.full_name ?? 'Unassigned'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Pending shortages */}
              {(allShortages as any[]).filter(s => s.status === 'pending').slice(0, 3 - Math.min(overdueTasks.length, 3)).map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => navigate('/shortages')}
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-800 truncate">
                      {(s.event_checklist_items as any)?.name ?? 'Shortage'} +{s.additional_qty_requested}
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {(s.event_operation_plans as any)?.events?.title ?? 'Unknown event'} · Pending
                    </p>
                  </div>
                </div>
              ))}

            </div>

            {(overdueTasks.length > 3 || openShortages > 3) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
                {overdueTasks.length > 3 && (
                  <button onClick={() => navigate('/tasks')} className="text-xs text-orange-600 font-semibold hover:underline">
                    +{overdueTasks.length - 3} more overdue tasks →
                  </button>
                )}
                {openShortages > 3 && (
                  <button onClick={() => navigate('/shortages')} className="text-xs text-red-600 font-semibold hover:underline">
                    +{openShortages - 3} more shortage requests →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </>
  )
}
