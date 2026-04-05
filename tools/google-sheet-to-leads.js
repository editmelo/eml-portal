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
  WEBHOOK_SECRET: 'YOUR_SECRET_HERE',

  // Name of the sheet tab (usually "Sheet1" or "Form Responses 1")
  SHEET_NAME: 'Sheet1',
}

// ── COLUMN MAP — Map your sheet columns to lead fields ───────────────────────
// Update the column numbers (1-based) to match YOUR sheet's layout.
// Set to 0 or null to skip a field.
const COLUMN_MAP = {
  name:    2,  // Column B — full name
  email:   3,  // Column C — email
  phone:   4,  // Column D — phone number
  company: 5,  // Column E — business/company name
  service: 6,  // Column F — what service they're interested in
  notes:   7,  // Column G — any additional notes/message
  // Column A (1) is usually the timestamp
}

// ── STATUS COLUMN — Tracks which rows have been sent ─────────────────────────
// This script will add a "Sent to EML" status in this column
const STATUS_COLUMN = 10  // Column J — change to an unused column in your sheet


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

  const payload = {
    name:    name,
    email:   getValue(COLUMN_MAP.email),
    phone:   getValue(COLUMN_MAP.phone),
    company: getValue(COLUMN_MAP.company),
    service: getValue(COLUMN_MAP.service),
    source:  'Website Form',
    notes:   getValue(COLUMN_MAP.notes),
    meta: {
      sheetRow: row,
      sheetName: sheet.getName(),
      submittedAt: String(sheet.getRange(row, 1).getValue()),  // Timestamp column
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
