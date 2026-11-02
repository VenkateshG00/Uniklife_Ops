import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsService, type Payment } from '../services/payments'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function usePayments(eventId: string) {
  return useQuery({
    queryKey: ['payments', eventId],
    queryFn: () => paymentsService.listByEvent(eventId),
    enabled: !!eventId,
    staleTime: 15_000,
  })
}

export function useAddPayment(eventId: string) {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<Payment>) =>
      paymentsService.create({
        ...payload,
        event_id: eventId,
        organization_id: orgId!,
        collected_by: userId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments', eventId] })
      toast.success('Payment recorded')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
