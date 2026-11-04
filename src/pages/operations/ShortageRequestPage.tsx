import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { PriorityBadge, ShortageStatusBadge } from '../../components/ui/Badge'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, AlertTriangle, Check, X, MessageCircle, Loader2, PackagePlus, PackageSearch } from 'lucide-react'
import { timeAgo, cn } from '../../lib/utils'
import { UNIT_OPTIONS } from '../../lib/constants'
import { useChecklist } from '../../hooks/useChecklist'
import { checklistService } from '../../services/checklist'
import { supabase } from '../../lib/supabase'
import { useShortages, useCreateShortage, useUpdateShortageStatus, type ShortageActionPayload } from '../../hooks/useShortages'
import { useOperationPlanById } from '../../hooks/useEvents'
import { useAuthStore } from '../../stores/authStore'
import { useRole } from '../../hooks/useRole'
import type { Priority } from '../../types'

const schema = z.object({
  itemId:        z.string().min(1, 'Select an item'),
  additionalQty: z.string().min(1, 'Enter amount needed'),
  reason:        z.string().min(5, 'Describe the reason'),
  priority:      z.enum(['critical', 'high', 'medium', 'low']),
  neededBy:      z.string().optional(),
  notes:         z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const newItemSchema = z.object({
  itemName:   z.string().min(2, 'Item name required'),
  unit:       z.string().min(1, 'Unit required'),
  qtyNeeded:  z.string().min(1, 'Quantity required'),
  itemType:   z.enum(['consumable', 'reusable']),
  reason:     z.string().min(5, 'Describe the reason'),
  priority:   z.enum(['critical', 'high', 'medium', 'low']),
  neededBy:   z.string().optional(),
  notes:      z.string().optional(),
})
type NewItemFormValues = z.infer<typeof newItemSchema>

export function ShortageRequestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const planId = id ?? ''
  const [showForm, setShowForm] = useState(false)
  const [requestType, setRequestType] = useState<'existing' | 'new'>('existing')
  const [actionModal, setActionModal] = useState<ShortageActionPayload & { itemName: string; requestedQty: number } | null>(null)
  const [approvedQty, setApprovedQty] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  const { data: plan } = useOperationPlanById(planId)
  const eventId = (plan as any)?.event_id ?? ''
  const { data: items = [] } = useChecklist(planId)
  const { data: shortages = [], isLoading } = useShortages(planId)
  const createShortage = useCreateShortage(planId)
  const updateShortage = useUpdateShortageStatus(planId)
  const userId = useAuthStore(s => s.user?.id ?? '')
  const profile = useAuthStore(s => s.profile)
  const { isAdmin } = useRole()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'high' },
  })

  const { register: regNew, handleSubmit: handleNew, reset: resetNew, formState: { errors: errNew } } = useForm<NewItemFormValues>({
    resolver: zodResolver(newItemSchema),
    defaultValues: { priority: 'high', itemType: 'consumable', unit: 'nos', qtyNeeded: '1' },
  })

  const onSubmit = async (values: FormValues) => {
    const existing = (shortages as any[]).find(
      s => s.checklist_item_id === values.itemId && s.status === 'pending'
    )
    if (existing) {
      const raiser = existing.profiles?.full_name ?? 'someone'
      toast.error(`Shortage already pending for this item — raised by ${raiser}`)
      return
    }
    const item = items.find(i => i.id === values.itemId)
    await createShortage.mutateAsync({
      operation_plan_id: planId,
      event_id: eventId,
      checklist_item_id: values.itemId,
      requested_by: userId,
      organization_id: profile?.organization_id ?? '',
      additional_qty_requested: parseInt(values.additionalQty),
      current_qty: item?.required_qty ?? 0,
      reason: values.reason,
      priority: values.priority,
      needed_by: values.neededBy || null,
      notes: values.notes || null,
      status: 'pending',
    } as any)
    reset()
    setShowForm(false)
  }

  const [submittingNew, setSubmittingNew] = useState(false)
  const onSubmitNew = async (values: NewItemFormValues) => {
    setSubmittingNew(true)
    try {
      // Get default system category for FK
      const { data: cat } = await supabase
        .from('material_categories')
        .select('id')
        .eq('is_system', true)
        .order('sort_order')
        .limit(1)
        .single()
      if (!cat) throw new Error('No default category found')

      // Auto-add item to checklist
      const newItem = await checklistService.create({
        operation_plan_id: planId,
        event_id: eventId,
        organization_id: profile?.organization_id ?? '',
        category_id: cat.id,
        name: values.itemName,
        unit: values.unit,
        required_qty: parseInt(values.qtyNeeded),
        item_type: values.itemType,
        priority: values.priority,
        is_critical: values.priority === 'critical',
        status: 'pending',
        office_status: 'not_started',
        venue_status: 'not_received',
        reserved_qty: 0, packed_qty: 0, dispatched_qty: 0,
        received_qty: 0, venue_verified_qty: 0,
        additional_requested_qty: 0, additional_approved_qty: 0,
        damaged_qty: 0, lost_qty: 0,
        photo_urls: [],
        last_updated_by: userId,
      })

      // Create shortage request linked to the new checklist item
      await createShortage.mutateAsync({
        operation_plan_id: planId,
        event_id: eventId,
        checklist_item_id: (newItem as any).id,
        requested_by: userId,
        organization_id: profile?.organization_id ?? '',
        additional_qty_requested: parseInt(values.qtyNeeded),
        current_qty: 0,
        reason: values.reason,
        priority: values.priority,
        needed_by: values.neededBy || null,
        notes: values.notes || null,
        status: 'pending',
      } as any)

      resetNew()
      setShowForm(false)
      toast.success('New item added to checklist and shortage request submitted')
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setSubmittingNew(false)
    }
  }

  return (
    <>
      <Header title="Shortage Requests" subtitle="Manage additional material requirements" />

      <main className="p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(`/operations/${id}`)} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Control Center
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setRequestType('existing') }}>
            <Plus className="w-4 h-4" /> New Shortage Request
          </button>
        </div>

        {showForm && (
          <div className="card p-6 border-2 border-brand-100">
            <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Report Shortage / Additional Requirement
            </h2>

            {/* Request type toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5 w-fit">
              <button
                type="button"
                onClick={() => setRequestType('existing')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  requestType === 'existing'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Existing Item
              </button>
              <button
                type="button"
                onClick={() => setRequestType('new')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  requestType === 'new'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <PackageSearch className="w-3.5 h-3.5" /> New Item (not in list)
              </button>
            </div>

            {/* ── Existing item form ── */}
            {requestType === 'existing' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Item *</label>
                    <select {...register('itemId')} className={cn('input', errors.itemId && 'input-error')}>
                      <option value="">Select item…</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    {errors.itemId && <p className="error-msg">{errors.itemId.message}</p>}
                  </div>
                  <div>
                    <label className="label">Priority *</label>
                    <select {...register('priority')} className="input">
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Additional Quantity Required *</label>
                    <input
                      {...register('additionalQty')}
                      type="number"
                      className={cn('input', errors.additionalQty && 'input-error')}
                      placeholder="e.g. 20"
                    />
                    {errors.additionalQty && <p className="error-msg">{errors.additionalQty.message}</p>}
                  </div>
                  <div>
                    <label className="label">Needed By</label>
                    <input {...register('neededBy')} type="datetime-local" className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Reason *</label>
                  <textarea
                    {...register('reason')}
                    rows={2}
                    className={cn('input resize-none', errors.reason && 'input-error')}
                    placeholder="Why is this additional quantity needed?"
                  />
                  {errors.reason && <p className="error-msg">{errors.reason.message}</p>}
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input {...register('notes')} className="input" placeholder="Additional notes…" />
                </div>
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button type="button" onClick={() => { setShowForm(false); reset() }} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={createShortage.isPending} className="btn btn-primary">
                    {createShortage.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}

            {/* ── New item form ── */}
            {requestType === 'new' && (
              <form onSubmit={handleNew(onSubmitNew)} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <PackageSearch className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This item will be <strong>auto-added to the checklist</strong> and a shortage request will be raised for admin approval.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Item Name *</label>
                    <input {...regNew('itemName')} className={cn('input', errNew.itemName && 'input-error')} placeholder="e.g. Extension Cords, Podium, Banners" />
                    {errNew.itemName && <p className="error-msg">{errNew.itemName.message}</p>}
                  </div>
                  <div>
                    <label className="label">Unit *</label>
                    <select {...regNew('unit')} className="input">
                      {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantity Needed *</label>
                    <input type="number" min="1" {...regNew('qtyNeeded')} className={cn('input', errNew.qtyNeeded && 'input-error')} />
                    {errNew.qtyNeeded && <p className="error-msg">{errNew.qtyNeeded.message}</p>}
                  </div>
                  <div>
                    <label className="label">Item Type</label>
                    <select {...regNew('itemType')} className="input">
                      <option value="consumable">Consumable</option>
                      <option value="reusable">Reusable</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority *</label>
                    <select {...regNew('priority')} className="input">
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Needed By</label>
                    <input {...regNew('neededBy')} type="datetime-local" className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Reason *</label>
                  <textarea
                    {...regNew('reason')}
                    rows={2}
                    className={cn('input resize-none', errNew.reason && 'input-error')}
                    placeholder="Why is this item needed? e.g. Last-minute addition by client"
                  />
                  {errNew.reason && <p className="error-msg">{errNew.reason.message}</p>}
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input {...regNew('notes')} className="input" placeholder="Supplier suggestion, specs…" />
                </div>
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetNew() }} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={submittingNew} className="btn btn-primary">
                    {submittingNew ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><PackagePlus className="w-4 h-4" /> Add & Request</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading shortages…
          </div>
        )}

        {!isLoading && shortages.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Check className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
            <p className="font-semibold text-slate-600">No shortage requests</p>
            <p className="text-sm mt-1">All materials are accounted for</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {(shortages as any[]).map((s: any) => (
            <div key={s.id} className="card p-6">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {s.event_checklist_items?.name ?? 'Item'}
                    </h3>
                    <PriorityBadge priority={s.priority as Priority} />
                    <ShortageStatusBadge status={s.status} />
                  </div>
                  <p className="text-sm text-slate-600">{s.reason}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                    <span>Current: <strong>{s.current_qty}</strong></span>
                    <span>Additional: <strong className="text-red-600">+{s.additional_qty_requested}</strong></span>
                    {s.approved_qty && <span>Approved: <strong className="text-emerald-600">{s.approved_qty}</strong></span>}
                    <span>By: {s.profiles?.full_name ?? 'Unknown'}</span>
                    <span>{timeAgo(s.created_at)}</span>
                  </div>
                  {s.review_notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <MessageCircle className="w-3 h-3 inline mr-1" />{s.review_notes}
                    </p>
                  )}
                </div>
                {s.status === 'pending' && isAdmin() && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const ci = s.event_checklist_items as any
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
                          itemName: (s.event_checklist_items as any)?.name ?? 'Item',
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

              {s.shortage_request_actions?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Action History</p>
                  <div className="space-y-2">
                    {(s.shortage_request_actions as any[]).map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 text-sm">
                        <span className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-700">{a.profiles?.full_name ?? 'Unknown'}</span>
                          {' '}<span className="text-slate-600 capitalize">{a.action_type}</span>
                          {a.notes && <span className="text-slate-500"> — {a.notes}</span>}
                          <span className="text-slate-400 ml-2">{timeAgo(a.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
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
                  updateShortage.isPending ||
                  (actionModal.status === 'approved' && !approvedQty) ||
                  (actionModal.status === 'rejected' && !reviewNote.trim())
                }
                onClick={() => {
                  updateShortage.mutate({
                    ...actionModal,
                    approved_qty: actionModal.status === 'approved' ? parseInt(approvedQty) : undefined,
                    review_notes: reviewNote.trim() || undefined,
                  })
                  setActionModal(null)
                }}
                className={cn('btn flex-1', actionModal.status === 'approved' ? 'btn-primary' : 'btn-danger')}
              >
                {updateShortage.isPending
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
