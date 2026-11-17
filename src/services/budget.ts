import { supabase } from '../lib/supabase'
import type { EventBudgetItem } from '../types'

export const budgetService = {
  async listByEvent(eventId: string) {
    const { data, error } = await supabase
      .from('event_budget_items')
      .select('*')
      .eq('event_id', eventId)
      .order('category')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as EventBudgetItem[]
  },

  async create(payload: Partial<EventBudgetItem>) {
    const { data, error } = await supabase
      .from('event_budget_items')
      .insert(payload as never)
      .select()
      .single()
    if (error) throw error
    return data as EventBudgetItem
  },

  async update(id: string, payload: Partial<EventBudgetItem>) {
    const { data, error } = await supabase
      .from('event_budget_items')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventBudgetItem
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('event_budget_items')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async summaryByEvent(eventId: string) {
    const { data, error } = await supabase
      .from('event_budget_items')
      .select('category, planned_amount, actual_amount')
      .eq('event_id', eventId)
    if (error) throw error
    return data as Pick<EventBudgetItem, 'category' | 'planned_amount' | 'actual_amount'>[]
  },
}
