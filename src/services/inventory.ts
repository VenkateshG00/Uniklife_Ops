import { supabase } from '../lib/supabase'

export interface InventoryItem {
  id: string
  organization_id: string
  category_id: string
  name: string
  sku?: string
  description?: string
  unit: string
  item_type: 'consumable' | 'reusable'
  storage_location?: string
  current_stock: number
  reserved_stock: number
  minimum_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export const inventoryService = {
  async list(orgId: string) {
    const { data, error } = await supabase
      .from('inventory_catalog')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    if (error) throw error
    return data as InventoryItem[]
  },

  async create(payload: Partial<InventoryItem>) {
    const { data, error } = await supabase
      .from('inventory_catalog')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as InventoryItem
  },

  async updateStock(id: string, currentStock: number) {
    const { data, error } = await supabase
      .from('inventory_catalog')
      .update({ current_stock: currentStock, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as InventoryItem
  },
}
