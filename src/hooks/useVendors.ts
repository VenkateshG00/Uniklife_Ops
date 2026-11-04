import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { vendorsService, type Vendor } from '../services/vendors'
import toast from 'react-hot-toast'

const KEY = 'vendors'

export function useVendors() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: [KEY, orgId],
    queryFn: () => vendorsService.list(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useCreateVendor() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (payload: { name: string; phone: string; category?: string; notes?: string }) =>
      vendorsService.create({ organization_id: orgId!, ...payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, orgId] }); toast.success('Vendor added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateVendor() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Omit<Vendor, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>) =>
      vendorsService.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, orgId] }); toast.success('Vendor updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteVendor() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (id: string) => vendorsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, orgId] }); toast.success('Vendor removed') },
    onError: (e: Error) => toast.error(e.message),
  })
}
