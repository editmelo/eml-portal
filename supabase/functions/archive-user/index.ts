import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * archive-user — Soft-deletes a user account.
 *
 * Sets profiles.archived = true and bans the user in Supabase Auth
 * so they can't log in. Data is fully preserved for admin reference.
 * If they want back in, they re-sign up (admin can unarchive first).
 *
 * POST /functions/v1/archive-user
 * Body: { userId }
 * Auth: requires authenticated admin OR the user themselves (self-deactivate)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the caller
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const targetUserId = body.userId

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service-role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Check authorization: must be admin OR self-deactivating
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    const isAdmin = callerProfile?.role === 'ADMIN'
    const isSelf = caller.id === targetUserId

    if (!isAdmin && !isSelf) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent admin from archiving themselves
    if (isAdmin && isSelf) {
      return new Response(JSON.stringify({ error: 'Cannot archive your own admin account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Mark profile as archived
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', targetUserId)

    if (profileError) throw profileError

    // 2. Ban the user in Supabase Auth (prevents login)
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { ban_duration: '876000h' } // ~100 years = effectively permanent
    )

    if (banError) throw banError

    return new Response(JSON.stringify({ ok: true, archived: targetUserId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
