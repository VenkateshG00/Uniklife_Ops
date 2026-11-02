import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendeesService, type Attendee } from '../services/attendees'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function useAttendees(eventId: string) {
  return useQuery({
    queryKey: ['attendees', eventId],
    queryFn: () => attendeesService.listByEvent(eventId),
    enabled: !!eventId,
    staleTime: 10_000,
  })
}

export function useRegisterAttendee(eventId: string) {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (payload: Partial<Attendee>) =>
      attendeesService.create({ ...payload, event_id: eventId, organization_id: orgId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendees', eventId] })
      toast.success('Attendee registered')
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}

export function useCheckIn(eventId: string) {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id ?? '')
  return useMutation({
    mutationFn: (id: string) => attendeesService.checkIn(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees', eventId] }),
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  })
}
