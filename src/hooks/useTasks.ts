import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '../services/tasks'
import { useAuthStore } from '../stores/authStore'
import type { EventTask, TaskStatus } from '../types'
import toast from 'react-hot-toast'

export function useTasksByPlan(planId: string) {
  return useQuery({
    queryKey: ['tasks', 'plan', planId],
    queryFn: () => tasksService.listByPlan(planId),
    enabled: !!planId,
    staleTime: 10_000,
  })
}

export function useTasksByOrg() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['tasks', 'org', orgId],
    queryFn: () => tasksService.listByOrg(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
  })
}

export function useCreateTask(planId: string) {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventTask>) =>
      tasksService.create({
        ...payload,
        operation_plan_id: planId,
        organization_id: orgId!,
        created_by: userId!,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'plan', planId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'org'] })
      toast.success('Task created')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

// Create a task from the org-level Tasks page (no pre-set planId)
export function useCreateTaskFromOrg() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventTask>) =>
      tasksService.create({
        ...payload,
        organization_id: orgId!,
        created_by: userId!,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'org'] })
      toast.success('Task created')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateTaskStatus(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'plan', planId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'org'] })
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useClaimTask() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (taskId: string) =>
      tasksService.update(taskId, { assigned_to_id: userId!, status: 'in_progress' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success("Task claimed — it's yours now!")
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateTaskFromOrg() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<EventTask> & { id: string }) =>
      tasksService.update(id, { ...payload, last_updated_by: userId } as Partial<EventTask>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useReleaseTask() {
  const qc = useQueryClient()
  const profile = useAuthStore(s => s.profile)
  return useMutation({
    mutationFn: ({ taskId, currentDesc }: { taskId: string; currentDesc?: string }) => {
      const releaseNote = `[Released by ${profile?.full_name ?? 'staff'} on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}]`
      const newDesc = currentDesc
        ? `${releaseNote}\n${currentDesc.replace(/^\[Released by[^\]]+\]\n?/, '')}`
        : releaseNote
      return tasksService.update(taskId, {
        assigned_to_id: null as unknown as string,
        status: 'pending',
        description: newDesc,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast('Task returned to open pool. Manager has been notified.', { icon: '↩️' })
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteTask(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'plan', planId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'org'] })
      toast.success('Task deleted')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
