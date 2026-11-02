import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!
  const admin       = createClient(supabaseUrl, serviceKey)

  const body = await req.json()
  const { action } = body

  // ── Public actions (no auth required) ───────────────────────────────────────

  if (action === 'get_invite') {
    const { token } = body
    if (!token) return json({ error: 'token required' }, 400)

    const { data, error } = await admin
      .from('staff_invites')
      .select('id, full_name, role, expires_at, used_at')
      .eq('id', token)
      .single()

    if (error || !data) return json({ error: 'Invite not found' }, 404)
    if (data.used_at)   return json({ error: 'This invite has already been used' }, 410)
    if (new Date(data.expires_at) < new Date()) return json({ error: 'This invite has expired' }, 410)

    return json({ invite: data })
  }

  if (action === 'complete_join') {
    const { token, email, password } = body
    if (!token || !email || !password) return json({ error: 'token, email and password required' }, 400)

    // Validate invite
    const { data: invite, error: invErr } = await admin
      .from('staff_invites')
      .select('*')
      .eq('id', token)
      .single()

    if (invErr || !invite) return json({ error: 'Invite not found' }, 404)
    if (invite.used_at)    return json({ error: 'This invite has already been used' }, 410)
    if (new Date(invite.expires_at) < new Date()) return json({ error: 'This invite has expired' }, 410)

    // Create the auth user
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invite.full_name },
    })
    if (createErr) return json({ error: createErr.message }, 400)

    // Update the profile with org, role, phone, job_title (trigger only sets full_name)
    await admin
      .from('profiles')
      .update({
        organization_id: invite.organization_id,
        role: invite.role,
        phone: invite.phone ?? null,
        job_title: invite.job_title ?? null,
      })
      .eq('id', newUser.user!.id)

    // Mark invite as used
    await admin
      .from('staff_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', token)

    return json({ success: true, email })
  }

  // ── Authenticated actions ────────────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: caller } = await userClient
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!caller || !['super_admin', 'event_manager'].includes(caller.role)) {
    return json({ error: 'Forbidden: insufficient role' }, 403)
  }

  // ── create_direct: admin creates account with password ──────────────────────

  if (action === 'create_direct') {
    const { email, password, full_name, role, phone, job_title } = body
    if (!email || !password || !full_name || !role) {
      return json({ error: 'email, password, full_name and role are required' }, 400)
    }

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })
    if (createErr) return json({ error: createErr.message }, 400)

    await admin
      .from('profiles')
      .update({
        organization_id: caller.organization_id,
        role,
        phone: phone ?? null,
        job_title: job_title ?? null,
      })
      .eq('id', newUser.user!.id)

    return json({ success: true, user_id: newUser.user!.id })
  }

  // ── generate_link: create an invite record and return the URL ───────────────

  if (action === 'generate_link') {
    const { full_name, role, phone, job_title } = body
    if (!full_name || !role) return json({ error: 'full_name and role are required' }, 400)

    const { data: invite, error: invErr } = await admin
      .from('staff_invites')
      .insert({
        organization_id: caller.organization_id,
        full_name,
        role,
        phone: phone ?? null,
        job_title: job_title ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (invErr || !invite) return json({ error: invErr?.message ?? 'Failed to create invite' }, 400)

    return json({ token: invite.id })
  }

  return json({ error: 'Unknown action' }, 400)
})
