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
