import { useState, useRef, useEffect } from 'react'
import { Header } from '../../components/layout/Header'
import { Plus, Calendar, MapPin, Users, Loader2, Zap, UserCheck, MoreVertical, Pencil, Trash2, ChevronRight, ArchiveRestore, X } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useEvents, useDeleteEvent, useRestoreEvent, useOperationPlans } from '../../hooks/useEvents'
import { useRole } from '../../hooks/useRole'
import { CreateEventModal } from './CreateEventModal'
import { EditEventModal } from './EditEventModal'
import { CreateOperationPlanModal } from '../operations/CreateOperationPlanModal'
import type { Event } from '../../types'

function EventRowMenu({ event, onEdit }: { event: Event; onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const deleteEvent = useDeleteEvent()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideBtn = btnRef.current?.contains(target)
      const insidePanel = panelRef.current?.contains(target)
      if (!insideBtn && !insidePanel) {
        setOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(o => !o)
    setConfirmDelete(false)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="btn btn-ghost btn-sm p-1.5"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="fixed w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-[200] py-1"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Event
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Event
            </button>
          ) : (
            <div className="px-3 py-2 border-t border-red-100">
              <p className="text-xs text-red-600 mb-2 font-medium">Move to cancelled?</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { deleteEvent.mutate(event.id); setOpen(false) }}
                  className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1 font-semibold hover:bg-red-600"
                  disabled={deleteEvent.isPending}
                >Confirm</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 text-xs border border-slate-200 text-slate-600 rounded-lg py-1 hover:bg-slate-50"
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EventsPage() {
  const navigate = useNavigate()
  const { data: events, isLoading } = useEvents()
  const { data: plans = [] } = useOperationPlans()
  const { isAdmin } = useRole()
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [planForEvent, setPlanForEvent] = useState<string | null>(null)
  const restoreEvent = useRestoreEvent()

  const activeEvents    = (events ?? []).filter(ev => ev.status !== 'cancelled')
  const cancelledEvents = (events ?? []).filter(ev => ev.status === 'cancelled')

  // Map event_id → plan_id for direct navigation (use event_id column, always present)
  const eventPlanMap = new Map(
    (plans as { id: string; event_id: string }[])
      .filter(p => !!p.event_id)
      .map(p => [p.event_id, p.id])
  )

  return (
    <>
      <Header title="Events" subtitle="All registered events" />
      <main className="p-6">
        {isAdmin() && (
          <div className="flex justify-end gap-2 mb-4">
            {cancelledEvents.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setShowCancelled(true)}>
                <ArchiveRestore className="w-4 h-4" />
                Cancelled
                <span className="ml-1 bg-slate-200 text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {cancelledEvents.length}
                </span>
              </button>
            )}
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

        {!isLoading && activeEvents.length === 0 && (
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

        {activeEvents.length > 0 && (
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
                {activeEvents.map(ev => (
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
                      <span className={`badge ${{
                        active: 'badge-completed',
                        published: 'badge-completed',
                        completed: 'badge-pending',
                        draft: 'badge-pending',
                        cancelled: 'badge-pending',
                      }[ev.status] ?? 'badge-pending'}`}>
                        {{ active: 'Active', published: 'Confirmed', completed: 'Completed', draft: 'Active', cancelled: 'Cancelled' }[ev.status] ?? ev.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        {eventPlanMap.has(ev.id) ? (
                          <button
                            onClick={() => navigate(`/operations/${eventPlanMap.get(ev.id)}`)}
                            className="btn btn-primary btn-sm"
                          >
                            Open Operations <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setPlanForEvent(ev.id)}
                            className="btn btn-secondary btn-sm"
                            title="Create operation plan for this event"
                          >
                            <Zap className="w-3.5 h-3.5" /> Create Plan
                          </button>
                        )}
                        {isAdmin() && (
                          <EventRowMenu event={ev} onEdit={() => setEditEvent(ev)} />
                        )}
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

      {editEvent && (
        <EditEventModal
          open={!!editEvent}
          onClose={() => setEditEvent(null)}
          event={editEvent}
        />
      )}

      <CreateOperationPlanModal
        open={!!planForEvent}
        onClose={() => setPlanForEvent(null)}
        preselectedEventId={planForEvent ?? undefined}
        onCreated={(id) => { setPlanForEvent(null); navigate(`/operations/${id}`) }}
      />

      {/* Cancelled events panel */}
      {showCancelled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Cancelled Events</h2>
                <p className="text-xs text-slate-400 mt-0.5">Restore to make them active again</p>
              </div>
              <button onClick={() => setShowCancelled(false)} className="btn btn-ghost btn-sm p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {cancelledEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No cancelled events</p>
              ) : cancelledEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.category} · {formatDate(ev.start_datetime)}</p>
                  </div>
                  <button
                    onClick={() => restoreEvent.mutate(ev.id)}
                    disabled={restoreEvent.isPending}
                    className="btn btn-primary btn-sm shrink-0"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
