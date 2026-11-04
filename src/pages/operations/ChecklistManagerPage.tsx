import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useChecklist, useUpdateItemStatus, useUpdateChecklistItem, useDeleteChecklistItem, useUploadChecklistPhoto, useRemoveChecklistPhoto } from '../../hooks/useChecklist'
import { useRole } from '../../hooks/useRole'
import { useOperationPlanById } from '../../hooks/useEvents'
import { checklistService } from '../../services/checklist'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { EventChecklistItem, ItemStatus, Priority } from '../../types'
import {
  Plus, ArrowLeft, Loader2, ClipboardList, AlertTriangle, MoreVertical, Pencil, Trash2, Copy, Camera, X as XIcon,
} from 'lucide-react'
import { useSaveAsTemplate } from '../../hooks/useTemplates'

const itemSchema = z.object({
  name:         z.string().min(1, 'Name required'),
  unit:         z.string().min(1, 'Unit required'),
  required_qty: z.string().min(1, 'Quantity required'),
  item_type:    z.enum(['consumable', 'reusable']),
  priority:     z.enum(['critical', 'high', 'medium', 'low']),
  is_critical:  z.boolean(),
  category_id:  z.string().min(1, 'Category required'),
  notes:        z.string().optional(),
})
type ItemForm = z.infer<typeof itemSchema>

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']
const STATUS_OPTIONS: ItemStatus[] = ['pending', 'packed', 'dispatched', 'at_venue', 'issue']

function ItemRowMenu({ onEdit, onDelete, canDelete }: { item: EventChecklistItem; onEdit: () => void; onDelete: () => void; canDelete: boolean }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function outside(e: MouseEvent) {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false); setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen(o => !o); setConfirmDelete(false)
  }

  return (
    <div>
      <button ref={btnRef} onClick={toggle} className="btn btn-ghost btn-sm p-1.5" title="Options">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div ref={panelRef} className="fixed w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-[200] py-1"
          style={{ top: pos.top, right: pos.right }}>
          <button onClick={() => { setOpen(false); onEdit() }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit
          </button>
          {canDelete && (
            !confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            ) : (
              <div className="px-3 py-2 border-t border-red-100">
                <p className="text-xs text-red-600 mb-2 font-medium">Delete this item?</p>
                <div className="flex gap-1.5">
                  <button onClick={() => { onDelete(); setOpen(false) }}
                    className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1 font-semibold">Yes</button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 text-xs border border-slate-200 text-slate-600 rounded-lg py-1">No</button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

export function ChecklistManagerPage() {
  const { id: planId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  const { isAdmin } = useRole()
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<EventChecklistItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [issueNote, setIssueNote] = useState<Record<string, string>>({})

  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [tplName, setTplName]     = useState('')
  const [tplCategory, setTplCategory] = useState('')
  const saveAsTemplate = useSaveAsTemplate()

  const { data: plan } = useOperationPlanById(planId ?? '')
  const { data: items = [], isLoading } = useChecklist(planId ?? '')
  const updateStatus  = useUpdateItemStatus(planId ?? '')
  const updateItem    = useUpdateChecklistItem(planId ?? '')
  const deleteItem    = useDeleteChecklistItem(planId ?? '')
  const uploadPhoto   = useUploadChecklistPhoto(planId ?? '')
  const removePhoto   = useRemoveChecklistPhoto(planId ?? '')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['material-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_categories')
        .select('id, name')
        .order('sort_order')
      if (error) throw error
      return data as { id: string; name: string }[]
    },
    staleTime: Infinity,
  })

  const ev = (plan as any)?.events

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(itemSchema) as any,
    defaultValues: { unit: 'nos', item_type: 'consumable', priority: 'medium', is_critical: false, required_qty: '1', category_id: '' },
  })

  function openEdit(item: EventChecklistItem) {
    setEditItem(item)
    reset({
      name: item.name,
      unit: item.unit,
      required_qty: String(item.required_qty),
      item_type: item.item_type,
      priority: item.priority,
      is_critical: item.is_critical,
      category_id: item.category_id,
      notes: item.notes ?? '',
    })
    setShowAdd(true)
  }

  function closeForm() {
    setShowAdd(false)
    setEditItem(null)
    reset({ unit: 'nos', item_type: 'consumable', priority: 'medium', is_critical: false, required_qty: '1', category_id: '' })
  }

  const onAdd = async (values: ItemForm) => {
    if (!planId || !orgId || !userId) return
    setSaving(true)
    try {
      if (editItem) {
        await updateItem.mutateAsync({
          id: editItem.id,
          payload: {
            name: values.name,
            unit: values.unit,
            required_qty: Number(values.required_qty),
            item_type: values.item_type,
            priority: values.priority,
            is_critical: values.is_critical,
            notes: values.notes || undefined,
            category_id: values.category_id,
          },
        })
      } else {
        await checklistService.create({
          operation_plan_id: planId,
          event_id: (plan as any)?.event_id,
          organization_id: orgId,
          name: values.name,
          unit: values.unit,
          required_qty: Number(values.required_qty),
          item_type: values.item_type,
          priority: values.priority,
          is_critical: values.is_critical,
          notes: values.notes || undefined,
          status: 'pending',
          office_status: 'not_started',
          venue_status: 'not_received',
          reserved_qty: 0, packed_qty: 0, dispatched_qty: 0,
          received_qty: 0, venue_verified_qty: 0,
          additional_requested_qty: 0, additional_approved_qty: 0,
          damaged_qty: 0, lost_qty: 0,
          photo_urls: [],
          last_updated_by: userId,
          category_id: values.category_id,
        })
        qc.invalidateQueries({ queryKey: ['checklist', planId] })
        toast.success('Item added')
      }
      closeForm()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const done = items.filter(i => i.status === 'at_venue').length

  return (
    <>
      <Header
        title="Checklist Manager"
        subtitle={ev ? `${ev.title} — manage items` : 'Manage checklist items'}
      />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate(`/operations/${planId}`)} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> Control Center
          </button>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => { setTplName(''); setTplCategory((ev as any)?.category ?? ''); setShowSaveTemplate(true) }}
              >
                <Copy className="w-4 h-4" /> Save as Template
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {items.length > 0 && (
          <div className="card p-4 flex items-center gap-4">
            <ClipboardList className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-semibold text-slate-700">{done} / {items.length} items done</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: items.length ? `${Math.round(done/items.length*100)}%` : '0%' }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700">
              {items.length ? Math.round(done/items.length*100) : 0}%
            </span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading checklist…
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No items yet</p>
            <p className="text-sm mt-1 mb-4">Add items this operation needs to prepare and track</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add First Item
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Type</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {item.is_critical && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900">{item.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{item.priority} priority · {item.unit}</p>
                      {/* Photo strip */}
                      {(item.photo_urls?.length ?? 0) > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {item.photo_urls!.map((url, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={url}
                                alt={`photo ${i + 1}`}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                                onClick={() => setLightbox(url)}
                              />
                              {isAdmin() && (
                                <button
                                  onClick={() => removePhoto.mutate({ itemId: item.id, photoUrl: url, currentUrls: item.photo_urls! })}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <XIcon className="w-2.5 h-2.5 text-white" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <span className={`badge ${item.item_type === 'reusable' ? 'badge-inprogress' : 'badge-pending'}`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-slate-700">
                      {item.packed_qty ?? 0}/{item.required_qty}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={item.status}
                          onChange={e => {
                            const newStatus = e.target.value as ItemStatus
                            if (newStatus !== 'issue') {
                              updateStatus.mutate({ id: item.id, status: newStatus })
                            } else {
                              updateStatus.mutate({ id: item.id, status: newStatus, statusNote: issueNote[item.id] ?? '' })
                            }
                          }}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer hover:border-brand-300"
                          disabled={updateStatus.isPending}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s === 'at_venue' ? 'At Venue' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        {item.status === 'issue' && (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Describe the issue…"
                              value={issueNote[item.id] ?? (item as any).status_note ?? ''}
                              onChange={e => setIssueNote(n => ({ ...n, [item.id]: e.target.value }))}
                              onBlur={e => updateStatus.mutate({ id: item.id, status: 'issue', statusNote: e.target.value })}
                              className="text-xs border border-red-200 rounded px-2 py-1 flex-1 bg-red-50 text-red-800 placeholder:text-red-300"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <label className="btn btn-ghost btn-sm p-1.5 cursor-pointer text-brand-500 hover:bg-brand-50" title="Attach photo">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) uploadPhoto.mutate({ itemId: item.id, file, currentUrls: item.photo_urls ?? [] })
                              e.target.value = ''
                            }}
                          />
                        </label>
                        <ItemRowMenu
                          item={item}
                          onEdit={() => openEdit(item)}
                          onDelete={() => deleteItem.mutate(item.id)}
                          canDelete={isAdmin()}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} title="Save Checklist as Template" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{items.length} items will be saved. You can apply this template to future events.</p>
          <div>
            <label className="label">Template Name *</label>
            <input
              className="input"
              placeholder="e.g. BOSS Corporate Event"
              value={tplName}
              onChange={e => setTplName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Event Category *</label>
            <input
              className="input"
              placeholder="e.g. Corporate, Wedding, Conference"
              value={tplCategory}
              onChange={e => setTplCategory(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowSaveTemplate(false)} className="btn btn-secondary">Cancel</button>
            <button
              type="button"
              disabled={!tplName.trim() || !tplCategory.trim() || saveAsTemplate.isPending}
              className="btn btn-primary px-6"
              onClick={() => {
                saveAsTemplate.mutate(
                  {
                    name: tplName.trim(),
                    event_category: tplCategory.trim(),
                    items: items.map(i => ({
                      name: i.name,
                      unit: i.unit,
                      required_qty: i.required_qty,
                      item_type: i.item_type,
                      priority: i.priority,
                      is_critical: i.is_critical,
                      notes: i.notes ?? undefined,
                    })),
                  },
                  { onSuccess: () => setShowSaveTemplate(false) }
                )
              }}
            >
              {saveAsTemplate.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Template'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showAdd} onClose={closeForm} title={editItem ? 'Edit Checklist Item' : 'Add Checklist Item'} size="md">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div>
            <label className="label">Item Name *</label>
            <input {...register('name')} className={cn('input', errors.name && 'input-error')} placeholder="e.g. Projector, Chairs, Banners" />
            {errors.name && <p className="error-msg">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Unit *</label>
              <input {...register('unit')} className="input" placeholder="nos, unit, kg, etc." />
            </div>
            <div>
              <label className="label">Required Qty *</label>
              <input type="number" min="1" {...register('required_qty')} className={cn('input', errors.required_qty && 'input-error')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select {...register('item_type')} className="input">
                <option value="consumable">Consumable</option>
                <option value="reusable">Reusable</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Category *</label>
            <select {...register('category_id')} className={cn('input', errors.category_id && 'input-error')}>
              <option value="">— Select category —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="error-msg">{errors.category_id.message}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_critical" {...register('is_critical')} className="w-4 h-4 accent-brand-600" />
            <label htmlFor="is_critical" className="text-sm font-semibold text-slate-700">Mark as Critical</label>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Any special instructions…" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={closeForm} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary px-6">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {editItem ? 'Saving…' : 'Adding…'}</>
                : editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Photo lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Photo" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )
}
