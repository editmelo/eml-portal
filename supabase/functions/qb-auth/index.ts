import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getAuthUrl,
  exchangeCode,
  getSupabaseAdmin,
  getValidToken,
} from '../_shared/qb-client.ts'

const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // ── GET /qb-auth/callback — OAuth callback from Intuit ─────────────────
    if (path.endsWith('/callback') && req.method === 'GET') {
      const code    = url.searchParams.get('code')
      const realmId = url.searchParams.get('realmId')
      const state   = url.searchParams.get('state')

      if (!code || !realmId) {
        return Response.redirect(`${APP_URL}/admin/settings?qb=error&reason=missing_params`, 302)
      }

      // Exchange code for tokens
      const tokens = await exchangeCode(code)
      const supabase = getSupabaseAdmin()
      const now = new Date()

      // Upsert tokens (replace any existing connection)
      const { error } = await supabase
        .from('qb_tokens')
        .upsert({
          realm_id:                 realmId,
          access_token:             tokens.access_token,
          refresh_token:            tokens.refresh_token,
          access_token_expires_at:  new Date(now.getTime() + tokens.expires_in * 1000).toISOString(),
          refresh_token_expires_at: new Date(now.getTime() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
          updated_at:               now.toISOString(),
        }, { onConflict: 'realm_id' })

      if (error) {
        console.error('Failed to store tokens:', error)
        return Response.redirect(`${APP_URL}/admin/settings?qb=error&reason=db_error`, 302)
      }

      return Response.redirect(`${APP_URL}/admin/settings?qb=connected`, 302)
    }

    // ── GET /qb-auth?action=connect — Start OAuth flow ─────────────────────
    const action = url.searchParams.get('action')

    if (action === 'connect') {
      const state = crypto.randomUUID()
      const authUrl = getAuthUrl(state)
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── GET /qb-auth?action=status — Check connection status ───────────────
    if (action === 'status') {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('qb_tokens')
        .select('realm_id, company_name, updated_at, refresh_token_expires_at')
        .limit(1)
        .single()

      if (error || !data) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const refreshExpiry = new Date(data.refresh_token_expires_at)
      const isExpired = refreshExpiry.getTime() < Date.now()

      return new Response(JSON.stringify({
        connected:      !isExpired,
        realmId:        data.realm_id,
        companyName:    data.company_name,
        lastSync:       data.updated_at,
        tokenExpiresAt: data.refresh_token_expires_at,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── POST /qb-auth?action=disconnect — Remove connection ────────────────
    if (action === 'disconnect' && req.method === 'POST') {
      const supabase = getSupabaseAdmin()
      await supabase.from('qb_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      return new Response(JSON.stringify({ disconnected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('qb-auth error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
