import { supabase } from '../lib/supabase'
import type { Event, EventOperationPlan } from '../types'

export const eventsService = {
  async list(organizationId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles!event_manager_id(full_name)')
      .eq('organization_id', organizationId)
      .order('start_datetime', { ascending: true })
    if (error) throw error
    return data as (Event & { profiles?: { full_name: string } | null })[]
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Event
  },

  async create(payload: Partial<Event>) {
    const { data, error } = await supabase
      .from('events')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as Event
  },

  async upcoming(organizationId: string, days = 14) {
    const cutoff = new Date(Date.now() + days * 86400000).toISOString()
    const { data, error } = await supabase
      .from('events')
      .select('*, event_operation_plans(*)')
      .eq('organization_id', organizationId)
      .gte('start_datetime', new Date().toISOString())
      .lte('start_datetime', cutoff)
      .order('start_datetime', { ascending: true })
    if (error) throw error
    return data
  },
}

export const operationPlansService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('event_operation_plans')
      .select('*, events(*)')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByEvent(eventId: string) {
    const { data, error } = await supabase
      .from('event_operation_plans')
      .select('*')
      .eq('event_id', eventId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as EventOperationPlan | null
  },

  async create(payload: Partial<EventOperationPlan>) {
    const { data, error } = await supabase
      .from('event_operation_plans')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as EventOperationPlan
  },

  async update(id: string, payload: Partial<EventOperationPlan>) {
    const { data, error } = await supabase
      .from('event_operation_plans')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventOperationPlan
  },

  async listWithReadiness(organizationId: string) {
    const { data, error } = await supabase
      .from('event_operation_plans')
      .select(`
        *,
        events ( id, title, venue_name, start_datetime, expected_attendees, status ),
        event_checklist_items ( id, status, is_critical ),
        shortage_requests ( id, status )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}
