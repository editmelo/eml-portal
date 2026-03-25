import { useState, useEffect, useRef, useMemo } from 'react'
import PortalLayout from '../../components/layout/PortalLayout'
import PageHeader from '../../components/layout/PageHeader'
import useAuthStore, { selectUser } from '../../store/authStore'
import useMessagingStore from '../../store/messagingStore'
import { cn } from '../../lib/utils'
import { Mail, Send, Search, X, Plus, MessageSquare, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function otherPersonName(conv, userId) {
  if (!conv) return ''
  const otherId = conv.participantIds?.find((id) => id !== userId)
  return conv.participantNames?.[otherId] ?? 'Unknown'
}

function convUnread(conv, userId, messages, lastRead) {
  const msgs = messages[conv.id] ?? []
  const lastReadAt = lastRead[userId]?.[conv.id]
  return msgs.filter(
    (m) => m.senderId !== userId && (!lastReadAt || new Date(m.timestamp) > new Date(lastReadAt))
  ).length
}

export default function ClientInbox() {
  const user = useAuthStore(selectUser)

  const allConvs                = useMessagingStore((s) => s.conversations)
  const messages                = useMessagingStore((s) => s.messages)
  const lastRead                = useMessagingStore((s) => s.lastRead)
  const sendMessage             = useMessagingStore((s) => s.sendMessage)
  const markRead                = useMessagingStore((s) => s.markRead)
  const getOrCreateConversation = useMessagingStore((s) => s.getOrCreateConversation)
  const loadConversations       = useMessagingStore((s) => s.loadConversations)
  const loadMessages            = useMessagingStore((s) => s.loadMessages)

  const [activeConvId, setActiveConvId] = useState(null)
  const [newMsg,       setNewMsg]       = useState('')
  const [showPicker,   setShowPicker]   = useState(false)
  const [search,       setSearch]       = useState('')
  const [mobileView,   setMobileView]   = useState('list')
  const msgEndRef = useRef(null)
  const inputRef  = useRef(null)

  const conversations = useMemo(() =>
    allConvs
      .filter((c) => c.participantIds?.includes(user?.id))
      .sort((a, b) => new Date(b.lastMessageAt ?? b.createdAt) - new Date(a.lastMessageAt ?? a.createdAt)),
    [allConvs, user?.id]
  )

  const [allContacts, setAllContacts] = useState([])
  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('id, name, email, role').neq('id', user.id)
      .then(({ data }) => {
        if (data) setAllContacts(data.map((p) => ({ id: p.id, name: p.name ?? p.email, role: p.role })))
      })
  }, [user?.id])

  const activeConv     = conversations.find((c) => c.id === activeConvId)
  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : []

  useEffect(() => { loadConversations(user?.id) }, [user?.id])

  useEffect(() => {
    if (activeConvId) markRead(user?.id, activeConvId)
  }, [activeConvId])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  const openConversation = (convId) => {
    setActiveConvId(convId)
    setMobileView('thread')
    markRead(user?.id, convId)
    loadMessages(convId)
  }

  const handleStartConversation = async (contact) => {
    const convId = await getOrCreateConversation(user.id, user.name, contact.id, contact.name)
    setShowPicker(false)
    setActiveConvId(convId)
    setMobileView('thread')
    loadMessages(convId)
  }

  const handleSend = () => {
    if (!newMsg.trim() || !activeConvId) return
    sendMessage(activeConvId, user.id, user.name, newMsg)
    setNewMsg('')
    inputRef.current?.focus()
  }

  const filteredConvs = conversations.filter((c) =>
    otherPersonName(c, user?.id).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalLayout>
      <div className={cn(mobileView === 'thread' ? 'hidden md:block' : 'block')}>
        <PageHeader title="Inbox" subtitle="Message your designer" className="mb-6" />
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100dvh - 200px)', minHeight: '400px' }}>

        {/* ── Left: conversation list ── */}
        <div className={cn(
          'flex flex-col rounded-2xl border overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          'w-full md:w-72 md:shrink-0',
          mobileView === 'thread' ? 'hidden md:flex' : 'flex'
        )}>

          <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-base pl-7 py-1.5 text-xs w-full"
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
                <Mail size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
                <button onClick={() => setShowPicker(true)} className="mt-3 text-xs text-brand-500 hover:underline">
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
                      'w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 transition-colors',
                      isActive
                        ? 'bg-blue-50 border-l-2 border-l-brand-500 dark:bg-white/5 dark:border-l-brand-400'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-500">
                        {otherPersonName(conv, user?.id).charAt(0).toUpperCase()}
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

        {/* ── Right: message thread ── */}
        <div className={cn(
          'flex-1 flex-col rounded-2xl border overflow-hidden min-w-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        )}>

          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={40} className="text-slate-200 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Select a conversation</p>
              <p className="text-xs text-slate-400">Or start a new message with the + button</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden shrink-0 p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0">
                  {otherPersonName(activeConv, user?.id).charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate">
                  {otherPersonName(activeConv, user?.id)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Send the first message</p>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : '')}>
                        <div className="h-7 w-7 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand-500">
                          {(msg.senderName ?? '?').charAt(0)}
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

      {/* ── Contact picker ── */}
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
              {allContacts.length === 0 ? (
                <p className="text-sm text-center text-slate-400 py-6">No contacts available yet.</p>
              ) : (
                allContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartConversation(contact)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0">
                      {(contact.name ?? '?').charAt(0)}
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
