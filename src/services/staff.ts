import { supabase } from '../lib/supabase'

async function callStaffFn(body: Record<string, unknown>, requireAuth = true) {
  let headers: Record<string, string> = {}
  if (requireAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    headers = { Authorization: `Bearer ${session.access_token}` }
  }
  const res = await supabase.functions.invoke('invite-staff', { body, headers })
  if (res.error) throw new Error(res.error.message)
  const data = res.data as { error?: string }
  if (data?.error) throw new Error(data.error)
  return res.data
}

export interface DirectCreatePayload {
  email: string
  password: string
  full_name: string
  role: string
  job_title?: string
  phone?: string
}

export interface LinkPayload {
  full_name: string
  role: string
  job_title?: string
  phone?: string
}

export async function createStaffDirect(payload: DirectCreatePayload): Promise<void> {
  await callStaffFn({ action: 'create_direct', ...payload })
}

export async function generateInviteLink(payload: LinkPayload): Promise<string> {
  const data = await callStaffFn({ action: 'generate_link', ...payload }) as { token: string }
  return data.token
}

export async function getInvite(token: string) {
  return callStaffFn({ action: 'get_invite', token }, false) as Promise<{
    invite: { id: string; full_name: string; role: string; expires_at: string }
  }>
}

export async function completeJoin(token: string, email: string, password: string): Promise<void> {
  await callStaffFn({ action: 'complete_join', token, email, password }, false)
}
