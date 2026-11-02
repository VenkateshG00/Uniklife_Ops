import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService, type InventoryItem } from '../services/inventory'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function useInventory() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['inventory', orgId],
    queryFn: () => inventoryService.list(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
  })
}

export function useAddInventoryItem() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (payload: Partial<InventoryItem>) =>
      inventoryService.create({ ...payload, organization_id: orgId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Item added')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      inventoryService.updateStock(id, stock),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
