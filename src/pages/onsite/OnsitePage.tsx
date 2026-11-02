import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, AlertTriangle, Clock, Camera, ChevronDown,
  ChevronUp, Zap, LogIn, Loader2, RefreshCw
} from 'lucide-react'
import { cn, timeAgo } from '../../lib/utils'
import type { ItemStatus } from '../../types'
import { useOperationPlans } from '../../hooks/useEvents'
import { useChecklist, useUpdateItemStatus } from '../../hooks/useChecklist'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-slate-500',   bg: 'bg-slate-100' },
  packed:     { label: 'Packed',     color: 'text-indigo-600',  bg: 'bg-indigo-100' },
  dispatched: { label: 'Dispatched', color: 'text-indigo-600',  bg: 'bg-indigo-100' },
  at_venue:   { label: 'At Venue',   color: 'text-teal-600',    bg: 'bg-teal-100' },
  done:       { label: 'Done',       color: 'text-emerald-700', bg: 'bg-emerald-100' },
  issue:      { label: 'Issue',      color: 'text-red-600',     bg: 'bg-red-100' },
}

const ONSITE_STATUSES: ItemStatus[] = ['pending', 'at_venue', 'done', 'issue']

function ChecklistItem({
  item,
  onStatusChange,
  onReportShortage,
}: {
  item: any
  onStatusChange: (id: string, status: ItemStatus) => void
  onReportShortage: (itemId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig[item.status] ?? statusConfig['not_started']
  const isDone = item.status === 'done'

  return (
    <div className={cn(
      'rounded-2xl border transition-all',
      isDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'
    )}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold', cfg.bg, cfg.color)}>
          {isDone ? <Check className="w-5 h-5" /> : item.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold text-sm', isDone ? 'text-slate-400' : 'text-slate-900')}>
              {item.name}
            </span>
            {item.is_critical && !isDone && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">CRITICAL</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
            <span className="text-xs text-slate-400">Req: {item.required_qty}</span>
            {item.updated_at && <span className="text-xs text-slate-300">{timeAgo(item.updated_at)}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Update Status</p>
          <div className="grid grid-cols-2 gap-2">
            {ONSITE_STATUSES.map(s => {
              const sc = statusConfig[s]
              const isActive = item.status === s
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(item.id, s)}
                  className={cn(
                    'touch-target rounded-xl text-sm font-semibold transition-all border-2 px-3 py-2',
                    isActive
                      ? `${sc.bg} ${sc.color} border-current`
                      : 'bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                  )}
                >
                  {sc.label}
                </button>
              )
            })}
          </div>
          <button
            className="mt-3 w-full touch-target rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold border-2 border-amber-100 flex items-center justify-center gap-2"
            onClick={() => onReportShortage(item.id)}
          >
            <AlertTriangle className="w-4 h-4" /> Report Shortage
          </button>
          <button className="mt-2 w-full touch-target rounded-xl bg-slate-50 text-slate-600 text-sm font-semibold border-2 border-slate-100 flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Take Photo
          </button>
        </div>
      )}
    </div>
  )
}

function PlanView({ planId, eventTitle, onShortage }: { planId: string; eventTitle: string; onShortage: (planId: string, itemId: string) => void }) {
  const { data: items = [], isLoading } = useChecklist(planId)
  const updateStatus = useUpdateItemStatus(planId)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category_id ?? 'Uncategorised')))]
  const filtered = activeCategory === 'all' ? items : items.filter(i => (i.category_id ?? 'Uncategorised') === activeCategory)
  const done = items.filter(i => ['completed', 'venue_verified'].includes(i.status)).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-sm">Loading checklist…</p>
    </div>
  )

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-6 text-center">
      <Clock className="w-10 h-10 opacity-30" />
      <p className="font-semibold text-slate-600">No items yet</p>
      <p className="text-sm">Checklist items will appear here once added by the office team</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-600">{eventTitle}</span>
          <span className="text-xs font-bold text-brand-700">{done}/{items.length} · {pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 2 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-slate-100">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0',
                activeCategory === cat ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            onReportShortage={(itemId) => onShortage(planId, itemId)}
          />
        ))}
      </div>

      {/* Submit button */}
      <div className="p-4 bg-white border-t border-slate-100">
        <button
          className="w-full btn btn-primary py-4 text-base font-bold rounded-2xl justify-center"
          disabled={pct < 100}
        >
          {pct === 100 ? (
            <><Check className="w-5 h-5" /> Submit Final Readiness</>
          ) : (
            `${100 - pct}% remaining`
          )}
        </button>
      </div>
    </div>
  )
}

export function OnsitePage() {
  const navigate = useNavigate()
  const { data: plans, isLoading } = useOperationPlans()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const handleShortage = (planId: string, _itemId: string) => {
    navigate(`/operations/${planId}/shortage`)
  }

  const upcoming = (plans ?? [])
    .filter(p => {
      const ev = (p as any).events
      return ev && new Date(ev.start_datetime) >= new Date(Date.now() - 24 * 3600000)
    })
    .sort((a, b) => {
      const da = new Date((a as any).events?.start_datetime ?? 0).getTime()
      const db = new Date((b as any).events?.start_datetime ?? 0).getTime()
      return da - db
    })

  const activePlan = selectedPlanId
    ? upcoming.find(p => p.id === selectedPlanId)
    : upcoming[0]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">UniklifeOps</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white"
            >
              <LogIn className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
        <p className="text-slate-400 text-xs">On-Site Operations</p>

        {/* Plan selector */}
        {upcoming.length > 1 && (
          <div className="mt-3">
            <select
              value={activePlan?.id ?? ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 py-2 border border-slate-700"
            >
              {upcoming.map(p => (
                <option key={p.id} value={p.id}>{(p as any).events?.title ?? 'Untitled'}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading events…</p>
          </div>
        )}

        {!isLoading && upcoming.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-6 text-center">
            <Clock className="w-10 h-10 opacity-30" />
            <p className="font-semibold text-slate-600">No active events</p>
            <p className="text-sm">No events are scheduled within the next 24 hours</p>
          </div>
        )}

        {!isLoading && activePlan && (
          <PlanView
            planId={activePlan.id}
            eventTitle={(activePlan as any).events?.title ?? 'Event'}
            onShortage={handleShortage}
          />
        )}
      </div>
    </div>
  )
}
