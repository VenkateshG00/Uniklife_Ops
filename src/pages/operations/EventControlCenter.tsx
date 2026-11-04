import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/layout/Header'
import { KpiCard } from '../../components/ui/KpiCard'
import { ReadinessGauge } from '../../components/ui/ReadinessGauge'
import { ActivityFeed } from '../../components/ui/ActivityFeed'
import { PriorityBadge, ShortageStatusBadge } from '../../components/ui/Badge'
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, RefreshCw, ArrowLeft, XCircle, Loader2, Flag, Lock
} from 'lucide-react'
import { cn, formatDateTime } from '../../lib/utils'
import type { EventPhase, ItemStatus } from '../../types'
import { useOperationPlanById, useCloseEvent, useUpdateOperationPlan } from '../../hooks/useEvents'
import { useChecklist, useUpdateItemStatus, useUpdateItemQty, type QtyField } from '../../hooks/useChecklist'
import { useShortages, useUpdateShortageStatus } from '../../hooks/useShortages'
import { useEventActivity, useRealtimeActivity } from '../../hooks/useRealtime'
import { useRole } from '../../hooks/useRole'

type FilterTab = 'all' | 'pending' | 'completed' | 'shortage' | 'critical'

const PHASE_ORDER: EventPhase[] = ['planning', 'preparation', 'dispatch', 'event_day', 'post_event', 'closed']

const PHASE_LABELS: Record<EventPhase, string> = {
  planning:    'Planning',
  preparation: 'Preparation',
  dispatch:    'Dispatch',
  event_day:   'Event Day',
  post_event:  'Post Event',
  closed:      'Closed',
}

const PHASE_STYLES: Record<EventPhase, string> = {
  planning:    'bg-blue-50 text-blue-700 border-blue-200',
  preparation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  dispatch:    'bg-amber-50 text-amber-700 border-amber-200',
  event_day:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  post_event:  'bg-violet-50 text-violet-700 border-violet-200',
  closed:      'bg-slate-100 text-slate-500 border-slate-200',
}

function computePhase(
  startDatetime: string,
  endDatetime: string,
  dispatchDeadline?: string | null,
  savedPhase?: string
): EventPhase {
  if (savedPhase === 'closed') return 'closed'
  const now = new Date()
  if (now >= new Date(endDatetime))   return 'post_event'
  if (now >= new Date(startDatetime)) return 'event_day'
  if (dispatchDeadline && now >= new Date(dispatchDeadline)) return 'dispatch'
  const msToStart = new Date(startDatetime).getTime() - now.getTime()
  const daysToStart = msToStart / (1000 * 60 * 60 * 24)
  if (dispatchDeadline) {
    const daysToDispatch = (new Date(dispatchDeadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysToDispatch <= 3) return 'preparation'
  } else {
    if (daysToStart <= 1)  return 'dispatch'
    if (daysToStart <= 7)  return 'preparation'
  }
  return 'planning'
}

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

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-slate-100 text-slate-600 border-slate-200',
  packed:     'bg-blue-50 text-blue-700 border-blue-200',
  dispatched: 'bg-amber-50 text-amber-700 border-amber-200',
  at_venue:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  issue:      'bg-red-50 text-red-700 border-red-200',
}

export function EventControlCenter() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [openIssueId, setOpenIssueId] = useState<string | null>(null)
  const [issueDrafts, setIssueDrafts] = useState<Record<string, string>>({})

  const { data: plan, isLoading: planLoading } = useOperationPlanById(id ?? '')
  const { data: checklist = [], isLoading: checklistLoading, refetch } = useChecklist(id ?? '')
  const { data: shortages = [] } = useShortages(id ?? '')
  const { data: initialActivity = [] } = useEventActivity((plan as any)?.events?.id ?? '')
  const liveActivity = useRealtimeActivity((plan as any)?.events?.id ?? '', initialActivity)
  const updateStatus = useUpdateItemStatus(id ?? '')
  const updateQty    = useUpdateItemQty(id ?? '')
  const updateShortage = useUpdateShortageStatus(id ?? '')
  const closeEvent   = useCloseEvent()
  const updatePlan   = useUpdateOperationPlan()
  const { isAdmin }  = useRole()
  const planPhase    = (plan as any)?.phase as EventPhase | undefined
  const eventStatus  = (plan as any)?.events?.status as string | undefined

  // Auto-advance phase based on event dates
  useEffect(() => {
    if (!plan) return
    const ev = (plan as any).events
    if (!ev?.start_datetime || !ev?.end_datetime) return
    const savedPhase = (plan as any).phase as EventPhase
    if (savedPhase === 'closed') return
    const computed = computePhase(ev.start_datetime, ev.end_datetime, (plan as any).dispatch_deadline, savedPhase)
    if (PHASE_ORDER.indexOf(computed) > PHASE_ORDER.indexOf(savedPhase)) {
      updatePlan.mutate({ id: (plan as any).id, payload: { phase: computed } })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(plan as any)?.id])

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
    completed: items.filter(i => i.status === 'at_venue').length,
    inProgress: items.filter(i => ['packed', 'dispatched'].includes(i.status)).length,
    pending: items.filter(i => i.status === 'pending').length,
    blocked: items.filter(i => i.status === 'issue').length,
    openShortages: pendingShortages.length,
    criticalAlerts: items.filter(i => i.is_critical && i.status !== 'at_venue').length,
    criticalPct: (() => {
      const crit = items.filter(i => i.is_critical)
      if (!crit.length) return 100
      return Math.round(crit.filter(i => i.status === 'at_venue').length / crit.length * 100)
    })(),
  }

  const filtered = items.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return ['pending', 'packed', 'dispatched'].includes(item.status)
    if (activeTab === 'completed') return item.status === 'at_venue'
    if (activeTab === 'shortage') return item.status === 'issue'
    if (activeTab === 'critical') return item.is_critical
    return true
  })

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',       label: 'All',        count: items.length },
    { key: 'pending',   label: 'Pending',    count: kpis.pending + kpis.inProgress },
    { key: 'completed', label: 'At Venue',   count: kpis.completed },
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
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/operations')} className="btn btn-ghost btn-sm">
              <ArrowLeft className="w-4 h-4" /> All Operations
            </button>
            {planPhase && planPhase !== 'closed' && (
              isAdmin() ? (
                <select
                  value={planPhase}
                  onChange={e => updatePlan.mutate({ id: (plan as any).id, payload: { phase: e.target.value as EventPhase } })}
                  disabled={updatePlan.isPending}
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer appearance-none',
                    PHASE_STYLES[planPhase] ?? 'bg-blue-50 text-blue-700 border-blue-200'
                  )}
                >
                  {PHASE_ORDER.filter(p => p !== 'closed').map(p => (
                    <option key={p} value={p}>{PHASE_LABELS[p]}</option>
                  ))}
                </select>
              ) : (
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', PHASE_STYLES[planPhase])}>
                  {PHASE_LABELS[planPhase]}
                </span>
              )
            )}
            {planPhase === 'closed' && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                Closed
              </span>
            )}
          </div>
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
            {planPhase === 'post_event' && eventStatus !== 'completed' && isAdmin() && (
              <button
                onClick={() => closeEvent.mutate({ planId: id ?? '', eventId: (plan as any).event_id })}
                disabled={closeEvent.isPending}
                className="btn btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                {closeEvent.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Closing…</>
                  : <><Lock className="w-4 h-4" /> Close Event</>}
              </button>
            )}
            {(planPhase === 'closed' || eventStatus === 'completed') && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Event Completed
              </span>
            )}
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
                  <th className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase">Required</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase">Ready</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">At Venue</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Returned</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => {
                  const gap = item.required_qty - (item.packed_qty ?? 0)
                  const isReusable = item.item_type === 'reusable'
                  const isPostEvent = planPhase === 'post_event' || planPhase === 'closed'
                  const dmgLoss = (item.damaged_qty ?? 0) + (item.lost_qty ?? 0)
                  return (
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
                        {gap > 0 && !pendingShortageItemIds.has(item.id) && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
                            −{gap}
                          </span>
                        )}
                        {dmgLoss > 0 && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-1.5 py-0.5">
                            {dmgLoss} dmg/lost
                          </span>
                        )}
                        <button
                          title="Flag an issue"
                          onClick={() => {
                            setOpenIssueId(openIssueId === item.id ? null : item.id)
                            setIssueDrafts(d => ({ ...d, [item.id]: (item as any).status_note ?? '' }))
                          }}
                          className={cn(
                            'ml-auto shrink-0 p-0.5 rounded transition-colors',
                            item.status === 'issue'
                              ? 'text-red-500 hover:text-red-700'
                              : 'text-slate-300 hover:text-red-400'
                          )}
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                      {openIssueId === item.id && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Describe the issue…"
                            value={issueDrafts[item.id] ?? ''}
                            onChange={e => setIssueDrafts(d => ({ ...d, [item.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                updateStatus.mutate({ id: item.id, status: 'issue', statusNote: issueDrafts[item.id] })
                                setOpenIssueId(null)
                              }
                              if (e.key === 'Escape') setOpenIssueId(null)
                            }}
                            className="flex-1 text-xs border border-red-200 rounded-lg px-2 py-1 bg-red-50 text-red-800 placeholder-red-300 outline-none focus:border-red-400"
                          />
                          <button
                            onClick={() => {
                              updateStatus.mutate({ id: item.id, status: 'issue', statusNote: issueDrafts[item.id] })
                              setOpenIssueId(null)
                            }}
                            className="text-[10px] font-semibold bg-red-500 text-white rounded px-2 py-1"
                          >Save</button>
                        </div>
                      )}
                      {!openIssueId && item.status === 'issue' && (item as any).status_note && (
                        <p className="text-[10px] text-red-500 italic mt-0.5">{(item as any).status_note}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PriorityBadge priority={item.priority as any} />
                        {isReusable && <span className="text-[9px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-1.5 py-0.5 uppercase tracking-wide">Reusable</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {(item as any).material_categories?.name ?? '—'}
                    </td>
                    <td className="px-2 py-3.5 text-center font-mono text-slate-700 font-semibold">
                      {item.required_qty}
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <input
                        type="number"
                        min={0}
                        defaultValue={item.packed_qty ?? 0}
                        onBlur={e => {
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v !== item.packed_qty) {
                            updateQty.mutate({ id: item.id, field: 'packed_qty' as QtyField, qty: v })
                          }
                        }}
                        className={cn(
                          'w-14 text-center font-mono text-sm border rounded-lg px-1 py-0.5 bg-white',
                          gap > 0 ? 'border-red-300 text-red-700' : 'border-slate-200 text-emerald-700'
                        )}
                      />
                    </td>
                    <td className="px-2 py-3.5 text-center hidden lg:table-cell">
                      <input
                        type="number"
                        min={0}
                        defaultValue={item.venue_verified_qty ?? 0}
                        onBlur={e => {
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v !== item.venue_verified_qty) {
                            updateQty.mutate({ id: item.id, field: 'venue_verified_qty' as QtyField, qty: v })
                          }
                        }}
                        className="w-14 text-center font-mono text-sm border border-slate-200 rounded-lg px-1 py-0.5 bg-white text-slate-700"
                      />
                    </td>
                    <td className="px-2 py-3.5 text-center hidden lg:table-cell">
                      {isReusable && isPostEvent ? (
                        <input
                          type="number"
                          min={0}
                          max={item.venue_verified_qty ?? item.required_qty}
                          defaultValue={item.returned_qty ?? 0}
                          onBlur={e => {
                            const v = parseInt(e.target.value)
                            if (!isNaN(v) && v !== item.returned_qty) {
                              updateQty.mutate({ id: item.id, field: 'returned_qty' as QtyField, qty: v })
                            }
                          }}
                          className="w-14 text-center font-mono text-sm border border-violet-200 rounded-lg px-1 py-0.5 bg-violet-50 text-violet-700"
                        />
                      ) : isReusable ? (
                        <span className="text-xs text-slate-300 font-mono">—</span>
                      ) : (
                        <span className="text-xs text-slate-200 font-mono">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus.mutate({ id: item.id, status: e.target.value as ItemStatus })}
                        className={cn(
                          'text-xs font-semibold border rounded-lg px-2 py-1 cursor-pointer appearance-none',
                          STATUS_STYLES[item.status] ?? STATUS_STYLES['pending']
                        )}
                        disabled={updateStatus.isPending}
                      >
                        {(['pending','packed','dispatched','at_venue','issue'] as ItemStatus[]).map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  )
                })}
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
