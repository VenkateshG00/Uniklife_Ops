// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '../lib/supabase'

export interface Vendor {
  id: string
  organization_id: string
  name: string
  phone: string
  category?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Cast to any because Supabase generated types predate the vendors migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const vendorsService = {
  async list(organizationId: string): Promise<Vendor[]> {
    const { data, error } = await db
      .from('vendors')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
    if (error) throw error
    return (data ?? []) as Vendor[]
  },

  async create(payload: { organization_id: string; name: string; phone: string; category?: string; notes?: string }): Promise<Vendor> {
    const { data, error } = await db
      .from('vendors')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as Vendor
  },

  async update(id: string, payload: Partial<Omit<Vendor, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await db.from('vendors').update(payload).eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('vendors').delete().eq('id', id)
    if (error) throw error
  },
}
