import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Environment ──────────────────────────────────────────────────────────────
const ZOOM_ACCOUNT_ID     = Deno.env.get('ZOOM_ACCOUNT_ID')!
const ZOOM_CLIENT_ID      = Deno.env.get('ZOOM_CLIENT_ID')!
const ZOOM_CLIENT_SECRET  = Deno.env.get('ZOOM_CLIENT_SECRET')!

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_URL   = 'https://api.zoom.us/v2'

// ── Supabase admin client ────────────────────────────────────────────────────
export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

// ── Token cache (in-memory, per edge function instance) ──────────────────────
let cachedToken: string | null = null
let tokenExpiresAt = 0

/** Get a valid Zoom access token (Server-to-Server OAuth) */
export async function getZoomToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiresAt - Date.now() > 5 * 60 * 1000) {
    return cachedToken
  }

  const basic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)
  const res = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Zoom token request failed: ${err}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000

  return cachedToken!
}

// ── Zoom API helpers ─────────────────────────────────────────────────────────

/** Make an authenticated request to the Zoom API */
export async function zoomFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getZoomToken()
  const res = await fetch(`${ZOOM_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Zoom API error (${res.status}): ${err}`)
  }

  return res.json()
}

/** Create a Zoom meeting */
export async function createZoomMeeting(data: {
  topic: string
  startTime: string
  duration: number
  hostEmail?: string
  agenda?: string
}) {
  const userId = data.hostEmail ?? 'me'
  return zoomFetch(`/users/${userId}/meetings`, {
    method: 'POST',
    body: JSON.stringify({
      topic:      data.topic,
      type:       2, // Scheduled
      start_time: data.startTime,
      duration:   data.duration,
      timezone:   'America/Chicago',
      agenda:     data.agenda ?? '',
      settings: {
        host_video:        true,
        participant_video: true,
        join_before_host:  false,
        mute_upon_entry:   true,
        auto_recording:    'cloud',
        waiting_room:      true,
      },
    }),
  })
}

/** Get recordings for a specific meeting */
export async function getMeetingRecordings(meetingId: string) {
  return zoomFetch(`/meetings/${meetingId}/recordings`)
}

/** List recent recordings for the account */
export async function listRecentRecordings(fromDate: string, toDate: string, hostEmail?: string) {
  const userId = hostEmail ?? 'me'
  return zoomFetch(`/users/${userId}/recordings?from=${fromDate}&to=${toDate}`)
}

/** Get meeting summary (AI Companion) */
export async function getMeetingSummary(meetingId: string) {
  try {
    return await zoomFetch(`/meetings/${meetingId}/meeting_summary`)
  } catch {
    return null // AI Companion may not be available
  }
}

/** Download a recording file and return its text content (for transcripts) */
export async function downloadTranscript(downloadUrl: string): Promise<string> {
  const token = await getZoomToken()
  const res = await fetch(`${downloadUrl}?access_token=${token}`)
  if (!res.ok) throw new Error(`Failed to download transcript: ${res.status}`)
  return res.text()
}
