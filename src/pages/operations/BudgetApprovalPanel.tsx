import { useState } from 'react'
import {
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn, formatCurrency, formatDateTime } from '../../lib/utils'
import {
  useApprovals, usePendingApprovals, useCreateApproval,
  useApproveItem, useRejectItem, useCancelApproval,
} from '../../hooks/useApproval'
import { useBudgetItems } from '../../hooks/useBudget'
import type { BudgetApproval, BudgetCategory } from '../../types'

const CATEGORIES: { key: BudgetCategory; label: string }[] = [
  { key: 'ad_spend',           label: 'Ad Spend' },
  { key: 'venue_facilities',   label: 'Venue & Facilities' },
  { key: 'travel_stay',        label: 'Travel & Stay' },
  { key: 'gifts_merchandise',  label: 'Gifts & Merch' },
  { key: 'inventory',          label: 'Inventory' },
  { key: 'other',              label: 'Other' },
]

interface Props {
  eventId: string
  isAdmin: boolean
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending:   Clock,
  approved:  CheckCircle2,
  rejected:  XCircle,
  cancelled: AlertTriangle,
}

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] ?? Clock
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium capitalize', STATUS_STYLES[status])}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  )
}

export function BudgetApprovalPanel({ eventId, isAdmin }: Props) {
  const { data: pending = [], isLoading: loadingPending } = usePendingApprovals(eventId)
  const { data: all = [], isLoading: loadingAll } = useApprovals(eventId)
  const { data: budgetItems = [] } = useBudgetItems(eventId)
  const approve = useApproveItem(eventId)
  const reject = useRejectItem(eventId)
  const cancel = useCancelApproval(eventId)
  const create = useCreateApproval(eventId)

  const [showHistory, setShowHistory] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [form, setForm] = useState({ budget_item_id: '', amount: '', category: '', description: '' })

  const resolved = all.filter((a: any) => a.status !== 'pending')

  function handleReject(id: string) {
    if (!rejectReason.trim()) return
    reject.mutate({ id, reason: rejectReason.trim() }, {
      onSuccess: () => { setRejectId(null); setRejectReason('') },
    })
  }

  function handleSubmitRequest() {
    const item = budgetItems.find((b: { id: string }) => b.id === form.budget_item_id)
    create.mutate({
      budget_item_id: form.budget_item_id || null,
      amount: parseFloat(form.amount) || (item ? Number(item.planned_amount) : 0),
      category: form.category || (item ? item.category : '') || null,
      description: form.description || (item ? item.label : '') || null,
    }, {
      onSuccess: () => {
        setShowRequestForm(false)
        setForm({ budget_item_id: '', amount: '', category: '', description: '' })
      },
    })
  }

  if (loadingPending || loadingAll) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Pending approvals */}
      {pending.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            {pending.length} Pending Approval{pending.length > 1 ? 's' : ''}
          </p>
          {pending.map((a: any) => (
            <div key={a.id} className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {a.description || a.category || 'Budget Item'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatCurrency(Number(a.amount))} · by {(a as any).requester?.full_name || 'Unknown'} · {formatDateTime(a.requested_at)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              {isAdmin && rejectId !== a.id && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => { if (confirm('Approve this budget item?')) approve.mutate(a.id) }}
                    disabled={approve.isPending}
                    className="btn-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => setRejectId(a.id)}
                    className="btn-sm bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => cancel.mutate(a.id)}
                    disabled={cancel.isPending}
                    className="btn-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {rejectId === a.id && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5"
                  />
                  <button
                    onClick={() => handleReject(a.id)}
                    disabled={reject.isPending || !rejectReason.trim()}
                    className="btn-sm bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => { setRejectId(null); setRejectReason('') }}
                    className="btn-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">No pending approvals</p>
      )}

      {/* Request approval button */}
      {!showRequestForm ? (
        <button
          onClick={() => setShowRequestForm(true)}
          className="w-full text-xs font-medium text-brand-600 hover:text-brand-700 py-2 border border-dashed border-brand-300 rounded-lg hover:bg-brand-50 transition-colors"
        >
          + Request Budget Approval
        </button>
      ) : (
        <div className="border border-brand-200 bg-brand-50/30 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-brand-700 uppercase">New Approval Request</p>
          <select
            value={form.budget_item_id}
            onChange={e => {
              const item = budgetItems.find((b: { id: string }) => b.id === e.target.value)
              setForm({
                budget_item_id: e.target.value,
                amount: item ? String(item.planned_amount) : form.amount,
                category: item ? item.category : form.category,
                description: item ? item.label : form.description,
              })
            }}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="">Link to budget item (optional)</option>
            {budgetItems.map((b: { id: string; label: string; planned_amount: number }) => (
              <option key={b.id} value={b.id}>{b.label} — {formatCurrency(Number(b.planned_amount))}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              type="number"
              placeholder="Amount"
              className="text-xs border border-slate-200 rounded-lg px-3 py-2"
            />
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmitRequest}
              disabled={create.isPending || (!form.amount && !form.budget_item_id)}
              className="btn-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-1.5 text-xs font-medium"
            >
              {create.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
            <button
              onClick={() => setShowRequestForm(false)}
              className="btn-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {resolved.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Approval History ({resolved.length})
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {resolved.map((a: any) => (
                <div key={a.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{a.description || a.category || 'Budget Item'}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatCurrency(Number(a.amount))} · by {(a as any).requester?.full_name || 'Unknown'} · Resolved {a.resolved_at ? formatDateTime(a.resolved_at) : '—'}
                    </p>
                    {a.rejection_reason && (
                      <p className="text-[10px] text-red-500 mt-0.5">Reason: {a.rejection_reason}</p>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
