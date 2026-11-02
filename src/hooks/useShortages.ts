import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { shortageService } from '../services/shortage'
import { useAuthStore } from '../stores/authStore'
import type { ShortageRequest, ShortageStatus } from '../types'
import toast from 'react-hot-toast'

export function useShortagesByOrg() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['shortages', 'org', orgId],
    queryFn: () => shortageService.listByOrg(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
  })
}

export function useShortages(planId: string) {
  return useQuery({
    queryKey: ['shortages', planId],
    queryFn: () => shortageService.listByPlan(planId),
    enabled: !!planId,
    staleTime: 15_000,
  })
}

export function useCreateShortage(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ShortageRequest>) => shortageService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shortages', planId] })
      toast.success('Shortage request submitted')
    },
    onError: (err: Error) => toast.error(`Failed to submit: ${err.message}`),
  })
}

export type ShortageActionPayload = {
  id: string
  status: ShortageStatus
  approved_qty?: number
  review_notes?: string
  checklist_item_id?: string
  current_item_status?: string
  current_required_qty?: number
}

export function useUpdateShortageStatus(_planId: string) {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({
      id, status, approved_qty, review_notes,
      checklist_item_id, current_item_status, current_required_qty,
    }: ShortageActionPayload) => {
      // 1. Update shortage record
      const result = await shortageService.updateStatus(id, status, {
        ...(approved_qty !== undefined ? { approved_qty } : {}),
        ...(review_notes ? { review_notes } : {}),
      })

      // 2. On approval: update checklist item qty + revert status if was done
      if (status === 'approved' && checklist_item_id && approved_qty) {
        const newQty = (current_required_qty ?? 0) + approved_qty
        await supabase
          .from('event_checklist_items')
          .update({
            required_qty: newQty,
            ...(current_item_status === 'done' ? { status: 'in_progress' } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', checklist_item_id)
      }

      // 3. Log action
      if (userId) {
        await shortageService.addAction({
          shortage_request_id: id,
          action_by: userId,
          action_type: status,
          notes: review_notes,
          qty_change: status === 'approved' ? approved_qty : undefined,
        })
      }

      return result
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shortages'] })
      qc.invalidateQueries({ queryKey: ['checklist'] })
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success(
        vars.status === 'approved'
          ? `Approved +${vars.approved_qty} — checklist qty updated`
          : 'Request rejected'
      )
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
