import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import { DarkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import useThemeStore from '../../store/themeStore'
import useProjectStore from '../../store/projectStore'
import { cn, formatDate } from '../../lib/utils'
import { createMeeting, fetchMeetingsFromDB, syncRecordings } from '../../lib/zoom'
import {
  Video, FileText, RefreshCw, Plus, X, Clock,
  CheckCircle2, ExternalLink, ChevronDown, ChevronUp,
  Loader2, Calendar, Mic,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  scheduled: { variant: 'warning', label: 'Scheduled' },
  completed: { variant: 'success', label: 'Completed' },
}

export default function AdminMeetingNotes() {
  const isDark   = useThemeStore((s) => s.adminTheme) === 'dark'
  const projects = useProjectStore((s) => s.projects)

  const [meetings, setMeetings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded]     = useState(null)

  const loadMeetings = async () => {
    try {
      const data = await fetchMeetingsFromDB()
      setMeetings(data)
    } catch {
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMeetings() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncRecordings()
      toast.success(`Synced ${result.synced} recording(s)`)
      await loadMeetings()
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const text    = isDark ? 'text-white' : 'text-slate-800'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'

  const completedMeetings = meetings.filter((m) => m.recording_ready)
  const scheduledMeetings = meetings.filter((m) => !m.recording_ready)

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader dark={isDark} title="Meeting Notes" subtitle="Zoom recordings, transcripts, and AI summaries" />
        <div className="flex items-center gap-2">
          <Button
            variant={isDark ? 'outline' : 'secondary'}
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className={cn(isDark && 'border-admin-border text-slate-300 hover:bg-admin-surface')}
          >
            <RefreshCw size={14} className={cn(syncing && 'animate-spin')} />
            Sync Recordings
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New Meeting
          </Button>
        </div>
      </div>

      {/* Scheduled meetings */}
      {scheduledMeetings.length > 0 && (
        <div className="mb-6">
          <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', subText)}>Upcoming</p>
          <div className="grid gap-3">
            {scheduledMeetings.map((mtg) => (
              <DarkCard key={mtg.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
                    )}>
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', text)}>{mtg.topic}</p>
                      <p className={cn('text-xs mt-0.5', subText)}>
                        {mtg.start_time ? formatDate(mtg.start_time) : 'No date set'}
                        {mtg.duration ? ` · ${mtg.duration} min` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Scheduled</Badge>
                    {mtg.join_url && (
                      <a href={mtg.join_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant={isDark ? 'outline' : 'secondary'} className={cn(isDark && 'border-admin-border text-slate-300')}>
                          <ExternalLink size={12} className="mr-1" />
                          Join
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </DarkCard>
            ))}
          </div>
        </div>
      )}

      {/* Completed meetings with recordings */}
      <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', subText)}>
        Recordings & Transcripts
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className={cn('animate-spin', subText)} />
        </div>
      ) : completedMeetings.length === 0 && scheduledMeetings.length === 0 ? (
        <DarkCard className="text-center py-12">
          <Video size={32} className={cn('mx-auto mb-3', subText)} />
          <p className={cn('text-sm', subText)}>
            No meetings yet. Create a meeting or sync your Zoom recordings.
          </p>
        </DarkCard>
      ) : completedMeetings.length === 0 ? (
        <DarkCard className="text-center py-8">
          <p className={cn('text-sm', subText)}>No recordings yet. Click "Sync Recordings" after your meetings.</p>
        </DarkCard>
      ) : (
        <div className="space-y-3">
          {completedMeetings.map((mtg) => {
            const isExpanded = expanded === mtg.id
            return (
              <DarkCard key={mtg.id} className="overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : mtg.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-5 py-4 text-left transition-colors',
                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      <Video size={16} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', text)}>{mtg.topic}</p>
                      <p className={cn('text-xs mt-0.5', subText)}>
                        {mtg.start_time ? formatDate(mtg.start_time) : ''}
                        {mtg.duration ? ` · ${mtg.duration} min` : ''}
                        {mtg.transcript ? ' · Transcript available' : ''}
                        {mtg.ai_summary ? ' · AI Summary' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Completed</Badge>
                    {isExpanded ? <ChevronUp size={16} className={subText} /> : <ChevronDown size={16} className={subText} />}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className={cn(
                    'px-5 pb-5 border-t space-y-4',
                    isDark ? 'border-admin-border' : 'border-slate-100'
                  )}>
                    {/* Recording link */}
                    {mtg.recording_url && (
                      <div className="pt-4">
                        <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', subText)}>Recording</p>
                        <a
                          href={mtg.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                            isDark ? 'bg-admin-bg border border-admin-border text-admin-accent hover:bg-white/5' : 'bg-slate-50 border border-slate-200 text-brand-500 hover:bg-slate-100'
                          )}
                        >
                          <Video size={14} />
                          Watch Recording
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* AI Summary */}
                    {mtg.ai_summary && (
                      <div>
                        <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', subText)}>
                          <Mic size={12} className="inline mr-1" />
                          AI Summary
                        </p>
                        <div className={cn(
                          'p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap',
                          isDark ? 'bg-admin-bg border border-admin-border text-slate-300' : 'bg-blue-50 border border-blue-100 text-slate-700'
                        )}>
                          {mtg.ai_summary}
                        </div>
                      </div>
                    )}

                    {/* Transcript */}
                    {mtg.transcript && (
                      <div>
                        <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', subText)}>
                          <FileText size={12} className="inline mr-1" />
                          Transcript
                        </p>
                        <div className={cn(
                          'p-4 rounded-lg text-sm leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap',
                          isDark ? 'bg-admin-bg border border-admin-border text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-700'
                        )}>
                          {mtg.transcript}
                        </div>
                      </div>
                    )}

                    {!mtg.transcript && !mtg.ai_summary && !mtg.recording_url && (
                      <p className={cn('text-sm pt-4', subText)}>
                        No recording data yet. Make sure Cloud Recording and Audio Transcript are enabled in your Zoom settings.
                      </p>
                    )}
                  </div>
                )}
              </DarkCard>
            )
          })}
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreate && (
        <CreateMeetingModal
          isDark={isDark}
          projects={projects}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadMeetings()
          }}
        />
      )}
    </AdminLayout>
  )
}

// ── Create Meeting Modal ─────────────────────────────────────────────────────
function CreateMeetingModal({ isDark, projects, onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    topic:     '',
    startDate: '',
    startTime: '',
    duration:  '60',
    projectId: '',
    agenda:    '',
  })

  const text    = isDark ? 'text-white' : 'text-slate-800'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2',
    isDark
      ? 'bg-admin-bg border-admin-border text-slate-200 placeholder-slate-600 focus:ring-admin-accent/40'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-brand-500/30'
  )
  const labelCls = cn('block text-xs font-medium mb-1.5', subText)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.topic || !form.startDate || !form.startTime) {
      toast.error('Please fill in topic, date, and time')
      return
    }

    setSaving(true)
    try {
      const startTime = `${form.startDate}T${form.startTime}:00`
      const result = await createMeeting({
        topic:     form.topic,
        startTime,
        duration:  parseInt(form.duration),
        projectId: form.projectId || null,
        agenda:    form.agenda,
      })
      toast.success('Zoom meeting created!')
      onCreated()
    } catch (err) {
      toast.error(err.message ?? 'Failed to create meeting')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-lg mx-4 rounded-2xl border shadow-2xl',
        isDark ? 'bg-admin-surface border-admin-border' : 'bg-white border-slate-200'
      )}>
        <div className={cn(
          'flex items-center justify-between px-6 py-4 border-b',
          isDark ? 'border-admin-border' : 'border-slate-100'
        )}>
          <h2 className={cn('text-lg font-semibold', text)}>Schedule Zoom Meeting</h2>
          <button onClick={onClose} className={cn('p-1 rounded-lg', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}>
            <X size={18} className={subText} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Meeting Topic *</label>
            <input
              className={inputCls}
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="Discovery Call — Jane Smith"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date *</label>
              <input
                className={inputCls}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Time *</label>
              <input
                className={inputCls}
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Duration (min)</label>
              <select
                className={inputCls}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className={labelCls}>Link to Project (optional)</label>
              <select
                className={inputCls}
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              >
                <option value="">No project linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? p.type} — {p.clientName ?? 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Agenda (optional)</label>
            <textarea
              className={cn(inputCls, 'resize-none')}
              rows={3}
              value={form.agenda}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
              placeholder="Topics to discuss..."
            />
          </div>

          <div className={cn(
            'flex items-center justify-end gap-3 pt-2 border-t mt-6',
            isDark ? 'border-admin-border' : 'border-slate-100'
          )}>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2',
                isDark
                  ? 'bg-admin-accent text-admin-bg hover:bg-[#3ab8e0]'
                  : 'bg-brand-500 text-white hover:bg-brand-600',
                saving && 'opacity-60 cursor-not-allowed'
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
              {saving ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
