import { useState, useEffect, useRef, useMemo } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import useAuthStore, { selectUser } from '../../store/authStore'
import useMessagingStore from '../../store/messagingStore'
import useProjectStore from '../../store/projectStore'
import { MOCK_USERS } from '../../lib/mockData'
import { ROLES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { Mail, Send, Search, X, Plus, MessageSquare } from 'lucide-react'
import { sendNotification } from '../../lib/emailService'

function otherPersonName(conv, userId) {
  if (!conv) return ''
  const otherId = conv.participantIds.find((id) => id !== userId)
  return conv.participantNames?.[otherId] ?? 'Unknown'
}

function otherPersonInitial(conv, userId) {
  return otherPersonName(conv, userId).charAt(0).toUpperCase() || '?'
}

export default function DesignerInbox() {
  const user     = useAuthStore(selectUser)
  const regUsers = useAuthStore((s) => s.registeredUsers)
  const projects = useProjectStore((s) => s.projects)

  const allConvs                = useMessagingStore((s) => s.conversations)
  const messages                = useMessagingStore((s) => s.messages)
  const lastRead                = useMessagingStore((s) => s.lastRead)
  const sendMessage             = useMessagingStore((s) => s.sendMessage)
  const markRead                = useMessagingStore((s) => s.markRead)
  const getOrCreateConversation = useMessagingStore((s) => s.getOrCreateConversation)

  const conversations = useMemo(() =>
    allConvs
      .filter((c) => c.participantIds?.includes(user?.id))
      .sort((a, b) => new Date(b.lastMessageAt ?? b.createdAt) - new Date(a.lastMessageAt ?? a.createdAt)),
    [allConvs, user?.id]
  )

  const [activeConvId, setActiveConvId] = useState(null)
  const [newMsg,       setNewMsg]       = useState('')
  const [showPicker,   setShowPicker]   = useState(false)
  const [search,       setSearch]       = useState('')
  const msgEndRef = useRef(null)
  const inputRef  = useRef(null)

  // Designer can message: admin users + clients from their assigned projects
  const myProjects  = projects.filter((p) => p.designerIds?.includes(user?.id))
  const clientIds   = [...new Set(myProjects.map((p) => p.clientId).filter(Boolean))]
  const allUsers    = [...MOCK_USERS, ...regUsers]
  const availableContacts = allUsers
    .reduce((acc, u) => {
      if (!acc.find((a) => a.id === u.id) && u.id !== user?.id) acc.push(u)
      return acc
    }, [])
    .filter((u) => u.role === ROLES.ADMIN || clientIds.includes(u.id))

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
    // Notify recipient by email
    const activeConv = conversations.find((c) => c.id === activeConvId)
    if (activeConv) {
      const recipientId   = activeConv.participantIds.find((id) => id !== user?.id)
      const recipientName = activeConv.participantNames?.[recipientId] ?? 'there'
      const recipientUser = availableContacts.find((u) => u.id === recipientId)
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

  return (
    <PortalLayout>
      <PageHeader title="Inbox" subtitle="Message clients and Edit Me Lo" className="mb-6" />

      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>

        {/* ── Left: Conversation list ── */}
        <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 overflow-hidden">

          {/* Search + New */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-base pl-7 py-1.5 text-xs w-full"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {availableContacts.length > 0 && (
              <button
                onClick={() => setShowPicker(true)}
                title="New Message"
                className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 transition-colors shrink-0"
              >
                <Plus size={13} />
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Mail size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
                {availableContacts.length > 0 && (
                  <button onClick={() => setShowPicker(true)} className="mt-3 text-xs text-brand-500 hover:underline">
                    Start a conversation
                  </button>
                )}
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const unread   = (() => {
                  const msgs = messages[conv.id] ?? []
                  const lastReadAt = lastRead[user?.id]?.[conv.id]
                  return msgs.filter((m) => m.senderId !== user?.id && (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))).length
                })()
                const isActive = conv.id === activeConvId
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 transition-colors',
                      isActive
                        ? 'bg-blue-50 border-l-2 border-l-brand-500 dark:bg-white/5 dark:border-l-brand-400'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-500">
                        {otherPersonInitial(conv, user?.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                            {otherPersonName(conv, user?.id)}
                          </p>
                          {unread > 0 && (
                            <span className="h-4 min-w-[16px] px-1 rounded-full bg-brand-500 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] truncate mt-0.5 text-slate-400">
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

        {/* ── Right: Message thread ── */}
        <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 overflow-hidden min-w-0">

          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={40} className="text-slate-200 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Select a conversation</p>
              <p className="text-xs text-slate-400">
                {availableContacts.length > 0
                  ? 'Or start a new message with the + button'
                  : 'No contacts available yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0">
                  {otherPersonInitial(activeConv, user?.id)}
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {otherPersonName(activeConv, user?.id)}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Send the first message</p>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : '')}>
                        <div className="h-7 w-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand-500">
                          {msg.senderName?.charAt(0) ?? '?'}
                        </div>
                        <div className={cn(
                          'max-w-[70%] rounded-xl px-3.5 py-2.5',
                          isMe
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600'
                        )}>
                          <p className={cn('text-xs leading-relaxed', isMe ? 'text-white' : 'text-slate-700 dark:text-slate-200')}>
                            {msg.text}
                          </p>
                          <p className={cn('text-[9px] mt-1', isMe ? 'text-white/60' : 'text-slate-400')}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Compose */}
              <div className="flex gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
                <input
                  ref={inputRef}
                  className="input-base flex-1"
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

      {/* ── Contact Picker Modal ── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">New Message</p>
              <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto no-scrollbar space-y-0.5">
              {availableContacts.length === 0 ? (
                <p className="text-sm text-center text-slate-400 py-6">No contacts available yet.</p>
              ) : (
                availableContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartConversation(contact)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0">
                      {contact.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{contact.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{contact.role?.toLowerCase()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
