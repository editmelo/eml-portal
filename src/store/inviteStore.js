import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useInviteStore = create(
  persist(
    (set) => ({
      invites: [],

      addInvite: (data) => {
        const invite = {
          id:          `inv_${Date.now()}`,
          role:        data.role,
          companyName: data.companyName ?? '',
          ownerName:   data.ownerName   ?? '',
          email:       data.email       ?? '',
          displayName: data.displayName ?? '',
          jobTitle:    data.jobTitle    ?? '',
          phone:       data.phone       ?? '',
          location:    data.location    ?? '',
          foundUs:     data.foundUs     ?? '',
          message:     data.message     ?? '',
          status:      'pending',
          sentAt:      new Date().toISOString(),
        }
        set((state) => ({ invites: [invite, ...state.invites] }))
        return invite
      },

      cancelInvite: (id) =>
        set((state) => ({
          invites: state.invites.map((i) =>
            i.id === id ? { ...i, status: 'cancelled' } : i
          ),
        })),

      resendInvite: (id) =>
        set((state) => ({
          invites: state.invites.map((i) =>
            i.id === id ? { ...i, sentAt: new Date().toISOString(), status: 'pending' } : i
          ),
        })),
    }),
    { name: 'eml_invites', partialize: (s) => ({ invites: s.invites }) }
  )
)

export default useInviteStore
