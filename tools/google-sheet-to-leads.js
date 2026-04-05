/**
 * Google Apps Script — Website Form (Google Sheet) → EML Lead Inbox
 *
 * HOW TO SET UP:
 * 1. Open your Google Sheet (the one connected to your website popup form)
 * 2. Go to Extensions → Apps Script
 * 3. Paste this entire script
 * 4. Replace the CONFIG values below with your actual values
 * 5. Update COLUMN_MAP to match your sheet's column layout
 * 6. Set up a trigger:
 *    - Click Triggers (clock icon in sidebar)
 *    - Add Trigger → onFormSubmit → From spreadsheet → On form submit
 *    - Save
 *    OR if rows are added by Zapier/other tools:
 *    - Add Trigger → syncNewRows → Time-driven → Every 5 minutes
 *
 * When a new row is added to the sheet, it automatically pushes the
 * lead data to your EML Portal.
 */

// ── CONFIG — Update these values ─────────────────────────────────────────────
const CONFIG = {
  // Your Supabase Edge Function URL
  WEBHOOK_URL: 'https://hlbhfzigspxotyofrors.supabase.co/functions/v1/ingest-lead',

  // Webhook secret (set this same value as LEAD_WEBHOOK_SECRET in Supabase Edge Function secrets)
  WEBHOOK_SECRET: 'eml-leads-2026-secret',

  // Name of the sheet tab (usually "Sheet1" or "Form Responses 1")
  SHEET_NAME: 'Sheet1',
}

// ── COLUMN MAP — Matches the Website Plug Sheet layout ───────────────────────
const COLUMN_MAP = {
  name:    2,   // Column B — name
  email:   3,   // Column C — email
  phone:   4,   // Column D — phone
  company: 5,   // Column E — business name
  service: 0,   // not a single column — built from description + pages
  notes:   16,  // Column P — special requests
}

// Extra columns to pull into meta (passed along as extra context)
// NOTE: Column M (13) = Existing/Listing URL, Column N (14) = Content Ready, etc.
const EXTRA_COLUMNS = {
  industry:       6,   // Column F
  description:    7,   // Column G
  pages:          8,   // Column H
  pagesNeeded:    9,   // Column I
  hasLogo:        10,  // Column J
  brandColors:    11,  // Column K
  referenceSites: 12,  // Column L
  listingUrl:     13,  // Column M
  contentReady:   14,  // Column N
  socialLinks:    15,  // Column O
  specialRequests:16,  // Column P
  generatedPrompt:17,  // Column Q
}

// ── STATUS COLUMN — Tracks which rows have been sent ─────────────────────────
// Using Column R (18) — first empty column after Q
const STATUS_COLUMN = 18  // Column R


/**
 * Trigger: runs when a Google Form submits a response to this sheet.
 * Set up: Triggers → onFormSubmit → From spreadsheet → On form submit
 */
function onFormSubmit(e) {
  if (!e || !e.range) return

  const sheet = e.range.getSheet()
  const row = e.range.getRow()
  sendRow(sheet, row)
}

/**
 * Trigger: runs on a timer to catch rows added by non-Form sources.
 * Set up: Triggers → syncNewRows → Time-driven → Every 5 minutes
 */
function syncNewRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME)
  if (!sheet) { Logger.log('Sheet not found: ' + CONFIG.SHEET_NAME); return }

  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return  // No data rows

  let sent = 0
  for (let row = 2; row <= lastRow; row++) {
    const status = sheet.getRange(row, STATUS_COLUMN).getValue()
    if (status === 'Sent to EML') continue  // Already processed

    sendRow(sheet, row)
    sent++
  }

  Logger.log('Sync complete. ' + sent + ' new rows sent.')
}

/**
 * Send a single row to the EML webhook
 */
function sendRow(sheet, row) {
  const getValue = (col) => col ? String(sheet.getRange(row, col).getValue()).trim() : ''

  const name = getValue(COLUMN_MAP.name)
  if (!name) return  // Skip empty rows

  // Build service string from description + pages needed
  const description = getValue(EXTRA_COLUMNS.description)
  const pagesNeeded = getValue(EXTRA_COLUMNS.pagesNeeded)
  const service = [description, pagesNeeded ? (pagesNeeded + ' pages') : ''].filter(Boolean).join(' — ')

  // Pull all the extra form fields into meta so nothing is lost
  const meta = {
    sheetRow: row,
    sheetName: sheet.getName(),
    submittedAt: String(sheet.getRange(row, 1).getValue()),
  }
  for (const [key, col] of Object.entries(EXTRA_COLUMNS)) {
    const val = getValue(col)
    if (val) meta[key] = val
  }

  const payload = {
    name:    name,
    email:   getValue(COLUMN_MAP.email),
    phone:   getValue(COLUMN_MAP.phone),
    company: getValue(COLUMN_MAP.company),
    service: service,
    source:  'Website Form',
    notes:   getValue(COLUMN_MAP.notes),
    meta:    meta,
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
      sheet.getRange(row, STATUS_COLUMN).setValue('Sent to EML')
      Logger.log('Row ' + row + ' sent: ' + name)
    } else {
      sheet.getRange(row, STATUS_COLUMN).setValue('Error: ' + response.getResponseCode())
      Logger.log('Error for row ' + row + ': ' + response.getContentText())
    }
  } catch (err) {
    sheet.getRange(row, STATUS_COLUMN).setValue('Error: ' + err.message)
    Logger.log('Fetch error row ' + row + ': ' + err.message)
  }
}

/**
 * Manual test: send all unsent rows
 * Run this from the Apps Script editor to test the setup
 */
function testSendAll() {
  syncNewRows()
}
