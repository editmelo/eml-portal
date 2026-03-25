import { useState, useEffect, useRef, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import useAuthStore, { selectUser } from '../../store/authStore'
import useMessagingStore from '../../store/messagingStore'
import useThemeStore from '../../store/themeStore'
import { cn } from '../../lib/utils'
import { Mail, Send, Search, X, Plus, MessageSquare } from 'lucide-react'
import { sendNotification } from '../../lib/emailService'

function otherPersonName(conv, userId) {
  const otherId = conv?.participantIds?.find((id) => id !== userId)
  return conv?.participantNames?.[otherId] ?? 'Unknown'
}

function convUnread(conv, userId, messages, lastRead) {
  const msgs = messages[conv.id] ?? []
  const lastReadAt = lastRead[userId]?.[conv.id]
  return msgs.filter(
    (m) => m.senderId !== userId && (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))
  ).length
}

export default function AdminInbox() {
  const isDark    = useThemeStore((s) => s.adminTheme) === 'dark'
  const user      = useAuthStore(selectUser)

  const allConvs   = useMessagingStore((s) => s.conversations)
  const messages   = useMessagingStore((s) => s.messages)
  const lastRead   = useMessagingStore((s) => s.lastRead)
  const sendMessage             = useMessagingStore((s) => s.sendMessage)
  const markRead                = useMessagingStore((s) => s.markRead)
  const getOrCreateConversation = useMessagingStore((s) => s.getOrCreateConversation)

  const [activeConvId, setActiveConvId] = useState(null)
  const [newMsg,       setNewMsg]       = useState('')
  const [showPicker,   setShowPicker]   = useState(false)
  const [search,       setSearch]       = useState('')
  const msgEndRef = useRef(null)
  const inputRef  = useRef(null)

  // Conversations for this user, newest first
  const conversations = useMemo(() =>
    allConvs
      .filter((c) => c.participantIds?.includes(user?.id))
      .sort((a, b) => new Date(b.lastMessageAt ?? b.createdAt) - new Date(a.lastMessageAt ?? a.createdAt)),
    [allConvs, user?.id]
  )

  // Contacts list — populated from real users once Supabase user management is wired up
  const allContacts = useMemo(() => [], [user?.id])

  const activeConv     = conversations.find((c) => c.id === activeConvId)
  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : []

  useEffect(() => {
    if (activeConvId) markRead(user?.id, activeConvId)
  }, [activeConvId])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  const openConversation = (convId) => {
    setActiveConvId(convId)
    markRead(user?.id, convId)
  }

  const handleStartConversation = (contact) => {
    const convId = getOrCreateConversation(user.id, user.name, contact.id, contact.name)
    setShowPicker(false)
    setActiveConvId(convId)
  }

  const handleSend = () => {
    if (!newMsg.trim() || !activeConvId) return
    sendMessage(activeConvId, user.id, user.name, newMsg)
    // Notify the other participant by email
    if (activeConv) {
      const recipientId = activeConv.participantIds.find((id) => id !== user?.id)
      const recipientName = activeConv.participantNames?.[recipientId] ?? 'there'
      const recipientUser = allContacts.find((u) => u.id === recipientId)
      if (recipientUser?.email) {
        sendNotification('new_message', recipientUser.email, {
          recipientName,
          senderName: user.name,
          preview: newMsg.length > 80 ? newMsg.slice(0, 80) + '…' : newMsg,
        })
      }
    }
    setNewMsg('')
    inputRef.current?.focus()
  }

  const filteredConvs = conversations.filter((c) =>
    otherPersonName(c, user?.id).toLowerCase().includes(search.toLowerCase())
  )

  // ── Style tokens ────────────────────────────────────────────────────────────
  const panelCls = isDark
    ? 'bg-admin-surface border-admin-border'
    : 'bg-white border-slate-200'
  const dividerCls = isDark ? 'border-admin-border' : 'border-slate-200'
  const textHead  = isDark ? 'text-white'     : 'text-slate-800'
  const textSub   = isDark ? 'text-slate-400' : 'text-slate-500'
  const convHover = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
  const convActiveCls = isDark
    ? 'bg-white/5 border-l-2 border-l-brand-400'
    : 'bg-blue-50 border-l-2 border-l-brand-500'
  const bubbleOther = isDark
    ? 'bg-admin-bg border border-admin-border text-slate-200'
    : 'bg-slate-100 text-slate-700'

  return (
    <AdminLayout>
      <PageHeader title="Inbox" subtitle="Internal messaging" dark={isDark} className="mb-6" />

      <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>

        {/* ── Left: conversation list ── */}
        <div className={cn('w-72 shrink-0 flex flex-col rounded-2xl border overflow-hidden', panelCls)}>

          <div className={cn('flex items-center gap-2 px-3 py-3 border-b', dividerCls)}>
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="admin-input pl-7 py-1.5 text-xs w-full"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowPicker(true)}
              title="New Message"
              className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 transition-colors shrink-0"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Mail size={28} className="text-slate-600 mb-2" />
                <p className={cn('text-xs', textSub)}>No conversations yet</p>
                <button onClick={() => setShowPicker(true)} className="mt-3 text-xs text-brand-400 hover:underline">
                  Start a new message
                </button>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const unread   = convUnread(conv, user?.id, messages, lastRead)
                const isActive = conv.id === activeConvId
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b transition-colors',
                      isDark ? 'border-admin-border/50' : 'border-slate-100',
                      isActive ? convActiveCls : convHover
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-400">
                        {otherPersonName(conv, user?.id).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn('text-xs font-semibold truncate', textHead)}>
                            {otherPersonName(conv, user?.id)}
                          </p>
                          {unread > 0 && (
                            <span className="h-4 min-w-[16px] px-1 rounded-full bg-brand-400 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className={cn('text-[10px] truncate mt-0.5', textSub)}>
                          {conv.lastMessageText ?? 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right: message thread ── */}
        <div className={cn('flex-1 flex flex-col rounded-2xl border overflow-hidden min-w-0', panelCls)}>

          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={40} className="text-slate-600 mb-3" />
              <p className={cn('text-sm font-medium mb-1', textHead)}>Select a conversation</p>
              <p className={cn('text-xs', textSub)}>Or start a new message with the + button</p>
            </div>
          ) : (
            <>
              <div className={cn('flex items-center gap-3 px-5 py-3.5 border-b shrink-0', dividerCls)}>
                <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                  {otherPersonName(activeConv, user?.id).charAt(0).toUpperCase()}
                </div>
                <p className={cn('text-sm font-semibold', textHead)}>
                  {otherPersonName(activeConv, user?.id)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <p className={cn('text-center text-xs py-10', textSub)}>Send the first message</p>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : '')}>
                        <div className="h-7 w-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand-400">
                          {(msg.senderName ?? '?').charAt(0)}
                        </div>
                        <div className={cn(
                          'max-w-[70%] rounded-xl px-3.5 py-2.5',
                          isMe ? 'bg-brand-500 text-white' : bubbleOther
                        )}>
                          <p className="text-xs leading-relaxed">{msg.text}</p>
                          <p className={cn('text-[9px] mt-1', isMe ? 'text-white/60' : textSub)}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={msgEndRef} />
              </div>

              <div className={cn('flex gap-2 px-5 py-3 border-t shrink-0', dividerCls)}>
                <input
                  ref={inputRef}
                  className="admin-input flex-1"
                  placeholder="Type a message…"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMsg.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Contact picker ── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={cn('rounded-2xl shadow-2xl w-full max-w-sm border', panelCls)}>
            <div className={cn('flex items-center justify-between px-5 py-4 border-b', dividerCls)}>
              <p className={cn('text-sm font-semibold', textHead)}>New Message</p>
              <button onClick={() => setShowPicker(false)} className={cn('transition-colors', textSub, 'hover:text-slate-300')}>
                <X size={16} />
              </button>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto no-scrollbar space-y-0.5">
              {allContacts.length === 0 ? (
                <p className={cn('text-sm text-center py-6', textSub)}>No contacts available.</p>
              ) : (
                allContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartConversation(contact)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                      {(contact.name ?? '?').charAt(0)}
                    </div>
                    <div>
                      <p className={cn('text-xs font-medium', textHead)}>{contact.name}</p>
                      <p className={cn('text-[10px] capitalize', textSub)}>{contact.role?.toLowerCase()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
