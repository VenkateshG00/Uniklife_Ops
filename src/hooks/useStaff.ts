import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import {
  createStaffDirect, generateInviteLink,
  type DirectCreatePayload, type LinkPayload,
} from '../services/staff'
import type { Profile } from '../types'

async function listProfiles(orgId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('full_name')
  if (error) throw error
  return data as Profile[]
}

export function useStaff() {
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useQuery({
    queryKey: ['staff', orgId],
    queryFn: () => listProfiles(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useCreateStaffDirect() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: (payload: DirectCreatePayload) => createStaffDirect(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff', orgId] }),
  })
}

export function useGenerateInviteLink() {
  return useMutation({
    mutationFn: (payload: LinkPayload) => generateInviteLink(payload),
  })
}

export function useUpdateJobTitle() {
  const qc = useQueryClient()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  return useMutation({
    mutationFn: async ({ id, job_title }: { id: string; job_title: string }) => {
      const { error } = await supabase.from('profiles').update({ job_title }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff', orgId] }),
  })
}
