import { useState } from 'react'
import { Header } from '../../components/layout/Header'
import { Package, Check, Truck, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useOperationPlans } from '../../hooks/useEvents'
import { useChecklist, useUpdateItemStatus } from '../../hooks/useChecklist'
import { operationPlansService } from '../../services/events'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'


function PlanChecklist({ planId }: { planId: string }) {
  const { data: items = [], isLoading } = useChecklist(planId)
  const updateStatus = useUpdateItemStatus(planId)

  const packable = items.filter(i => i.status !== 'at_venue')

  if (isLoading) return (
    <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading items…
    </div>
  )

  if (packable.length === 0 && items.length > 0) return (
    <p className="text-sm text-emerald-600 py-4 flex items-center gap-2">
      <Check className="w-4 h-4" /> All items packed and verified
    </p>
  )

  if (items.length === 0) return (
    <p className="text-sm text-slate-400 py-4">No checklist items for this plan</p>
  )

  const totalRequired = items.reduce((n, i) => n + (i.required_qty ?? 0), 0)
  const totalPacked = items.reduce((n, i) => n + (i.packed_qty ?? 0), 0)
  const pct = totalRequired > 0 ? Math.round((totalPacked / totalRequired) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-700 shrink-0">{pct}% packed</span>
      </div>

      {items.map(item => {
        const isPacked = ['packed', 'dispatched', 'at_venue'].includes(item.status)
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-colors',
              isPacked ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-brand-200'
            )}
          >
            <button
              onClick={() => updateStatus.mutate({
                id: item.id,
                status: isPacked ? 'pending' : 'packed',
              })}
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                isPacked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-brand-400'
              )}
              disabled={updateStatus.isPending}
            >
              {isPacked && <Check className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <span className={cn('text-sm font-semibold', isPacked ? 'text-slate-400 line-through' : 'text-slate-900')}>
                {item.name}
              </span>
              {item.is_critical && <span className="ml-2 text-xs text-red-500 font-medium">Critical</span>}
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-mono text-slate-700">
                {item.packed_qty ?? 0} / {item.required_qty}
              </span>
              <p className="text-xs text-slate-400">{item.status.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OfficePage() {
  const { data: plans, isLoading } = useOperationPlans()
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [dispatching, setDispatching] = useState<string | null>(null)
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)

  const confirmDispatch = async (planId: string) => {
    setDispatching(planId)
    try {
      await operationPlansService.update(planId, { phase: 'dispatch' })
      qc.invalidateQueries({ queryKey: ['operation-plans', orgId] })
      toast.success('Dispatch confirmed!')
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setDispatching(null)
    }
  }

  const upcoming = (plans ?? []).filter(p => {
    const ev = (p as any).events
    return ev && new Date(ev.start_datetime) >= new Date()
  }).sort((a, b) => {
    const da = new Date((a as any).events?.start_datetime ?? 0).getTime()
    const db = new Date((b as any).events?.start_datetime ?? 0).getTime()
    return da - db
  })

  return (
    <>
      <Header title="Office Preparation" subtitle="Pack and dispatch materials for upcoming events" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading plans…
          </div>
        )}

        {!isLoading && upcoming.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No upcoming events to prepare</p>
          </div>
        )}

        {upcoming.map(plan => {
          const ev = (plan as any).events
          const isOpen = expandedPlan === plan.id

          return (
            <div key={plan.id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedPlan(isOpen ? null : plan.id)}
              >
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">{ev?.title}</h2>
                  <p className="text-sm text-slate-500">
                    {ev?.venue_name} · {ev?.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {plan.phase === 'dispatch' ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                      <Check className="w-4 h-4" /> Dispatched
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={dispatching === plan.id}
                      onClick={(e) => { e.stopPropagation(); confirmDispatch(plan.id) }}
                    >
                      {dispatching === plan.id
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                        : <><Truck className="w-4 h-4" /> Confirm Dispatch</>
                      }
                    </button>
                  )}
                  <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                </div>
              </div>

              {isOpen && (
                <div className="px-6 pb-6 border-t border-slate-50">
                  <PlanChecklist planId={plan.id} />
                </div>
              )}
            </div>
          )
        })}
      </main>
    </>
  )
}
