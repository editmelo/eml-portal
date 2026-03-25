import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DesignerEarnings() {
  const user     = useAuthStore(selectUser)
  const payroll  = useProjectStore((s) => s.payroll)
  const projects = useProjectStore((s) => s.projects)

  const myPayroll   = payroll.filter((p) => p.designerId === user?.id)
  const totalEarned = myPayroll.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const pending     = myPayroll.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)

  const getProject = (id) => projects.find((p) => p.id === id)

  return (
    <PortalLayout>
      <PageHeader
        title="Earnings"
        subtitle="Your payouts set by Edit Me Lo per project."
        className="mb-8"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-5 border-emerald-200 bg-emerald-50">
          <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium mb-1">Total Earned</p>
          <p className="text-3xl font-bold text-emerald-800">{formatCurrency(totalEarned)}</p>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50">
          <p className="text-xs text-amber-600 uppercase tracking-wider font-medium mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-800">{formatCurrency(pending)}</p>
          {pending > 0 && <p className="text-xs text-amber-600 mt-1">Released upon project completion</p>}
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payout Breakdown</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={13} />}
            onClick={() => toast('Invoice download coming soon!')}
          >
            Export
          </Button>
        </CardHeader>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {myPayroll.map((entry) => {
            const project = getProject(entry.projectId)
            return (
              <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{project?.name ?? entry.projectId}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.status === 'Paid' ? `Paid ${formatDate(entry.paidDate)}` : `Due ${formatDate(entry.dueDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(entry.amount)}</p>
                  <Badge variant={entry.status === 'Paid' ? 'success' : 'warning'}>{entry.status}</Badge>
                </div>
              </div>
            )
          })}
          {myPayroll.length === 0 && (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">No payouts yet.</div>
          )}
        </div>
      </Card>
    </PortalLayout>
  )
}
