import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Calendar, Video } from 'lucide-react'

const BOOKING_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0n0b_igWSiP1IMClg0q2APw7c47V3ZmroNvwCecZbqUWJZ-A3bFzopk7DV7ppYSC8oFaPmtyvM'

export default function ClientSchedule() {
  return (
    <PortalLayout>
      <PageHeader title="Schedule a Call" subtitle="Book time directly on the Edit Me Lo calendar." className="mb-8" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="flex flex-col items-center text-center py-10 gap-4">
            <div className="p-4 bg-blue-100 rounded-2xl">
              <Video size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Discovery Call</h3>
              <p className="text-sm text-slate-500 mt-1">30 minutes · Free</p>
            </div>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Book Now
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col items-center text-center py-10 gap-4">
            <div className="p-4 bg-emerald-100 rounded-2xl">
              <Calendar size={32} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Project Check-in</h3>
              <p className="text-sm text-slate-500 mt-1">15 minutes · Existing clients</p>
            </div>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Book Now
            </a>
          </CardBody>
        </Card>
      </div>

      {/* Open calendar in popup */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.open(BOOKING_URL, '_blank', 'width=900,height=700,noopener,noreferrer')}
          className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Open Booking Calendar
        </button>
      </div>
    </PortalLayout>
  )
}
