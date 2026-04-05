/**
 * Google Apps Script — Google Calendar Appointment Scheduling → EML Lead Inbox
 *
 * HOW TO SET UP:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire script
 * 3. Replace the CONFIG values below with your actual values
 * 4. Click Run → "syncNewBookings" to test
 * 5. Set up a time-driven trigger:
 *    - Click Triggers (clock icon in sidebar)
 *    - Add Trigger → syncNewBookings → Time-driven → Every 5 minutes
 *    - Save
 *
 * This checks your calendar for new appointment bookings every 5 minutes
 * and pushes them to your EML Portal as leads.
 */

// ── CONFIG — Update these values ─────────────────────────────────────────────
const CONFIG = {
  // Your Supabase Edge Function URL
  WEBHOOK_URL: 'https://hlbhfzigspxotyofrors.supabase.co/functions/v1/ingest-lead',

  // Webhook secret (set this same value as LEAD_WEBHOOK_SECRET in Supabase Edge Function secrets)
  WEBHOOK_SECRET: 'YOUR_SECRET_HERE',

  // The calendar ID to watch (usually your primary calendar email)
  CALENDAR_ID: 'primary',

  // How far back to look for new events (in minutes)
  LOOKBACK_MINUTES: 10,
}

function syncNewBookings() {
  const now = new Date()
  const lookback = new Date(now.getTime() - CONFIG.LOOKBACK_MINUTES * 60 * 1000)

  // Get events created in the lookback window
  // We use updatedMin to catch newly created events
  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
  if (!calendar) {
    Logger.log('Calendar not found: ' + CONFIG.CALENDAR_ID)
    return
  }

  // Look at events scheduled in the next 30 days that were recently created
  const futureEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const events = calendar.getEvents(now, futureEnd)

  let sent = 0
  for (const event of events) {
    const created = event.getDateCreated()

    // Only process events created in the last LOOKBACK_MINUTES
    if (created < lookback) continue

    // Skip events we've already processed (tagged in description)
    if ((event.getDescription() || '').includes('[EML-SYNCED]')) continue

    // Extract attendee info (the person who booked)
    const guests = event.getGuestList()
    const booker = guests.length > 0 ? guests[0] : null

    const name = booker ? (booker.getName() || booker.getEmail().split('@')[0]) : event.getTitle()
    const email = booker ? booker.getEmail() : ''

    const payload = {
      name: name,
      email: email,
      source: 'Google Calendar',
      service: '',
      notes: 'Booked: ' + event.getTitle() + ' on ' + event.getStartTime().toLocaleDateString() + ' at ' + event.getStartTime().toLocaleTimeString(),
      meta: {
        eventTitle: event.getTitle(),
        eventStart: event.getStartTime().toISOString(),
        eventEnd: event.getEndTime().toISOString(),
        calendarEventId: event.getId(),
      }
    }

    try {
      const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-webhook-secret': CONFIG.WEBHOOK_SECRET },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      })

      if (response.getResponseCode() === 201) {
        // Tag the event so we don't process it again
        event.setDescription((event.getDescription() || '') + '\n[EML-SYNCED]')
        sent++
        Logger.log('Sent lead: ' + name + ' (' + email + ')')
      } else {
        Logger.log('Error sending lead: ' + response.getContentText())
      }
    } catch (err) {
      Logger.log('Fetch error: ' + err.message)
    }
  }

  Logger.log('Sync complete. ' + sent + ' new leads sent.')
}
