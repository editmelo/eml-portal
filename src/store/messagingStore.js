import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Messaging Store — powers the Inbox across all three portals.
 *
 * Conversations are 1:1 threads between two users.
 * Access rules are enforced in the UI layer (not here):
 *   Client   → can only message designers on their project
 *   Designer → can message admin + clients they've worked with
 *   Admin    → can message anyone
 */
const useMessagingStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      conversations: [],
      // { [convId]: Message[] }
      messages: {},
      // { [userId]: { [convId]: ISO timestamp } } — last-read per conv per user
      lastRead: {},

      // ── Actions ────────────────────────────────────────────────────────────

      /** All conversations for a user, newest first */
      getConversations: (userId) =>
        get()
          .conversations.filter((c) => c.participantIds.includes(userId))
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt ?? b.createdAt) -
              new Date(a.lastMessageAt ?? a.createdAt)
          ),

      /**
       * Get existing 1:1 conversation or create a new one.
       * Returns the conversation id.
       */
      getOrCreateConversation: (user1Id, user1Name, user2Id, user2Name) => {
        const existing = get().conversations.find(
          (c) =>
            c.participantIds.length === 2 &&
            c.participantIds.includes(user1Id) &&
            c.participantIds.includes(user2Id)
        )
        if (existing) return existing.id

        const newConv = {
          id:               `conv_${Date.now()}`,
          participantIds:   [user1Id, user2Id],
          participantNames: { [user1Id]: user1Name, [user2Id]: user2Name },
          lastMessageAt:    null,
          lastMessageText:  null,
          createdAt:        new Date().toISOString(),
        }
        set((state) => ({ conversations: [newConv, ...state.conversations] }))
        return newConv.id
      },

      /** Send a message and update conversation metadata */
      sendMessage: (convId, senderId, senderName, text) => {
        const msg = {
          id:         `msg_${Date.now()}`,
          senderId,
          senderName,
          text:       text.trim(),
          timestamp:  new Date().toISOString(),
        }
        set((state) => ({
          messages: {
            ...state.messages,
            [convId]: [...(state.messages[convId] ?? []), msg],
          },
          conversations: state.conversations.map((c) =>
            c.id === convId
              ? { ...c, lastMessageAt: msg.timestamp, lastMessageText: text.trim() }
              : c
          ),
          // Sender auto-marks as read
          lastRead: {
            ...state.lastRead,
            [senderId]: {
              ...(state.lastRead[senderId] ?? {}),
              [convId]: msg.timestamp,
            },
          },
        }))
      },

      /** Mark a conversation as fully read for a user */
      markRead: (userId, convId) => {
        set((state) => ({
          lastRead: {
            ...state.lastRead,
            [userId]: {
              ...(state.lastRead[userId] ?? {}),
              [convId]: new Date().toISOString(),
            },
          },
        }))
      },

      /** Total unread message count for a user across all conversations */
      getTotalUnread: (userId) => {
        const convs       = get().conversations.filter((c) => c.participantIds.includes(userId))
        const userLastRead = get().lastRead[userId] ?? {}
        const allMessages  = get().messages
        let total = 0
        for (const conv of convs) {
          const msgs      = allMessages[conv.id] ?? []
          const lastReadAt = userLastRead[conv.id]
          total += msgs.filter(
            (m) =>
              m.senderId !== userId &&
              (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))
          ).length
        }
        return total
      },

      /** Unread count for a specific conversation */
      getConvUnread: (userId, convId) => {
        const msgs      = get().messages[convId] ?? []
        const lastReadAt = get().lastRead[userId]?.[convId]
        return msgs.filter(
          (m) =>
            m.senderId !== userId &&
            (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))
        ).length
      },
    }),
    {
      name: 'eml_messaging',
      partialize: (state) => ({
        conversations: state.conversations,
        messages:      state.messages,
        lastRead:      state.lastRead,
      }),
    }
  )
)

export default useMessagingStore
