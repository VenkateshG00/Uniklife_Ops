import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetService } from '../services/budget'
import { useAuthStore } from '../stores/authStore'
import type { EventBudgetItem } from '../types'
import toast from 'react-hot-toast'

export function useBudgetItems(eventId: string) {
  return useQuery({
    queryKey: ['budget-items', eventId],
    queryFn: () => budgetService.listByEvent(eventId),
    enabled: !!eventId,
  })
}

export function useBudgetSummary(eventId: string) {
  return useQuery({
    queryKey: ['budget-summary', eventId],
    queryFn: () => budgetService.summaryByEvent(eventId),
    enabled: !!eventId,
  })
}

export function useCreateBudgetItem(eventId: string) {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventBudgetItem>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return budgetService.create({
        ...payload,
        event_id: eventId,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-items', eventId] })
      qc.invalidateQueries({ queryKey: ['budget-summary', eventId] })
      toast.success('Budget item added')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateBudgetItem(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EventBudgetItem> }) =>
      budgetService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-items', eventId] })
      qc.invalidateQueries({ queryKey: ['budget-summary', eventId] })
      toast.success('Budget item updated')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteBudgetItem(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => budgetService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-items', eventId] })
      qc.invalidateQueries({ queryKey: ['budget-summary', eventId] })
      toast.success('Budget item removed')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
