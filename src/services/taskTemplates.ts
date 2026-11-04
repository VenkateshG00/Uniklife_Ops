import { supabase } from '../lib/supabase'
import type { TaskTemplate, TaskTemplateItem } from '../types'

export const taskTemplateService = {
  async list(organizationId: string): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*, task_template_items(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as TaskTemplate[]
  },

  async create(payload: {
    organization_id: string
    created_by: string
    name: string
    program?: string
    description?: string
  }): Promise<TaskTemplate> {
    const { data, error } = await supabase
      .from('task_templates')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as TaskTemplate
  },

  async update(id: string, payload: { name?: string; program?: string; description?: string }): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .update(payload)
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async addItem(item: Omit<TaskTemplateItem, 'id' | 'created_at'>): Promise<TaskTemplateItem> {
    const { data, error } = await supabase
      .from('task_template_items')
      .insert(item)
      .select()
      .single()
    if (error) throw error
    return data as TaskTemplateItem
  },

  async updateItem(id: string, payload: Partial<Omit<TaskTemplateItem, 'id' | 'template_id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('task_template_items')
      .update(payload)
      .eq('id', id)
    if (error) throw error
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_template_items')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
