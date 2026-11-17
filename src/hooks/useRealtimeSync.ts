import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * App-wide Supabase Realtime sync.
 * Mounted once in AppLayout. On any DB change to watched tables,
 * invalidates the relevant TanStack Query keys so every component
 * using those queries re-fetches automatically.
 */
export function useRealtimeSync() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!orgId) return

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`realtime-sync-${orgId}`)

      // Checklist items — status changes, issue notes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_checklist_items' },
        () => {
          qc.invalidateQueries({ queryKey: ['checklist'] })
          qc.invalidateQueries({ queryKey: ['reports'] })
          qc.invalidateQueries({ queryKey: ['notifications'] })
        }
      )

      // Tasks — new assignments, status updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_tasks' },
        () => {
          qc.invalidateQueries({ queryKey: ['tasks'] })
          qc.invalidateQueries({ queryKey: ['notifications'] })
        }
      )

      // Shortage requests — new raises, approvals, rejections
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shortage_requests' },
        () => {
          qc.invalidateQueries({ queryKey: ['shortages'] })
          qc.invalidateQueries({ queryKey: ['reports'] })
          qc.invalidateQueries({ queryKey: ['notifications'] })
        }
      )

      // Operation plans — readiness scores, plan updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_operation_plans' },
        () => {
          qc.invalidateQueries({ queryKey: ['operation-plans'] })
          qc.invalidateQueries({ queryKey: ['reports'] })
        }
      )

      // Budget items — amounts, GST, approval status
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_budget_items' },
        () => {
          qc.invalidateQueries({ queryKey: ['budget-items'] })
          qc.invalidateQueries({ queryKey: ['budget-summary'] })
        }
      )

      // Revenue tiers — price, seats changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_revenue_tiers' },
        () => {
          qc.invalidateQueries({ queryKey: ['revenue-tiers'] })
          qc.invalidateQueries({ queryKey: ['revenue-adjustments'] })
        }
      )

      // Ad campaigns — spend, lead counts
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_ad_campaigns' },
        () => {
          qc.invalidateQueries({ queryKey: ['ad-campaigns'] })
        }
      )

      // Budget approvals — approve/reject/cancel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budget_approvals' },
        () => {
          qc.invalidateQueries({ queryKey: ['approvals'] })
          qc.invalidateQueries({ queryKey: ['pending-approvals'] })
          qc.invalidateQueries({ queryKey: ['budget-items'] })
        }
      )

      // Upsells — new cross-event upsell records
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_upsells' },
        () => {
          qc.invalidateQueries({ queryKey: ['upsells-downstream'] })
          qc.invalidateQueries({ queryKey: ['upsells-upstream'] })
          qc.invalidateQueries({ queryKey: ['upsell-stats'] })
        }
      )

      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [orgId, qc])
}
