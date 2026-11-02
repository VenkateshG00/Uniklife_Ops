import { supabase } from '../lib/supabase'

export interface Payment {
  id: string
  event_id: string
  organization_id: string
  payer_name: string
  amount: number
  payment_type: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'
  category?: string
  reference_no?: string
  description?: string
  collected_by?: string
  payment_date: string
  created_at: string
}

export const paymentsService = {
  async listByEvent(eventId: string) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('event_payments' as any)
      .select('*, profiles!collected_by(full_name)')
      .eq('event_id', eventId)
      .order('payment_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as (Payment & { profiles: { full_name: string } | null })[]
  },

  async create(payload: Partial<Payment>) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('event_payments' as any)
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as unknown as Payment
  },
}
