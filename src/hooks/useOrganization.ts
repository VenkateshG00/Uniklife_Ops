import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export interface OrgDetails {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  gst_number: string | null
  contact_phone: string | null
  contact_email: string | null
}

export function useOrganization() {
  const orgId = useAuthStore(s => s.profile?.organization_id)

  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: async (): Promise<OrgDetails | null> => {
      if (!orgId) return null
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url, settings')
        .eq('id', orgId)
        .single()
      if (error) throw error
      const s = (data.settings ?? {}) as Record<string, string>
      return {
        id: data.id,
        name: data.name,
        logo_url: data.logo_url ?? null,
        address:       s.address       ?? null,
        gst_number:    s.gst_number    ?? null,
        contact_phone: s.contact_phone ?? null,
        contact_email: s.contact_email ?? null,
      }
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  })
}
