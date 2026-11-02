import { useState } from 'react'
import { Header } from '../../components/layout/Header'
import { ReadinessBar } from '../../components/ui/ReadinessGauge'
import { formatDate } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Users, ClipboardList, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { useOperationPlans } from '../../hooks/useEvents'
import { useRole } from '../../hooks/useRole'
import { CreateOperationPlanModal } from './CreateOperationPlanModal'

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

const phaseColors: Record<string, string> = {
  planning: 'badge-pending', preparation: 'badge-inprogress', dispatch: 'badge-dispatched',
  event_day: 'badge-critical', post_event: 'badge-delivered', closed: 'badge-completed',
}

export function OperationsListPage() {
  const navigate = useNavigate()
  const { data: plans, isLoading } = useOperationPlans()
  const { isAdmin } = useRole()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <Header title="Event Operations" subtitle="All operation plans" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {isAdmin() && (
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Operation Plan
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading plans…
          </div>
        )}

        {!isLoading && (!plans || plans.length === 0) && (
          <div className="card p-12 text-center text-slate-400">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No operation plans yet</p>
            <p className="text-sm mt-1 mb-4">No operation plans yet{isAdmin() ? ' — create the first one to get started' : ''}</p>
            {isAdmin() && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Create Plan
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {(plans ?? []).map((plan) => {
            const ev = (plan as any).events
            const items: Array<{ status: string; is_critical: boolean }> = (plan as any).event_checklist_items ?? []
            const shortages: Array<{ status: string }> = (plan as any).shortage_requests ?? []
            const readiness = calcReadiness(items)
            const completed = items.filter(i => ['completed', 'venue_verified'].includes(i.status)).length
            const openSr = shortages.filter(s => s.status === 'pending').length

            return (
              <div
                key={plan.id}
                className="card p-6 card-hover cursor-pointer"
                onClick={() => navigate(`/operations/${plan.id}`)}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900 text-base">{ev?.title ?? 'Untitled Event'}</h3>
                      <span className={`badge ${phaseColors[plan.phase ?? 'planning'] ?? 'badge-pending'}`}>
                        {(plan.phase ?? 'planning').replace('_', ' ')}
                      </span>
                      {openSr > 0 && <span className="badge badge-shortage">{openSr} shortage</span>}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mb-3">
                      {ev?.start_datetime && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(ev.start_datetime)}</span>
                      )}
                      {ev?.venue_name && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.venue_name}</span>
                      )}
                      {ev?.expected_attendees > 0 && (
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev.expected_attendees} attendees</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <ReadinessBar pct={readiness} className="flex-1 max-w-xs" />
                      <span className="text-xs font-bold text-slate-700">{readiness}%</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> {completed}/{items.length} items done
                      </span>
                      {openSr > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertTriangle className="w-3 h-3" /> {openSr} pending shortages
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary shrink-0"
                    onClick={(e) => { e.stopPropagation(); navigate(`/operations/${plan.id}`) }}
                  >
                    Open
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <CreateOperationPlanModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => { setShowCreate(false); navigate(`/operations/${id}`) }}
      />
    </>
  )
}
