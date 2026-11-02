import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { templatesService, type TemplateItem } from '../services/templates'

const KEY = 'templates'

export function useTemplates() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: [KEY, orgId],
    queryFn: () => templatesService.list(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  const profile = useAuthStore(s => s.profile)
  return useMutation({
    mutationFn: (payload: { name: string; event_category: string; description?: string }) =>
      templatesService.create({
        organization_id: profile!.organization_id!,
        created_by: profile!.id,
        ...payload,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateTemplateItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: TemplateItem[] }) =>
      templatesService.updateItems(id, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => templatesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useApplyTemplate() {
  return useMutation({
    mutationFn: ({ templateId, planId }: { templateId: string; planId: string }) =>
      templatesService.applyToPlan(templateId, planId),
  })
}
