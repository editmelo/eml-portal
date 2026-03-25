import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import useAuthStore, { selectUser } from '../../store/authStore'
import useProjectStore from '../../store/projectStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { ArrowRight, FileText, Calendar, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ClientDashboard() {
  const user     = useAuthStore(selectUser)
  const projects = useProjectStore((s) => s.projects)
  const invoices = useProjectStore((s) => s.invoices)
  const navigate = useNavigate()

  const project = projects.find((p) => p.id === user?.projectId)
  const myInvoices = invoices.filter((i) => i.clientId === user?.id)
  const pendingInvoices = myInvoices.filter((i) => i.status === 'Pending')

  const quickLinks = [
    { label: 'View Drafts', icon: <Image size={18} />, path: '/client/drafts', color: 'text-violet-600' },
    { label: 'Invoices',    icon: <FileText size={18} />, path: '/client/invoices', color: 'text-blue-600' },
    { label: 'Schedule',    icon: <Calendar size={18} />, path: '/client/schedule', color: 'text-emerald-600' },
  ]

  return (
    <PortalLayout>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
        subtitle="Here's a snapshot of your project with Edit Me Lo."
        className="mb-8"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project status card — takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {project ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">Due {formatDate(project.dueDate)}</p>
                </div>
                <StatusBadge status={project.status} />
              </CardHeader>
              <CardBody className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Project progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} color="blue" />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{project.brief}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRight size={14} />}
                  onClick={() => navigate('/client/project')}
                >
                  View full project
                </Button>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <p className="text-slate-400 text-sm">No active project linked to your account.</p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => navigate('/client/onboarding')}
                >
                  Start Onboarding
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map((l) => (
              <Card
                key={l.path}
                className="p-4 cursor-pointer hover:shadow-card-md transition-shadow"
                onClick={() => navigate(l.path)}
              >
                <span className={l.color}>{l.icon}</span>
                <p className="text-sm font-medium text-slate-700 mt-2">{l.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invoices</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {pendingInvoices.length > 0 ? (
                pendingInvoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-700">{inv.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Due {formatDate(inv.issuedAt)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(inv.amount)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No pending invoices.</p>
              )}
              {pendingInvoices.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigate('/client/invoices')}
                >
                  Pay Now
                </Button>
              )}
            </CardBody>
          </Card>

          {/* Draft notifications */}
          {project?.drafts?.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardBody>
                <p className="text-sm font-medium text-blue-800">
                  {project.drafts.length} draft{project.drafts.length > 1 ? 's' : ''} ready for review
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => navigate('/client/drafts')}
                >
                  Review Drafts →
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
