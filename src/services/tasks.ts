import { supabase } from '../lib/supabase'
import type { EventTask, TaskStatus } from '../types'

export const tasksService = {
  async listByPlan(planId: string) {
    const { data, error } = await supabase
      .from('event_tasks')
      .select('*, profiles!assigned_to_id(full_name, avatar_url, job_title)')
      .eq('operation_plan_id', planId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as (EventTask & { profiles: { full_name: string; avatar_url: string | null } | null })[]
  },

  async listByOrg(orgId: string) {
    const { data, error } = await supabase
      .from('event_tasks')
      .select('*, profiles!assigned_to_id(full_name, job_title), events(title, start_datetime)')
      .eq('organization_id', orgId)
      .order('deadline', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data
  },

  async create(payload: Partial<EventTask>) {
    const { data, error } = await supabase
      .from('event_tasks')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select()
      .single()
    if (error) throw error
    return data as EventTask
  },

  async updateStatus(id: string, status: TaskStatus) {
    const patch: { status: TaskStatus; updated_at: string; completed_at?: string } = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'completed') patch.completed_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('event_tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventTask
  },

  async update(id: string, payload: Partial<EventTask>) {
    const { data, error } = await supabase
      .from('event_tasks')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as EventTask
  },

  async delete(id: string) {
    const { error } = await supabase.from('event_tasks').delete().eq('id', id)
    if (error) throw error
  },
}
