import { supabase } from '../lib/supabase'

export interface Attendee {
  id: string
  event_id: string
  organization_id: string
  full_name: string
  email?: string
  phone?: string
  ticket_type: string
  ticket_code?: string
  checked_in: boolean
  checked_in_at?: string
  notes?: string
  created_at: string
}

export const attendeesService = {
  async listByEvent(eventId: string) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('event_attendees' as any)
      .select('*')
      .eq('event_id', eventId)
      .order('full_name', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Attendee[]
  },

  async create(payload: Partial<Attendee>) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('event_attendees' as any)
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as unknown as Attendee
  },

  async checkIn(id: string, checkedInBy: string) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('event_attendees' as any)
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as unknown as Attendee
  },

  async findByTicket(ticketCode: string) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('event_attendees' as any)
      .select('*')
      .eq('ticket_code', ticketCode)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as Attendee | null
  },
}
