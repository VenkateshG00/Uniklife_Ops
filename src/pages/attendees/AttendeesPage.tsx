import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useAttendees, useRegisterAttendee, useCheckIn } from '../../hooks/useAttendees'
import { useEvents } from '../../hooks/useEvents'
import { cn } from '../../lib/utils'
import { Plus, UserCheck, Users, Loader2, Check, Search, QrCode } from 'lucide-react'

const regSchema = z.object({
  full_name:   z.string().min(1, 'Name required'),
  email:       z.string().email().optional().or(z.literal('')),
  phone:       z.string().optional(),
  ticket_type: z.string().min(1),
  ticket_code: z.string().optional(),
  notes:       z.string().optional(),
})
type RegForm = z.infer<typeof regSchema>

const TICKET_TYPES = ['general','vip','speaker','sponsor','press','staff','volunteer']

export function AttendeesPage() {
  const { data: events = [] } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [showRegister, setShowRegister] = useState(false)
  const [search, setSearch] = useState('')

  const eventId = selectedEventId || events[0]?.id || ''
  const { data: attendees = [], isLoading } = useAttendees(eventId)
  const register_ = useRegisterAttendee(eventId)
  const checkIn = useCheckIn(eventId)

  const filtered = attendees.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.ticket_code?.toLowerCase().includes(search.toLowerCase())
  )

  const checkedIn = attendees.filter(a => a.checked_in).length

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegForm>({
    resolver: zodResolver(regSchema),
    defaultValues: { ticket_type: 'general' },
  })

  const onRegister = (values: RegForm) => {
    register_.mutate({
      full_name: values.full_name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      ticket_type: values.ticket_type,
      ticket_code: values.ticket_code || `TKT-${Date.now().toString(36).toUpperCase()}`,
      notes: values.notes || undefined,
    }, {
      onSuccess: () => { setShowRegister(false); reset() }
    })
  }

  return (
    <>
      <Header title="Attendees" subtitle="Registration and check-in management" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Event selector */}
        {events.length > 1 && (
          <div>
            <select
              value={selectedEventId || events[0]?.id || ''}
              onChange={e => setSelectedEventId(e.target.value)}
              className="input max-w-sm"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Stats + controls */}
        {eventId && (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{attendees.length}</p>
                <p className="text-xs text-slate-400">Registered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{checkedIn}</p>
                <p className="text-xs text-slate-400">Checked In</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{attendees.length - checkedIn}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => window.location.href = '/scanner'}
              >
                <QrCode className="w-4 h-4" /> QR Scanner
              </button>
              <button className="btn btn-primary" onClick={() => setShowRegister(true)}>
                <Plus className="w-4 h-4" /> Register
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        {attendees.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Search name, phone, ticket…"
            />
          </div>
        )}

        {!eventId && (
          <div className="card p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No events found</p>
            <p className="text-sm mt-1">Create an event first to manage attendees</p>
          </div>
        )}

        {eventId && isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading attendees…
          </div>
        )}

        {eventId && !isLoading && attendees.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No attendees yet</p>
            <p className="text-sm mt-1 mb-4">Register attendees for this event</p>
            <button className="btn btn-primary" onClick={() => setShowRegister(true)}>
              <Plus className="w-4 h-4" /> Register First Attendee
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Contact</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(att => (
                  <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{att.full_name}</p>
                    </td>
                    <td className="px-3 py-3.5 text-slate-500 text-xs hidden md:table-cell">
                      {att.phone || att.email || '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-mono text-xs text-slate-600">{att.ticket_code ?? '—'}</p>
                      <span className="badge badge-pending text-[10px] mt-0.5">{att.ticket_type}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      {att.checked_in ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" /> Checked In
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      {!att.checked_in && (
                        <button
                          onClick={() => checkIn.mutate(att.id)}
                          disabled={checkIn.isPending}
                          className="btn btn-primary btn-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal open={showRegister} onClose={() => { setShowRegister(false); reset() }} title="Register Attendee" size="md">
        <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register('full_name')} className={cn('input', errors.full_name && 'input-error')} placeholder="Attendee full name" />
            {errors.full_name && <p className="error-msg">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91 9999999999" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="email@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ticket Type</label>
              <select {...register('ticket_type')} className="input">
                {TICKET_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ticket Code (auto if blank)</label>
              <input {...register('ticket_code')} className="input" placeholder="Auto-generated" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowRegister(false); reset() }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={register_.isPending} className="btn btn-primary px-6">
              {register_.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
