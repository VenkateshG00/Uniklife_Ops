import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export interface NotificationItem {
  id: string
  type: 'issue' | 'shortage' | 'overdue_task' | 'assigned_task' | 'task_updated' | 'shortage_approved' | 'shortage_rejected'
  title: string
  subtitle: string
  planId?: string
  eventTitle?: string
}

export function useNotifications() {
  const orgId  = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)

  return useQuery({
    queryKey: ['notifications', orgId, userId],
    queryFn: async (): Promise<NotificationItem[]> => {
      if (!orgId) return []

      // Tasks assigned to me in the last 48 hours (new assignments)
      const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const [issuesRes, shortagesRes, overdueRes, assignedRes, updatedRes, myShortagesRes] = await Promise.all([
        supabase
          .from('event_checklist_items')
          .select('id, name, operation_plan_id, event_operation_plans(events(title))')
          .eq('organization_id', orgId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('status', 'issue' as any)
          .limit(20),

        supabase
          .from('shortage_requests')
          .select('id, event_operation_plans(id, events(title))')
          .eq('organization_id', orgId)
          .eq('status', 'pending')
          .limit(20),

        supabase
          .from('event_tasks')
          .select('id, title, operation_plan_id, event_operation_plans(events(title))')
          .eq('organization_id', orgId)
          .in('status', ['pending', 'in_progress'])
          .not('deadline', 'is', null)
          .lt('deadline', new Date().toISOString())
          .limit(20),

        // New tasks assigned to the current user in the last 48 hours
        userId
          ? supabase
              .from('event_tasks')
              .select('id, title, operation_plan_id, event_operation_plans(events(title))')
              .eq('organization_id', orgId)
              .eq('assigned_to_id', userId)
              .eq('status', 'pending')
              .gte('created_at', since48h)
              .limit(10)
          : Promise.resolve({ data: [], error: null }),

        // Tasks assigned to me that were recently updated (last 2h) — edit notifications
        userId
          ? supabase
              .from('event_tasks')
              .select('id, title, operation_plan_id, event_operation_plans(events(title))')
              .eq('organization_id', orgId)
              .eq('assigned_to_id', userId)
              .gte('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
              .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
              .limit(10)
          : Promise.resolve({ data: [], error: null }),

        // My shortage requests that were approved or rejected in the last 24h
        userId
          ? supabase
              .from('shortage_requests')
              .select('id, status, additional_qty_requested, approved_qty, review_notes, checklist_item_id, operation_plan_id, event_checklist_items(name), event_operation_plans(events(title))')
              .eq('organization_id', orgId)
              .eq('requested_by', userId)
              .in('status', ['approved', 'rejected'])
              .gte('updated_at', since24h)
              .limit(10)
          : Promise.resolve({ data: [], error: null }),
      ])

      const results: NotificationItem[] = []
      const seenTaskIds = new Set<string>()

      for (const i of (issuesRes.data ?? []) as any[]) {
        results.push({
          id: `issue-${i.id}`,
          type: 'issue',
          title: `Issue: ${i.name}`,
          subtitle: (i.event_operation_plans as any)?.events?.title ?? 'Unknown event',
          planId: i.operation_plan_id,
          eventTitle: (i.event_operation_plans as any)?.events?.title,
        })
      }

      for (const s of (shortagesRes.data ?? []) as any[]) {
        results.push({
          id: `shortage-${s.id}`,
          type: 'shortage',
          title: 'Shortage request pending review',
          subtitle: s.event_operation_plans?.events?.title ?? 'Unknown event',
          planId: s.event_operation_plans?.id,
          eventTitle: s.event_operation_plans?.events?.title,
        })
      }

      for (const t of (overdueRes.data ?? []) as any[]) {
        results.push({
          id: `overdue-${t.id}`,
          type: 'overdue_task',
          title: `Overdue: ${t.title}`,
          subtitle: (t.event_operation_plans as any)?.events?.title ?? 'Unknown event',
          planId: t.operation_plan_id,
          eventTitle: (t.event_operation_plans as any)?.events?.title,
        })
      }

      for (const a of (assignedRes.data ?? []) as any[]) {
        seenTaskIds.add(a.id)
        results.push({
          id: `assigned-${a.id}`,
          type: 'assigned_task',
          title: `New task: ${a.title}`,
          subtitle: (a.event_operation_plans as any)?.events?.title ?? 'No linked event',
          planId: a.operation_plan_id,
          eventTitle: (a.event_operation_plans as any)?.events?.title,
        })
      }

      for (const u of (updatedRes.data ?? []) as any[]) {
        if (seenTaskIds.has(u.id)) continue
        results.push({
          id: `updated-${u.id}`,
          type: 'task_updated',
          title: `Task updated: ${u.title}`,
          subtitle: (u.event_operation_plans as any)?.events?.title ?? 'No linked event',
          planId: u.operation_plan_id,
          eventTitle: (u.event_operation_plans as any)?.events?.title,
        })
      }

      for (const sr of (myShortagesRes.data ?? []) as any[]) {
        const itemName = (sr.event_checklist_items as any)?.name ?? 'Item'
        const eventTitle = (sr.event_operation_plans as any)?.events?.title ?? 'Unknown event'
        if (sr.status === 'approved') {
          results.push({
            id: `shortage-approved-${sr.id}`,
            type: 'shortage_approved',
            title: `Shortage approved: ${itemName} (+${sr.approved_qty ?? sr.additional_qty_requested})`,
            subtitle: sr.review_notes ? `"${sr.review_notes}" · ${eventTitle}` : eventTitle,
            planId: sr.operation_plan_id,
            eventTitle,
          })
        } else {
          results.push({
            id: `shortage-rejected-${sr.id}`,
            type: 'shortage_rejected',
            title: `Shortage rejected: ${itemName}`,
            subtitle: sr.review_notes ? `"${sr.review_notes}" · ${eventTitle}` : eventTitle,
            planId: sr.operation_plan_id,
            eventTitle,
          })
        }
      }

      return results
    },
    staleTime: 30_000,
    enabled: !!orgId,
  })
}
