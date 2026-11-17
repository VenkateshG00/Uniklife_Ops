import { supabase } from '../lib/supabase'

export const approvalService = {
  async listApprovals(eventId: string) {
    const { data, error } = await supabase
      .from('budget_approvals')
      .select('*, requester:profiles!requested_by(full_name)')
      .eq('event_id', eventId)
      .order('requested_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async listPendingApprovals(eventId: string) {
    const { data, error } = await supabase
      .from('budget_approvals')
      .select('*, requester:profiles!requested_by(full_name)')
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async createApproval(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('budget_approvals')
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async approveItem(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('budget_approvals')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (data?.budget_item_id) {
      const { error: itemErr } = await supabase
        .from('event_budget_items')
        .update({ approval_status: 'approved' })
        .eq('id', data.budget_item_id)
      if (itemErr) throw itemErr
    }

    return data
  },

  async rejectItem(id: string, approvedBy: string, reason: string) {
    const { data, error } = await supabase
      .from('budget_approvals')
      .update({
        status: 'rejected',
        approved_by: approvedBy,
        rejection_reason: reason,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (data?.budget_item_id) {
      const { error: itemErr } = await supabase
        .from('event_budget_items')
        .update({ approval_status: 'rejected' })
        .eq('id', data.budget_item_id)
      if (itemErr) throw itemErr
    }

    return data
  },

  async cancelApproval(id: string) {
    const { data, error } = await supabase
      .from('budget_approvals')
      .update({
        status: 'cancelled',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (data?.budget_item_id) {
      const { error: itemErr } = await supabase
        .from('event_budget_items')
        .update({ approval_status: 'approved' })
        .eq('id', data.budget_item_id)
      if (itemErr) throw itemErr
    }
  },
}
