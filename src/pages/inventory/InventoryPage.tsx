import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useInventory, useAddInventoryItem, useUpdateStock } from '../../hooks/useInventory'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/utils'
import { Plus, ArrowUpDown, Package, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const addSchema = z.object({
  name:             z.string().min(1, 'Name required'),
  sku:              z.string().optional(),
  unit:             z.string().min(1, 'Unit required'),
  item_type:        z.enum(['consumable','reusable']),
  storage_location: z.string().optional(),
  current_stock:    z.string().min(1),
  minimum_stock:    z.string().min(1),
})
type AddForm = z.infer<typeof addSchema>

type TypeFilter = 'all' | 'consumable' | 'reusable'

function generateSKU(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  let prefix: string
  if (words.length === 1) {
    prefix = words[0].slice(0, 4).toUpperCase()           // Projector → PROJ
  } else if (words.length === 2) {
    prefix = (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase() // Folding Chair → FOCH
  } else {
    prefix = words.slice(0, 4).map(w => w[0]).join('').toUpperCase()     // LED Stage Light → LSL
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefix}-${suffix}`
}

export function InventoryPage() {
  const { data: items = [], isLoading } = useInventory()
  const addItem = useAddInventoryItem()
  const updateStock = useUpdateStock()
  const orgId = useAuthStore(s => s.profile?.organization_id)

  const [showAdd, setShowAdd] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [editingStock, setEditingStock] = useState<{ id: string; val: string } | null>(null)

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.item_type === typeFilter)
  const lowStockCount = items.filter(i => i.current_stock <= i.minimum_stock).length

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { unit: 'unit', item_type: 'reusable', current_stock: '0', minimum_stock: '0' },
  })

  const skuTouched = useRef(false)
  const watchedName = watch('name')

  useEffect(() => {
    if (skuTouched.current) return
    if (watchedName && watchedName.trim().length >= 2) {
      setValue('sku', generateSKU(watchedName))
    }
  }, [watchedName, setValue])

  function closeAddModal() {
    setShowAdd(false)
    reset()
    skuTouched.current = false
  }

  const onAdd = (values: AddForm) => {
    addItem.mutate({
      name: values.name,
      sku: values.sku || undefined,
      unit: values.unit,
      item_type: values.item_type,
      storage_location: values.storage_location || undefined,
      current_stock: Number(values.current_stock),
      minimum_stock: Number(values.minimum_stock),
      reserved_stock: 0,
      organization_id: orgId!,
      category_id: orgId!,
      is_active: true,
    }, {
      onSuccess: () => closeAddModal()
    })
  }

  const saveStock = (id: string) => {
    if (!editingStock) return
    const val = parseInt(editingStock.val)
    if (isNaN(val) || val < 0) { toast.error('Invalid quantity'); return }
    updateStock.mutate({ id, stock: val }, {
      onSuccess: () => setEditingStock(null)
    })
  }

  return (
    <>
      <Header title="Inventory & Materials" subtitle="Track consumable and reusable item stock" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 items-center">
            {(['all','consumable','reusable'] as TypeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  'btn btn-sm',
                  typeFilter === f ? 'btn-primary' : 'btn-secondary'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold ml-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} low stock
              </span>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading inventory…
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No inventory items yet</p>
            <p className="text-sm mt-1 mb-4">Add items to start tracking stock</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add First Item
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">In Stock</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Reserved</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Available</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Location</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => {
                  const available = item.current_stock - item.reserved_stock
                  const isLow = item.current_stock <= item.minimum_stock
                  const isEditing = editingStock?.id === item.id
                  return (
                    <tr key={item.id} className={cn('hover:bg-slate-50 transition-colors', isLow && 'bg-amber-50/30')}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.sku ?? '—'} · {item.unit}</p>
                        {isLow && (
                          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Low stock
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`badge ${item.item_type === 'reusable' ? 'badge-inprogress' : 'badge-pending'}`}>
                          {item.item_type}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              value={editingStock.val}
                              onChange={e => setEditingStock({ id: item.id, val: e.target.value })}
                              className="w-20 text-right border border-brand-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveStock(item.id)
                                if (e.key === 'Escape') setEditingStock(null)
                              }}
                            />
                            <button onClick={() => saveStock(item.id)} className="text-emerald-600 text-xs font-bold">✓</button>
                            <button onClick={() => setEditingStock(null)} className="text-slate-400 text-xs">✕</button>
                          </div>
                        ) : (
                          <span className={cn('text-slate-700', isLow && 'text-amber-600 font-bold')}>
                            {item.current_stock}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-amber-600 hidden md:table-cell">{item.reserved_stock}</td>
                      <td className="px-3 py-3.5 text-right font-mono font-bold text-emerald-600">{available}</td>
                      <td className="px-3 py-3.5 text-slate-500 text-xs hidden lg:table-cell">{item.storage_location ?? '—'}</td>
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => setEditingStock({ id: item.id, val: String(item.current_stock) })}
                          className="btn btn-ghost btn-sm"
                          disabled={isEditing}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" /> Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal open={showAdd} onClose={closeAddModal} title="Add Inventory Item" size="md">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name *</label>
              <input {...register('name')} className={cn('input', errors.name && 'input-error')} placeholder="e.g. Projector" />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">SKU / Code</label>
              <div className="relative">
                <input
                  {...register('sku')}
                  className="input pr-8"
                  placeholder="Auto-generated"
                  onChange={e => {
                    skuTouched.current = true
                    register('sku').onChange(e)
                  }}
                />
                <button
                  type="button"
                  title="Regenerate SKU"
                  onClick={() => {
                    skuTouched.current = false
                    setValue('sku', generateSKU(watchedName ?? ''))
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <label className="label">Unit *</label>
              <input {...register('unit')} className="input" placeholder="unit, nos, kg…" />
            </div>
            <div>
              <label className="label">Type</label>
              <select {...register('item_type')} className="input">
                <option value="reusable">Reusable</option>
                <option value="consumable">Consumable</option>
              </select>
            </div>
            <div>
              <label className="label">Storage Location</label>
              <input {...register('storage_location')} className="input" placeholder="Store A, Shelf B-2…" />
            </div>
            <div>
              <label className="label">Current Stock</label>
              <input type="number" min="0" {...register('current_stock')} className="input" />
            </div>
            <div>
              <label className="label">Min Stock (alert below)</label>
              <input type="number" min="0" {...register('minimum_stock')} className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={closeAddModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={addItem.isPending} className="btn btn-primary px-6">
              {addItem.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
