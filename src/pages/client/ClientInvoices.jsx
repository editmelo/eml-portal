import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { CreditCard, CheckCircle2, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_VARIANT = { Paid: 'success', Pending: 'warning', Overdue: 'danger', Draft: 'default' }

export default function ClientInvoices() {
  const user          = useAuthStore(selectUser)
  const invoices      = useProjectStore((s) => s.invoices)
  const markPaid      = useProjectStore((s) => s.markInvoicePaid)

  const myInvoices    = invoices.filter((i) => i.clientId === user?.id)
  const totalPaid     = myInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const totalPending  = myInvoices.filter((i) => i.status === 'Pending').reduce((s, i) => s + i.amount, 0)

  const handlePay = (invId) => {
    markPaid(invId)
    toast.success('Payment recorded! (Demo — wire to Stripe in production)')
  }

  return (
    <PortalLayout>
      <PageHeader title="Invoices" subtitle="Your billing history and outstanding balances." className="mb-6" />

      {/* QuickBooks integration notice */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-8">
        <Link2 size={16} className="text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">QuickBooks integration coming soon.</span>{' '}
          Invoices will sync automatically once connected. For now, your billing history is shown below.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50">
          <p className="text-xs text-amber-600 uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(totalPending)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice History</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {myInvoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-2.5 rounded-lg ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}
                >
                  {inv.status === 'Paid' ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{inv.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Issued {formatDate(inv.issuedAt)}
                    {inv.paidAt ? ` · Paid ${formatDate(inv.paidAt)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold text-slate-800">{formatCurrency(inv.amount)}</p>
                <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                {inv.status === 'Pending' && (
                  <Button size="sm" onClick={() => handlePay(inv.id)}>
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          ))}
          {myInvoices.length === 0 && (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">No invoices yet.</div>
          )}
        </div>
      </Card>
    </PortalLayout>
  )
}
