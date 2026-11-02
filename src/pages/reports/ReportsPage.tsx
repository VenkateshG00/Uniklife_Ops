import { useState, type ReactNode } from 'react'
import { Header } from '../../components/layout/Header'
import { cn, formatDate, readinessPctColor, readinessPctBarColor, timeAgo } from '../../lib/utils'
import { useEventReadiness, useIssueItems, useCategoryBreakdown, useShortageSummary } from '../../hooks/useReports'
import { Loader2, BarChart3, AlertTriangle, CheckCircle2, Layers, Package } from 'lucide-react'
import { PriorityBadge, ShortageStatusBadge } from '../../components/ui/Badge'
import type { Priority, ShortageStatus } from '../../types'

type Tab = 'readiness' | 'issues' | 'categories' | 'shortages'

const phaseLabel: Record<string, string> = {
  planning: 'Planning', preparation: 'Preparation', dispatch: 'Dispatch',
  event_day: 'Event Day', post_event: 'Post Event', closed: 'Closed',
}
const phaseBadge: Record<string, string> = {
  planning: 'badge-pending', preparation: 'badge-inprogress', dispatch: 'badge-dispatched',
  event_day: 'badge-critical', post_event: 'badge-delivered', closed: 'badge-completed',
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('readiness')

  const { data: readiness  = [], isLoading: loadingR } = useEventReadiness()
  const { data: issues     = [], isLoading: loadingI } = useIssueItems()
  const { data: categories = [], isLoading: loadingC } = useCategoryBreakdown()
  const { data: shortages  = [], isLoading: loadingS } = useShortageSummary()

  const pendingShortageCount = (shortages as any[]).filter(s => s.status === 'pending').length

  const tabs: { key: Tab; label: string; icon: ReactNode; count?: number; alertCount?: number }[] = [
    { key: 'readiness',  label: 'Event Readiness',    icon: <BarChart3     className="w-4 h-4" />, count: readiness.length },
    { key: 'issues',     label: 'Issue Tracker',      icon: <AlertTriangle className="w-4 h-4" />, count: issues.length },
    { key: 'shortages',  label: 'Shortages',          icon: <Package       className="w-4 h-4" />, count: shortages.length, alertCount: pendingShortageCount },
    { key: 'categories', label: 'By Category',        icon: <Layers        className="w-4 h-4" /> },
  ]

  return (
    <>
      <Header title="Reports" subtitle="Event operations analytics and summaries" />

      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Total Events</p>
            <p className="text-2xl font-bold text-slate-900">{readiness.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Avg Readiness</p>
            <p className={cn('text-2xl font-bold', readinessPctColor(
              readiness.length ? Math.round(readiness.reduce((n, r) => n + r.readiness_pct, 0) / readiness.length) : 0
            ))}>
              {readiness.length ? Math.round(readiness.reduce((n, r) => n + r.readiness_pct, 0) / readiness.length) : 0}%
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Open Issues</p>
            <p className="text-2xl font-bold text-red-600">{issues.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Pending Shortages</p>
            <p className="text-2xl font-bold text-amber-600">{pendingShortageCount}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.icon}
              {t.label}
              {t.alertCount != null && t.alertCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                  {t.alertCount} pending
                </span>
              )}
              {t.count !== undefined && t.count > 0 && !t.alertCount && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-bold',
                  tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
                )}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Event Readiness */}
        {tab === 'readiness' && (
          <div className="card overflow-hidden table-scroll">
            {loadingR ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            ) : readiness.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-600">No events yet</p>
                <p className="text-sm mt-1">Create events and operation plans to see readiness data here</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Event</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Phase</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Items</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Issues</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Shortages</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {readiness.map(r => (
                    <tr key={r.plan_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{r.event_title}</p>
                        <p className="text-xs text-slate-400">{r.venue_name} · {r.event_date ? formatDate(r.event_date) : '—'}</p>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <span className={`badge ${phaseBadge[r.phase] ?? 'badge-pending'}`}>
                          {phaseLabel[r.phase] ?? r.phase}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="font-mono text-slate-700">{r.done_items}/{r.total_items}</span>
                        {r.critical_total > 0 && (
                          <p className="text-xs text-slate-400">{r.critical_done}/{r.critical_total} critical</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right hidden sm:table-cell">
                        {r.issue_items > 0 ? (
                          <span className="text-red-600 font-semibold">{r.issue_items}</span>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right hidden sm:table-cell">
                        {r.pending_shortages > 0 ? (
                          <span className="text-amber-600 font-semibold">{r.pending_shortages}</span>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                        )}
                      </td>
                      <td className="px-3 py-3.5 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', readinessPctBarColor(r.readiness_pct))}
                              style={{ width: `${r.readiness_pct}%` }}
                            />
                          </div>
                          <span className={cn('text-sm font-bold w-10 text-right', readinessPctColor(r.readiness_pct))}>
                            {r.readiness_pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Issue Tracker */}
        {tab === 'issues' && (
          <div className="card overflow-hidden table-scroll">
            {loadingI ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-500" />
                <p className="font-semibold text-slate-600">No issues reported</p>
                <p className="text-sm mt-1">All checklist items are on track</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Note</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {issues.map((issue, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {issue.is_critical && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          <span className="font-semibold text-slate-900">{issue.item_name}</span>
                        </div>
                        <p className="text-xs text-slate-400">{issue.priority} priority</p>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{issue.category_name}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        {issue.status_note ? (
                          <span className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded-lg">{issue.status_note}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No note</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <p className="text-sm text-slate-700 font-medium">{issue.event_title}</p>
                        <p className="text-xs text-slate-400">{issue.event_date ? formatDate(issue.event_date) : '—'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Shortage Summary */}
        {tab === 'shortages' && (
          <div className="card overflow-hidden table-scroll">
            {loadingS ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            ) : shortages.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-500" />
                <p className="font-semibold text-slate-600">No shortage requests</p>
                <p className="text-sm mt-1">All materials are accounted for across events</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Event</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Status</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Note</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">By</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(shortages as any[]).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{s.item_name}</p>
                        <PriorityBadge priority={s.priority as Priority} />
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <p className="text-sm text-slate-700">{s.event_title}</p>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-red-600 font-semibold">+{s.additional_qty_requested}</span>
                        {s.approved_qty != null && (
                          <p className="text-xs text-emerald-600">✓ {s.approved_qty}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <ShortageStatusBadge status={s.status as ShortageStatus} />
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell max-w-[180px]">
                        {s.review_notes ? (
                          <span className="text-xs text-slate-500 truncate block">{s.review_notes}</span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-slate-600">{s.requester_name}</p>
                      </td>
                      <td className="px-3 py-3.5 text-right hidden sm:table-cell">
                        <p className="text-xs text-slate-400">{timeAgo(s.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Category Breakdown */}
        {tab === 'categories' && (
          <div className="flex flex-col gap-3">
            {loadingC ? (
              <div className="card flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            ) : categories.length === 0 ? (
              <div className="card text-center py-16 text-slate-400">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-600">No data yet</p>
                <p className="text-sm mt-1">Add checklist items across events to see category breakdowns</p>
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.category_name} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{cat.category_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cat.done} done · {cat.issue} issues · {cat.total} total
                      </p>
                    </div>
                    <span className={cn('text-lg font-bold', readinessPctColor(cat.pct))}>
                      {cat.pct}%
                    </span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-0.5">
                    {cat.done > 0 && (
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${Math.round((cat.done / cat.total) * 100)}%` }}
                        title={`${cat.done} done`}
                      />
                    )}
                    {cat.issue > 0 && (
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${Math.round((cat.issue / cat.total) * 100)}%` }}
                        title={`${cat.issue} issues`}
                      />
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Done
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Issue
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Remaining
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  )
}
