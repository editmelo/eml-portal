import { supabase } from './supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

/** Get the auth header for edge function calls */
async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// ── Connection ───────────────────────────────────────────────────────────────

/** Start the QuickBooks OAuth flow — returns the Intuit authorization URL */
export async function connectQuickBooks() {
  const res = await fetch(`${FUNCTIONS_URL}/qb-auth?action=connect`, {
    headers: await authHeaders(),
  })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  }
  return data
}

/** Check if QuickBooks is connected */
export async function getQBConnectionStatus() {
  const res = await fetch(`${FUNCTIONS_URL}/qb-auth?action=status`, {
    headers: await authHeaders(),
  })
  return res.json()
}

/** Disconnect QuickBooks */
export async function disconnectQuickBooks() {
  const res = await fetch(`${FUNCTIONS_URL}/qb-auth?action=disconnect`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  return res.json()
}

// ── Invoices ─────────────────────────────────────────────────────────────────

/** Create a new invoice (syncs to QuickBooks if connected) */
export async function createInvoice(data) {
  const res = await fetch(`${FUNCTIONS_URL}/qb-invoice`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create invoice')
  }
  return res.json()
}

/** List all invoices (or filter by clientId) */
export async function listInvoices(clientId = null) {
  const params = clientId ? `?clientId=${clientId}` : ''
  const res = await fetch(`${FUNCTIONS_URL}/qb-invoice${params}`, {
    headers: await authHeaders(),
  })
  return res.json()
}

/** Get a single invoice */
export async function getInvoice(id) {
  const res = await fetch(`${FUNCTIONS_URL}/qb-invoice?id=${id}`, {
    headers: await authHeaders(),
  })
  return res.json()
}

/** Send an invoice email via QuickBooks */
export async function sendInvoice(invoiceId) {
  const res = await fetch(`${FUNCTIONS_URL}/qb-invoice?action=send`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ invoiceId }),
  })
  return res.json()
}

/** Sync invoice statuses from QuickBooks */
export async function syncInvoiceStatuses() {
  const res = await fetch(`${FUNCTIONS_URL}/qb-invoice?action=sync`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  return res.json()
}

/** Get QuickBooks customers for invoice creation form */
export async function getQBCustomers() {
  const res = await fetch(`${FUNCTIONS_URL}/qb-invoice?action=customers`, {
    headers: await authHeaders(),
  })
  return res.json()
}

// ── Direct Supabase queries (for real-time / faster reads) ───────────────────

/** Fetch invoices directly from Supabase (no edge function needed for reads) */
export async function fetchInvoicesFromDB(clientId = null) {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Subscribe to real-time invoice updates */
export function subscribeToInvoices(clientId, onUpdate) {
  const channel = supabase
    .channel('invoice-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoices',
        ...(clientId ? { filter: `client_id=eq.${clientId}` } : {}),
      },
      (payload) => onUpdate(payload),
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
