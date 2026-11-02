import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityService } from '../services/activity'
import { useAuthStore } from '../stores/authStore'
import type { EventActivityLog } from '../types'

export function useEventActivity(eventId: string) {
  return useQuery({
    queryKey: ['activity', eventId],
    queryFn: () => activityService.listByEvent(eventId),
    enabled: !!eventId,
    staleTime: 10_000,
  })
}

export function useRecentActivity() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['activity', 'recent', orgId],
    queryFn: () => activityService.listRecentByOrg(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

export function useRealtimeActivity(eventId: string, initialItems: EventActivityLog[] = []) {
  const [items, setItems] = useState<EventActivityLog[]>(initialItems)

  useEffect(() => {
    if (!eventId) return
    const channel = activityService.subscribeToEvent(eventId, (newRow) => {
      setItems(prev => [newRow, ...prev].slice(0, 50))
    })
    return () => { channel.unsubscribe() }
  }, [eventId])

  // Sync when initialItems load
  useEffect(() => {
    if (initialItems.length > 0) setItems(initialItems)
  }, [initialItems.length])

  return items
}
