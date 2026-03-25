import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ── Shape converters ───────────────────────────────────────────────────────────
function dbConvToLocal(row) {
  return {
    id:               row.id,
    participantIds:   row.participant_ids,
    participantNames: row.participant_names,
    lastMessageAt:    row.last_message_at,
    lastMessageText:  row.last_message_text,
    createdAt:        row.created_at,
  }
}

function dbMsgToLocal(row) {
  return {
    id:         row.id,
    senderId:   row.sender_id,
    senderName: row.sender_name,
    text:       row.text,
    timestamp:  row.created_at,
  }
}

const useMessagingStore = create((set, get) => ({
  conversations: [],
  messages:      {},
  lastRead:      {},
  _realtimeSub:  null,

  // ── Load ────────────────────────────────────────────────────────────────────

  /** Fetch this user's conversations + last-read state from Supabase */
  loadConversations: async (userId) => {
    if (!userId) return

    const { data: convRows, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!error && convRows) {
      set({ conversations: convRows.map(dbConvToLocal) })
    }

    const { data: lrRows } = await supabase
      .from('message_last_read')
      .select('*')
      .eq('user_id', userId)

    if (lrRows) {
      const lr = { [userId]: {} }
      lrRows.forEach((r) => { lr[userId][r.conversation_id] = r.last_read_at })
      set((state) => ({ lastRead: { ...state.lastRead, ...lr } }))
    }

    // Live updates
    get()._subscribeRealtime(userId)
  },

  /** Fetch messages for a specific conversation */
  loadMessages: async (convId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      set((state) => ({
        messages: { ...state.messages, [convId]: data.map(dbMsgToLocal) },
      }))
    }
  },

  // ── Actions ─────────────────────────────────────────────────────────────────

  getOrCreateConversation: async (user1Id, user1Name, user2Id, user2Name) => {
    // Check local state first
    const local = get().conversations.find(
      (c) => c.participantIds.length === 2 &&
             c.participantIds.includes(user1Id) &&
             c.participantIds.includes(user2Id)
    )
    if (local) return local.id

    // Check Supabase for existing
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, participant_ids')
      .contains('participant_ids', [user1Id, user2Id])

    const match = existing?.find(
      (c) => c.participant_ids.includes(user1Id) &&
             c.participant_ids.includes(user2Id) &&
             c.participant_ids.length === 2
    )
    if (match) {
      await get().loadConversations(user1Id)
      return match.id
    }

    // Create new
    const id  = `conv_${Date.now()}`
    const now = new Date().toISOString()
    const newRow = {
      id,
      participant_ids:   [user1Id, user2Id],
      participant_names: { [user1Id]: user1Name, [user2Id]: user2Name },
    }
    await supabase.from('conversations').insert(newRow)

    set((state) => ({
      conversations: [
        dbConvToLocal({ ...newRow, last_message_at: null, last_message_text: null, created_at: now }),
        ...state.conversations,
      ],
    }))
    return id
  },

  sendMessage: async (convId, senderId, senderName, text) => {
    const trimmed = text.trim()
    const id      = `msg_${Date.now()}`
    const now     = new Date().toISOString()

    // Optimistic local update so the UI feels instant
    const localMsg = { id, senderId, senderName, text: trimmed, timestamp: now }
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] ?? []), localMsg],
      },
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, lastMessageAt: now, lastMessageText: trimmed } : c
      ),
      lastRead: {
        ...state.lastRead,
        [senderId]: { ...(state.lastRead[senderId] ?? {}), [convId]: now },
      },
    }))

    // Persist
    await supabase.from('messages').insert({
      id,
      conversation_id: convId,
      sender_id:       senderId,
      sender_name:     senderName,
      text:            trimmed,
    })
    await supabase.from('conversations').update({
      last_message_at:   now,
      last_message_text: trimmed,
    }).eq('id', convId)
  },

  markRead: async (userId, convId) => {
    const now = new Date().toISOString()
    set((state) => ({
      lastRead: {
        ...state.lastRead,
        [userId]: { ...(state.lastRead[userId] ?? {}), [convId]: now },
      },
    }))
    await supabase.from('message_last_read').upsert({
      user_id:         userId,
      conversation_id: convId,
      last_read_at:    now,
    })
  },

  getTotalUnread: (userId) => {
    const convs        = get().conversations.filter((c) => c.participantIds.includes(userId))
    const userLastRead = get().lastRead[userId] ?? {}
    const allMessages  = get().messages
    let total = 0
    for (const conv of convs) {
      const msgs       = allMessages[conv.id] ?? []
      const lastReadAt = userLastRead[conv.id]
      total += msgs.filter(
        (m) => m.senderId !== userId && (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))
      ).length
    }
    return total
  },

  getConvUnread: (userId, convId) => {
    const msgs       = get().messages[convId] ?? []
    const lastReadAt = get().lastRead[userId]?.[convId]
    return msgs.filter(
      (m) => m.senderId !== userId && (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))
    ).length
  },

  // ── Realtime ────────────────────────────────────────────────────────────────

  _subscribeRealtime: (userId) => {
    const existing = get()._realtimeSub
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel(`inbox_${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row     = payload.new
          const convIds = get().conversations.map((c) => c.id)
          if (!convIds.includes(row.conversation_id)) return
          // Skip dedup (optimistic update already added it from this device)
          const already = (get().messages[row.conversation_id] ?? []).find((m) => m.id === row.id)
          if (already) return

          const localMsg = dbMsgToLocal(row)
          set((state) => ({
            messages: {
              ...state.messages,
              [row.conversation_id]: [
                ...(state.messages[row.conversation_id] ?? []),
                localMsg,
              ],
            },
            conversations: state.conversations.map((c) =>
              c.id === row.conversation_id
                ? { ...c, lastMessageAt: row.created_at, lastMessageText: row.text }
                : c
            ),
          }))
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        async (payload) => {
          const row = payload.new
          if (!row.participant_ids.includes(userId)) return
          await get().loadConversations(userId)
        }
      )
      .subscribe()

    set({ _realtimeSub: channel })
  },
}))

export default useMessagingStore
