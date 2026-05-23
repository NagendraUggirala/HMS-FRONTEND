import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead
} from '../../../../services/patientApi'

function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.conversations)) return payload.conversations
  if (Array.isArray(payload.messages)) return payload.messages
  return []
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

const Messages = () => {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await getMyConversations()
      const payload = await res.json().catch(() => ({}))
      console.log('[Messages] conversations payload:', payload)
      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load conversations.')
        setConversations([])
        return
      }
      const list = extractList(payload)
      setConversations(list)
    } catch (err) {
      console.error('[Messages] fetch convs error:', err)
      toast.error('Could not load conversations.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv)
    setMessagesLoading(true)
    const convId = conv.id || conv.conversation_id
    try {
      const res = await getConversationMessages(convId)
      const payload = await res.json().catch(() => ({}))
      console.log('[Messages] get messages payload:', payload)
      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load messages.')
        setMessages([])
        return
      }
      const msgs = extractList(payload)
      // sort by created_at asc if needed
      msgs.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      setMessages(msgs)

      // Optionally update local unread state
      setConversations(prev => prev.map(c => 
        (c.id === convId || c.conversation_id === convId) ? { ...c, unread_count: 0 } : c
      ))
      
      // Attempt to mark messages as read
      const unreadMsgs = msgs.filter(m => !m.is_read && m.sender_type !== 'PATIENT')
      for (const m of unreadMsgs) {
        const mId = m.id || m.message_id
        if (mId) markMessageAsRead(mId).catch(() => {})
      }
      
    } catch (err) {
      console.error('[Messages] fetch msgs error:', err)
      toast.error('Could not load messages.')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return
    const convId = selectedConv.id || selectedConv.conversation_id
    
    setSending(true)
    try {
      // Backend probably expects { content: string }
      const res = await sendMessage(convId, { content: newMessage.trim(), message: newMessage.trim(), text: newMessage.trim() })
      const payload = await res.json().catch(() => ({}))
      console.log('[Messages] send payload:', payload)
      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to send message.')
        return
      }
      
      // Append the new message (using payload if it returns the saved message, else fallback)
      const sentMsg = payload.id || payload.message_id ? payload : {
        id: Date.now(),
        content: newMessage.trim(),
        sender_type: 'PATIENT',
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, sentMsg])
      setNewMessage('')
      
      // Update last message in the conversation list
      setConversations(prev => prev.map(c => {
        if (c.id === convId || c.conversation_id === convId) {
          return {
            ...c,
            last_message: newMessage.trim(),
            last_message_at: new Date().toISOString()
          }
        }
        return c
      }))
      
    } catch (err) {
      console.error('[Messages] send error:', err)
      toast.error('Could not send message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-gray-700">Messages</h2>
        <p className="text-gray-500 text-sm mt-1">Chat with your healthcare providers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Conversations List */}
        <div className="bg-white rounded-xl card-shadow border p-4 lg:col-span-1 overflow-hidden flex flex-col h-full">
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Conversations</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <i className="fas fa-search absolute right-3 top-2.5 text-gray-400"></i>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No conversations found.
              </div>
            ) : (
              conversations.map(conv => {
                const cId = conv.id || conv.conversation_id
                const isSelected = selectedConv && (selectedConv.id === cId || selectedConv.conversation_id === cId)
                const participantName = conv.doctor_name || conv.participant_name || conv.hospital_name || 'Hospital Staff'
                
                return (
                  <div
                    key={cId}
                    onClick={() => handleSelectConv(conv)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="fas fa-user-md text-blue-600"></i>
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-gray-800 truncate">{participantName}</p>
                          <p className="text-xs text-gray-500 truncate">{conv.department || conv.role || 'Staff'}</p>
                        </div>
                      </div>
                      {(conv.unread_count > 0 || conv.unread) && (
                        <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 ml-2"></span>
                      )}
                    </div>
                    <div className="mt-2 flex justify-between items-end">
                      <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                        {conv.last_message || conv.lastMessage || 'No messages yet'}
                      </p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(conv.last_message_at || conv.updated_at || conv.time)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white rounded-xl card-shadow border lg:col-span-2 flex flex-col h-full overflow-hidden">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-user-md text-blue-600"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {selectedConv.doctor_name || selectedConv.participant_name || 'Staff'}
                      </p>
                      <p className="text-xs text-gray-500">{selectedConv.department || selectedConv.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">
                    No messages in this conversation yet. Send a message to start!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isPatient = msg.sender_type === 'PATIENT' || msg.sender === 'patient' || msg.is_mine === true
                    const content = msg.content || msg.text || msg.message || ''
                    return (
                      <div
                        key={msg.id || msg.message_id || Math.random()}
                        className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-lg p-3 ${
                          isPatient 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
                          <div className={`text-[10px] mt-1 flex justify-end ${isPatient ? 'text-blue-100' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at || msg.time)}
                            {isPatient && msg.is_read && <i className="fas fa-check-double ml-1"></i>}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sending}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-paper-plane text-sm -ml-1"></i>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-comments text-blue-500 text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Conversation</h3>
              <p className="text-gray-500 text-sm max-w-sm">Choose a chat from the list on the left to start messaging with your healthcare provider.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages