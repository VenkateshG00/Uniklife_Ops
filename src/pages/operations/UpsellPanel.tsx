import { useState } from 'react'
import {
  useDownstreamUpsells,
  useUpsellStats,
  useCreateUpsell,
  useUpdateUpsell,
  useDeleteUpsell,
} from '../../hooks/useUpsell'
import { useEvents } from '../../hooks/useEvents'
import { formatCurrency, cn } from '../../lib/utils'
import {
  Plus, Pencil, Trash2, Loader2, Users,
  TrendingUp, Calendar, ArrowRight, AlertTriangle, X, Check, Info,
} from 'lucide-react'

interface Props {
  eventId: string
  isAdmin: boolean
}

const emptyForm = {
  attendee_name: '',
  attendee_email: '',
  attendee_phone: '',
  source_amount: '',
  target_event_id: '',
  target_amount: '',
  days_between: '',
  notes: '',
}

export function UpsellPanel({ eventId, isAdmin }: Props) {
  const { data: upsells = [], isLoading, isError, refetch } = useDownstreamUpsells(eventId)
  const { data: stats } = useUpsellStats(eventId)
  const { data: allEvents = [] } = useEvents()
  const createUpsell = useCreateUpsell(eventId)
  const updateUpsell = useUpdateUpsell(eventId)
  const deleteUpsell = useDeleteUpsell(eventId)

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const otherEvents = allEvents.filter((e: any) => e.id !== eventId)

  function resetForm() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
  }

  function startEdit(u: any) {
    setForm({
      attendee_name: u.attendee_name ?? '',
      attendee_email: u.attendee_email ?? '',
      attendee_phone: u.attendee_phone ?? '',
      source_amount: String(u.source_amount ?? ''),
      target_event_id: u.target_event_id ?? '',
      target_amount: String(u.target_amount ?? ''),
      days_between: u.days_between != null ? String(u.days_between) : '',
      notes: u.notes ?? '',
    })
    setEditId(u.id)
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      attendee_name: form.attendee_name.trim(),
      attendee_email: form.attendee_email.trim() || null,
      attendee_phone: form.attendee_phone.trim() || null,
      source_amount: parseFloat(form.source_amount) || 0,
      target_event_id: form.target_event_id,
      target_amount: parseFloat(form.target_amount) || 0,
      days_between: form.days_between ? parseInt(form.days_between) : null,
      notes: form.notes.trim() || null,
    }

    if (editId) {
      updateUpsell.mutate({ id: editId, payload }, { onSuccess: resetForm })
    } else {
      createUpsell.mutate(payload as any, { onSuccess: resetForm })
    }
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">Failed to load upsell data</p>
        <button onClick={() => refetch()} className="text-xs text-brand-600 hover:underline mt-1">
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading upsells…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Upsell tracking shows downstream revenue — when attendees of this event later purchase other programs.
          This helps measure true ROI beyond direct event revenue.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 space-y-1">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Downstream Revenue</p>
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(stats?.totalDownstreamRevenue ?? 0)}
          </p>
        </div>
        <div className="card p-4 space-y-1">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Upsell Count</p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" />
            <p className="text-lg font-bold text-slate-900">{stats?.upsellCount ?? 0}</p>
          </div>
        </div>
        <div className="card p-4 space-y-1">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Avg Days to Convert</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <p className="text-lg font-bold text-slate-900">
              {stats?.avgDaysBetween ?? 0}<span className="text-xs text-slate-400 ml-1">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Upsells Table */}
      {upsells.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 pr-3 font-medium">Attendee</th>
                <th className="pb-2 pr-3 font-medium text-right">Source (₹)</th>
                <th className="pb-2 px-2 font-medium text-center w-8"></th>
                <th className="pb-2 pr-3 font-medium">Target Event</th>
                <th className="pb-2 pr-3 font-medium text-right">Target (₹)</th>
                <th className="pb-2 pr-3 font-medium text-right">Days</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upsells.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-slate-900">{u.attendee_name}</p>
                    {u.attendee_email && (
                      <p className="text-[11px] text-slate-400">{u.attendee_email}</p>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-slate-700">
                    {formatCurrency(Number(u.source_amount))}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="text-slate-700">{u.target_event?.title ?? '—'}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-emerald-600 font-semibold">
                    {formatCurrency(Number(u.target_amount))}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-slate-500">
                    {u.days_between != null ? u.days_between : '—'}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(u)}
                        aria-label="Edit upsell"
                        className="p-1 text-slate-400 hover:text-brand-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { if (confirm('Remove this upsell record?')) deleteUpsell.mutate(u.id) }}
                          disabled={deleteUpsell.isPending}
                          aria-label="Delete upsell"
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {upsells.length === 0 && !showForm && (
        <div className="text-center py-8 text-slate-400">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm text-slate-500">No upsell data recorded</p>
          <p className="text-xs mt-1">
            Track attendees who go on to purchase other programs to see the true lifetime value of this event.
          </p>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-4 space-y-3 border">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-slate-700">
              {editId ? 'Edit Upsell Record' : 'Add Upsell Record'}
            </h4>
            <button type="button" onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Attendee Name *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.attendee_name}
                onChange={e => setForm(f => ({ ...f, attendee_name: e.target.value }))}
                placeholder="Name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.attendee_email}
                onChange={e => setForm(f => ({ ...f, attendee_email: e.target.value }))}
                placeholder="email@example.com"
                type="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.attendee_phone}
                onChange={e => setForm(f => ({ ...f, attendee_phone: e.target.value }))}
                placeholder="+91..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Paid at this event (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.source_amount}
                onChange={e => setForm(f => ({ ...f, source_amount: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Target Event *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.target_event_id}
                onChange={e => setForm(f => ({ ...f, target_event_id: e.target.value }))}
                required
              >
                <option value="">Select event…</option>
                {otherEvents.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Paid at target event (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.target_amount}
                onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Days between</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.days_between}
                onChange={e => setForm(f => ({ ...f, days_between: e.target.value }))}
                placeholder="e.g. 14"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={createUpsell.isPending || updateUpsell.isPending}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white',
                createUpsell.isPending || updateUpsell.isPending
                  ? 'bg-brand-400'
                  : 'bg-brand-600 hover:bg-brand-700',
              )}
            >
              {(createUpsell.isPending || updateUpsell.isPending) ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> {editId ? 'Update' : 'Add'}</>
              )}
            </button>
            <button type="button" onClick={resetForm} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <Plus className="w-4 h-4" /> Add Upsell Record
        </button>
      )}
    </div>
  )
}
