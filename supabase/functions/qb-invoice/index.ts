import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getSupabaseAdmin,
  createQBInvoice,
  getQBInvoiceWithLink,
  getQBInvoiceStatus,
  sendQBInvoice,
  getQBCustomers,
} from '../_shared/qb-client.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const supabase = getSupabaseAdmin()

  try {
    // ── POST — Create a new invoice ────────────────────────────────────────
    if (req.method === 'POST') {
      const action = url.searchParams.get('action')

      // Send an existing invoice via QB email
      if (action === 'send') {
        const { invoiceId } = await req.json()
        const { data: inv } = await supabase
          .from('invoices')
          .select('qb_invoice_id')
          .eq('id', invoiceId)
          .single()

        if (!inv?.qb_invoice_id) {
          return new Response(JSON.stringify({ error: 'Invoice not synced to QuickBooks' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        await sendQBInvoice(inv.qb_invoice_id)
        return new Response(JSON.stringify({ sent: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Sync invoice statuses from QB
      if (action === 'sync') {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, qb_invoice_id, status')
          .not('qb_invoice_id', 'is', null)
          .neq('status', 'Paid')

        if (!invoices?.length) {
          return new Response(JSON.stringify({ synced: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        let synced = 0
        for (const inv of invoices) {
          try {
            const status = await getQBInvoiceStatus(inv.qb_invoice_id!)
            if (status.isPaid && inv.status !== 'Paid') {
              await supabase
                .from('invoices')
                .update({
                  status:     'Paid',
                  paid_at:    new Date().toISOString().split('T')[0],
                  updated_at: new Date().toISOString(),
                })
                .eq('id', inv.id)
              synced++
            }
          } catch (e) {
            console.error(`Failed to sync invoice ${inv.id}:`, e)
          }
        }

        return new Response(JSON.stringify({ synced }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create new invoice
      const body = await req.json()
      const {
        projectId,
        clientId,
        clientName,
        clientEmail,
        description,
        lineItems,
        amount,
        dueDate,
        qbCustomerId,
      } = body

      // 1. Create in QuickBooks
      let qbInvoice = null
      let paymentLink = null
      let qbInvoiceId = null

      if (qbCustomerId) {
        try {
          qbInvoice = await createQBInvoice({
            customerRef: qbCustomerId,
            lineItems: lineItems ?? [{ description, amount, qty: 1 }],
            dueDate,
            billEmail: clientEmail,
          })
          qbInvoiceId = String(qbInvoice.Id)

          // 2. Fetch the payment link
          const withLink = await getQBInvoiceWithLink(qbInvoiceId)
          paymentLink = withLink.InvoiceLink ?? null
        } catch (e) {
          console.error('QB invoice creation failed:', e)
          // Continue — save to DB without QB sync
        }
      }

      // 3. Save to Supabase
      const { data: newInvoice, error } = await supabase
        .from('invoices')
        .insert({
          project_id:     projectId ?? null,
          client_id:      clientId ?? null,
          client_name:    clientName,
          client_email:   clientEmail,
          description,
          line_items:     lineItems ?? [{ description, amount, qty: 1 }],
          amount,
          status:         'Pending',
          issued_at:      new Date().toISOString().split('T')[0],
          due_date:       dueDate,
          qb_invoice_id:  qbInvoiceId,
          qb_customer_id: qbCustomerId ?? null,
          payment_link:   paymentLink,
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(newInvoice), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── GET — List or get single invoice ───────────────────────────────────
    if (req.method === 'GET') {
      const action = url.searchParams.get('action')

      // Get QuickBooks customers for the invoice form
      if (action === 'customers') {
        const customers = await getQBCustomers()
        return new Response(JSON.stringify(customers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const id = url.searchParams.get('id')

      if (id) {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // List all invoices
      const clientId = url.searchParams.get('clientId')
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
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
    console.error('qb-invoice error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
