import { supabase } from '../lib/supabase'
import type { EventTour, TourSharedCost } from '../types'

export const tourService = {
  async listTours() {
    const { data, error } = await supabase
      .from('event_tours')
      .select('*')
      .order('year', { ascending: false })
      .order('name', { ascending: true })
    if (error) throw error
    return data as EventTour[]
  },

  async getTour(id: string) {
    const { data, error } = await supabase
      .from('event_tours')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as EventTour
  },

  async createTour(payload: Partial<EventTour>) {
    const { data, error } = await supabase
      .from('event_tours')
      .insert(payload as never)
      .select()
      .single()
    if (error) throw error
    return data as EventTour
  },

  async updateTour(id: string, payload: Partial<EventTour>) {
    const { data, error } = await supabase
      .from('event_tours')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventTour
  },

  async removeTour(id: string) {
    const { error } = await supabase
      .from('event_tours')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async listSharedCosts(tourId: string) {
    const { data, error } = await supabase
      .from('tour_shared_costs')
      .select('*')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as TourSharedCost[]
  },

  async createSharedCost(payload: Partial<TourSharedCost>) {
    const { data, error } = await supabase
      .from('tour_shared_costs')
      .insert(payload as never)
      .select()
      .single()
    if (error) throw error
    return data as TourSharedCost
  },

  async updateSharedCost(id: string, payload: Partial<TourSharedCost>) {
    const { data, error } = await supabase
      .from('tour_shared_costs')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as TourSharedCost
  },

  async removeSharedCost(id: string) {
    const { error } = await supabase
      .from('tour_shared_costs')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async assignEventToTour(eventId: string, tourId: string) {
    const { error } = await supabase
      .from('events')
      .update({ tour_id: tourId } as never)
      .eq('id', eventId)
    if (error) throw error
  },

  async removeEventFromTour(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({ tour_id: null } as never)
      .eq('id', eventId)
    if (error) throw error
  },

  async listTourEvents(tourId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('tour_id', tourId)
      .order('start_datetime', { ascending: true })
    if (error) throw error
    return data
  },
}
