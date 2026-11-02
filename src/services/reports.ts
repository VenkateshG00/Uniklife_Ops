import { supabase } from '../lib/supabase'

export interface EventReadinessReport {
  plan_id: string
  event_id: string
  event_title: string
  event_date: string
  venue_name: string
  total_items: number
  done_items: number
  issue_items: number
  critical_total: number
  critical_done: number
  readiness_pct: number
  phase: string
  pending_shortages: number
}

export interface ShortageSummaryRow {
  id: string
  item_name: string
  event_title: string
  additional_qty_requested: number
  approved_qty: number | null
  status: string
  priority: string
  requester_name: string
  review_notes: string | null
  created_at: string
}

export interface IssueSummaryRow {
  item_name: string
  category_name: string
  status_note: string | null
  event_title: string
  event_date: string
  priority: string
  is_critical: boolean
}

export interface CategoryBreakdown {
  category_name: string
  total: number
  done: number
  issue: number
  pct: number
}

export const reportsService = {
  async getEventReadiness(): Promise<EventReadinessReport[]> {
    const { data, error } = await supabase
      .from('event_operation_plans')
      .select(`
        id,
        event_id,
        phase,
        events ( title, start_datetime, venue_name ),
        event_checklist_items ( status, is_critical ),
        shortage_requests ( status )
      `)
      .order('created_at', { ascending: false })
    if (error) throw error

    return (data ?? []).map((p: any) => {
      const items: any[] = p.event_checklist_items ?? []
      const done = items.filter(i => i.status === 'done').length
      const issue = items.filter(i => i.status === 'issue').length
      const critTotal = items.filter(i => i.is_critical).length
      const critDone = items.filter(i => i.is_critical && i.status === 'done').length
      const pct = items.length === 0 ? 0 : Math.round(
        0.6 * (done / items.length) * 100 +
        0.4 * (critTotal ? (critDone / critTotal) * 100 : 100)
      )
      const pendingShortages = (p.shortage_requests ?? []).filter((s: any) => s.status === 'pending').length
      return {
        plan_id: p.id,
        event_id: p.event_id,
        event_title: p.events?.title ?? '—',
        event_date: p.events?.start_datetime ?? '',
        venue_name: p.events?.venue_name ?? '—',
        total_items: items.length,
        done_items: done,
        issue_items: issue,
        critical_total: critTotal,
        critical_done: critDone,
        readiness_pct: pct,
        phase: p.phase,
        pending_shortages: pendingShortages,
      }
    })
  },

  async getIssueItems(): Promise<IssueSummaryRow[]> {
    const { data, error } = await supabase
      .from('event_checklist_items')
      .select(`
        name,
        status_note,
        priority,
        is_critical,
        material_categories ( name ),
        event_operation_plans (
          events ( title, start_datetime )
        )
      `)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('status', 'issue' as any)
      .order('is_critical', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error

    return (data ?? []).map((i: any) => ({
      item_name: i.name,
      category_name: i.material_categories?.name ?? '—',
      status_note: i.status_note,
      event_title: i.event_operation_plans?.events?.title ?? '—',
      event_date: i.event_operation_plans?.events?.start_datetime ?? '',
      priority: i.priority,
      is_critical: i.is_critical,
    }))
  },

  async getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
    const { data, error } = await supabase
      .from('event_checklist_items')
      .select(`
        status,
        material_categories ( name )
      `)
    if (error) throw error

    const map: Record<string, { total: number; done: number; issue: number }> = {}
    for (const i of (data ?? []) as any[]) {
      const cat = i.material_categories?.name ?? 'Uncategorised'
      if (!map[cat]) map[cat] = { total: 0, done: 0, issue: 0 }
      map[cat].total++
      if (i.status === 'done') map[cat].done++
      if (i.status === 'issue') map[cat].issue++
    }

    return Object.entries(map)
      .map(([category_name, v]) => ({
        category_name,
        ...v,
        pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
  },

  async getShortageSummary(): Promise<ShortageSummaryRow[]> {
    const { data, error } = await supabase
      .from('shortage_requests')
      .select(`
        id,
        status,
        additional_qty_requested,
        approved_qty,
        priority,
        review_notes,
        created_at,
        event_checklist_items ( name ),
        event_operation_plans ( events ( title ) ),
        profiles!requested_by ( full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error

    return (data ?? []).map((s: any) => ({
      id: s.id,
      item_name: s.event_checklist_items?.name ?? '—',
      event_title: s.event_operation_plans?.events?.title ?? '—',
      additional_qty_requested: s.additional_qty_requested,
      approved_qty: s.approved_qty,
      status: s.status,
      priority: s.priority,
      requester_name: s.profiles?.full_name ?? 'Unknown',
      review_notes: s.review_notes,
      created_at: s.created_at,
    }))
  },
}
