import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getSupabaseAdmin,
  createZoomMeeting,
  getMeetingRecordings,
  downloadTranscript,
  getMeetingSummary,
  listRecentRecordings,
} from '../_shared/zoom-client.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const supabase = getSupabaseAdmin()

  try {
    // ── POST — Create a new Zoom meeting ───────────────────────────────────
    if (req.method === 'POST') {
      const action = url.searchParams.get('action')

      // Sync recordings/transcripts for all meetings that don't have them yet
      if (action === 'sync') {
        const { data: meetings } = await supabase
          .from('zoom_meetings')
          .select('id, zoom_meeting_id, recording_ready')
          .eq('recording_ready', false)
          .not('zoom_meeting_id', 'is', null)

        let synced = 0
        for (const mtg of meetings ?? []) {
          try {
            const recs = await getMeetingRecordings(mtg.zoom_meeting_id!)
            const files = recs.recording_files ?? []

            // Find transcript file
            const transcriptFile = files.find(
              (f: any) => f.file_type === 'TRANSCRIPT' || (f.file_type === 'VTT' && f.recording_type === 'audio_transcript')
            )

            let transcript = null
            if (transcriptFile?.download_url) {
              transcript = await downloadTranscript(transcriptFile.download_url)
            }

            // Try AI summary
            const summary = await getMeetingSummary(mtg.zoom_meeting_id!)

            // Find video recording URL
            const videoFile = files.find((f: any) => f.file_type === 'MP4')

            await supabase
              .from('zoom_meetings')
              .update({
                recording_url:   videoFile?.play_url ?? null,
                transcript:      transcript,
                ai_summary:      summary?.meeting_summary?.summary_details ?? summary?.summary_overview ?? null,
                recording_ready: true,
                status:          'completed',
                updated_at:      new Date().toISOString(),
              })
              .eq('id', mtg.id)

            synced++
          } catch (e) {
            console.error(`Failed to sync meeting ${mtg.zoom_meeting_id}:`, e)
          }
        }

        return new Response(JSON.stringify({ synced }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create new meeting
      const body = await req.json()
      const { topic, startTime, duration, projectId, hostEmail, agenda } = body

      // Create in Zoom
      const zoomMeeting = await createZoomMeeting({
        topic,
        startTime,
        duration: duration ?? 60,
        hostEmail,
        agenda,
      })

      // Save to Supabase
      const { data: newMeeting, error } = await supabase
        .from('zoom_meetings')
        .insert({
          zoom_meeting_id: String(zoomMeeting.id),
          project_id:      projectId ?? null,
          topic,
          start_time:      zoomMeeting.start_time,
          duration:        zoomMeeting.duration,
          join_url:        zoomMeeting.join_url,
          host_email:      zoomMeeting.host_email,
          status:          'scheduled',
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ ...newMeeting, start_url: zoomMeeting.start_url }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── GET — List meetings ────────────────────────────────────────────────
    if (req.method === 'GET') {
      const projectId = url.searchParams.get('projectId')
      const id        = url.searchParams.get('id')

      if (id) {
        const { data, error } = await supabase
          .from('zoom_meetings')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let query = supabase
        .from('zoom_meetings')
        .select('*')
        .order('start_time', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify(data ?? []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('zoom-meeting error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
