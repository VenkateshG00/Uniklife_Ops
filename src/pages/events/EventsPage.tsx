import { useState } from 'react'
import { Header } from '../../components/layout/Header'
import { Plus, Calendar, MapPin, Users, Loader2, Zap, UserCheck } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '../../hooks/useEvents'
import { useRole } from '../../hooks/useRole'
import { CreateEventModal } from './CreateEventModal'
import { CreateOperationPlanModal } from '../operations/CreateOperationPlanModal'

export function EventsPage() {
  const navigate = useNavigate()
  const { data: events, isLoading } = useEvents()
  const { isAdmin } = useRole()
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [planForEvent, setPlanForEvent] = useState<string | null>(null)

  return (
    <>
      <Header title="Events" subtitle="All registered events" />
      <main className="p-6">
        {isAdmin() && (
          <div className="flex justify-end mb-4">
            <button className="btn btn-primary" onClick={() => setShowCreateEvent(true)}>
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading events…
          </div>
        )}

        {!isLoading && (!events || events.length === 0) && (
          <div className="card p-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No events yet</p>
            <p className="text-sm mt-1 mb-4">No events yet{isAdmin() ? ' — create the first one to start planning' : ''}</p>
            {isAdmin() && (
              <button className="btn btn-primary" onClick={() => setShowCreateEvent(true)}>
                <Plus className="w-4 h-4" /> New Event
              </button>
            )}
          </div>
        )}

        {events && events.length > 0 && (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Event</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Venue</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Attendees</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <p className="text-xs text-slate-400">{ev.category}</p>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(ev.start_datetime)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 hidden lg:table-cell">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {ev.venue_name}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Users className="w-3.5 h-3.5" /> {ev.expected_attendees}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 hidden xl:table-cell">
                      <span className="flex items-center gap-1 text-slate-600 text-xs">
                        <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                        {(ev as any).profiles?.full_name ?? <span className="text-slate-300 italic">Unassigned</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`badge ${ev.status === 'published' || ev.status === 'active' ? 'badge-completed' : 'badge-pending'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/operations')}
                          className="btn btn-secondary btn-sm"
                        >
                          Operations
                        </button>
                        <button
                          onClick={() => setPlanForEvent(ev.id)}
                          className="btn btn-ghost btn-sm"
                          title="Create operation plan for this event"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CreateEventModal
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />

      <CreateOperationPlanModal
        open={!!planForEvent}
        onClose={() => setPlanForEvent(null)}
        preselectedEventId={planForEvent ?? undefined}
        onCreated={(id) => { setPlanForEvent(null); navigate(`/operations/${id}`) }}
      />
    </>
  )
}
