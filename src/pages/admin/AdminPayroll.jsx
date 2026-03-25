import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Pencil, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const designers = []

export default function AdminPayroll() {
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const payroll         = useProjectStore((s) => s.payroll)
  const projects        = useProjectStore((s) => s.projects)
  const setDesignerPayout = useProjectStore((s) => s.setDesignerPayout)

  const [editing, setEditing] = useState(null)   // { projectId, designerId }
  const [editVal, setEditVal] = useState('')

  const getDesigner  = (id) => designers.find((d) => d.id === id)
  const getProject   = (id) => projects.find((p) => p.id === id)

  const totalPending = payroll
    .filter((p) => p.status === 'Pending')
    .reduce((s, p) => s + p.amount, 0)

  const startEdit = (entry) => {
    setEditing({ projectId: entry.projectId, designerId: entry.designerId })
    setEditVal(String(entry.amount))
  }

  const saveEdit = (entry) => {
    const amount = parseFloat(editVal)
    if (isNaN(amount) || amount < 0) {
      toast.error('Enter a valid amount')
      return
    }
    setDesignerPayout(entry.projectId, entry.designerId, amount)
    setEditing(null)
    toast.success('Payout updated')
  }

  const isEditing = (entry) =>
    editing?.projectId === entry.projectId && editing?.designerId === entry.designerId

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="Designer Payroll"
        subtitle={`${formatCurrency(totalPending)} outstanding payouts`}
        className="mb-8"
      />

      <DarkCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Designer', 'Project', 'Payout Amount', 'Status', 'Due / Paid', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payroll.map((entry) => {
                const designer = getDesigner(entry.designerId)
                const project  = getProject(entry.projectId)
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-admin-border/50 hover:bg-admin-surface/50 transition-colors"
                  >
                    <td className="px-5 py-4 text-slate-100 font-medium">
                      {designer?.name ?? entry.designerId}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {project?.name ?? entry.projectId}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing(entry) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            className="admin-input w-28 py-1"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(entry)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-100 font-semibold">
                          {formatCurrency(entry.amount)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={entry.status === 'Paid' ? 'success' : 'warning'}>
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {entry.paidDate ? formatDate(entry.paidDate) : formatDate(entry.dueDate) ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      {!isEditing(entry) && (
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-slate-500 hover:text-brand-400 transition-colors"
                          title="Edit payout"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DarkCard>
    </AdminLayout>
  )
}
