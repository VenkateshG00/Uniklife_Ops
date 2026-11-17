import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tourService } from '../services/tour'
import { useAuthStore } from '../stores/authStore'
import type { EventTour, TourSharedCost } from '../types'
import toast from 'react-hot-toast'

export function useTours() {
  return useQuery({
    queryKey: ['tours'],
    queryFn: () => tourService.listTours(),
  })
}

export function useTour(tourId: string) {
  return useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => tourService.getTour(tourId),
    enabled: !!tourId,
  })
}

export function useTourEvents(tourId: string) {
  return useQuery({
    queryKey: ['tour-events', tourId],
    queryFn: () => tourService.listTourEvents(tourId),
    enabled: !!tourId,
  })
}

export function useTourSharedCosts(tourId: string) {
  return useQuery({
    queryKey: ['tour-shared-costs', tourId],
    queryFn: () => tourService.listSharedCosts(tourId),
    enabled: !!tourId,
  })
}

export function useCreateTour() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<EventTour>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return tourService.createTour({
        ...payload,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tours'] })
      toast.success('Tour created')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateTour() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EventTour> }) =>
      tourService.updateTour(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tours'] })
      qc.invalidateQueries({ queryKey: ['tour', vars.id] })
      toast.success('Tour updated')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteTour() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tourService.removeTour(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tours'] })
      toast.success('Tour deleted')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useCreateSharedCost(tourId: string) {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: (payload: Partial<TourSharedCost>) => {
      if (!orgId || !userId) throw new Error('Not authenticated')
      return tourService.createSharedCost({
        ...payload,
        tour_id: tourId,
        organization_id: orgId,
        created_by: userId,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tour-shared-costs', tourId] })
      toast.success('Shared cost added')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useUpdateSharedCost(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TourSharedCost> }) =>
      tourService.updateSharedCost(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tour-shared-costs', tourId] })
      toast.success('Shared cost updated')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useDeleteSharedCost(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tourService.removeSharedCost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tour-shared-costs', tourId] })
      toast.success('Shared cost removed')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useAssignEventToTour(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tourId: string) =>
      tourService.assignEventToTour(eventId, tourId),
    onSuccess: (_data, tourId) => {
      qc.invalidateQueries({ queryKey: ['tour-events', tourId] })
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['operation-plan-by-id'] })
      toast.success('Event assigned to tour')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useRemoveEventFromTour(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      tourService.removeEventFromTour(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tour-events'] })
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['operation-plan-by-id'] })
      toast.success('Event removed from tour')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
