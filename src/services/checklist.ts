import { supabase } from '../lib/supabase'
import type { EventChecklistItem, ItemStatus } from '../types'

export const checklistService = {
  async listByPlan(planId: string) {
    const { data, error } = await supabase
      .from('event_checklist_items')
      .select('*, profiles!responsible_staff_id(full_name), material_categories(name)')
      .eq('operation_plan_id', planId)
      .order('is_critical', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as (EventChecklistItem & { profiles: { full_name: string } | null })[]
  },

  async updateStatus(id: string, status: ItemStatus, updatedBy: string, statusNote?: string) {
    const { data, error } = await supabase
      .from('event_checklist_items')
      .update({ status, status_note: statusNote ?? null, last_updated_by: updatedBy, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventChecklistItem
  },

  async updateQuantity(id: string, field: string, qty: number, updatedBy: string) {
    const { data, error } = await supabase
      .from('event_checklist_items')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ [field]: qty, last_updated_by: updatedBy, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventChecklistItem
  },

  async create(payload: Partial<EventChecklistItem>) {
    const { data, error } = await supabase
      .from('event_checklist_items')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as EventChecklistItem
  },

  async updateItem(id: string, payload: Partial<EventChecklistItem>) {
    const { data, error } = await supabase
      .from('event_checklist_items')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ ...payload as any, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventChecklistItem
  },

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('event_checklist_items')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async uploadPhoto(itemId: string, file: File, currentUrls: string[]): Promise<string[]> {
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `checklist/${itemId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('checklist-photos')
      .upload(path, file, { upsert: false })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('checklist-photos')
      .getPublicUrl(path)

    const newUrls = [...currentUrls, publicUrl]
    const { error: updateError } = await supabase
      .from('event_checklist_items')
      .update({ photo_urls: newUrls, updated_at: new Date().toISOString() })
      .eq('id', itemId)
    if (updateError) throw updateError

    return newUrls
  },

  async removePhoto(itemId: string, photoUrl: string, currentUrls: string[]): Promise<string[]> {
    // Extract storage path from public URL: everything after /checklist-photos/
    const marker = '/checklist-photos/'
    const idx = photoUrl.indexOf(marker)
    if (idx !== -1) {
      const storagePath = photoUrl.slice(idx + marker.length)
      await supabase.storage.from('checklist-photos').remove([storagePath])
    }
    const newUrls = currentUrls.filter(u => u !== photoUrl)
    const { error } = await supabase
      .from('event_checklist_items')
      .update({ photo_urls: newUrls, updated_at: new Date().toISOString() })
      .eq('id', itemId)
    if (error) throw error
    return newUrls
  },

  async bulkCreate(items: Partial<EventChecklistItem>[]) {
    const { data, error } = await supabase
      .from('event_checklist_items')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(items as any)
      .select()
    if (error) throw error
    return data as EventChecklistItem[]
  },
}
