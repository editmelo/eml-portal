import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useProjectStore from '../../store/projectStore'
import useThemeStore from '../../store/themeStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { UserPlus, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  'New':            'brand',
  'Contacted':      'info',
  'Proposal Sent':  'warning',
  'Converted':      'success',
}

export default function AdminLeads() {
  const isDark = useThemeStore((s) => s.adminTheme) === 'dark'
  const leads       = useProjectStore((s) => s.leads)
  const convertLead = useProjectStore((s) => s.convertLead)
  const updateLead  = useProjectStore((s) => s.updateLead)

  const totalPotential = leads
    .filter((l) => !l.converted)
    .reduce((s, l) => s + l.potentialValue, 0)

  const handleConvert = (leadId) => {
    convertLead(leadId)
    toast.success('Lead converted to project!')
  }

  return (
    <AdminLayout>
      <PageHeader
        dark={isDark}
        title="Lead Management"
        subtitle={`${leads.filter((l) => !l.converted).length} open leads · ${formatCurrency(totalPotential)} potential revenue`}
        actions={
          <Button size="sm" icon={<UserPlus size={14} />}>
            Add Lead
          </Button>
        }
        className="mb-8"
      />

      <DarkCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Contact', 'Service', 'Potential', 'Source', 'Status', 'Submitted', 'Action'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-admin-border/50 hover:bg-admin-surface/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="text-slate-100 font-medium">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.company}</p>
                    <p className="text-xs text-slate-600">{lead.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{lead.service}</td>
                  <td className="px-5 py-4 text-slate-200 font-semibold">
                    {formatCurrency(lead.potentialValue)}
                  </td>
                  <td className="px-5 py-4 text-slate-400">{lead.source}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE[lead.status] ?? 'default'}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(lead.submittedAt)}</td>
                  <td className="px-5 py-4">
                    {!lead.converted ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<CheckCircle2 size={14} />}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                        onClick={() => handleConvert(lead.id)}
                      >
                        Convert
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600">Converted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DarkCard>
    </AdminLayout>
  )
}
