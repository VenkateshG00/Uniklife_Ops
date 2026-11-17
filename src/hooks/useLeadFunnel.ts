import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadFunnelService } from '../services/leadFunnel'
import { useAuthStore } from '../stores/authStore'
import type { EventAdCampaign } from '../types'
import toast from 'react-hot-toast'

export function useAdCampaigns(eventId: string) {
  return useQuery({
    queryKey: ['ad-campaigns', eventId],
    queryFn: () => leadFunnelService.listCampaigns(eventId),
    enabled: !!eventId,
  })
}

function useInvalidateCampaigns(eventId: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['ad-campaigns', eventId] })
  }
}

export function useCreateAdCampaign(eventId: string) {
  const invalidate = useInvalidateCampaigns(eventId)
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventAdCampaign>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return leadFunnelService.createCampaign({
        ...payload,
        event_id: eventId,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => { invalidate(); toast.success('Campaign added') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateAdCampaign(eventId: string) {
  const invalidate = useInvalidateCampaigns(eventId)
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EventAdCampaign> }) =>
      leadFunnelService.updateCampaign(id, payload),
    onSuccess: () => { invalidate(); toast.success('Campaign updated') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteAdCampaign(eventId: string) {
  const invalidate = useInvalidateCampaigns(eventId)
  return useMutation({
    mutationFn: (id: string) => leadFunnelService.removeCampaign(id),
    onSuccess: () => { invalidate(); toast.success('Campaign removed') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
