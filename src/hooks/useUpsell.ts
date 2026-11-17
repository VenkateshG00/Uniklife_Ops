import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { upsellService } from '../services/upsell'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function useDownstreamUpsells(sourceEventId: string) {
  return useQuery({
    queryKey: ['upsells-downstream', sourceEventId],
    queryFn: () => upsellService.listDownstreamUpsells(sourceEventId),
    enabled: !!sourceEventId,
  })
}

export function useUpstreamSources(targetEventId: string) {
  return useQuery({
    queryKey: ['upsells-upstream', targetEventId],
    queryFn: () => upsellService.listUpstreamSources(targetEventId),
    enabled: !!targetEventId,
  })
}

export function useUpsellStats(sourceEventId: string) {
  return useQuery({
    queryKey: ['upsell-stats', sourceEventId],
    queryFn: () => upsellService.getUpsellStats(sourceEventId),
    enabled: !!sourceEventId,
  })
}

export function useCreateUpsell(sourceEventId: string) {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Record<string, any>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return upsellService.createUpsell({
        ...payload,
        source_event_id: sourceEventId,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells-downstream', sourceEventId] })
      qc.invalidateQueries({ queryKey: ['upsell-stats', sourceEventId] })
      toast.success('Upsell record added')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateUpsell(sourceEventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) =>
      upsellService.updateUpsell(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells-downstream', sourceEventId] })
      qc.invalidateQueries({ queryKey: ['upsell-stats', sourceEventId] })
      toast.success('Upsell record updated')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteUpsell(sourceEventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => upsellService.removeUpsell(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells-downstream', sourceEventId] })
      qc.invalidateQueries({ queryKey: ['upsell-stats', sourceEventId] })
      toast.success('Upsell record removed')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
