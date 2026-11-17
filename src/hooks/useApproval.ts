import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalService } from '../services/approval'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function useApprovals(eventId: string) {
  return useQuery({
    queryKey: ['approvals', eventId],
    queryFn: () => approvalService.listApprovals(eventId),
    enabled: !!eventId,
  })
}

export function usePendingApprovals(eventId: string) {
  return useQuery({
    queryKey: ['pending-approvals', eventId],
    queryFn: () => approvalService.listPendingApprovals(eventId),
    enabled: !!eventId,
  })
}

function useInvalidateApprovals(eventId: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['approvals', eventId] })
    qc.invalidateQueries({ queryKey: ['pending-approvals', eventId] })
    qc.invalidateQueries({ queryKey: ['budget-items', eventId] })
  }
}

export function useCreateApproval(eventId: string) {
  const invalidate = useInvalidateApprovals(eventId)
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return approvalService.createApproval({
        ...payload,
        event_id: eventId,
        organization_id: orgId,
        requested_by: userId,
      })
    },
    onSuccess: () => { invalidate(); toast.success('Approval request submitted') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useApproveItem(eventId: string) {
  const invalidate = useInvalidateApprovals(eventId)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('Not authenticated')
      return approvalService.approveItem(id, userId)
    },
    onSuccess: () => { invalidate(); toast.success('Budget item approved') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useRejectItem(eventId: string) {
  const invalidate = useInvalidateApprovals(eventId)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => {
      if (!userId) throw new Error('Not authenticated')
      return approvalService.rejectItem(id, userId, reason)
    },
    onSuccess: () => { invalidate(); toast.success('Budget item rejected') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useCancelApproval(eventId: string) {
  const invalidate = useInvalidateApprovals(eventId)
  return useMutation({
    mutationFn: (id: string) => approvalService.cancelApproval(id),
    onSuccess: () => { invalidate(); toast.success('Approval cancelled') },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
