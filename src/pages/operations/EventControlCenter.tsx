import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/layout/Header'
import { KpiCard } from '../../components/ui/KpiCard'
import { ReadinessGauge } from '../../components/ui/ReadinessGauge'
import { ActivityFeed } from '../../components/ui/ActivityFeed'
import { ItemStatusBadge, PriorityBadge, ShortageStatusBadge } from '../../components/ui/Badge'
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, RefreshCw, ArrowLeft, XCircle, Loader2
} from 'lucide-react'
import { cn, timeAgo, formatDateTime } from '../../lib/utils'
import type { ItemStatus } from '../../types'
import { useOperationPlanById } from '../../hooks/useEvents'
import { useChecklist, useUpdateItemStatus } from '../../hooks/useChecklist'
import { useShortages, useUpdateShortageStatus } from '../../hooks/useShortages'
import { useEventActivity, useRealtimeActivity } from '../../hooks/useRealtime'

type FilterTab = 'all' | 'pending' | 'completed' | 'shortage' | 'critical'

function calcReadiness(items: Array<{ status: string; is_critical: boolean }>) {
  if (!items.length) return 0
  const done = items.filter(i => i.status === 'done')
  const critical = items.filter(i => i.is_critical)
  const critDone = critical.filter(i => i.status === 'done')
  return Math.round(
    0.6 * (done.length / items.length) * 100 +
    0.4 * (critical.length ? (critDone.length / critical.length) * 100 : 100)
  )
}

export function EventControlCenter() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const { data: plan, isLoading: planLoading } = useOperationPlanById(id ?? '')
  const { data: checklist = [], isLoading: checklistLoading, refetch } = useChecklist(id ?? '')
  const { data: shortages = [] } = useShortages(id ?? '')
  const { data: initialActivity = [] } = useEventActivity((plan as any)?.events?.id ?? '')
  const liveActivity = useRealtimeActivity((plan as any)?.events?.id ?? '', initialActivity)
  const updateStatus = useUpdateItemStatus(id ?? '')
  const updateShortage = useUpdateShortageStatus(id ?? '')

  if (planLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-400">
        <XCircle className="w-10 h-10" />
        <p>Operation plan not found</p>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/operations')}>
          <ArrowLeft className="w-4 h-4" /> Back to Operations
        </button>
      </div>
    )
  }

  const ev = (plan as any).events
  const items = checklist
  const readinessPct = calcReadiness(items)
  const pendingShortages = shortages.filter((s: any) => s.status === 'pending')
  const pendingShortageItemIds = new Set((pendingShortages as any[]).map((s: any) => s.checklist_item_id))

  const kpis = {
    total: items.length,
    completed: items.filter(i => i.status === 'done').length,
    inProgress: items.filter(i => ['packed', 'dispatched', 'at_venue'].includes(i.status)).length,
    pending: items.filter(i => i.status === 'pending').length,
    blocked: items.filter(i => i.status === 'issue').length,
    openShortages: pendingShortages.length,
    criticalAlerts: items.filter(i => i.is_critical && i.status !== 'done').length,
    criticalPct: (() => {
      const crit = items.filter(i => i.is_critical)
      if (!crit.length) return 100
      return Math.round(crit.filter(i => i.status === 'done').length / crit.length * 100)
    })(),
  }

  const filtered = items.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return ['pending', 'packed', 'dispatched'].includes(item.status)
    if (activeTab === 'completed') return item.status === 'done'
    if (activeTab === 'shortage') return item.status === 'issue'
    if (activeTab === 'critical') return item.is_critical
    return true
  })

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',       label: 'All',        count: items.length },
    { key: 'pending',   label: 'Pending',    count: kpis.pending + kpis.inProgress },
    { key: 'completed', label: 'Done',       count: kpis.completed },
    { key: 'shortage',  label: 'Issues',     count: items.filter(i => i.status === 'issue').length },
    { key: 'critical',  label: 'Critical',   count: items.filter(i => i.is_critical).length },
  ]

  return (
    <>
      <Header
        title={ev?.title ?? 'Event Control Center'}
        subtitle={ev ? `${ev.venue_name} · ${formatDateTime(ev.start_datetime)}` : ''}
      />

      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate('/operations')} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> All Operations
          </button>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => navigate(`/operations/${id}/checklist`)} className="btn btn-secondary btn-sm">
              <ClipboardList className="w-4 h-4" /> Checklist
            </button>
            <button onClick={() => navigate(`/operations/${id}/tasks`)} className="btn btn-secondary btn-sm">
              <CheckCircle2 className="w-4 h-4" /> Tasks
            </button>
            <button onClick={() => navigate(`/operations/${id}/shortage`)} className="btn btn-danger btn-sm">
              <AlertTriangle className="w-4 h-4" /> Shortages
              {kpis.openShortages > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{kpis.openShortages}</span>
              )}
            </button>
          </div>
        </div>

        {/* Readiness + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="card p-6 flex flex-col items-center justify-center">
            <ReadinessGauge pct={readinessPct} />
            <p className="text-sm text-slate-500 mt-2">Overall Readiness</p>
            <p className="text-xs text-slate-400">Critical: {kpis.criticalPct}%</p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total Items"  value={kpis.total}       icon={ClipboardList} iconBg="bg-slate-50"   iconColor="text-slate-500" accent="border-slate-300" />
            <KpiCard label="Completed"    value={kpis.completed}   icon={CheckCircle2}  iconBg="bg-emerald-50" iconColor="text-emerald-600" accent="border-emerald-400" />
            <KpiCard label="In Progress"  value={kpis.inProgress}  icon={Clock}         iconBg="bg-blue-50"    iconColor="text-blue-600"   accent="border-blue-400" />
            <KpiCard label="Open Shortages" value={kpis.openShortages} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" accent="border-red-400" />
          </div>
        </div>

        {/* Checklist */}
        <div className="card overflow-hidden table-scroll">
          <div className="flex items-center gap-1 px-5 py-3 border-b border-slate-100 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                  activeTab === t.key
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {t.label} <span className="ml-1 opacity-70">{t.count}</span>
              </button>
            ))}
          </div>

          {checklistLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading checklist…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {items.length === 0
                ? 'No checklist items yet — add items to this operation plan'
                : 'No items match this filter'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Updated</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.is_critical && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Critical" />
                        )}
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        {pendingShortageItemIds.has(item.id) && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-1.5 py-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Shortage
                          </span>
                        )}
                      </div>
                      <PriorityBadge priority={item.priority as any} />
                    </td>
                    <td className="px-3 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {(item as any).material_categories?.name ?? '—'}
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-slate-700">
                      {item.status === 'done' || item.status === 'at_venue'
                        ? item.required_qty
                        : item.packed_qty ?? 0}/{item.required_qty}
                    </td>
                    <td className="px-3 py-3.5">
                      <ItemStatusBadge status={item.status as ItemStatus} />
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-400 hidden lg:table-cell">
                      {item.updated_at ? timeAgo(item.updated_at) : '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus.mutate({ id: item.id, status: e.target.value as ItemStatus })}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer hover:border-brand-300"
                        disabled={updateStatus.isPending}
                      >
                        {(['pending','packed','dispatched','at_venue','done','issue'] as ItemStatus[]).map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom row: Shortages + Staff + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending shortages */}
          <div className="card p-5">
            <div className="section-header mb-3">
              <h2 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Shortages
              </h2>
              <button
                onClick={() => navigate(`/operations/${id}/shortage`)}
                className="btn btn-ghost btn-sm"
              >
                All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {shortages.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No shortage requests</p>
            ) : (
              <div className="space-y-3">
                {(shortages as any[]).slice(0, 3).map((s: any) => (
                  <div key={s.id} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{s.event_checklist_items?.name ?? 'Item'}</span>
                        <ShortageStatusBadge status={s.status} />
                      </div>
                      <p className="text-xs text-slate-500">+{s.additional_qty_requested} needed · {s.profiles?.full_name ?? 'Unknown'}</p>
                    </div>
                    {s.status === 'pending' && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => updateShortage.mutate({ id: s.id, status: 'approved' })}
                          className="btn btn-primary btn-sm py-0.5 px-2 text-xs"
                        >Approve</button>
                        <button
                          onClick={() => updateShortage.mutate({ id: s.id, status: 'rejected' })}
                          className="btn btn-danger btn-sm py-0.5 px-2 text-xs"
                        >Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff */}
          <div className="card p-5">
            <div className="section-header mb-3">
              <h2 className="section-title">Staff</h2>
            </div>
            {ev?.event_manager_id || ev?.office_coordinator_id ? (
              <div className="space-y-2 text-sm">
                {ev.event_manager_id && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">M</div>
                    <span className="text-slate-700">Event Manager</span>
                  </div>
                )}
                {ev.office_coordinator_id && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">O</div>
                    <span className="text-slate-700">Office Coordinator</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No staff assigned yet</p>
            )}
          </div>

          {/* Live Activity */}
          <div className="card p-5">
            <div className="section-header mb-3">
              <h2 className="section-title">Live Activity</h2>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            {liveActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No activity yet</p>
            ) : (
              <ActivityFeed items={liveActivity.slice(0, 8)} compact />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
