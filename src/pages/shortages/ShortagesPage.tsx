import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/layout/Header'
import { PriorityBadge, ShortageStatusBadge } from '../../components/ui/Badge'
import { useShortagesByOrg, useUpdateShortageStatus, type ShortageActionPayload } from '../../hooks/useShortages'
import { useRole } from '../../hooks/useRole'
import { cn, timeAgo } from '../../lib/utils'
import type { Priority, ShortageStatus } from '../../types'
import { AlertTriangle, Check, X, Loader2, Package, Filter, ExternalLink, PackagePlus } from 'lucide-react'

type FilterOption = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_TABS: [FilterOption, string][] = [
  ['all',      'All'],
  ['pending',  'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
]

export function ShortagesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useRole()
  const { data: shortages = [], isLoading } = useShortagesByOrg()
  const updateStatus = useUpdateShortageStatus('')
  const [filter, setFilter] = useState<FilterOption>('pending')
  const [actionModal, setActionModal] = useState<ShortageActionPayload & { itemName: string; requestedQty: number } | null>(null)
  const [approvedQty, setApprovedQty] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  const filtered = (shortages as any[]).filter((s: any) => {
    if (filter === 'all') return true
    return s.status === filter
  })

  const pendingCount = (shortages as any[]).filter((s: any) => s.status === 'pending').length

  return (
    <>
      <Header title="Shortage Requests" subtitle="Review and action material shortage requests" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {STATUS_TABS.map(([key, label]) => {
            const count = key === 'all'
              ? (shortages as any[]).length
              : (shortages as any[]).filter((s: any) => s.status === key).length
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  filter === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  key === 'pending' && count > 0 && filter !== key && 'bg-amber-100 text-amber-700'
                )}
              >
                {label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            )
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        )}

        {!isLoading && shortages.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Check className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
            <p className="font-semibold text-slate-600">No shortage requests</p>
            <p className="text-sm mt-1">All materials are accounted for across all events</p>
          </div>
        )}

        {!isLoading && shortages.length > 0 && filtered.length === 0 && (
          <div className="card p-8 text-center text-slate-400 text-sm">No {filter} requests</div>
        )}

        {isAdmin() && pendingCount > 0 && filter !== 'pending' && (
          <div
            className="card p-4 border-amber-200 bg-amber-50 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => setFilter('pending')}
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {pendingCount} shortage request{pendingCount > 1 ? 's' : ''} waiting for your review
            </p>
            <span className="ml-auto text-xs text-amber-600 font-medium">Review →</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map((s: any) => {
            const ci = s.event_checklist_items as any
            return (
              <div key={s.id} className={cn('card p-5', s.status === 'pending' && 'border-amber-200')}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-slate-900">{ci?.name ?? 'Item'}</p>
                      <PriorityBadge priority={s.priority as Priority} />
                      <ShortageStatusBadge status={s.status as ShortageStatus} />
                    </div>

                    {s.event_operation_plans?.events?.title && (
                      <button
                        onClick={() => navigate(`/operations/${s.operation_plan_id}/shortage`)}
                        className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:underline mb-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {s.event_operation_plans.events.title}
                      </button>
                    )}

                    <p className="text-sm text-slate-600 mb-2">{s.reason}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>Current qty: <strong>{ci?.required_qty ?? s.current_qty}</strong></span>
                      <span>Requested: <strong className="text-red-600">+{s.additional_qty_requested}</strong></span>
                      {s.approved_qty != null && (
                        <span>Approved: <strong className="text-emerald-600">+{s.approved_qty} → new qty: {(ci?.required_qty ?? 0) + s.approved_qty}</strong></span>
                      )}
                      <span>By: <strong className="text-slate-600">{s.profiles?.full_name ?? 'Unknown'}</strong></span>
                      <span>{timeAgo(s.created_at)}</span>
                    </div>

                    {s.review_notes && (
                      <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-semibold">Note: </span>{s.review_notes}
                      </p>
                    )}
                  </div>

                  {s.status === 'pending' && isAdmin() && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setApprovedQty(String(s.additional_qty_requested))
                          setReviewNote('')
                          setActionModal({
                            id: s.id, status: 'approved',
                            itemName: ci?.name ?? 'Item',
                            requestedQty: s.additional_qty_requested,
                            checklist_item_id: s.checklist_item_id,
                            current_item_status: ci?.status,
                            current_required_qty: ci?.required_qty,
                          })
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setReviewNote('')
                          setActionModal({
                            id: s.id, status: 'rejected',
                            itemName: ci?.name ?? 'Item',
                            requestedQty: s.additional_qty_requested,
                            checklist_item_id: s.checklist_item_id,
                          })
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Approve / Reject action modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              {actionModal.status === 'approved'
                ? <PackagePlus className="w-5 h-5 text-emerald-600" />
                : <X className="w-5 h-5 text-red-500" />}
              <h2 className="font-bold text-slate-900">
                {actionModal.status === 'approved' ? 'Approve Shortage' : 'Reject Request'}
              </h2>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Item: <span className="font-semibold text-slate-800">{actionModal.itemName}</span>
              {actionModal.status === 'approved' && (
                <> · Requested: <span className="font-semibold text-red-600">+{actionModal.requestedQty}</span></>
              )}
            </p>

            {actionModal.status === 'approved' && (
              <div className="mb-4">
                <label className="label">Approved Qty *</label>
                <input
                  type="number"
                  value={approvedQty}
                  onChange={e => setApprovedQty(e.target.value)}
                  className="input"
                  min={1}
                  max={actionModal.requestedQty}
                  placeholder={`Max ${actionModal.requestedQty}`}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Required qty will update: {actionModal.current_required_qty} → {(actionModal.current_required_qty ?? 0) + (parseInt(approvedQty) || 0)}
                </p>
              </div>
            )}

            <div className="mb-5">
              <label className="label">
                {actionModal.status === 'approved' ? 'Note' : 'Reason for rejection *'}
              </label>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                rows={2}
                className="input resize-none"
                placeholder={
                  actionModal.status === 'approved'
                    ? 'e.g. Will arrive by 3pm from warehouse'
                    : 'e.g. Budget constraint / already on the way'
                }
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                disabled={
                  updateStatus.isPending ||
                  (actionModal.status === 'approved' && !approvedQty) ||
                  (actionModal.status === 'rejected' && !reviewNote.trim())
                }
                onClick={() => {
                  updateStatus.mutate({
                    ...actionModal,
                    approved_qty: actionModal.status === 'approved' ? parseInt(approvedQty) : undefined,
                    review_notes: reviewNote.trim() || undefined,
                  })
                  setActionModal(null)
                }}
                className={cn('btn flex-1', actionModal.status === 'approved' ? 'btn-primary' : 'btn-danger')}
              >
                {updateStatus.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : actionModal.status === 'approved' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
