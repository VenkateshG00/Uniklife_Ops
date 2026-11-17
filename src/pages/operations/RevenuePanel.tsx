import { useState } from 'react'
import {
  Plus, Trash2, Edit3, X, Check, Loader2,
  TrendingUp, TrendingDown, Ticket, ReceiptText, Download
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { exportMultiSheet } from '../../lib/exportExcel'
import {
  useRevenueTiers, useRevenueAdjustments,
  useCreateRevenueTier, useUpdateRevenueTier, useDeleteRevenueTier,
  useCreateRevenueAdjustment, useUpdateRevenueAdjustment, useDeleteRevenueAdjustment,
} from '../../hooks/useRevenue'
import type { RevenueAdjustmentType, EventRevenueTier, EventRevenueAdjustment, GstType } from '../../types'
import { GST_RATES } from '../../types'

const ADJ_TYPES: { key: RevenueAdjustmentType; label: string; sign: 'negative' | 'positive' }[] = [
  { key: 'refund',          label: 'Refund',           sign: 'negative' },
  { key: 'advance_booking', label: 'Advance Booking',  sign: 'positive' },
  { key: 'gateway_fee',     label: 'Gateway Fee',      sign: 'negative' },
  { key: 'discount',        label: 'Discount',         sign: 'negative' },
  { key: 'other',           label: 'Other',            sign: 'negative' },
]

const ADJ_MAP = Object.fromEntries(ADJ_TYPES.map(a => [a.key, a]))

interface Props {
  eventId: string
  isAdmin: boolean
}

const emptyTier = { tier_name: '', price: 0, seats_available: 0, seats_sold: 0, notes: '', gst_rate: 0, gst_type: 'none' as GstType, hsn_code: '' }
const emptyAdj = { type: 'refund' as RevenueAdjustmentType, label: '', amount: 0, notes: '' }

function RevenueSummaryBar({ grossRevenue, netRevenue, totalRefunds, totalRegistrations, totalGst }: {
  grossRevenue: number; netRevenue: number; totalRefunds: number; totalRegistrations: number; totalGst: number
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Gross Revenue</p>
        <p className="text-lg font-bold text-slate-900">{formatCurrency(grossRevenue)}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Net Revenue</p>
        <p className={cn('text-lg font-bold', netRevenue >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {formatCurrency(netRevenue)}
        </p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Adjustments</p>
        <p className="text-lg font-bold text-red-600">−{formatCurrency(Math.abs(totalRefunds))}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Output GST</p>
        <p className="text-lg font-bold text-amber-600">{formatCurrency(totalGst)}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Registrations</p>
        <p className="text-lg font-bold text-brand-600">{totalRegistrations}</p>
      </div>
    </div>
  )
}

export function RevenuePanel({ eventId, isAdmin }: Props) {
  const { data: tiers = [], isLoading: tiersLoading, isError: tiersError, refetch: refetchTiers } = useRevenueTiers(eventId)
  const { data: adjustments = [], isLoading: adjLoading, isError: adjError, refetch: refetchAdj } = useRevenueAdjustments(eventId)

  const createTier = useCreateRevenueTier(eventId)
  const updateTier = useUpdateRevenueTier(eventId)
  const deleteTier = useDeleteRevenueTier(eventId)
  const createAdj = useCreateRevenueAdjustment(eventId)
  const updateAdj = useUpdateRevenueAdjustment(eventId)
  const deleteAdj = useDeleteRevenueAdjustment(eventId)

  const [showTierForm, setShowTierForm] = useState(false)
  const [tierForm, setTierForm] = useState(emptyTier)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)

  const [showAdjForm, setShowAdjForm] = useState(false)
  const [adjForm, setAdjForm] = useState(emptyAdj)
  const [editingAdjId, setEditingAdjId] = useState<string | null>(null)

  const grossRevenue = tiers.reduce((s, t) => s + Number(t.price) * t.seats_sold, 0)
  const totalRegistrations = tiers.reduce((s, t) => s + t.seats_sold, 0)
  const totalGst = tiers.reduce((s, t) => {
    if (!t.gst_type || t.gst_type === 'none' || !t.gst_rate) return s
    return s + Number(t.price) * t.seats_sold * Number(t.gst_rate) / 100
  }, 0)
  const totalAdjustments = adjustments.reduce((s, a) => {
    const info = ADJ_MAP[a.type]
    return s + (info?.sign === 'positive' ? Number(a.amount) : -Number(a.amount))
  }, 0)
  const netRevenue = grossRevenue + totalAdjustments

  function handleTierSubmit() {
    if (!tierForm.tier_name.trim()) return
    const payload = {
      ...tierForm,
      notes: tierForm.notes || null,
      hsn_code: tierForm.hsn_code || null,
    }
    if (editingTierId) {
      updateTier.mutate({ id: editingTierId, payload }, {
        onSuccess: () => { setEditingTierId(null); setShowTierForm(false); setTierForm(emptyTier) },
      })
    } else {
      createTier.mutate(payload, {
        onSuccess: () => { setShowTierForm(false); setTierForm(emptyTier) },
      })
    }
  }

  function handleAdjSubmit() {
    if (!adjForm.label.trim()) return
    if (editingAdjId) {
      updateAdj.mutate({ id: editingAdjId, payload: adjForm }, {
        onSuccess: () => { setEditingAdjId(null); setShowAdjForm(false); setAdjForm(emptyAdj) },
      })
    } else {
      createAdj.mutate(adjForm, {
        onSuccess: () => { setShowAdjForm(false); setAdjForm(emptyAdj) },
      })
    }
  }

  function startEditTier(tier: EventRevenueTier) {
    setEditingTierId(tier.id)
    setTierForm({
      tier_name: tier.tier_name,
      price: Number(tier.price),
      seats_available: tier.seats_available,
      seats_sold: tier.seats_sold,
      notes: tier.notes ?? '',
      gst_rate: Number(tier.gst_rate) || 0,
      gst_type: (tier.gst_type as GstType) || 'none',
      hsn_code: tier.hsn_code ?? '',
    })
    setShowTierForm(true)
  }

  function startEditAdj(adj: EventRevenueAdjustment) {
    setEditingAdjId(adj.id)
    setAdjForm({
      type: adj.type,
      label: adj.label,
      amount: Number(adj.amount),
      notes: adj.notes ?? '',
    })
    setShowAdjForm(true)
  }

  if (tiersLoading || adjLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading revenue…
      </div>
    )
  }

  if (tiersError || adjError) {
    return (
      <div className="text-center py-8 text-red-500 text-sm space-y-2">
        <p>Failed to load revenue data</p>
        <button onClick={() => { refetchTiers(); refetchAdj() }} className="btn btn-secondary btn-sm">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <RevenueSummaryBar
        grossRevenue={grossRevenue}
        netRevenue={netRevenue}
        totalRefunds={Math.abs(totalAdjustments)}
        totalRegistrations={totalRegistrations}
        totalGst={totalGst}
      />

      {/* Pricing Tiers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-brand-500" /> Pricing Tiers
          </h3>
          <div className="flex items-center gap-2">
            {(tiers.length > 0 || adjustments.length > 0) && (
              <button
                onClick={async () => {
                  const sheets: { name: string; data: Record<string, unknown>[] }[] = []
                  if (tiers.length > 0) {
                    sheets.push({ name: 'Revenue Tiers', data: tiers.map(t => {
                      const rev = Number(t.price) * t.seats_sold
                      const gstAmt = t.gst_type !== 'none' ? Number((rev * (Number(t.gst_rate) || 0) / 100).toFixed(2)) : 0
                      return {
                        Tier: t.tier_name,
                        'Price (₹)': Number(t.price),
                        'Seats Available': t.seats_available,
                        'Seats Sold': t.seats_sold,
                        'Revenue (₹)': rev,
                        'GST Rate %': Number(t.gst_rate) || 0,
                        'GST Type': t.gst_type === 'cgst_sgst' ? 'CGST+SGST' : t.gst_type === 'igst' ? 'IGST' : 'None',
                        'GST Amount (₹)': gstAmt,
                        'HSN Code': t.hsn_code ?? '',
                        Notes: t.notes ?? '',
                      }
                    })})
                  }
                  if (adjustments.length > 0) {
                    sheets.push({ name: 'Adjustments', data: adjustments.map(a => ({
                      Label: a.label,
                      Type: ADJ_MAP[a.type]?.label ?? a.type,
                      'Amount (₹)': Number(a.amount),
                      Direction: ADJ_MAP[a.type]?.sign === 'positive' ? 'Credit' : 'Debit',
                      Notes: a.notes ?? '',
                    }))})
                  }
                  if (sheets.length > 0) await exportMultiSheet(sheets, 'revenue-export')
                }}
                className="btn btn-secondary btn-sm"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
            )}
            <button
              onClick={() => { setShowTierForm(true); setEditingTierId(null); setTierForm(emptyTier) }}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" /> Add Tier
            </button>
          </div>
        </div>

        {showTierForm && (
          <div className="card p-4 border-2 border-brand-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">{editingTierId ? 'Edit Tier' : 'New Pricing Tier'}</h4>
              <button onClick={() => { setShowTierForm(false); setEditingTierId(null); setTierForm(emptyTier) }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Tier Name *</label>
                <input
                  value={tierForm.tier_name}
                  onChange={e => setTierForm(f => ({ ...f, tier_name: e.target.value }))}
                  placeholder="e.g. Early Bird"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Price (₹)</label>
                <input
                  type="number" min={0}
                  value={tierForm.price || ''}
                  onChange={e => setTierForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Seats Available</label>
                <input
                  type="number" min={0}
                  value={tierForm.seats_available || ''}
                  onChange={e => setTierForm(f => ({ ...f, seats_available: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Seats Sold</label>
                <input
                  type="number" min={0}
                  value={tierForm.seats_sold || ''}
                  onChange={e => setTierForm(f => ({ ...f, seats_sold: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">GST Type</label>
                <select
                  value={tierForm.gst_type}
                  onChange={e => setTierForm(f => ({ ...f, gst_type: e.target.value as GstType }))}
                  className="input w-full"
                >
                  <option value="none">No GST</option>
                  <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                  <option value="igst">IGST (Inter-state)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">GST Rate %</label>
                <select
                  value={tierForm.gst_rate}
                  onChange={e => setTierForm(f => ({ ...f, gst_rate: Number(e.target.value) }))}
                  className="input w-full"
                  disabled={tierForm.gst_type === 'none'}
                >
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">HSN/SAC Code</label>
                <input
                  value={tierForm.hsn_code}
                  onChange={e => setTierForm(f => ({ ...f, hsn_code: e.target.value }))}
                  placeholder="e.g. 998596"
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
              <input
                value={tierForm.notes}
                onChange={e => setTierForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowTierForm(false); setEditingTierId(null); setTierForm(emptyTier) }} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={handleTierSubmit}
                disabled={!tierForm.tier_name.trim() || createTier.isPending || updateTier.isPending}
                className="btn btn-primary btn-sm"
              >
                {(createTier.isPending || updateTier.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingTierId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {tiers.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No pricing tiers set — add your first tier
          </div>
        ) : (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">Tier</th>
                  <th className="text-right px-4 py-2.5">Price</th>
                  <th className="text-right px-4 py-2.5">Available</th>
                  <th className="text-right px-4 py-2.5">Sold</th>
                  <th className="text-right px-4 py-2.5">Revenue</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">Fill %</th>
                  <th className="text-center px-4 py-2.5 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tiers.map(tier => {
                  const revenue = Number(tier.price) * tier.seats_sold
                  const fillPct = tier.seats_available > 0 ? Math.round((tier.seats_sold / tier.seats_available) * 100) : 0
                  return (
                    <tr key={tier.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{tier.tier_name}</div>
                        {tier.gst_type && tier.gst_type !== 'none' && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {tier.gst_type === 'cgst_sgst' ? `CGST+SGST ${tier.gst_rate}%` : `IGST ${tier.gst_rate}%`}
                            {tier.hsn_code && ` · HSN: ${tier.hsn_code}`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatCurrency(Number(tier.price))}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{tier.seats_available}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">{tier.seats_sold}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600">{formatCurrency(revenue)}</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', fillPct >= 90 ? 'bg-red-400' : fillPct >= 60 ? 'bg-amber-400' : 'bg-brand-400')}
                              style={{ width: `${Math.min(fillPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">{fillPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEditTier(tier)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors" title="Edit" aria-label="Edit tier">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button onClick={() => { if (confirm('Remove this tier?')) deleteTier.mutate(tier.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete" aria-label="Delete tier">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-sm">
                  <td className="px-4 py-2.5 text-slate-700">Total</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                    {tiers.reduce((s, t) => s + t.seats_available, 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                    {totalRegistrations}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">
                    {formatCurrency(grossRevenue)}
                  </td>
                  <td className="hidden md:table-cell" />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Adjustments (Refunds, Advance Bookings, etc.) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-amber-500" /> Adjustments
          </h3>
          <button
            onClick={() => { setShowAdjForm(true); setEditingAdjId(null); setAdjForm(emptyAdj) }}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {showAdjForm && (
          <div className="card p-4 border-2 border-brand-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">{editingAdjId ? 'Edit Adjustment' : 'New Adjustment'}</h4>
              <button onClick={() => { setShowAdjForm(false); setEditingAdjId(null); setAdjForm(emptyAdj) }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                <select
                  value={adjForm.type}
                  onChange={e => setAdjForm(f => ({ ...f, type: e.target.value as RevenueAdjustmentType }))}
                  className="input w-full"
                >
                  {ADJ_TYPES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Label *</label>
                <input
                  value={adjForm.label}
                  onChange={e => setAdjForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Razorpay fees, 3 refunds"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount (₹)</label>
                <input
                  type="number" min={0}
                  value={adjForm.amount || ''}
                  onChange={e => setAdjForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
              <input
                value={adjForm.notes}
                onChange={e => setAdjForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAdjForm(false); setEditingAdjId(null); setAdjForm(emptyAdj) }} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={handleAdjSubmit}
                disabled={!adjForm.label.trim() || createAdj.isPending || updateAdj.isPending}
                className="btn btn-primary btn-sm"
              >
                {(createAdj.isPending || updateAdj.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingAdjId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {adjustments.length === 0 ? (
          <p className="text-center py-4 text-slate-400 text-sm">No adjustments recorded</p>
        ) : (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">Label</th>
                  <th className="text-left px-4 py-2.5">Type</th>
                  <th className="text-right px-4 py-2.5">Amount</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell">Notes</th>
                  <th className="text-center px-4 py-2.5 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map(adj => {
                  const info = ADJ_MAP[adj.type]
                  const isPositive = info?.sign === 'positive'
                  return (
                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{adj.label}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        )}>
                          {isPositive ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                          {info?.label ?? adj.type}
                        </span>
                      </td>
                      <td className={cn('px-4 py-3 text-right tabular-nums font-medium', isPositive ? 'text-emerald-600' : 'text-red-600')}>
                        {isPositive ? '+' : '−'}{formatCurrency(Number(adj.amount))}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell truncate max-w-[200px]">{adj.notes}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEditAdj(adj)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors" title="Edit" aria-label="Edit adjustment">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button onClick={() => { if (confirm('Remove this adjustment?')) deleteAdj.mutate(adj.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete" aria-label="Delete adjustment">
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
      </div>
    </div>
  )
}
