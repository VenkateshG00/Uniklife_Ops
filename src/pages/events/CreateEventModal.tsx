import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../components/ui/Modal'
import { useCreateEvent } from '../../hooks/useEvents'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const schema = z.object({
  title:               z.string().min(2, 'Title is required'),
  category:            z.string().min(1, 'Select a category'),
  venue_name:          z.string().min(2, 'Venue name is required'),
  venue_address:       z.string().min(5, 'Venue address is required'),
  start_datetime:      z.string().min(1, 'Start date/time is required'),
  end_datetime:        z.string().min(1, 'End date/time is required'),
  expected_attendees:  z.string().min(1, 'Enter expected attendees'),
  description:         z.string().optional(),
  location_link:       z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  event_manager_id:    z.string().optional(),
}).refine(d => new Date(d.end_datetime) > new Date(d.start_datetime), {
  message: 'End time must be after start time',
  path: ['end_datetime'],
})

type FormValues = z.infer<typeof schema>

const EVENT_CATEGORIES = [
  'Conference', 'Wedding', 'Corporate Event', 'Exhibition', 'Seminar',
  'Workshop', 'Concert', 'Sports Event', 'Gala / Awards', 'Product Launch', 'Other',
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

export function CreateEventModal({ open, onClose, onCreated }: Props) {
  const createEvent = useCreateEvent()
  const orgId = useAuthStore(s => s.profile?.organization_id)

  // Fetch event managers for assignment dropdown
  const { data: managers = [] } = useQuery({
    queryKey: ['managers', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', orgId!)
        .eq('role', 'event_manager')
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return data as { id: string; full_name: string }[]
    },
    enabled: !!orgId,
    staleTime: 60_000,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { expected_attendees: '' },
  })

  const onSubmit = async (values: FormValues) => {
    const event = await createEvent.mutateAsync({
      title:              values.title,
      category:           values.category,
      venue_name:         values.venue_name,
      venue_address:      values.venue_address,
      start_datetime:     new Date(values.start_datetime).toISOString(),
      end_datetime:       new Date(values.end_datetime).toISOString(),
      expected_attendees: parseInt(values.expected_attendees),
      description:        values.description || undefined,
      location_link:      values.location_link || undefined,
      event_manager_id:   values.event_manager_id || undefined,
    })
    reset()
    onClose()
    onCreated?.(event.id)
  }

  const F = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Create New Event" subtitle="Fill in the event details to get started" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Row 1: Title + Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F id="title" label="Event Title *" error={errors.title?.message}>
            <input id="title" {...register('title')} className={cn('input', errors.title && 'input-error')}
              placeholder="e.g. Annual Tech Summit 2026" />
          </F>
          <F id="category" label="Category *" error={errors.category?.message}>
            <select id="category" {...register('category')} className={cn('input', errors.category && 'input-error')}>
              <option value="">Select category…</option>
              {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>

        {/* Row 2: Venue name + address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F id="venue_name" label="Venue Name *" error={errors.venue_name?.message}>
            <input id="venue_name" {...register('venue_name')} className={cn('input', errors.venue_name && 'input-error')}
              placeholder="e.g. Grand Ballroom, Taj Hotel" />
          </F>
          <F id="venue_address" label="Venue Address *" error={errors.venue_address?.message}>
            <input id="venue_address" {...register('venue_address')} className={cn('input', errors.venue_address && 'input-error')}
              placeholder="Full address" />
          </F>
        </div>

        {/* Row 3: Start + End datetimes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F id="start_datetime" label="Start Date & Time *" error={errors.start_datetime?.message}>
            <input id="start_datetime" type="datetime-local" {...register('start_datetime')}
              className={cn('input', errors.start_datetime && 'input-error')} />
          </F>
          <F id="end_datetime" label="End Date & Time *" error={errors.end_datetime?.message}>
            <input id="end_datetime" type="datetime-local" {...register('end_datetime')}
              className={cn('input', errors.end_datetime && 'input-error')} />
          </F>
        </div>

        {/* Row 4: Attendees + Assign Manager */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F id="expected_attendees" label="Expected Attendees *" error={errors.expected_attendees?.message}>
            <input id="expected_attendees" type="number" min="1" {...register('expected_attendees')}
              className={cn('input', errors.expected_attendees && 'input-error')}
              placeholder="e.g. 500" />
          </F>
          <F id="event_manager_id" label="Assign Event Manager">
            <select id="event_manager_id" {...register('event_manager_id')} className="input">
              <option value="">— Assign later —</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </F>
        </div>

        {/* Row 5: Location link */}
        <F id="location_link" label="Google Maps Link" error={errors.location_link?.message}>
          <input id="location_link" {...register('location_link')} className={cn('input', errors.location_link && 'input-error')}
            placeholder="https://maps.google.com/..." />
        </F>

        {/* Description */}
        <F id="description" label="Description (optional)">
          <textarea id="description" {...register('description')} rows={3}
            className="input resize-none"
            placeholder="Brief description of the event…" />
        </F>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={() => { reset(); onClose() }} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={createEvent.isPending} className="btn btn-primary px-6">
            {createEvent.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
