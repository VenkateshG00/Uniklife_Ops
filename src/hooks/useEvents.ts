import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService, operationPlansService } from '../services/events'
import { useAuthStore } from '../stores/authStore'
import type { Event, EventOperationPlan } from '../types'
import toast from 'react-hot-toast'

export function useUpcomingEvents() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['events', 'upcoming', orgId],
    queryFn: () => eventsService.upcoming(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
  })
}

export function useEvents() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['events', 'list', orgId],
    queryFn: () => eventsService.list(orgId!),
    enabled: !!orgId,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    enabled: !!id,
  })
}

export function useOperationPlans() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['operation-plans', orgId],
    queryFn: () => operationPlansService.listWithReadiness(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
  })
}

export function useOperationPlanById(id: string) {
  return useQuery({
    queryKey: ['operation-plan-by-id', id],
    queryFn: () => operationPlansService.getById(id),
    enabled: !!id,
  })
}

export function useOperationPlanByEvent(eventId: string) {
  return useQuery({
    queryKey: ['operation-plan', eventId],
    queryFn: () => operationPlansService.getByEvent(eventId),
    enabled: !!eventId,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<Event>) =>
      eventsService.create({
        ...payload,
        organization_id: orgId!,
        created_by: userId!,
        status: 'draft',
        phase: 'planning',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event created')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Event> }) =>
      eventsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event updated')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventsService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event moved to cancelled')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useCreateOperationPlan() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventOperationPlan>) =>
      operationPlansService.create({
        ...payload,
        organization_id: orgId!,
        created_by: userId!,
        overall_readiness_pct: 0,
        phase: 'planning',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operation-plans'] })
      toast.success('Operation plan created')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
