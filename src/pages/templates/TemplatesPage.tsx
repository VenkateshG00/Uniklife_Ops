import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import {
  Plus, BookOpen, ChevronDown, ChevronUp, Trash2,
  Loader2, X, Zap, CheckSquare, Copy,
} from 'lucide-react'
import {
  useTemplates, useCreateTemplate, useUpdateTemplateItems,
  useDeleteTemplate, useApplyTemplate,
} from '../../hooks/useTemplates'
import { useOperationPlans } from '../../hooks/useEvents'
import { cn } from '../../lib/utils'
import type { TemplateItem } from '../../services/templates'

const EVENT_CATEGORIES = [
  'Wedding', 'Corporate', 'Conference', 'Concert', 'Exhibition',
  'Birthday', 'Social', 'Sports', 'Religious', 'Other',
]

const createSchema = z.object({
  name: z.string().min(2, 'Name required'),
  event_category: z.string().min(1, 'Category required'),
  description: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const itemSchema = z.object({
  name: z.string().min(1, 'Required'),
  unit: z.string().min(1, 'Required'),
  required_qty: z.string().min(1),
  item_type: z.enum(['consumable', 'reusable']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  is_critical: z.boolean(),
  notes: z.string().optional(),
})
type ItemForm = z.infer<typeof itemSchema>

const priorityColors: Record<string, string> = {
  low: 'badge-pending', medium: 'badge-dispatched',
  high: 'badge-inprogress', critical: 'badge-critical',
}

export function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates()
  const { data: plans = [] } = useOperationPlans()
  const createTemplate = useCreateTemplate()
  const updateItems = useUpdateTemplateItems()
  const deleteTemplate = useDeleteTemplate()
  const applyTemplate = useApplyTemplate()

  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { event_category: 'Corporate' },
  })
  const itemForm = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { unit: 'nos', item_type: 'reusable', priority: 'medium', is_critical: false, required_qty: '1' },
  })

  async function onCreateTemplate(values: CreateForm) {
    try {
      await createTemplate.mutateAsync(values)
      toast.success('Template created')
      createForm.reset({ event_category: 'Corporate' })
      setShowCreate(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function onAddItem(templateId: string, currentItems: TemplateItem[], values: ItemForm) {
    const newItem: TemplateItem = {
      ...values,
      required_qty: parseInt(values.required_qty),
      notes: values.notes || undefined,
    }
    try {
      await updateItems.mutateAsync({ id: templateId, items: [...currentItems, newItem] })
      itemForm.reset({ unit: 'nos', item_type: 'reusable', priority: 'medium', is_critical: false, required_qty: '1' })
      toast.success('Item added')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function onRemoveItem(templateId: string, currentItems: TemplateItem[], index: number) {
    const updated = currentItems.filter((_, i) => i !== index)
    try {
      await updateItems.mutateAsync({ id: templateId, items: updated })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return
    try {
      await deleteTemplate.mutateAsync(id)
      toast.success('Template deleted')
      if (expandedId === id) setExpandedId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function onApply() {
    if (!applyingId || !selectedPlan) return
    try {
      const count = await applyTemplate.mutateAsync({ templateId: applyingId, planId: selectedPlan })
      toast.success(`${count} items added to the operation plan`)
      setApplyingId(null)
      setSelectedPlan('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <>
      <Header title="Templates" subtitle="Reusable operation checklists for any event type" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">

        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading templates…
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No templates yet</p>
            <p className="text-sm mt-1 mb-4">Create reusable checklists to speed up event planning</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {templates.map(tpl => {
            const items: TemplateItem[] = tpl.template_data?.items ?? []
            const isExpanded = expandedId === tpl.id

            return (
              <div key={tpl.id} className="card overflow-hidden">
                {/* Card header */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{tpl.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-pending">{tpl.event_category}</span>
                        <span className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                        {tpl.is_system && <span className="badge badge-dispatched">System</span>}
                      </div>
                      {tpl.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{tpl.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setApplyingId(tpl.id); setSelectedPlan('') }}
                      className="btn btn-secondary btn-sm"
                      title="Apply to operation plan"
                    >
                      <Zap className="w-3.5 h-3.5" /> Apply
                    </button>
                    {!tpl.is_system && (
                      <button onClick={() => onDelete(tpl.id, tpl.name)} className="btn btn-ghost btn-sm text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                      className="btn btn-ghost btn-sm"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 flex flex-col gap-4">

                    {/* Items list */}
                    {items.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No items yet — add below</p>
                    )}
                    {items.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckSquare className={cn('w-4 h-4 shrink-0', item.is_critical ? 'text-red-500' : 'text-slate-400')} />
                              <span className="font-medium text-slate-800 truncate">{item.name}</span>
                              <span className="text-xs text-slate-400 shrink-0">{item.required_qty} {item.unit}</span>
                              <span className={`badge ${priorityColors[item.priority]} shrink-0`}>{item.priority}</span>
                            </div>
                            {!tpl.is_system && (
                              <button
                                onClick={() => onRemoveItem(tpl.id, items, idx)}
                                className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add item form */}
                    {!tpl.is_system && (
                      <form
                        onSubmit={itemForm.handleSubmit(v => onAddItem(tpl.id, items, v))}
                        className="bg-white rounded-xl p-4 shadow-sm"
                      >
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Item</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 md:col-span-1">
                            <label className="label">Item Name</label>
                            <input {...itemForm.register('name')} className="input" placeholder="e.g. Projector" />
                            {itemForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{itemForm.formState.errors.name.message}</p>}
                          </div>
                          <div>
                            <label className="label">Unit</label>
                            <input {...itemForm.register('unit')} className="input" placeholder="nos, kg…" />
                          </div>
                          <div>
                            <label className="label">Qty</label>
                            <input type="number" min="1" {...itemForm.register('required_qty')} className="input" />
                          </div>
                          <div>
                            <label className="label">Type</label>
                            <select {...itemForm.register('item_type')} className="input">
                              <option value="reusable">Reusable</option>
                              <option value="consumable">Consumable</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">Priority</label>
                            <select {...itemForm.register('priority')} className="input">
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <input type="checkbox" id={`crit-${tpl.id}`} {...itemForm.register('is_critical')} className="rounded" />
                            <label htmlFor={`crit-${tpl.id}`} className="text-sm text-slate-600">Mark as critical</label>
                          </div>
                          <div className="col-span-2">
                            <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                            <input {...itemForm.register('notes')} className="input" placeholder="Any extra info…" />
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <button type="submit" disabled={updateItems.isPending} className="btn btn-primary">
                            {updateItems.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Item
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Create template modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900">New Template</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createForm.handleSubmit(onCreateTemplate)} className="space-y-4">
              <div>
                <label className="label">Template Name</label>
                <input {...createForm.register('name')} className="input" placeholder="e.g. Wedding Setup Checklist" />
                {createForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Event Category</label>
                <select {...createForm.register('event_category')} className="input">
                  {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <input {...createForm.register('description')} className="input" placeholder="What this template is for…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createTemplate.isPending} className="btn btn-primary flex-1">
                  {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply to plan modal */}
      {applyingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900">Apply Template</h2>
              </div>
              <button onClick={() => setApplyingId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select an operation plan to add this template's items to its checklist.
            </p>
            {plans.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No operation plans found. Create one first.</p>
            ) : (
              <>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                  className="input mb-4"
                >
                  <option value="">— Select a plan —</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {(p.events as { title?: string } | null)?.title ?? p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setApplyingId(null)} className="btn btn-secondary flex-1">Cancel</button>
                  <button
                    onClick={onApply}
                    disabled={!selectedPlan || applyTemplate.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {applyTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
