import { supabase } from '../lib/supabase'
import type { ShortageRequest, ShortageStatus } from '../types'

export const shortageService = {
  async listByPlan(planId: string) {
    const { data, error } = await supabase
      .from('shortage_requests')
      .select(`
        *,
        profiles!requested_by(full_name),
        event_checklist_items(name, required_qty, packed_qty, status)
      `)
      .eq('operation_plan_id', planId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(payload: Partial<ShortageRequest>) {
    const { data, error } = await supabase
      .from('shortage_requests')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as ShortageRequest
  },

  async updateStatus(
    id: string,
    status: ShortageStatus,
    extras: Partial<ShortageRequest> = {}
  ) {
    const { data, error } = await supabase
      .from('shortage_requests')
      .update({ status, ...extras, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ShortageRequest
  },

  async listByOrg(orgId: string) {
    const { data, error } = await supabase
      .from('shortage_requests')
      .select(`
        *,
        profiles!requested_by(full_name),
        event_checklist_items(name, required_qty, packed_qty, status),
        event_operation_plans(events(title))
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async addAction(payload: {
    shortage_request_id: string
    action_by: string
    action_type: string
    notes?: string
    qty_change?: number
  }) {
    const { data, error } = await supabase
      .from('shortage_request_actions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
