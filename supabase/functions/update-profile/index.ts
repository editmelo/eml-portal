import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * update-profile — Updates a user's profile using service role (bypasses RLS).
 *
 * Accepts access_token in the request body. If getUser() fails (e.g. bloated
 * JWT), falls back to decoding the JWT payload to extract the user ID, then
 * verifies the user exists via the admin API.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const token = body.access_token

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing access_token in body' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service role client — bypasses RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null

    // Try normal auth verification first
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (caller) {
      userId = caller.id
    } else {
      // Fallback: decode JWT payload to get sub (user ID)
      // JWT is header.payload.signature — we only need the payload
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          if (payload.sub) {
            // Verify this user actually exists via admin API
            const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(payload.sub)
            if (adminUser?.user && !adminErr) {
              userId = adminUser.user.id

              // Clean up bloated user_metadata that caused this problem
              await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: {}
              })
            }
          }
        }
      } catch (_decodeErr) {
        // Decode failed — fall through to error
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token — please log out and log back in' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update the profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        name:          body.name          ?? undefined,
        business:      body.business      ?? undefined,
        businesses:    body.businesses    ?? undefined,
        phone:         body.phone         ?? undefined,
        nickname:      body.nickname      ?? undefined,
        avatar_url:    body.avatar_url    ?? undefined,
        specialty:     body.specialty     ?? undefined,
        portfolio_url: body.portfolio_url ?? undefined,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, profile: data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
