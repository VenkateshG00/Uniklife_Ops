import { supabase } from '../lib/supabase'

export const upsellService = {
  async listDownstreamUpsells(sourceEventId: string) {
    const { data, error } = await supabase
      .from('event_upsells')
      .select('*, target_event:events!event_upsells_target_event_id_fkey(id, title, category, start_datetime)')
      .eq('source_event_id', sourceEventId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async listUpstreamSources(targetEventId: string) {
    const { data, error } = await supabase
      .from('event_upsells')
      .select('*, source_event:events!event_upsells_source_event_id_fkey(id, title, category, start_datetime)')
      .eq('target_event_id', targetEventId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async createUpsell(payload: Record<string, any>) {
    const { data, error } = await supabase
      .from('event_upsells')
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateUpsell(id: string, payload: Record<string, any>) {
    const { data, error } = await supabase
      .from('event_upsells')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeUpsell(id: string) {
    const { error } = await supabase
      .from('event_upsells')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getUpsellStats(sourceEventId: string) {
    const { data, error } = await supabase
      .from('event_upsells')
      .select('target_amount, days_between')
      .eq('source_event_id', sourceEventId)
    if (error) throw error
    const rows = data ?? []
    return {
      totalDownstreamRevenue: rows.reduce((s, r) => s + Number(r.target_amount), 0),
      upsellCount: rows.length,
      avgDaysBetween: rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + (Number(r.days_between) || 0), 0) / rows.length)
        : 0,
    }
  },
}
