import { supabase } from './supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// ── Meetings ─────────────────────────────────────────────────────────────────

/** Create a Zoom meeting */
export async function createMeeting(data) {
  const res = await fetch(`${FUNCTIONS_URL}/zoom-meeting`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create meeting')
  }
  return res.json()
}

/** List all meetings (optionally filtered by project) */
export async function listMeetings(projectId = null) {
  const params = projectId ? `?projectId=${projectId}` : ''
  const res = await fetch(`${FUNCTIONS_URL}/zoom-meeting${params}`, {
    headers: await authHeaders(),
  })
  return res.json()
}

/** Sync recordings/transcripts for meetings */
export async function syncRecordings() {
  const res = await fetch(`${FUNCTIONS_URL}/zoom-meeting?action=sync`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  return res.json()
}

// ── Direct Supabase queries ──────────────────────────────────────────────────

/** Fetch meetings from Supabase directly */
export async function fetchMeetingsFromDB(projectId = null) {
  let query = supabase
    .from('zoom_meetings')
    .select('*')
    .order('start_time', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Fetch a single meeting with transcript */
export async function fetchMeetingById(id) {
  const { data, error } = await supabase
    .from('zoom_meetings')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
