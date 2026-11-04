import { useState } from 'react'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../../hooks/useVendors'
import type { Vendor } from '../../services/vendors'
import { Plus, Loader2, Store, Pencil, Trash2, Phone } from 'lucide-react'

const VENDOR_CATEGORIES = [
  'AV & Technical', 'Venue & Hall', 'Catering & Food', 'Decoration',
  'Printing & Stationery', 'Transport & Logistics', 'Gifts & Merchandise',
  'Security', 'Photography & Video', 'Other',
]

export function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()

  const [showAdd, setShowAdd] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', category: '', notes: '' })

  function openAdd() { setForm({ name: '', phone: '', category: '', notes: '' }); setEditVendor(null); setShowAdd(true) }
  function openEdit(v: Vendor) { setForm({ name: v.name, phone: v.phone, category: v.category ?? '', notes: v.notes ?? '' }); setEditVendor(v); setShowAdd(true) }

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return
    if (editVendor) {
      updateVendor.mutate({ id: editVendor.id, ...form, category: form.category || undefined, notes: form.notes || undefined }, {
        onSuccess: () => setShowAdd(false),
      })
    } else {
      createVendor.mutate({ ...form, category: form.category || undefined, notes: form.notes || undefined }, {
        onSuccess: () => setShowAdd(false),
      })
    }
  }

  return (
    <>
      <Header title="Vendors" subtitle="Supplier contacts for shortage fulfilment" />
      <main className="p-4 md:p-6 flex flex-col gap-4">
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading vendors…
          </div>
        )}

        {!isLoading && vendors.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No vendors yet</p>
            <p className="text-sm mt-1 mb-4">Add your suppliers — they'll appear as options when notifying after shortage approval</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add First Vendor
            </button>
          </div>
        )}

        {vendors.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(vendors as Vendor[]).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{v.name}</p>
                      {v.notes && <p className="text-xs text-slate-400 mt-0.5">{v.notes}</p>}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 hidden md:table-cell">
                      {v.category ? (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{v.category}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <a
                        href={`https://wa.me/91${v.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-emerald-600 hover:underline font-medium"
                      >
                        <Phone className="w-3.5 h-3.5" /> {v.phone}
                      </a>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(v)} className="btn btn-ghost btn-sm p-1.5">
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remove ${v.name}?`)) deleteVendor.mutate(v.id) }}
                          className="btn btn-ghost btn-sm p-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editVendor ? 'Edit Vendor' : 'Add Vendor'}>
        <div className="flex flex-col gap-4 p-4">
          <div>
            <label className="label">Vendor Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. ABC Supplies" autoFocus />
          </div>
          <div>
            <label className="label">Phone Number *</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="e.g. 9876543210" />
            <p className="text-xs text-slate-400 mt-1">Used for WhatsApp — enter 10-digit mobile number</p>
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
              <option value="">Select category…</option>
              {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="e.g. 24hr delivery available" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.phone.trim() || createVendor.isPending || updateVendor.isPending}
              className="btn btn-primary"
            >
              {editVendor ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
