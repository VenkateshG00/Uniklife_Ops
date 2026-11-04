import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { taskTemplateService } from '../services/taskTemplates'
import type { TaskTemplateItem } from '../types'
import toast from 'react-hot-toast'

const KEY = 'task-templates'

export function useTaskTemplates() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: [KEY, orgId],
    queryFn: () => taskTemplateService.list(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useCreateTaskTemplate() {
  const qc = useQueryClient()
  const orgId  = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: { name: string; program?: string; description?: string }) =>
      taskTemplateService.create({ organization_id: orgId!, created_by: userId!, ...payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, orgId] }); toast.success('Template created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTaskTemplate() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; program?: string; description?: string }) =>
      taskTemplateService.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, orgId] }); toast.success('Template updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTaskTemplate() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (id: string) => taskTemplateService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY, orgId] }); toast.success('Template deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddTaskTemplateItem() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (item: Omit<TaskTemplateItem, 'id' | 'created_at'>) =>
      taskTemplateService.addItem(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, orgId] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTaskTemplateItem() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Omit<TaskTemplateItem, 'id' | 'template_id' | 'created_at'>>) =>
      taskTemplateService.updateItem(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, orgId] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTaskTemplateItem() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (id: string) => taskTemplateService.deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, orgId] }),
    onError: (e: Error) => toast.error(e.message),
  })
}
