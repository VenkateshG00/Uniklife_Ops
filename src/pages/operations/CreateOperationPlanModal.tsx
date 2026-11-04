import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../components/ui/Modal'
import { useCreateOperationPlan, useEvents, useOperationPlans } from '../../hooks/useEvents'
import { Loader2 } from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'

const schema = z.object({
  event_id:          z.string().min(1, 'Select an event'),
  reporting_time:    z.string().optional(),
  setup_deadline:    z.string().optional(),
  dispatch_deadline: z.string().optional(),
  budget:            z.string().optional(),
  instructions:      z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (planId: string) => void
  preselectedEventId?: string
}

export function CreateOperationPlanModal({ open, onClose, onCreated, preselectedEventId }: Props) {
  const createPlan = useCreateOperationPlan()
  const { data: events = [] } = useEvents()
  const { data: plans = [] } = useOperationPlans()

  // Events that already have a plan cannot have a second one (unique constraint)
  const plannedEventIds = new Set((plans as { events?: { id: string } | null }[]).map(p => p.events?.id).filter(Boolean))
  const availableEvents = events.filter(ev => !plannedEventIds.has(ev.id))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { event_id: preselectedEventId ?? '' },
  })

  const onSubmit = async (values: FormValues) => {
    const plan = await createPlan.mutateAsync({
      event_id:          values.event_id,
      reporting_time:    values.reporting_time ? new Date(values.reporting_time).toISOString() : undefined,
      setup_deadline:    values.setup_deadline  ? new Date(values.setup_deadline).toISOString() : undefined,
      dispatch_deadline: values.dispatch_deadline ? new Date(values.dispatch_deadline).toISOString() : undefined,
      budget:            values.budget ? parseFloat(values.budget) : undefined,
      instructions:      values.instructions || undefined,
    })
    reset()
    onClose()
    onCreated?.(plan.id)
  }

  const F = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Create Operation Plan" subtitle="Link a plan to an event to start managing operations" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Event select */}
        <F id="event_id" label="Event *" error={errors.event_id?.message}>
          <select id="event_id" {...register('event_id')} className={cn('input', errors.event_id && 'input-error')}>
            <option value="">Select event…</option>
            {availableEvents.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {formatDate(ev.start_datetime)}
              </option>
            ))}
          </select>
          {events.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No events found. Create an event first.</p>
          )}
          {events.length > 0 && availableEvents.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">All events already have an operation plan.</p>
          )}
          {plannedEventIds.size > 0 && availableEvents.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">{plannedEventIds.size} event{plannedEventIds.size > 1 ? 's' : ''} with existing plans hidden.</p>
          )}
        </F>

        {/* Deadlines row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <F id="dispatch_deadline" label="Dispatch Deadline">
            <input id="dispatch_deadline" type="datetime-local" {...register('dispatch_deadline')} className="input" />
          </F>
          <F id="setup_deadline" label="Setup Deadline">
            <input id="setup_deadline" type="datetime-local" {...register('setup_deadline')} className="input" />
          </F>
          <F id="reporting_time" label="Reporting Time">
            <input id="reporting_time" type="datetime-local" {...register('reporting_time')} className="input" />
          </F>
        </div>

        {/* Budget */}
        <F id="budget" label="Budget (₹, optional)">
          <input id="budget" type="number" min="0" step="100" {...register('budget')} className="input"
            placeholder="e.g. 50000" />
        </F>

        {/* Instructions */}
        <F id="instructions" label="Instructions / Notes (optional)">
          <textarea id="instructions" {...register('instructions')} rows={3}
            className="input resize-none"
            placeholder="Special instructions for this event operation…" />
        </F>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={() => { reset(); onClose() }} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={createPlan.isPending || availableEvents.length === 0} className="btn btn-primary px-6">
            {createPlan.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              : 'Create Plan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
