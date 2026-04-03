import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  getSupabaseAdmin,
  getMeetingRecordings,
  downloadTranscript,
  getMeetingSummary,
} from '../_shared/zoom-client.ts'

const WEBHOOK_SECRET_TOKEN = Deno.env.get('ZOOM_WEBHOOK_SECRET_TOKEN') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.text()
    const payload = JSON.parse(body)

    // ── Zoom endpoint URL validation (challenge-response) ──────────────────
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload?.plainToken
      if (!plainToken) {
        return new Response('Missing plainToken', { status: 400 })
      }

      // HMAC-SHA256 of plainToken using webhook secret
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(WEBHOOK_SECRET_TOKEN),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(plainToken))
      const hashHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      return new Response(JSON.stringify({
        plainToken,
        encryptedToken: hashHex,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = getSupabaseAdmin()

    // ── recording.completed — Recording is ready to download ───────────────
    if (payload.event === 'recording.completed') {
      const meetingObj = payload.payload?.object
      if (!meetingObj) return new Response('OK', { status: 200 })

      const zoomMeetingId = String(meetingObj.id)
      const files = meetingObj.recording_files ?? []

      // Find transcript
      const transcriptFile = files.find(
        (f: any) => f.file_type === 'TRANSCRIPT' || (f.file_type === 'VTT' && f.recording_type === 'audio_transcript')
      )

      let transcript = null
      if (transcriptFile?.download_url) {
        try {
          transcript = await downloadTranscript(transcriptFile.download_url)
        } catch (e) {
          console.error('Failed to download transcript:', e)
        }
      }

      // Find video
      const videoFile = files.find((f: any) => f.file_type === 'MP4')

      // Try AI summary
      let aiSummary = null
      try {
        const summary = await getMeetingSummary(zoomMeetingId)
        aiSummary = summary?.meeting_summary?.summary_details ?? summary?.summary_overview ?? null
      } catch {}

      // Upsert into database
      const { data: existing } = await supabase
        .from('zoom_meetings')
        .select('id')
        .eq('zoom_meeting_id', zoomMeetingId)
        .single()

      if (existing) {
        // Update existing meeting
        await supabase
          .from('zoom_meetings')
          .update({
            recording_url:   videoFile?.play_url ?? null,
            transcript,
            ai_summary:      aiSummary,
            recording_ready: true,
            status:          'completed',
            updated_at:      new Date().toISOString(),
          })
          .eq('zoom_meeting_id', zoomMeetingId)
      } else {
        // Insert new (meeting was created outside the portal)
        await supabase
          .from('zoom_meetings')
          .insert({
            zoom_meeting_id: zoomMeetingId,
            topic:           meetingObj.topic ?? 'Zoom Meeting',
            start_time:      meetingObj.start_time,
            duration:        meetingObj.duration,
            host_email:      meetingObj.host_email,
            recording_url:   videoFile?.play_url ?? null,
            transcript,
            ai_summary:      aiSummary,
            recording_ready: true,
            status:          'completed',
          })
      }

      console.log(`Recording processed for meeting ${zoomMeetingId}`)
    }

    // ── recording.transcript_completed — Transcript ready ──────────────────
    if (payload.event === 'recording.transcript_completed') {
      const meetingObj = payload.payload?.object
      if (!meetingObj) return new Response('OK', { status: 200 })

      const zoomMeetingId = String(meetingObj.id)

      try {
        const recs = await getMeetingRecordings(zoomMeetingId)
        const transcriptFile = (recs.recording_files ?? []).find(
          (f: any) => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript'
        )

        if (transcriptFile?.download_url) {
          const transcript = await downloadTranscript(transcriptFile.download_url)
          await supabase
            .from('zoom_meetings')
            .update({ transcript, updated_at: new Date().toISOString() })
            .eq('zoom_meeting_id', zoomMeetingId)
        }
      } catch (e) {
        console.error('Failed to process transcript:', e)
      }
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('zoom-webhook error:', err)
    return new Response('OK', { status: 200 })
  }
})
