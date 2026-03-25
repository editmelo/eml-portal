import { create } from 'zustand'
import { supabase } from '../lib/supabase'

function dbToLocal(row) {
  return {
    id:          row.id,
    role:        row.role,
    companyName: row.company_name,
    ownerName:   row.owner_name,
    email:       row.email,
    displayName: row.display_name,
    jobTitle:    row.job_title,
    phone:       row.phone,
    location:    row.location,
    foundUs:     row.found_us,
    message:     row.message,
    status:      row.status,
    sentAt:      row.sent_at,
  }
}

const useInviteStore = create((set) => ({
  invites: [],

  loadInvites: async () => {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .order('sent_at', { ascending: false })
    if (!error && data) set({ invites: data.map(dbToLocal) })
  },

  addInvite: async (data) => {
    const row = {
      id:           `inv_${Date.now()}`,
      role:         data.role,
      company_name: data.companyName  ?? '',
      owner_name:   data.ownerName    ?? '',
      email:        data.email        ?? '',
      display_name: data.displayName  ?? '',
      job_title:    data.jobTitle     ?? '',
      phone:        data.phone        ?? '',
      location:     data.location     ?? '',
      found_us:     data.foundUs      ?? '',
      message:      data.message      ?? '',
      status:       'pending',
      sent_at:      new Date().toISOString(),
    }
    const { error } = await supabase.from('invites').insert(row)
    if (!error) {
      set((state) => ({ invites: [dbToLocal(row), ...state.invites] }))
    }
    return dbToLocal(row)
  },

  cancelInvite: async (id) => {
    await supabase.from('invites').update({ status: 'cancelled' }).eq('id', id)
    set((state) => ({
      invites: state.invites.map((i) => i.id === id ? { ...i, status: 'cancelled' } : i),
    }))
  },

  resendInvite: async (id) => {
    const now = new Date().toISOString()
    await supabase.from('invites').update({ status: 'pending', sent_at: now }).eq('id', id)
    set((state) => ({
      invites: state.invites.map((i) => i.id === id ? { ...i, status: 'pending', sentAt: now } : i),
    }))
  },
}))

export default useInviteStore
