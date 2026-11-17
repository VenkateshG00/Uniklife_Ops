import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { revenueService } from '../services/revenue'
import { useAuthStore } from '../stores/authStore'
import type { EventRevenueTier, EventRevenueAdjustment } from '../types'
import toast from 'react-hot-toast'

export function useRevenueTiers(eventId: string) {
  return useQuery({
    queryKey: ['revenue-tiers', eventId],
    queryFn: () => revenueService.listTiers(eventId),
    enabled: !!eventId,
  })
}

export function useRevenueAdjustments(eventId: string) {
  return useQuery({
    queryKey: ['revenue-adjustments', eventId],
    queryFn: () => revenueService.listAdjustments(eventId),
    enabled: !!eventId,
  })
}

function useInvalidateRevenue(eventId: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['revenue-tiers', eventId] })
    qc.invalidateQueries({ queryKey: ['revenue-adjustments', eventId] })
  }
}

export function useCreateRevenueTier(eventId: string) {
  const invalidate = useInvalidateRevenue(eventId)
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventRevenueTier>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return revenueService.createTier({
        ...payload,
        event_id: eventId,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => { invalidate(); toast.success('Tier added') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateRevenueTier(eventId: string) {
  const invalidate = useInvalidateRevenue(eventId)
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EventRevenueTier> }) =>
      revenueService.updateTier(id, payload),
    onSuccess: () => { invalidate(); toast.success('Tier updated') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteRevenueTier(eventId: string) {
  const invalidate = useInvalidateRevenue(eventId)
  return useMutation({
    mutationFn: (id: string) => revenueService.removeTier(id),
    onSuccess: () => { invalidate(); toast.success('Tier removed') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useCreateRevenueAdjustment(eventId: string) {
  const invalidate = useInvalidateRevenue(eventId)
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventRevenueAdjustment>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return revenueService.createAdjustment({
        ...payload,
        event_id: eventId,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => { invalidate(); toast.success('Adjustment added') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateRevenueAdjustment(eventId: string) {
  const invalidate = useInvalidateRevenue(eventId)
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EventRevenueAdjustment> }) =>
      revenueService.updateAdjustment(id, payload),
    onSuccess: () => { invalidate(); toast.success('Adjustment updated') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteRevenueAdjustment(eventId: string) {
  const invalidate = useInvalidateRevenue(eventId)
  return useMutation({
    mutationFn: (id: string) => revenueService.removeAdjustment(id),
    onSuccess: () => { invalidate(); toast.success('Adjustment removed') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
