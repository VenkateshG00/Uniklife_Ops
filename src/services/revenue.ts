import { supabase } from '../lib/supabase'
import type { EventRevenueTier, EventRevenueAdjustment } from '../types'

export const revenueService = {
  async listTiers(eventId: string) {
    const { data, error } = await supabase
      .from('event_revenue_tiers')
      .select('*')
      .eq('event_id', eventId)
      .order('price', { ascending: true })
    if (error) throw error
    return data as EventRevenueTier[]
  },

  async createTier(payload: Partial<EventRevenueTier>) {
    const { data, error } = await supabase
      .from('event_revenue_tiers')
      .insert(payload as never)
      .select()
      .single()
    if (error) throw error
    return data as EventRevenueTier
  },

  async updateTier(id: string, payload: Partial<EventRevenueTier>) {
    const { data, error } = await supabase
      .from('event_revenue_tiers')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventRevenueTier
  },

  async removeTier(id: string) {
    const { error } = await supabase
      .from('event_revenue_tiers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async listAdjustments(eventId: string) {
    const { data, error } = await supabase
      .from('event_revenue_adjustments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as EventRevenueAdjustment[]
  },

  async createAdjustment(payload: Partial<EventRevenueAdjustment>) {
    const { data, error } = await supabase
      .from('event_revenue_adjustments')
      .insert(payload as never)
      .select()
      .single()
    if (error) throw error
    return data as EventRevenueAdjustment
  },

  async updateAdjustment(id: string, payload: Partial<EventRevenueAdjustment>) {
    const { data, error } = await supabase
      .from('event_revenue_adjustments')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventRevenueAdjustment
  },

  async removeAdjustment(id: string) {
    const { error } = await supabase
      .from('event_revenue_adjustments')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
