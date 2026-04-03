import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { inviteId, password } = await req.json()

    if (!inviteId || !password) {
      return new Response(JSON.stringify({ error: 'inviteId and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = getSupabaseAdmin()

    // Look up the invite
    const { data: invite, error: invErr } = await supabase
      .from('invites')
      .select('id, email, owner_name, role, status')
      .eq('id', inviteId)
      .single()

    if (invErr || !invite) {
      return new Response(JSON.stringify({ error: 'Invite not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (invite.status === 'accepted') {
      return new Response(JSON.stringify({ error: 'This invite has already been accepted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (invite.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'This invite has been cancelled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create user with email auto-confirmed (no confirmation email needed)
    const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: invite.owner_name,
        role: invite.role,
      },
    })

    if (createErr) {
      // If user already exists, return a helpful message
      if (createErr.message?.includes('already been registered')) {
        return new Response(JSON.stringify({ error: 'An account with this email already exists. Try signing in instead.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw createErr
    }

    // Create profiles row
    await supabase.from('profiles').upsert({
      id:    userData.user.id,
      email: invite.email,
      name:  invite.owner_name,
      role:  invite.role,
    })

    // Mark invite as accepted
    await supabase.from('invites').update({ status: 'accepted' }).eq('id', inviteId)

    return new Response(JSON.stringify({
      success: true,
      email:   invite.email,
      role:    invite.role,
      name:    invite.owner_name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('accept-invite error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
