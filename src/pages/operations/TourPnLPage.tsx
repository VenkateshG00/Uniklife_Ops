import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useTour,
  useTourEvents,
  useTourSharedCosts,
  useCreateSharedCost,
  useUpdateSharedCost,
  useDeleteSharedCost,
} from '../../hooks/useTour'
import { usePnL, type PnLData } from '../../hooks/usePnL'
import { useOperationPlanByEvent } from '../../hooks/useEvents'
import { formatCurrency, cn } from '../../lib/utils'
import { useRole } from '../../hooks/useRole'
import type { Event, TourSplitMethod, TourSharedCost } from '../../types'
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Header } from '../../components/layout/Header'

const PROGRAM_COLORS: Record<string, string> = {
  BOSS: 'bg-blue-100 text-blue-700',
  UBM: 'bg-purple-100 text-purple-700',
  MSGB: 'bg-emerald-100 text-emerald-700',
  'VK-M': 'bg-amber-100 text-amber-700',
}

const SPLIT_LABELS: Record<TourSplitMethod, string> = {
  equal: 'Equal',
  proportional_revenue: 'Proportional to Revenue',
  manual: 'Manual',
}

// ─── Per-event row that calls usePnL internally ─────────────────────────────

function EventPnLRow({
  event,
  sharedAllocation,
  onPnLData,
}: {
  event: Event
  sharedAllocation: number
  onPnLData: (eventId: string, data: PnLData) => void
}) {
  const pnl = usePnL(event.id)
  const { data: plan } = useOperationPlanByEvent(event.id)
  const navigate = useNavigate()

  useEffect(() => {
    if (!pnl.isLoading) onPnLData(event.id, pnl)
  }, [pnl.isLoading, pnl.netRevenue, pnl.totalActual, pnl.netPnL, event.id, onPnLData])

  const adjustedPnL = pnl.netPnL - sharedAllocation

  if (pnl.isLoading) {
    return (
      <tr className="border-b border-slate-100">
        <td colSpan={6} className="px-4 py-3 text-center text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading…
        </td>
      </tr>
    )
  }

  return (
    <tr
      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => plan ? navigate(`/operations/${plan.id}`) : undefined}
    >
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-900">{event.title}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{event.venue_name}</td>
      <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">
        {formatCurrency(pnl.netRevenue)}
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
        {formatCurrency(pnl.totalActual)}
      </td>
      <td className="px-4 py-3 text-sm text-right text-slate-600">
        {formatCurrency(sharedAllocation)}
      </td>
      <td className={cn(
        'px-4 py-3 text-sm text-right font-semibold',
        adjustedPnL >= 0 ? 'text-emerald-600' : 'text-red-600',
      )}>
        {formatCurrency(adjustedPnL)}
      </td>
    </tr>
  )
}

// ─── Shared cost form ───────────────────────────────────────────────────────

const emptyForm = {
  label: '',
  amount: '',
  split_method: 'equal' as TourSplitMethod,
  notes: '',
}

function SharedCostForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: TourSharedCost
  onSubmit: (data: { label: string; amount: number; split_method: TourSplitMethod; notes?: string | null }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [form, setForm] = useState(
    initial
      ? { label: initial.label, amount: String(initial.amount), split_method: initial.split_method, notes: initial.notes ?? '' }
      : emptyForm,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label.trim() || !form.amount) return
    onSubmit({
      label: form.label.trim(),
      amount: Number(form.amount),
      split_method: form.split_method,
      notes: form.notes.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Cost label *"
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Amount (₹) *"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={form.split_method}
          onChange={e => setForm(f => ({ ...f, split_method: e.target.value as TourSplitMethod }))}
        >
          <option value="equal">Equal Split</option>
          <option value="proportional_revenue">Proportional to Revenue</option>
          <option value="manual">Manual</option>
        </select>
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : initial ? 'Update' : 'Add Shared Cost'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 text-sm rounded-lg hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export function TourPnLPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useRole()

  if (!tourId) return <div className="p-8 text-center text-slate-500">Tour not found</div>

  const { data: tour, isLoading: tourLoading, isError: tourError } = useTour(tourId)
  const { data: events = [], isLoading: eventsLoading } = useTourEvents(tourId)
  const { data: sharedCosts = [], isLoading: costsLoading } = useTourSharedCosts(tourId)

  const createCost = useCreateSharedCost(tourId)
  const updateCost = useUpdateSharedCost(tourId)
  const deleteCost = useDeleteSharedCost(tourId)

  const [pnlMap, setPnlMap] = useState<Record<string, PnLData>>({})
  const [showCostForm, setShowCostForm] = useState(false)
  const [editingCost, setEditingCost] = useState<TourSharedCost | null>(null)

  const handlePnLData = useCallback((eventId: string, data: PnLData) => {
    setPnlMap(prev => {
      if (prev[eventId]?.netPnL === data.netPnL && prev[eventId]?.netRevenue === data.netRevenue) return prev
      return { ...prev, [eventId]: data }
    })
  }, [])

  // Compute tour totals
  const tourTotalRevenue = Object.values(pnlMap).reduce((s, p) => s + p.netRevenue, 0)
  const tourTotalExpenses = Object.values(pnlMap).reduce((s, p) => s + p.totalActual, 0)
  const totalSharedCosts = sharedCosts.reduce((s, c) => s + Number(c.amount), 0)
  const tourNetPnL = tourTotalRevenue - tourTotalExpenses - totalSharedCosts
  const allDataLoaded = events.length > 0 && Object.keys(pnlMap).length === events.length

  // Compute shared cost allocation per event
  function getSharedAllocation(eventId: string): number {
    if (events.length === 0) return 0
    return sharedCosts.reduce((sum, cost) => {
      const amount = Number(cost.amount)
      if (cost.split_method === 'equal') {
        return sum + amount / events.length
      }
      if (cost.split_method === 'proportional_revenue' && tourTotalRevenue > 0) {
        const eventRevenue = pnlMap[eventId]?.netRevenue ?? 0
        return sum + (eventRevenue / tourTotalRevenue) * amount
      }
      return sum + amount / events.length
    }, 0)
  }

  // Chart data
  const chartData = events.map(e => ({
    name: e.title.length > 15 ? e.title.slice(0, 15) + '…' : e.title,
    Revenue: pnlMap[e.id]?.netRevenue ?? 0,
    Expenses: (pnlMap[e.id]?.totalActual ?? 0) + getSharedAllocation(e.id),
  }))

  const isLoading = tourLoading || eventsLoading || costsLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Tour P&L" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </div>
    )
  }

  if (tourError || !tour) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Tour P&L" />
        <div className="max-w-3xl mx-auto p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Tour not found</h2>
          <p className="text-sm text-slate-500 mb-4">The tour may have been deleted or you don't have access.</p>
          <button onClick={() => navigate(-1)} className="text-brand-600 text-sm hover:underline">Go back</button>
        </div>
      </div>
    )
  }

  const programBadge = PROGRAM_COLORS[tour.program] ?? 'bg-slate-100 text-slate-700'

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title={tour.name} subtitle={`${tour.program} · ${tour.year}`} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Tour header */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{tour.name}</h1>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', programBadge)}>
            {tour.program}
          </span>
          <span className="text-sm text-slate-500">{tour.year}</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Revenue"
            value={formatCurrency(tourTotalRevenue)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            color="bg-emerald-50 border-emerald-200"
            loading={!allDataLoaded}
          />
          <SummaryCard
            label="Total Expenses"
            value={formatCurrency(tourTotalExpenses + totalSharedCosts)}
            icon={<TrendingDown className="w-5 h-5 text-red-500" />}
            color="bg-red-50 border-red-200"
            loading={!allDataLoaded}
          />
          <SummaryCard
            label="Net P&L"
            value={formatCurrency(tourNetPnL)}
            icon={<IndianRupee className="w-5 h-5 text-brand-500" />}
            color={tourNetPnL >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}
            loading={!allDataLoaded}
          />
          <SummaryCard
            label="Events"
            value={String(events.length)}
            icon={<MapPin className="w-5 h-5 text-brand-500" />}
            color="bg-brand-50 border-brand-200"
          />
        </div>

        {/* Per-city breakdown table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Per-City Breakdown</h2>
          </div>
          {events.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No events linked to this tour yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="text-left px-4 py-2 font-medium">City / Event</th>
                    <th className="text-left px-4 py-2 font-medium">Venue</th>
                    <th className="text-right px-4 py-2 font-medium">Revenue</th>
                    <th className="text-right px-4 py-2 font-medium">Expenses</th>
                    <th className="text-right px-4 py-2 font-medium">Shared Costs</th>
                    <th className="text-right px-4 py-2 font-medium">Net P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <EventPnLRow
                      key={event.id}
                      event={event as Event}
                      sharedAllocation={getSharedAllocation(event.id)}
                      onPnLData={handlePnLData}
                    />
                  ))}
                </tbody>
                {allDataLoaded && (
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold text-sm">
                      <td className="px-4 py-3 text-slate-900" colSpan={2}>Tour Total</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(tourTotalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrency(tourTotalExpenses)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(totalSharedCosts)}</td>
                      <td className={cn('px-4 py-3 text-right', tourNetPnL >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(tourNetPnL)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Per-city bar chart */}
        {chartData.length > 0 && allDataLoaded && (
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue vs Expenses by City</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Shared costs section */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Shared Tour Costs</h2>
              {totalSharedCosts > 0 && (
                <span className="text-xs text-slate-500">({formatCurrency(totalSharedCosts)} total)</span>
              )}
            </div>
            {!showCostForm && !editingCost && (
              <button
                onClick={() => setShowCostForm(true)}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>

          <div className="p-4 space-y-3">
            {showCostForm && (
              <SharedCostForm
                onSubmit={data => {
                  createCost.mutate(data, { onSuccess: () => setShowCostForm(false) })
                }}
                onCancel={() => setShowCostForm(false)}
                isLoading={createCost.isPending}
              />
            )}

            {editingCost && (
              <SharedCostForm
                initial={editingCost}
                onSubmit={data => {
                  updateCost.mutate(
                    { id: editingCost.id, payload: data },
                    { onSuccess: () => setEditingCost(null) },
                  )
                }}
                onCancel={() => setEditingCost(null)}
                isLoading={updateCost.isPending}
              />
            )}

            {sharedCosts.length === 0 && !showCostForm ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No shared costs yet. These are tour-level expenses split across all city events.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase border-b">
                      <th className="text-left px-3 py-2 font-medium">Label</th>
                      <th className="text-right px-3 py-2 font-medium">Amount</th>
                      <th className="text-left px-3 py-2 font-medium">Split Method</th>
                      <th className="text-left px-3 py-2 font-medium">Per Event</th>
                      <th className="text-right px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedCosts.map(cost => {
                      const perEvent =
                        cost.split_method === 'equal' && events.length > 0
                          ? Number(cost.amount) / events.length
                          : null

                      return (
                        <tr key={cost.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 text-slate-900">
                            {cost.label}
                            {cost.notes && (
                              <span className="block text-xs text-slate-400">{cost.notes}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">
                            {formatCurrency(Number(cost.amount))}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {SPLIT_LABELS[cost.split_method]}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {perEvent != null
                              ? `${formatCurrency(perEvent)} × ${events.length}`
                              : 'Variable'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingCost(cost); setShowCostForm(false) }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                aria-label="Edit shared cost"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin() && (
                                <button
                                  onClick={() => { if (confirm('Delete this shared cost?')) deleteCost.mutate(cost.id) }}
                                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                  aria-label="Delete shared cost"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Allocation breakdown */}
            {sharedCosts.length > 0 && events.length > 0 && allDataLoaded && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-amber-800 mb-2">Shared Cost Allocation</h3>
                <div className="space-y-1">
                  {events.map(e => (
                    <div key={e.id} className="flex justify-between text-xs">
                      <span className="text-amber-700">{e.title}</span>
                      <span className="font-medium text-amber-800">
                        {formatCurrency(getSharedAllocation(e.id))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Summary card ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  loading?: boolean
}) {
  return (
    <div className={cn('rounded-xl border p-4', color)}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-600">{label}</span>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-1" />
      ) : (
        <span className="text-lg font-bold text-slate-900">{value}</span>
      )}
    </div>
  )
}
