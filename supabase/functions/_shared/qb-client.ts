import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Environment ──────────────────────────────────────────────────────────────
const QB_CLIENT_ID     = Deno.env.get('QB_CLIENT_ID')!
const QB_CLIENT_SECRET = Deno.env.get('QB_CLIENT_SECRET')!
const QB_REDIRECT_URI  = Deno.env.get('QB_REDIRECT_URI')!
const QB_ENVIRONMENT   = Deno.env.get('QB_ENVIRONMENT') ?? 'sandbox'

const QB_BASE_URL = QB_ENVIRONMENT === 'production'
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com'

const QB_AUTH_URL  = 'https://appcenter.intuit.com/connect/oauth2'
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'

// ── Supabase admin client (service role) ─────────────────────────────────────
export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

// ── OAuth helpers ────────────────────────────────────────────────────────────

/** Build the Intuit OAuth2 authorization URL */
export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     QB_CLIENT_ID,
    response_type: 'code',
    scope:         'com.intuit.quickbooks.accounting',
    redirect_uri:  QB_REDIRECT_URI,
    state,
  })
  return `${QB_AUTH_URL}?${params}`
}

/** Exchange an authorization code for access + refresh tokens */
export async function exchangeCode(code: string) {
  const basic = btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)
  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Accept':        'application/json',
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: QB_REDIRECT_URI,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json()
}

/** Refresh an expired access token */
export async function refreshAccessToken(refreshToken: string) {
  const basic = btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)
  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Accept':        'application/json',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }
  return res.json()
}

// ── Token management ─────────────────────────────────────────────────────────

/** Get a valid access token, refreshing if expired */
export async function getValidToken() {
  const supabase = getSupabaseAdmin()
  const { data: tokens, error } = await supabase
    .from('qb_tokens')
    .select('*')
    .limit(1)
    .single()

  if (error || !tokens) throw new Error('QuickBooks not connected')

  // If access token is still valid (with 5 min buffer), return it
  const expiresAt = new Date(tokens.access_token_expires_at)
  if (expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return { accessToken: tokens.access_token, realmId: tokens.realm_id }
  }

  // Refresh the token
  const refreshed = await refreshAccessToken(tokens.refresh_token)

  const now = new Date()
  const newAccessExpiry  = new Date(now.getTime() + refreshed.expires_in * 1000)
  const newRefreshExpiry = new Date(now.getTime() + (refreshed.x_refresh_token_expires_in ?? 8640000) * 1000)

  await supabase
    .from('qb_tokens')
    .update({
      access_token:             refreshed.access_token,
      refresh_token:            refreshed.refresh_token,
      access_token_expires_at:  newAccessExpiry.toISOString(),
      refresh_token_expires_at: newRefreshExpiry.toISOString(),
      updated_at:               now.toISOString(),
    })
    .eq('id', tokens.id)

  return { accessToken: refreshed.access_token, realmId: tokens.realm_id }
}

// ── QuickBooks API helpers ───────────────────────────────────────────────────

/** Make an authenticated request to the QuickBooks API */
export async function qbFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const { accessToken, realmId } = await getValidToken()
  const url = `${QB_BASE_URL}/v3/company/${realmId}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QuickBooks API error (${res.status}): ${err}`)
  }

  return res.json()
}

/** Create an invoice in QuickBooks */
export async function createQBInvoice(invoice: {
  customerRef: string
  lineItems: Array<{ description: string; amount: number; qty?: number }>
  dueDate: string
  billEmail: string
}) {
  const lines = invoice.lineItems.map((item, idx) => ({
    Amount:     item.amount,
    DetailType: 'SalesItemLineDetail',
    Description: item.description,
    LineNum:    idx + 1,
    SalesItemLineDetail: {
      ItemRef:   { value: '1', name: 'Services' },
      Qty:       item.qty ?? 1,
      UnitPrice: item.amount,
    },
  }))

  const body = {
    CustomerRef: { value: invoice.customerRef },
    Line: lines,
    DueDate: invoice.dueDate,
    BillEmail: { Address: invoice.billEmail },
    EmailStatus: 'NeedToSend',
  }

  const result = await qbFetch('/invoice?minorversion=65', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return result.Invoice
}

/** Get an invoice with its payment link */
export async function getQBInvoiceWithLink(invoiceId: string) {
  const result = await qbFetch(
    `/invoice/${invoiceId}?minorversion=65&include=invoiceLink`,
  )
  return result.Invoice
}

/** Query QuickBooks for invoice status */
export async function getQBInvoiceStatus(invoiceId: string) {
  const result = await qbFetch(`/invoice/${invoiceId}?minorversion=65`)
  const inv = result.Invoice
  return {
    balance: inv.Balance,
    totalAmt: inv.TotalAmt,
    isPaid: inv.Balance === 0,
    status: inv.Balance === 0 ? 'Paid' : 'Pending',
  }
}

/** Send an invoice via QuickBooks email */
export async function sendQBInvoice(invoiceId: string) {
  return qbFetch(`/invoice/${invoiceId}/send?minorversion=65`, {
    method: 'POST',
  })
}

/** Query all customers from QuickBooks */
export async function getQBCustomers() {
  const result = await qbFetch(
    `/query?query=${encodeURIComponent("SELECT * FROM Customer MAXRESULTS 100")}&minorversion=65`,
  )
  return result.QueryResponse?.Customer ?? []
}

export { QB_ENVIRONMENT }
