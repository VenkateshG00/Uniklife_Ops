import { supabase } from '../lib/supabase'

export interface TemplateItem {
  name: string
  unit: string
  required_qty: number
  item_type: 'consumable' | 'reusable'
  priority: 'low' | 'medium' | 'high' | 'critical'
  is_critical: boolean
  notes?: string
  [key: string]: unknown
}

export interface Template {
  id: string
  organization_id: string
  name: string
  event_category: string
  description?: string
  template_data: { items: TemplateItem[] }
  is_system: boolean
  created_by: string
  created_at: string
}

export const templatesService = {
  async list(orgId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('operation_templates')
      .select('*')
      .or(`organization_id.eq.${orgId},is_system.eq.true`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Template[]
  },

  async create(payload: {
    organization_id: string
    name: string
    event_category: string
    description?: string
    created_by: string
  }): Promise<Template> {
    const { data, error } = await supabase
      .from('operation_templates')
      .insert({ ...payload, template_data: { items: [] } as unknown as never })
      .select()
      .single()
    if (error) throw error
    return data as unknown as Template
  },

  async updateItems(id: string, items: TemplateItem[]): Promise<void> {
    const { error } = await supabase
      .from('operation_templates')
      .update({ template_data: { items } as unknown as never, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('operation_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateMeta(id: string, payload: { name: string; event_category: string; description?: string }): Promise<void> {
    const { error } = await supabase
      .from('operation_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async createFromChecklist(payload: {
    organization_id: string
    created_by: string
    name: string
    event_category: string
    description?: string
    items: TemplateItem[]
  }): Promise<Template> {
    const { items, ...meta } = payload
    const { data, error } = await supabase
      .from('operation_templates')
      .insert({ ...meta, template_data: { items } as unknown as never })
      .select()
      .single()
    if (error) throw error
    return data as unknown as Template
  },

  async applyToPlan(templateId: string, planId: string): Promise<number> {
    // Fetch template
    const { data: tpl, error: tErr } = await supabase
      .from('operation_templates')
      .select('template_data')
      .eq('id', templateId)
      .single()
    if (tErr || !tpl) throw new Error('Template not found')

    const items: TemplateItem[] = (tpl.template_data as unknown as { items: TemplateItem[] }).items ?? []
    if (!items.length) throw new Error('Template has no items')

    // Fetch plan for event_id + organization_id
    const { data: plan, error: pErr } = await supabase
      .from('event_operation_plans')
      .select('event_id, organization_id')
      .eq('id', planId)
      .single()
    if (pErr || !plan) throw new Error('Operation plan not found')

    // Get any system category id to satisfy FK
    const { data: cat } = await supabase
      .from('material_categories')
      .select('id')
      .eq('is_system', true)
      .order('sort_order')
      .limit(1)
      .single()
    const categoryId = cat?.id
    if (!categoryId) throw new Error('No default category found')

    const rows = items.map(item => ({
      operation_plan_id: planId,
      event_id: plan.event_id,
      organization_id: plan.organization_id,
      category_id: categoryId,
      name: item.name,
      unit: item.unit,
      required_qty: item.required_qty,
      item_type: item.item_type,
      priority: item.priority,
      is_critical: item.is_critical,
      notes: item.notes ?? null,
    }))

    const { error: iErr } = await supabase.from('event_checklist_items').insert(rows as never)
    if (iErr) throw iErr
    return rows.length
  },
}
