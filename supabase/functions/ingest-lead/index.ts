import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * ingest-lead — Public webhook that accepts lead data from:
 *   1. Google Calendar appointment scheduling (via Apps Script)
 *   2. Website popup form → Google Sheet (via Apps Script)
 *
 * POST /functions/v1/ingest-lead
 * Body: { name, email?, phone?, company?, service?, source?, notes?, meta? }
 * Header: x-webhook-secret (must match LEAD_WEBHOOK_SECRET env var)
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

  // Simple secret check to prevent spam
  const secret = Deno.env.get('LEAD_WEBHOOK_SECRET')
  const provided = req.headers.get('x-webhook-secret')
  if (secret && provided !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return new Response(JSON.stringify({ error: 'name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase.from('lead_inbox').insert({
      name:    body.name.trim(),
      email:   body.email?.trim() || null,
      phone:   body.phone?.trim() || null,
      company: body.company?.trim() || null,
      service: body.service?.trim() || null,
      source:  body.source?.trim() || 'Website',
      notes:   body.notes?.trim() || null,
      meta:    body.meta || {},
    }).select().single()

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
