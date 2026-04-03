import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getSupabaseAdmin, getQBInvoiceStatus } from '../_shared/qb-client.ts'

const WEBHOOK_VERIFIER_TOKEN = Deno.env.get('QB_WEBHOOK_VERIFIER_TOKEN') ?? ''

/** Verify the Intuit HMAC-SHA256 webhook signature */
async function verifySignature(payload: string, signature: string): Promise<boolean> {
  if (!WEBHOOK_VERIFIER_TOKEN) return true // Skip if no token configured

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(WEBHOOK_VERIFIER_TOKEN),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return computed === signature
}

serve(async (req) => {
  // QuickBooks webhooks are always POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('intuit-signature') ?? ''

    // Verify signature
    const valid = await verifySignature(body, signature)
    if (!valid) {
      console.error('Invalid webhook signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // Respond immediately with 200 (QuickBooks requires < 3 second response)
    // Process asynchronously
    const payload = JSON.parse(body)
    const supabase = getSupabaseAdmin()

    for (const notification of payload.eventNotifications ?? []) {
      for (const entity of notification.dataChangeEvent?.entities ?? []) {
        // We care about Payment Create/Update and Invoice Update
        if (entity.name === 'Payment' && entity.operation === 'Create') {
          // A payment was created — sync all unpaid invoices
          const { data: invoices } = await supabase
            .from('invoices')
            .select('id, qb_invoice_id')
            .not('qb_invoice_id', 'is', null)
            .neq('status', 'Paid')

          for (const inv of invoices ?? []) {
            try {
              const status = await getQBInvoiceStatus(inv.qb_invoice_id!)
              if (status.isPaid) {
                await supabase
                  .from('invoices')
                  .update({
                    status:     'Paid',
                    paid_at:    new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', inv.id)
              }
            } catch (e) {
              console.error(`Webhook: failed to check invoice ${inv.id}:`, e)
            }
          }
        }

        if (entity.name === 'Invoice' && entity.operation === 'Update') {
          // An invoice was updated in QB — sync that specific invoice
          const qbId = String(entity.id)
          const { data: inv } = await supabase
            .from('invoices')
            .select('id, qb_invoice_id')
            .eq('qb_invoice_id', qbId)
            .single()

          if (inv) {
            try {
              const status = await getQBInvoiceStatus(qbId)
              if (status.isPaid) {
                await supabase
                  .from('invoices')
                  .update({
                    status:     'Paid',
                    paid_at:    new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', inv.id)
              }
            } catch (e) {
              console.error(`Webhook: failed to update invoice ${inv.id}:`, e)
            }
          }
        }
      }
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('qb-webhook error:', err)
    // Still return 200 to prevent QuickBooks from retrying
    return new Response('OK', { status: 200 })
  }
})
