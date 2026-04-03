import { create } from 'zustand'
import { supabase } from '../lib/supabase'

/**
 * Activity Log Store — centralized, timestamped event log visible to all parties.
 *
 * Supabase table: `activity_log`
 *   id          text  PK  (auto-generated)
 *   actor_id    uuid        — who did the action
 *   actor_name  text        — display name at the time
 *   actor_role  text        — ADMIN | DESIGNER | CLIENT
 *   action      text        — event key (invite_sent, draft_uploaded, etc.)
 *   description text        — human-readable summary
 *   project_id  text  null  — optional project reference
 *   meta        jsonb null  — any extra structured data
 *   created_at  timestamptz — defaults to now()
 *
 * If the table doesn't exist yet, events are stored locally and logged to console.
 */

const EVENT_LABELS = {
  invite_sent:          'Invite Sent',
  invite_accepted:      'Invite Accepted',
  invite_resent:        'Invite Resent',
  invite_cancelled:     'Invite Cancelled',
  project_created:      'Project Created',
  project_status:       'Status Changed',
  draft_uploaded:       'Draft Uploaded',
  message_sent:         'Message Sent',
  note_added:           'Note Added',
  invoice_created:      'Invoice Created',
  invoice_paid:         'Invoice Paid',
  intake_submitted:     'Intake Form Submitted',
  agreement_signed:     'Agreement Signed',
  todo_completed:       'Task Completed',
  profile_updated:      'Profile Updated',
}

function shapeRow(row) {
  return {
    id:          row.id,
    actorId:     row.actor_id,
    actorName:   row.actor_name,
    actorRole:   row.actor_role,
    action:      row.action,
    label:       EVENT_LABELS[row.action] ?? row.action,
    description: row.description,
    projectId:   row.project_id,
    meta:        row.meta,
    createdAt:   row.created_at,
  }
}

const useActivityStore = create((set, get) => ({
  events: [],
  isLoading: false,

  /**
   * Load recent activity. Optionally filter by projectId or actorId.
   */
  loadActivity: async ({ projectId, actorId, limit = 50 } = {}) => {
    set({ isLoading: true })
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (projectId) query = query.eq('project_id', projectId)
    if (actorId)   query = query.eq('actor_id', actorId)

    const { data, error } = await query
    if (error) {
      console.warn('[activityStore] load failed (table may not exist yet):', error.message)
      set({ isLoading: false })
      return
    }
    set({ events: (data ?? []).map(shapeRow), isLoading: false })
  },

  /**
   * Log a new activity event.
   */
  logEvent: async ({ actorId, actorName, actorRole, action, description, projectId, meta }) => {
    const row = {
      id:          `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actor_id:    actorId,
      actor_name:  actorName,
      actor_role:  actorRole,
      action,
      description,
      project_id:  projectId ?? null,
      meta:        meta ?? null,
      created_at:  new Date().toISOString(),
    }

    // Optimistic local update
    set((state) => ({ events: [shapeRow(row), ...state.events] }))

    // Persist to Supabase
    const { error } = await supabase.from('activity_log').insert(row)
    if (error) {
      console.warn('[activityStore] insert failed (table may not exist yet):', error.message)
    }
  },
}))

/** Convenience — import and call from anywhere without needing the hook */
export function logActivity(params) {
  return useActivityStore.getState().logEvent(params)
}

export default useActivityStore
