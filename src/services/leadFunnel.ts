import { supabase } from '../lib/supabase'
import type { EventAdCampaign } from '../types'

export const leadFunnelService = {
  async listCampaigns(eventId: string) {
    const { data, error } = await supabase
      .from('event_ad_campaigns')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as EventAdCampaign[]
  },

  async createCampaign(payload: Partial<EventAdCampaign>) {
    const { data, error } = await supabase
      .from('event_ad_campaigns')
      .insert(payload as never)
      .select()
      .single()
    if (error) throw error
    return data as EventAdCampaign
  },

  async updateCampaign(id: string, payload: Partial<EventAdCampaign>) {
    const { data, error } = await supabase
      .from('event_ad_campaigns')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventAdCampaign
  },

  async removeCampaign(id: string) {
    const { error } = await supabase
      .from('event_ad_campaigns')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
