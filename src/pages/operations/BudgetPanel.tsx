import { useState } from 'react'
import {
  Plus, Trash2, Edit3, X, Check, Loader2,
  IndianRupee, TrendingUp, TrendingDown, Minus, Download,
  CheckCircle2, XCircle, Clock, ShieldCheck,
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { exportToExcel } from '../../lib/exportExcel'
import { useBudgetItems, useCreateBudgetItem, useUpdateBudgetItem, useDeleteBudgetItem } from '../../hooks/useBudget'
import { usePendingApprovals, useApproveItem, useRejectItem, useCreateApproval } from '../../hooks/useApproval'
import type { BudgetCategory, EventBudgetItem, GstType } from '../../types'
import { GST_RATES } from '../../types'

const CATEGORIES: { key: BudgetCategory; label: string; color: string }[] = [
  { key: 'ad_spend',           label: 'Ad Spend',            color: 'bg-blue-500' },
  { key: 'venue_facilities',   label: 'Venue & Facilities',  color: 'bg-purple-500' },
  { key: 'travel_stay',        label: 'Travel & Stay',       color: 'bg-amber-500' },
  { key: 'gifts_merchandise',  label: 'Gifts & Merch',       color: 'bg-pink-500' },
  { key: 'inventory',          label: 'Inventory',           color: 'bg-teal-500' },
  { key: 'other',              label: 'Other',               color: 'bg-slate-500' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

const GST_TYPE_LABELS: Record<GstType, string> = {
  none: 'No GST',
  cgst_sgst: 'CGST + SGST',
  igst: 'IGST',
}

function calcGst(item: EventBudgetItem) {
  const base = Number(item.actual_amount) * item.qty
  const rate = Number(item.gst_rate) || 0
  if (rate === 0 || item.gst_type === 'none') return { total: 0, label: '' }
  const tax = Math.round((base * rate) / 100 * 100) / 100
  if (item.gst_type === 'cgst_sgst') {
    const half = Math.round((tax / 2) * 100) / 100
    return { total: tax, label: `CGST ${formatCurrency(half)} + SGST ${formatCurrency(half)}` }
  }
  return { total: tax, label: `IGST ${formatCurrency(tax)}` }
}

interface Props {
  eventId: string
  isAdmin: boolean
}

function BudgetSummaryBar({ planned, actual, gst }: { planned: number; actual: number; gst: number }) {
  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0
  const over = actual > planned
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Budget vs Actual</p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-lg font-bold text-slate-900">{formatCurrency(actual)}</span>
            <span className="text-sm text-slate-400">of {formatCurrency(planned)}</span>
          </div>
          {gst > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              + GST {formatCurrency(gst)} = <span className="font-semibold">{formatCurrency(actual + gst)}</span>
            </p>
          )}
        </div>
        <div className={cn(
          'flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full',
          over ? 'bg-red-50 text-red-600' : actual === 0 ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-600'
        )}>
          {over ? <TrendingUp className="w-3.5 h-3.5" /> : actual === 0 ? <Minus className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {over ? `Over by ${formatCurrency(actual - planned)}` : planned > 0 ? `${Math.round(100 - pct)}% remaining` : 'No budget set'}
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-red-500' : 'bg-brand-500')}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function CategoryBreakdown({ items }: { items: EventBudgetItem[] }) {
  const byCategory = CATEGORIES.map(cat => {
    const catItems = items.filter(i => i.category === cat.key)
    const planned = catItems.reduce((s, i) => s + Number(i.planned_amount), 0)
    const actual = catItems.reduce((s, i) => s + Number(i.actual_amount), 0)
    return { ...cat, planned, actual, count: catItems.length }
  }).filter(c => c.count > 0)

  if (byCategory.length === 0) return null

  const totalActual = byCategory.reduce((s, c) => s + c.actual, 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {byCategory.map(cat => (
        <div key={cat.key} className="card p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', cat.color)} />
            <span className="text-xs font-semibold text-slate-700">{cat.label}</span>
          </div>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(cat.actual)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Planned: {formatCurrency(cat.planned)}</span>
            <span>{totalActual > 0 ? Math.round((cat.actual / totalActual) * 100) : 0}%</span>
          </div>
          {cat.planned > 0 && (
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', cat.actual > cat.planned ? 'bg-red-400' : 'bg-brand-400')}
                style={{ width: `${Math.min((cat.actual / cat.planned) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const emptyForm = {
  label: '', description: '', category: 'other' as BudgetCategory,
  planned_amount: 0, actual_amount: 0, qty: 1, is_reusable: false,
  vendor_name: '', receipt_url: '', notes: '',
  gst_rate: 0, gst_type: 'none' as GstType, hsn_code: '',
}

const APPROVAL_THRESHOLD = 10000

export function BudgetPanel({ eventId, isAdmin }: Props) {
  const { data: items = [], isLoading, isError, refetch } = useBudgetItems(eventId)
  const createItem = useCreateBudgetItem(eventId)
  const updateItem = useUpdateBudgetItem(eventId)
  const deleteItem = useDeleteBudgetItem(eventId)

  const { data: pendingApprovals = [] } = usePendingApprovals(eventId)
  const approveItem = useApproveItem(eventId)
  const rejectItem = useRejectItem(eventId)
  const createApproval = useCreateApproval(eventId)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<BudgetCategory | 'all'>('all')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  const totalPlanned = items.reduce((s, i) => s + Number(i.planned_amount), 0)
  const totalActual = items.reduce((s, i) => s + Number(i.actual_amount), 0)
  const totalGst = items.reduce((s, i) => s + calcGst(i).total, 0)

  const pendingItemIds = new Set(pendingApprovals.map((a: any) => a.budget_item_id).filter(Boolean))
  const filteredByCategory = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)
  const filtered = showPendingOnly ? filteredByCategory.filter(i => i.approval_status === 'pending') : filteredByCategory

  const needsApproval = !isAdmin && (form.actual_amount * (form.qty || 1)) >= APPROVAL_THRESHOLD

  function handleSubmit() {
    if (!form.label.trim()) return
    const payload = {
      ...form,
      description: form.description || null,
      vendor_name: form.vendor_name || null,
      receipt_url: form.receipt_url || null,
      notes: form.notes || null,
      hsn_code: form.hsn_code || null,
      ...(needsApproval && !editingId ? { approval_status: 'pending' } : {}),
    }
    if (editingId) {
      updateItem.mutate({ id: editingId, payload }, {
        onSuccess: () => { setEditingId(null); setShowForm(false); setForm(emptyForm) },
      })
    } else {
      createItem.mutate(payload, {
        onSuccess: (data: any) => {
          setShowForm(false)
          setForm(emptyForm)
          if (needsApproval && data?.id) {
            createApproval.mutate({
              budget_item_id: data.id,
              amount: form.actual_amount,
              category: form.category,
              description: form.label,
            })
          }
        },
      })
    }
  }

  function startEdit(item: EventBudgetItem) {
    setEditingId(item.id)
    setForm({
      label: item.label,
      description: item.description ?? '',
      category: item.category,
      planned_amount: Number(item.planned_amount),
      actual_amount: Number(item.actual_amount),
      qty: item.qty,
      is_reusable: item.is_reusable,
      vendor_name: item.vendor_name ?? '',
      receipt_url: item.receipt_url ?? '',
      notes: item.notes ?? '',
      gst_rate: Number(item.gst_rate) || 0,
      gst_type: item.gst_type || 'none',
      hsn_code: item.hsn_code ?? '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading budget…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500 text-sm space-y-2">
        <p>Failed to load budget data</p>
        <button onClick={() => refetch()} className="btn btn-secondary btn-sm">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <BudgetSummaryBar planned={totalPlanned} actual={totalActual} gst={totalGst} />

      {/* Pending approvals banner */}
      {isAdmin && pendingApprovals.length > 0 && (
        <button
          onClick={() => setShowPendingOnly(p => !p)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-colors',
            showPendingOnly
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-50'
          )}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{pendingApprovals.length} pending approval{pendingApprovals.length > 1 ? 's' : ''}</span>
          </span>
          <span className="text-xs">{showPendingOnly ? 'Show all' : 'Show pending only'}</span>
        </button>
      )}

      {/* Category breakdown */}
      <CategoryBreakdown items={items} />

      {/* Add button + filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterCat('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
              filterCat === 'all' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            All ({items.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.key).length
            if (count === 0) return null
            return (
              <button
                key={cat.key}
                onClick={() => setFilterCat(cat.key)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                  filterCat === cat.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button
              onClick={() => {
                const rows = filtered.map(item => ({
                  Item: item.label,
                  Category: CATEGORY_MAP[item.category]?.label ?? item.category,
                  'Planned (₹)': Number(item.planned_amount),
                  'Actual (₹)': Number(item.actual_amount),
                  'Variance (₹)': Number(item.planned_amount) - Number(item.actual_amount),
                  Qty: item.qty,
                  'GST Rate %': Number(item.gst_rate) || 0,
                  'GST Type': GST_TYPE_LABELS[item.gst_type] || 'No GST',
                  'GST Amount (₹)': calcGst(item).total,
                  'HSN Code': item.hsn_code ?? '',
                  Reusable: item.is_reusable ? 'Yes' : 'No',
                  Vendor: item.vendor_name ?? '',
                  Notes: item.notes ?? '',
                }))
                exportToExcel(rows, 'budget-export', 'Budget')
              }}
              className="btn btn-secondary btn-sm"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card p-4 border-2 border-brand-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Budget Item' : 'New Budget Item'}</h3>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Label *</label>
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Hall Rent, Meta Campaign"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as BudgetCategory }))}
                className="input w-full"
              >
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Planned Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={form.planned_amount || ''}
                onChange={e => setForm(f => ({ ...f, planned_amount: Number(e.target.value) }))}
                className="input w-full"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Actual Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={form.actual_amount || ''}
                onChange={e => setForm(f => ({ ...f, actual_amount: Number(e.target.value) }))}
                className="input w-full"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Qty</label>
              <input
                type="number"
                min={1}
                value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) || 1 }))}
                className="input w-full"
              />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_reusable}
                  onChange={e => setForm(f => ({ ...f, is_reusable: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                Reusable item
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">GST Rate %</label>
              <select
                value={form.gst_rate}
                onChange={e => { const rate = Number(e.target.value); setForm(f => ({ ...f, gst_rate: rate, ...(rate === 0 ? { gst_type: 'none' as GstType } : f.gst_type === 'none' ? { gst_type: 'cgst_sgst' as GstType } : {}) })) }}
                className="input w-full"
              >
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">GST Type</label>
              <select
                value={form.gst_type}
                onChange={e => { const t = e.target.value as GstType; setForm(f => ({ ...f, gst_type: t, ...(t === 'none' ? { gst_rate: 0 } : {}) })) }}
                className="input w-full"
                disabled={form.gst_rate === 0}
              >
                <option value="none">No GST</option>
                <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                <option value="igst">IGST (Inter-state)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">HSN/SAC Code</label>
              <input
                value={form.hsn_code}
                onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))}
                placeholder="e.g. 9983"
                className="input w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. 10×8 banner for stage backdrop"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Vendor</label>
              <input
                value={form.vendor_name}
                onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                placeholder="e.g. PrintShop India"
                className="input w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Receipt URL</label>
              <input
                value={form.receipt_url}
                onChange={e => setForm(f => ({ ...f, receipt_url: e.target.value }))}
                placeholder="Link to receipt or invoice"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className="input w-full"
              />
            </div>
          </div>
          {needsApproval && !editingId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Items ≥ {formatCurrency(APPROVAL_THRESHOLD)} require manager approval before they take effect.
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={cancelForm} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!form.label.trim() || createItem.isPending || updateItem.isPending}
              className="btn btn-primary btn-sm"
            >
              {(createItem.isPending || updateItem.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4" />}
              {editingId ? 'Update' : needsApproval ? 'Submit for Approval' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Items table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {items.length === 0
            ? 'No budget items yet — start by adding your first expense'
            : 'No items in this category'}
        </div>
      ) : (
        <div className="card overflow-hidden table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2.5">Item</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Category</th>
                <th className="text-right px-4 py-2.5">Planned</th>
                <th className="text-right px-4 py-2.5">Actual</th>
                <th className="text-right px-4 py-2.5 hidden md:table-cell">GST</th>
                <th className="text-right px-4 py-2.5 hidden md:table-cell">Variance</th>
                <th className="text-center px-4 py-2.5 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const cat = CATEGORY_MAP[item.category]
                const variance = Number(item.planned_amount) - Number(item.actual_amount)
                const gst = calcGst(item)
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        {item.approval_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-2.5 h-2.5" /> Pending
                          </span>
                        )}
                        {item.approval_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-2.5 h-2.5" /> Rejected
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="md:hidden flex items-center gap-1">
                          <span className={cn('w-1.5 h-1.5 rounded-full', cat?.color ?? 'bg-slate-400')} />
                          {cat?.label}
                        </span>
                        {item.qty > 1 && <span>Qty: {item.qty}</span>}
                        {item.is_reusable && <span className="text-teal-600 font-medium">Reusable</span>}
                        {item.hsn_code && <span className="text-slate-500">HSN: {item.hsn_code}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className={cn('w-2 h-2 rounded-full', cat?.color ?? 'bg-slate-400')} />
                        {cat?.label ?? item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 tabular-nums">
                      {formatCurrency(Number(item.planned_amount))}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                      {formatCurrency(Number(item.actual_amount))}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {gst.total > 0 ? (
                        <div>
                          <span className="font-medium text-slate-700 tabular-nums">{formatCurrency(gst.total)}</span>
                          <p className="text-[10px] text-slate-400">{gst.label}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right font-medium tabular-nums hidden md:table-cell',
                      variance < 0 ? 'text-red-600' : variance > 0 ? 'text-emerald-600' : 'text-slate-400'
                    )}>
                      {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {isAdmin && item.approval_status === 'pending' && (() => {
                          const approval = pendingApprovals.find((a: any) => a.budget_item_id === item.id)
                          if (!approval) return null
                          if (rejectingId === approval.id) {
                            return (
                              <div className="flex items-center gap-1">
                                <input
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value)}
                                  placeholder="Reason"
                                  className="input text-xs py-1 px-2 w-24"
                                  autoFocus
                                />
                                <button
                                  onClick={() => { if (!rejectReason.trim()) return; rejectItem.mutate({ id: approval.id, reason: rejectReason }); setRejectingId(null); setRejectReason('') }}
                                  className="p-1 rounded bg-red-500 text-white hover:bg-red-600"
                                  title="Confirm reject"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => { setRejectingId(null); setRejectReason('') }}
                                  className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          }
                          return (
                            <>
                              <button
                                onClick={() => approveItem.mutate(approval.id)}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRejectingId(approval.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )
                        })()}
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors"
                          title="Edit"
                          aria-label="Edit budget item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { if (confirm('Remove this budget item?')) deleteItem.mutate(item.id) }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete"
                            aria-label="Delete budget item"
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
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-sm">
                <td className="px-4 py-2.5 text-slate-700" colSpan={2}>Total ({filtered.length} items)</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {formatCurrency(filtered.reduce((s, i) => s + Number(i.planned_amount), 0))}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                  {formatCurrency(filtered.reduce((s, i) => s + Number(i.actual_amount), 0))}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums hidden md:table-cell text-slate-700">
                  {formatCurrency(filtered.reduce((s, i) => s + calcGst(i).total, 0))}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums hidden md:table-cell">
                  {(() => {
                    const v = filtered.reduce((s, i) => s + Number(i.planned_amount) - Number(i.actual_amount), 0)
                    return <span className={v < 0 ? 'text-red-600' : 'text-emerald-600'}>{v > 0 ? '+' : ''}{formatCurrency(v)}</span>
                  })()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
