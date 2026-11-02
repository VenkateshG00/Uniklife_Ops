import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checklistService } from '../services/checklist'
import { useAuthStore } from '../stores/authStore'
import type { ItemStatus } from '../types'
import toast from 'react-hot-toast'

export function useChecklist(planId: string) {
  return useQuery({
    queryKey: ['checklist', planId],
    queryFn: () => checklistService.listByPlan(planId),
    enabled: !!planId,
    staleTime: 10_000,
  })
}

export function useUpdateItemStatus(planId: string) {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id ?? '')

  return useMutation({
    mutationFn: ({ id, status, statusNote }: { id: string; status: ItemStatus; statusNote?: string }) =>
      checklistService.updateStatus(id, status, userId, statusNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', planId] })
    },
    onError: (err: Error) => {
      toast.error(`Failed to update: ${err.message}`)
    },
  })
}
