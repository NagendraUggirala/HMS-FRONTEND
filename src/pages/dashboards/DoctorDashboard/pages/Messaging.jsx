import React, { useState, useEffect, useRef } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { getDoctorMessages, sendDoctorMessage, markDoctorMessageRead } from '../../../../services/doctorApi'

const Messaging = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [sending, setSending] = useState(false)
  const [markingRead, setMarkingRead] = useState(null)

  // Compose form state
  const [recipientUserId, setRecipientUserId] = useState('')
  const [msgTitle, setMsgTitle] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgEventType, setMsgEventType] = useState('NEW_MESSAGE')

  const [notificationSettings, setNotificationSettings] = useState({
    appointmentReminders: true,
    labResults: true,
    messages: true,
    emergencyAlerts: true
  })

  const bodyRef = useRef(null)

  useEffect(() => {
    loadMessages()
  }, [unreadOnly])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDoctorMessages({ limit: 100, unreadOnly })
      setMessages(data)
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!recipientUserId.trim() || !msgTitle.trim() || !msgBody.trim()) return
    try {
      setSending(true)
      await sendDoctorMessage({
        recipientUserId: recipientUserId.trim(),
        title: msgTitle.trim(),
        body: msgBody.trim(),
        eventType: msgEventType,
      })
      setRecipientUserId('')
      setMsgTitle('')
      setMsgBody('')
      setMsgEventType('NEW_MESSAGE')
      alert('Message sent successfully!')
      // Refresh list after sending
      loadMessages()
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const handleMarkAsRead = async (msg) => {
    if (msg.isRead || !msg.source || !msg.id) return
    try {
      setMarkingRead(msg.id)
      await markDoctorMessageRead({ source: msg.source, messageId: msg.id })
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m)
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    } finally {
      setMarkingRead(null)
    }
  }

  const handleNotificationSettingChange = (setting, value) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }))
  }

  const formatTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const now = new Date()
    const diffMs = now - d
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (diffHours < 48) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const sourceLabel = (source) => {
    if (source === 'telemed') return { label: 'Telemedicine', color: 'blue', icon: 'video' }
    if (source === 'prescription') return { label: 'Prescription', color: 'green', icon: 'prescription-bottle-alt' }
    return { label: source, color: 'gray', icon: 'bell' }
  }

  const unreadCount = messages.filter(m => !m.isRead).length

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">
            <i className="fas fa-comments text-blue-500 mr-3"></i>
            Messaging &amp; Notifications
          </h2>
          {unreadCount > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              <i className="fas fa-circle text-xs mr-1"></i>
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded"
            />
            Unread only
          </label>
          <button
            onClick={loadMessages}
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <div>
            <p className="text-red-700 font-medium">Failed to load messages</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button onClick={loadMessages} className="ml-auto text-red-600 hover:text-red-800 text-sm underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Inbox */}
        <div className="bg-white p-4 border rounded card-shadow lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-1">
            {messages.map(msg => {
              const src = sourceLabel(msg.source)
              const isMarking = markingRead === msg.id
              return (
                <div
                  key={msg.id}
                  onClick={() => handleMarkAsRead(msg)}
                  className={`flex items-start p-3 border rounded-lg transition-colors ${
                    !msg.isRead
                      ? 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100'
                      : 'bg-white border-gray-100 cursor-default'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-${src.color}-100`}>
                    {isMarking
                      ? <i className="fas fa-spinner fa-spin text-gray-400"></i>
                      : <i className={`fas fa-${src.icon} text-${src.color}-600`}></i>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{msg.title || '(No title)'}</p>
                        <span className={`text-xs text-${src.color}-600 bg-${src.color}-50 px-1.5 py-0.5 rounded`}>
                          {src.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(msg.createdAt)}</span>
                    </div>
                    {msg.body && (
                      <p className="text-sm text-gray-600 mt-1 break-words">{msg.body}</p>
                    )}
                    {msg.eventType && (
                      <p className="text-xs text-gray-400 mt-1">Event: {msg.eventType}</p>
                    )}
                  </div>
                  {!msg.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 mt-2"></span>
                  )}
                </div>
              )
            })}

            {messages.length === 0 && !error && (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-comments text-4xl mb-3 block"></i>
                <p className="font-medium">No messages found</p>
                <p className="text-sm mt-1">
                  {unreadOnly ? 'No unread messages.' : 'Your inbox is empty.'}
                </p>
              </div>
            )}
          </div>

          {/* Send Message Form */}
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3 text-gray-700">
              <i className="fas fa-paper-plane mr-2 text-blue-500"></i>
              Send Notification
            </h4>
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Recipient User ID</label>
                <input
                  type="text"
                  value={recipientUserId}
                  onChange={(e) => setRecipientUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter recipient user ID..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Message title..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Event Type</label>
                <select
                  value={msgEventType}
                  onChange={(e) => setMsgEventType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="NEW_MESSAGE">NEW_MESSAGE</option>
                  <option value="APPOINTMENT_REMINDER">APPOINTMENT_REMINDER</option>
                  <option value="LAB_RESULT">LAB_RESULT</option>
                  <option value="PRESCRIPTION_READY">PRESCRIPTION_READY</option>
                  <option value="EMERGENCY_ALERT">EMERGENCY_ALERT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Message (Body)</label>
                <textarea
                  ref={bodyRef}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows="3"
                  placeholder="Type your message here..."
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={sending || !recipientUserId.trim() || !msgTitle.trim() || !msgBody.trim() || !msgEventType}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending
                  ? <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                  : <><i className="fas fa-paper-plane"></i> Send Message</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Message Summary */}
          <div className="bg-white p-4 border rounded card-shadow">
            <h3 className="text-lg font-semibold mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <i className="fas fa-envelope text-blue-500"></i> Total
                </span>
                <span className="font-semibold text-blue-700">{messages.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <i className="fas fa-envelope-open text-orange-500"></i> Unread
                </span>
                <span className="font-semibold text-orange-700">{unreadCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <i className="fas fa-video text-blue-500"></i> Telemedicine
                </span>
                <span className="font-semibold text-blue-700">
                  {messages.filter(m => m.source === 'telemed').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <i className="fas fa-prescription-bottle-alt text-green-500"></i> Prescription
                </span>
                <span className="font-semibold text-green-700">
                  {messages.filter(m => m.source === 'prescription').length}
                </span>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white p-4 border rounded card-shadow">
            <h3 className="text-lg font-semibold mb-3">Notification Settings</h3>
            <div className="space-y-3">
              {[
                { key: 'appointmentReminders', label: 'Appointment Reminders', icon: 'calendar-check' },
                { key: 'labResults', label: 'Lab Results', icon: 'flask' },
                { key: 'messages', label: 'Messages', icon: 'comments' },
                { key: 'emergencyAlerts', label: 'Emergency Alerts', icon: 'exclamation-triangle' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center">
                    <i className={`fas fa-${setting.icon} text-gray-400 mr-3 w-5 text-center`}></i>
                    <span className="text-sm">{setting.label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings[setting.key]}
                      onChange={(e) => handleNotificationSettingChange(setting.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Notifications are</span>
                <span className={`font-medium ${
                  Object.values(notificationSettings).some(v => v) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Object.values(notificationSettings).some(v => v) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messaging