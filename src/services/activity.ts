import { supabase } from '../lib/supabase'
import type { EventActivityLog } from '../types'

export const activityService = {
  async listByEvent(eventId: string, limit = 50) {
    const { data, error } = await supabase
      .from('event_activity_log')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as EventActivityLog[]
  },

  async listRecentByOrg(orgId: string, limit = 30) {
    const { data, error } = await supabase
      .from('event_activity_log')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as EventActivityLog[]
  },

  async log(payload: Partial<EventActivityLog>) {
    const { data, error } = await supabase
      .from('event_activity_log')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as EventActivityLog
  },

  // Supabase Realtime subscription for live activity feed
  subscribeToEvent(
    eventId: string,
    onInsert: (row: EventActivityLog) => void
  ) {
    return supabase
      .channel(`activity:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_activity_log',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => onInsert(payload.new as EventActivityLog)
      )
      .subscribe()
  },
}
