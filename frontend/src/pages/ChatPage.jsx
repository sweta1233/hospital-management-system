import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, User, Users, Plus, Search,
  Phone, Video, MoreVertical, CheckCheck, Clock,
  Stethoscope, HeartPulse, Pill, FlaskConical, Shield,
  Building2, X, Sparkles, Smile, Paperclip
} from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../services/api'
import { getSocket } from '../services/socket'

export default function ChatPage() {
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [contacts, setContacts] = useState([])
  const [contactSearch, setContactSearch] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(false)

  const user = useSelector((state) => state.auth.user)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms')
      const roomList = res.data?.data || []
      setRooms(roomList)
      if (roomList.length > 0 && !activeRoom) {
        setActiveRoom(roomList[0])
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err)
    }
  }

  const fetchMessages = async (roomId) => {
    setLoadingMessages(true)
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`)
      setMessages(res.data?.data?.items || [])
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchContacts = async (search = '') => {
    setLoadingContacts(true)
    try {
      const res = await api.get(`/chat/contacts?search=${encodeURIComponent(search)}`)
      setContacts(res.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch contacts', err)
    } finally {
      setLoadingContacts(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (showNewChatModal) {
      fetchContacts(contactSearch)
    }
  }, [showNewChatModal, contactSearch])

  // Socket and Room Subscription
  useEffect(() => {
    if (!activeRoom) return

    fetchMessages(activeRoom.id)
    const socket = getSocket()

    if (socket) {
      // Join room
      socket.emit('join_chat_room', { room_id: activeRoom.id })

      // Listen for new messages
      const handleReceiveMessage = (msg) => {
        if (msg.room_id === activeRoom.id) {
          setMessages((prev) => {
            // Avoid duplicate message if already added
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setIsTyping(false)
        }
        // Refresh room last_message
        fetchRooms()
      }

      const handleTyping = (data) => {
        if (data.user_name) {
          setTypingUser(data.user_name)
          setIsTyping(true)
        }
      }

      const handleStopTyping = () => {
        setIsTyping(false)
        setTypingUser('')
      }

      socket.on('receive_message', handleReceiveMessage)
      socket.on('user_typing', handleTyping)
      socket.on('user_stop_typing', handleStopTyping)

      return () => {
        socket.emit('leave_chat_room', { room_id: activeRoom.id })
        socket.off('receive_message', handleReceiveMessage)
        socket.off('user_typing', handleTyping)
        socket.off('user_stop_typing', handleStopTyping)
      }
    }
  }, [activeRoom?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleInputChange = (e) => {
    setInputMessage(e.target.value)
    const socket = getSocket()
    if (socket && activeRoom) {
      socket.emit('typing', {
        room_id: activeRoom.id,
        user_name: user?.full_name || 'Staff Member',
      })
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { room_id: activeRoom.id })
      }, 1500)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !activeRoom) return

    const textToSend = inputMessage.trim()
    setInputMessage('')

    try {
      const res = await api.post(`/chat/rooms/${activeRoom.id}/messages`, {
        message: textToSend,
      })
      const newMsg = res.data?.data
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      }
      fetchRooms()
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  const handleStartDirectChat = async (contact) => {
    try {
      const res = await api.post(`/chat/direct/${contact.id}`)
      const room = res.data?.data
      if (room) {
        setShowNewChatModal(false)
        await fetchRooms()
        setActiveRoom(room)
      }
    } catch (err) {
      console.error('Failed to create direct room', err)
    }
  }

  const getRoleIcon = (roles = []) => {
    if (roles.includes('doctor')) return <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
    if (roles.includes('nurse')) return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
    if (roles.includes('pharmacist')) return <Pill className="w-3.5 h-3.5 text-purple-400" />
    if (roles.includes('lab_technician')) return <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
    if (roles.includes('admin')) return <Shield className="w-3.5 h-3.5 text-blue-400" />
    if (roles.includes('receptionist')) return <Building2 className="w-3.5 h-3.5 text-amber-400" />
    return <User className="w-3.5 h-3.5 text-slate-400" />
  }

  const filteredRooms = rooms.filter((r) => {
    const name = r.display_name || r.name || ''
    return name.toLowerCase().includes(searchFilter.toLowerCase())
  })

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-slate-900/60 backdrop-blur-xl text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Hospital Clinical & Patient Chat</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold">
                Live Real-Time
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Direct & departmental communication between doctors, nurses, staff, and patients
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewChatModal(true)}
          className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center space-x-2 cursor-pointer hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations Directory */}
        <div className="w-80 sm:w-96 border-r border-slate-800/80 bg-slate-900/40 flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 font-medium">No conversations found</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-600/30 transition cursor-pointer"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = activeRoom?.id === room.id
                const unread = room.unread_count || 0
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full p-4 text-left flex items-start space-x-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-white'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-600/10">
                        {room.room_type === 'group' ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {room.display_name || room.name || 'Chat Conversation'}
                        </h4>
                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[10px] animate-pulse">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {room.last_message?.message || 'Say hello...'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Conversation */}
        <div className="flex-1 flex flex-col bg-[#070d1e]/60">
          {activeRoom ? (
            <>
              {/* Chat Room Top Bar */}
              <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                    {activeRoom.room_type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {activeRoom.display_name || activeRoom.name || 'Direct Chat'}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Active Consultation Line</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => alert('Starting secure VoIP call consultation...')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => alert('Redirecting to video consultation room...')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Video Checkup"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Flow Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">No messages yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Send a message to begin real-time clinical coordination or patient care discussion.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_user_id === user?.id
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm shadow-md ${
                            isMine
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                              : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60'
                          }`}
                        >
                          {!isMine && (
                            <p className="text-[11px] font-bold text-cyan-300 mb-1">
                              {m.sender_name || 'Hospital User'}
                            </p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                          <div className={`text-[10px] flex items-center justify-end space-x-1 mt-1.5 ${isMine ? 'text-cyan-200' : 'text-slate-400'}`}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-xs text-cyan-400 bg-slate-800/80 px-3 py-1.5 rounded-full w-fit border border-cyan-500/30"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{typingUser || 'Someone'} is typing...</span>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type your message here... (Enter to send)"
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-3 rounded-xl gradient-btn text-white shadow-lg shadow-cyan-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-sm space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-xl">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Select or Start a Chat</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose an existing conversation from the left or click "New Conversation" to message any doctor, nurse, patient, or hospital staff member.
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-6 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700/60 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Start New Conversation</h3>
                </div>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Contacts Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctors, nurses, pharmacists, patients..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Contacts List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 space-y-1">
                {loadingContacts ? (
                  <div className="py-8 text-center text-xs text-slate-400">Searching directory...</div>
                ) : contacts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No matching hospital contacts found.</div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleStartDirectChat(contact)}
                      className="w-full p-3 rounded-xl text-left flex items-center justify-between hover:bg-slate-800/60 transition cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                          {getRoleIcon(contact.roles)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                            {contact.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{contact.role_display || 'Hospital Member'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                        Chat →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
