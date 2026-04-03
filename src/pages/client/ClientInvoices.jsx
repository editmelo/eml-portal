import { useState, useEffect } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { fetchInvoicesFromDB, subscribeToInvoices } from '../../lib/quickbooks'
import { CreditCard, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'

const STATUS_VARIANT = { Paid: 'success', Pending: 'warning', Overdue: 'danger', Draft: 'default' }

export default function ClientInvoices() {
  const user = useAuthStore(selectUser)

  // Try Supabase first, fallback to Zustand store
  const zustandInvoices = useProjectStore((s) => s.invoices)
  const [dbInvoices, setDbInvoices] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user?.id) return

    fetchInvoicesFromDB(user.id)
      .then((data) => {
        setDbInvoices(data)
        setLoading(false)
      })
      .catch(() => {
        // Supabase table might not exist yet — fall back to Zustand
        setDbInvoices(null)
        setLoading(false)
      })

    // Subscribe to real-time invoice updates
    const unsub = subscribeToInvoices(user.id, () => {
      fetchInvoicesFromDB(user.id).then(setDbInvoices).catch(() => {})
    })

    return unsub
  }, [user?.id])

  // Use Supabase data if available, otherwise fall back to Zustand (mock data)
  const useSupabase = dbInvoices !== null && dbInvoices.length > 0
  const myInvoices = useSupabase
    ? dbInvoices
    : zustandInvoices.filter((i) => i.clientId === user?.id)

  // Normalize field names (Supabase uses snake_case, Zustand uses camelCase)
  const normalize = (inv) => ({
    id:          inv.id,
    description: inv.description,
    amount:      Number(inv.amount),
    status:      inv.status,
    issuedAt:    inv.issued_at ?? inv.issuedAt,
    paidAt:      inv.paid_at ?? inv.paidAt,
    dueDate:     inv.due_date ?? inv.dueDate,
    paymentLink: inv.payment_link ?? inv.paymentLink ?? null,
  })

  const normalized  = myInvoices.map(normalize)
  const totalPaid    = normalized.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = normalized.filter((i) => i.status === 'Pending').reduce((s, i) => s + i.amount, 0)

  return (
    <PortalLayout>
      <PageHeader title="Invoices" subtitle="Your billing history and outstanding balances." className="mb-6" />

      {/* QuickBooks status */}
      {useSupabase && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40 mb-8">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold">Invoices synced with QuickBooks.</span>{' '}
            Click "Pay Now" to make a payment securely through Intuit.
          </p>
        </div>
      )}

      {!useSupabase && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40 mb-8">
          <CreditCard size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Invoice sync coming soon.</span>{' '}
            Your billing history is shown below. Payment links will be available once invoicing is connected.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/40">
          <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{formatCurrency(totalPending)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice History</CardTitle></CardHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {normalized.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2.5 rounded-lg ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {inv.status === 'Paid' ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{inv.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Issued {formatDate(inv.issuedAt)}
                      {inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ''}
                      {inv.paidAt ? ` · Paid ${formatDate(inv.paidAt)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatCurrency(inv.amount)}</p>
                  <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                  {inv.status === 'Pending' && inv.paymentLink && (
                    <a
                      href={inv.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm">
                        <ExternalLink size={12} className="mr-1" />
                        Pay Now
                      </Button>
                    </a>
                  )}
                  {inv.status === 'Pending' && !inv.paymentLink && (
                    <Button size="sm" disabled className="opacity-50 cursor-not-allowed">
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {normalized.length === 0 && (
              <div className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">No invoices yet.</div>
            )}
          </div>
        )}
      </Card>
    </PortalLayout>
  )
}
