import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import DataTable from '../../../../components/ui/Tables/DataTable'
import {
  createCommunicationLogEntry,
  doctorAppointmentErrorMessage,
  getAppointmentMetricsSummary,
  getAppointmentTrackingDetails,
  getCommunicationLog,
  getNotificationHistory,
  getTodaysAppointmentDelays,
  getTodaysAppointmentTracking,
  getUpcomingAppointmentsTracking,
  sendAppointmentNotification,
  sendBulkAppointmentNotifications,
  updateAppointmentDelay,
} from '../../../../services/doctorApi'

const NOTIFICATION_TYPES = [
  'APPOINTMENT_REMINDER',
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_CANCELLATION',
  'APPOINTMENT_RESCHEDULE',
  'APPOINTMENT_DELAY',
  'FOLLOW_UP_REMINDER',
]

const METRIC_PERIODS = ['week', 'month', 'quarter', 'year']
const NOTIFICATION_CHANNELS = ['SMS', 'EMAIL', 'PUSH']
const COMMUNICATION_TYPES = ['CALL', 'SMS', 'EMAIL', 'IN_PERSON']
const COMMUNICATION_DIRECTIONS = ['OUTBOUND', 'INBOUND']

function normalizeApiData(payload) {
  return payload?.data ?? payload ?? {}
}

function formatClockTime(timeStr) {
  if (!timeStr) return '-'
  const part = String(timeStr).slice(0, 5)
  const [hRaw, mRaw] = part.split(':')
  const h = parseInt(hRaw, 10)
  const m = mRaw ?? '00'
  if (Number.isNaN(h)) return String(timeStr)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function normalizedStatus(status) {
  return String(status || '').toUpperCase()
}

function humanizeStatus(status) {
  return String(status || 'UNKNOWN')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusClass(status) {
  const s = normalizedStatus(status)
  if (s.includes('CONFIRMED') || s === 'CHECKED_IN') return 'status-confirmed'
  if (s.includes('COMPLETED')) return 'status-completed'
  if (s.includes('CANCELLED')) return 'status-cancelled'
  return 'status-pending'
}

const AppointmentTracking = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [todaySummary, setTodaySummary] = useState({})
  const [todayAppointments, setTodayAppointments] = useState([])
  const [upcomingDays, setUpcomingDays] = useState(7)
  const [upcomingByDate, setUpcomingByDate] = useState({})
  const [metricsPeriod, setMetricsPeriod] = useState('month')
  const [metrics, setMetrics] = useState({})
  const [delays, setDelays] = useState([])
  const [delaySummary, setDelaySummary] = useState({})
  const [notificationHistory, setNotificationHistory] = useState([])
  const [communicationLog, setCommunicationLog] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedTracking, setSelectedTracking] = useState(null)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const [isSendingBulkNotification, setIsSendingBulkNotification] = useState(false)
  const [isUpdatingDelay, setIsUpdatingDelay] = useState(false)
  const [isCreatingCommunicationLog, setIsCreatingCommunicationLog] = useState(false)
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false)
  const [notificationForm, setNotificationForm] = useState({
    appointment_ref: '',
    notification_type: 'APPOINTMENT_REMINDER',
    message: '',
    channels: {
      SMS: true,
      EMAIL: false,
      PUSH: false,
    },
  })
  const [bulkNotificationForm, setBulkNotificationForm] = useState({
    notification_type: 'APPOINTMENT_REMINDER',
    message_template:
      'Hello {patient_name}, this is a reminder from {doctor_name} for your appointment on {appointment_date} at {appointment_time}.',
    channels: {
      SMS: true,
      EMAIL: false,
      PUSH: false,
    },
  })
  const [selectedBulkRefs, setSelectedBulkRefs] = useState([])
  const [delayForm, setDelayForm] = useState({
    appointment_ref: '',
    delay_minutes: 15,
    reason: '',
    estimated_new_time: '',
    notify_patient: true,
  })
  const [notificationFiltersDraft, setNotificationFiltersDraft] = useState({
    appointment_ref: '',
    notification_type: '',
    date_from: '',
    date_to: '',
    limit: 20,
  })
  const [appliedNotificationFilters, setAppliedNotificationFilters] = useState({
    appointment_ref: '',
    notification_type: '',
    date_from: '',
    date_to: '',
    limit: 20,
  })
  const [communicationFiltersDraft, setCommunicationFiltersDraft] = useState({
    appointment_ref: '',
    patient_ref: '',
    communication_type: '',
    date_from: '',
    date_to: '',
    limit: 20,
  })
  const [appliedCommunicationFilters, setAppliedCommunicationFilters] = useState({
    appointment_ref: '',
    patient_ref: '',
    communication_type: '',
    date_from: '',
    date_to: '',
    limit: 20,
  })
  const [communicationForm, setCommunicationForm] = useState({
    appointment_ref: '',
    communication_type: 'SMS',
    direction: 'OUTBOUND',
    channel: 'SMS',
    subject: '',
    message: '',
    status: 'SENT',
    response_received: false,
    response_message: '',
  })

  const runApiRequest = useCallback(async (requestFn, fallbackError) => {
    try {
      const response = await requestFn()
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { ok: false, payload, error: doctorAppointmentErrorMessage(payload) || fallbackError }
      }
      return { ok: true, payload }
    } catch {
      return { ok: false, payload: {}, error: fallbackError }
    }
  }, [])

  const loadDashboardData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    setRefreshing(true)

    const [todayRes, upcomingRes, metricRes, delayRes, historyRes, communicationRes] = await Promise.all([
      runApiRequest(getTodaysAppointmentTracking, 'Could not load today tracking data'),
      runApiRequest(() => getUpcomingAppointmentsTracking(upcomingDays), 'Could not load upcoming tracking data'),
      runApiRequest(() => getAppointmentMetricsSummary(metricsPeriod), 'Could not load metrics'),
      runApiRequest(getTodaysAppointmentDelays, 'Could not load delays summary'),
      runApiRequest(() => getNotificationHistory(appliedNotificationFilters), 'Could not load notification history'),
      runApiRequest(() => getCommunicationLog(appliedCommunicationFilters), 'Could not load communication log'),
    ])

    let failedSections = 0

    if (todayRes.ok) {
      const data = normalizeApiData(todayRes.payload)
      const appointments = Array.isArray(data?.appointments) ? data.appointments : []
      setTodaySummary(data?.tracking_summary || {})
      setTodayAppointments(appointments)
      setNotificationForm((prev) => ({
        ...prev,
        appointment_ref: prev.appointment_ref || appointments[0]?.appointment_ref || '',
      }))
      setDelayForm((prev) => ({
        ...prev,
        appointment_ref: prev.appointment_ref || appointments[0]?.appointment_ref || '',
      }))
      setCommunicationForm((prev) => ({
        ...prev,
        appointment_ref: prev.appointment_ref || appointments[0]?.appointment_ref || '',
      }))
      setSelectedBulkRefs((prev) => {
        const available = appointments.map((item) => item.appointment_ref)
        const retained = prev.filter((ref) => available.includes(ref))
        if (retained.length > 0) return retained
        return available.slice(0, Math.min(3, available.length))
      })
    } else {
      failedSections += 1
      setTodaySummary({})
      setTodayAppointments([])
      setSelectedBulkRefs([])
    }

    if (upcomingRes.ok) {
      const data = normalizeApiData(upcomingRes.payload)
      setUpcomingByDate(data?.appointments_by_date || {})
    } else {
      failedSections += 1
      setUpcomingByDate({})
    }

    if (metricRes.ok) {
      const data = normalizeApiData(metricRes.payload)
      setMetrics(data?.metrics || {})
    } else {
      failedSections += 1
      setMetrics({})
    }

    if (delayRes.ok) {
      const data = normalizeApiData(delayRes.payload)
      setDelaySummary(data || {})
      setDelays(Array.isArray(data?.delays) ? data.delays : [])
    } else {
      failedSections += 1
      setDelaySummary({})
      setDelays([])
    }

    if (historyRes.ok) {
      const data = normalizeApiData(historyRes.payload)
      setNotificationHistory(Array.isArray(data?.notifications) ? data.notifications : [])
    } else {
      failedSections += 1
      setNotificationHistory([])
    }

    if (communicationRes.ok) {
      const data = normalizeApiData(communicationRes.payload)
      setCommunicationLog(Array.isArray(data?.communications) ? data.communications : [])
    } else {
      failedSections += 1
      setCommunicationLog([])
    }

    if (failedSections > 0) {
      toast.warn('Some tracking sections could not be loaded. Please refresh.')
    }

    setLoading(false)
    setRefreshing(false)
  }, [
    appliedCommunicationFilters,
    appliedNotificationFilters,
    metricsPeriod,
    runApiRequest,
    upcomingDays,
  ])

  useEffect(() => {
    loadDashboardData(true)
  }, [loadDashboardData])

  const upcomingRows = useMemo(() => {
    return Object.entries(upcomingByDate || {}).flatMap(([date, items]) =>
      (Array.isArray(items) ? items : []).map((item) => ({
        ...item,
        date,
      }))
    )
  }, [upcomingByDate])

  const appointmentOptions = useMemo(() => {
    const unique = new Map()
    todayAppointments.forEach((item) => {
      unique.set(item.appointment_ref, {
        appointment_ref: item.appointment_ref,
        patient_name: item.patient_name,
      })
    })
    upcomingRows.forEach((item) => {
      if (!unique.has(item.appointment_ref)) {
        unique.set(item.appointment_ref, {
          appointment_ref: item.appointment_ref,
          patient_name: item.patient_name,
        })
      }
    })
    return Array.from(unique.values())
  }, [todayAppointments, upcomingRows])

  const handleViewTrackingDetails = async (appointmentRef) => {
    if (!appointmentRef) return
    setDetailsLoading(true)
    const result = await runApiRequest(
      () => getAppointmentTrackingDetails(appointmentRef),
      'Could not load appointment tracking details'
    )
    if (!result.ok) {
      toast.error(result.error)
      setDetailsLoading(false)
      return
    }
    const data = normalizeApiData(result.payload)
    setSelectedTracking({
      appointment_tracking: data?.appointment_tracking || {},
      communication_log: Array.isArray(data?.communication_log) ? data.communication_log : [],
      notification_history: Array.isArray(data?.notification_history) ? data.notification_history : [],
    })
    setDetailsLoading(false)
  }

  const handleSendNotification = async (event) => {
    event.preventDefault()
    const channels = Object.entries(notificationForm.channels)
      .filter(([, checked]) => checked)
      .map(([channel]) => channel)

    if (!notificationForm.appointment_ref) {
      toast.error('Please select an appointment reference')
      return
    }
    if (channels.length === 0) {
      toast.error('Please select at least one notification channel')
      return
    }

    setIsSendingNotification(true)
    const result = await runApiRequest(
      () =>
        sendAppointmentNotification({
          appointment_ref: notificationForm.appointment_ref,
          notification_type: notificationForm.notification_type,
          channels,
          message: String(notificationForm.message || '').trim() || null,
        }),
      'Could not send notification'
    )

    if (!result.ok) {
      toast.error(result.error)
      setIsSendingNotification(false)
      return
    }

    toast.success('Notification sent successfully')
    setNotificationForm((prev) => ({ ...prev, message: '' }))
    await loadDashboardData(false)
    setIsSendingNotification(false)
  }

  const handleQuickReminder = async (appointmentRef) => {
    if (!appointmentRef) return
    const result = await runApiRequest(
      () =>
        sendAppointmentNotification({
          appointment_ref: appointmentRef,
          notification_type: 'APPOINTMENT_REMINDER',
          channels: ['SMS'],
          message: null,
        }),
      'Could not send reminder'
    )
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Reminder sent')
    await loadDashboardData(false)
  }

  const handleDelayUpdate = async (event) => {
    event.preventDefault()
    if (!delayForm.appointment_ref || !delayForm.reason.trim()) {
      toast.error('Appointment reference and delay reason are required')
      return
    }

    setIsUpdatingDelay(true)
    const result = await runApiRequest(
      () =>
        updateAppointmentDelay(delayForm.appointment_ref, {
          delay_minutes: Number(delayForm.delay_minutes || 0),
          reason: String(delayForm.reason || '').trim(),
          estimated_new_time: delayForm.estimated_new_time || null,
          notify_patient: Boolean(delayForm.notify_patient),
        }),
      'Could not update appointment delay'
    )

    if (!result.ok) {
      toast.error(result.error)
      setIsUpdatingDelay(false)
      return
    }

    toast.success('Appointment delay updated')
    setDelayForm((prev) => ({ ...prev, reason: '', estimated_new_time: '' }))
    await loadDashboardData(false)
    setIsUpdatingDelay(false)
  }

  const handleBulkNotificationSubmit = async (event) => {
    event.preventDefault()
    const channels = Object.entries(bulkNotificationForm.channels)
      .filter(([, checked]) => checked)
      .map(([channel]) => channel)

    if (selectedBulkRefs.length === 0) {
      toast.error('Select at least one appointment for bulk notifications')
      return
    }
    if (channels.length === 0) {
      toast.error('Please select at least one notification channel')
      return
    }
    if (!bulkNotificationForm.message_template.trim()) {
      toast.error('Message template is required for bulk notification')
      return
    }

    setIsSendingBulkNotification(true)
    const result = await runApiRequest(
      () =>
        sendBulkAppointmentNotifications({
          appointment_refs: selectedBulkRefs,
          notification_type: bulkNotificationForm.notification_type,
          channels,
          message_template: bulkNotificationForm.message_template.trim(),
          priority: 'NORMAL',
        }),
      'Could not send bulk notifications'
    )
    if (!result.ok) {
      toast.error(result.error)
      setIsSendingBulkNotification(false)
      return
    }
    toast.success('Bulk notifications queued successfully')
    await loadDashboardData(false)
    setIsSendingBulkNotification(false)
  }

  const handleSelectBulkRef = (appointmentRef) => {
    setSelectedBulkRefs((prev) => {
      if (prev.includes(appointmentRef)) {
        return prev.filter((ref) => ref !== appointmentRef)
      }
      return [...prev, appointmentRef]
    })
  }

  const openCommunicationLogModal = (appointmentRef = '') => {
    setCommunicationForm((prev) => ({
      ...prev,
      appointment_ref: appointmentRef || prev.appointment_ref || appointmentOptions[0]?.appointment_ref || '',
      communication_type: prev.communication_type || 'SMS',
      direction: prev.direction || 'OUTBOUND',
      channel: prev.channel || 'SMS',
    }))
    setIsCommunicationModalOpen(true)
  }

  const handleCreateCommunicationEntry = async (event) => {
    event.preventDefault()
    if (!communicationForm.appointment_ref || !communicationForm.message.trim()) {
      toast.error('Appointment reference and message are required')
      return
    }

    setIsCreatingCommunicationLog(true)
    const result = await runApiRequest(
      () =>
        createCommunicationLogEntry({
          appointment_ref: communicationForm.appointment_ref,
          communication_type: communicationForm.communication_type,
          direction: communicationForm.direction,
          channel: communicationForm.channel,
          subject: communicationForm.subject.trim() || null,
          message: communicationForm.message.trim(),
          status: communicationForm.status || 'SENT',
          response_received: Boolean(communicationForm.response_received),
          response_message: communicationForm.response_received
            ? communicationForm.response_message.trim() || null
            : null,
        }),
      'Could not create communication log entry'
    )

    if (!result.ok) {
      toast.error(result.error)
      setIsCreatingCommunicationLog(false)
      return
    }

    toast.success('Communication log entry created')
    setCommunicationForm((prev) => ({
      ...prev,
      subject: '',
      message: '',
      status: 'SENT',
      response_received: false,
      response_message: '',
    }))
    setIsCommunicationModalOpen(false)
    await loadDashboardData(false)
    setIsCreatingCommunicationLog(false)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Appointment Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">Live tracking, notifications, delays, and communication overview.</p>
        </div>
        <button type="button"  style={{
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer"
    }} onClick={() => loadDashboardData(false)} className="btn-secondary" disabled={refreshing}>
       <i className="fas fa-sync-alt mr-2"></i>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <TrackingCard title="Scheduled" value={todaySummary.scheduled || 0} color="yellow" />
        <TrackingCard title="Confirmed" value={todaySummary.confirmed || 0} color="blue" />
        <TrackingCard title="Checked In" value={todaySummary.checked_in || 0} color="green" />
        <TrackingCard title="In Progress" value={todaySummary.in_progress || 0} color="purple" />
        <TrackingCard title="Completed" value={todaySummary.completed || 0} color="emerald" />
      </div>

      <div className="bg-white rounded-xl border card-shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Today&apos;s Appointments</h3>
          <span className="text-xs text-gray-500">{todayAppointments.length} appointments</span>
        </div>
        <DataTable
          columns={[
            { key: 'appointment_ref', title: 'Reference', sortable: true },
            { key: 'patient_name', title: 'Patient', sortable: true },
            {
              key: 'appointment_time',
              title: 'Time',
              render: (v) => formatClockTime(v),
            },
            {
              key: 'tracking_status',
              title: 'Tracking',
              render: (v) => <span className={`px-2 py-1 rounded-full text-xs ${statusClass(v)}`}>{humanizeStatus(v)}</span>,
            },
            {
              key: 'appointment_status',
              title: 'Status',
              render: (v) => <span className={`px-2 py-1 rounded-full text-xs ${statusClass(v)}`}>{humanizeStatus(v)}</span>,
            },
            {
              key: 'actions',
              title: 'Actions',
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="icon-btn text-blue-600"
                    title="View tracking details"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleViewTrackingDetails(row.appointment_ref)
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    type="button"
                    className="icon-btn text-green-600"
                    title="Send SMS reminder"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleQuickReminder(row.appointment_ref)
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                  <button
                    type="button"
                    className="icon-btn text-indigo-600"
                    title="Create communication log"
                    onClick={(event) => {
                      event.stopPropagation()
                      openCommunicationLogModal(row.appointment_ref)
                    }}
                  >
                    <i className="fas fa-comment-medical"></i>
                  </button>
                </div>
              ),
            },
          ]}
          data={todayAppointments}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border card-shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Tracking</h3>
            <select
              value={upcomingDays}
              onChange={(e) => setUpcomingDays(Number(e.target.value))}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <DataTable
            columns={[
              { key: 'date', title: 'Date', sortable: true },
              { key: 'appointment_time', title: 'Time', render: (v) => formatClockTime(v) },
              { key: 'patient_name', title: 'Patient', sortable: true },
              {
                key: 'tracking_status',
                title: 'Tracking',
                render: (v) => <span className={`px-2 py-1 rounded-full text-xs ${statusClass(v)}`}>{humanizeStatus(v)}</span>,
              },
              {
                key: 'requires_confirmation',
                title: 'Needs Confirm',
                render: (v) => (v ? <span className="text-red-600 font-medium">Yes</span> : <span className="text-green-600">No</span>),
              },
            ]}
            data={upcomingRows}
          />
        </div>

        <div className="bg-white rounded-xl border card-shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Send Appointment Notification</h3>
          <form className="space-y-3" onSubmit={handleSendNotification}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Appointment Reference</label>
              <select
                value={notificationForm.appointment_ref}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, appointment_ref: e.target.value }))}
                className="form-input"
              >
                <option value="">Select appointment</option>
                {todayAppointments.map((item) => (
                  <option key={item.appointment_ref} value={item.appointment_ref}>
                    {item.appointment_ref} - {item.patient_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Notification Type</label>
              <select
                value={notificationForm.notification_type}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, notification_type: e.target.value }))}
                className="form-input"
              >
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {humanizeStatus(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Channels</p>
              <div className="flex items-center gap-4">
                {Object.keys(notificationForm.channels).map((channel) => (
                  <label key={channel} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={notificationForm.channels[channel]}
                      onChange={(e) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          channels: { ...prev.channels, [channel]: e.target.checked },
                        }))
                      }
                    />
                    {channel}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Custom Message (Optional)</label>
              <textarea
                rows={3}
                value={notificationForm.message}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, message: e.target.value }))}
                className="form-input"
                placeholder="Leave empty to use backend template"
              />
            </div>
            <button type="submit"
               style={{
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer"
  }}
            className="btn-primary" disabled={isSendingNotification}>
              {isSendingNotification ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border card-shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Bulk Notifications</h3>
          <form className="space-y-3" onSubmit={handleBulkNotificationSubmit}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Notification Type</label>
              <select
                value={bulkNotificationForm.notification_type}
                onChange={(e) => setBulkNotificationForm((prev) => ({ ...prev, notification_type: e.target.value }))}
                className="form-input"
              >
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {humanizeStatus(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Channels</p>
              <div className="flex items-center gap-3">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <label key={channel} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={bulkNotificationForm.channels[channel]}
                      onChange={(e) =>
                        setBulkNotificationForm((prev) => ({
                          ...prev,
                          channels: { ...prev.channels, [channel]: e.target.checked },
                        }))
                      }
                    />
                    {channel}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Appointments</p>
              <div className="max-h-32 overflow-auto border rounded-lg p-2 space-y-1">
                {todayAppointments.map((item) => (
                  <label key={item.appointment_ref} className="block text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedBulkRefs.includes(item.appointment_ref)}
                      onChange={() => handleSelectBulkRef(item.appointment_ref)}
                      className="mr-2"
                    />
                    {item.appointment_ref} - {item.patient_name}
                  </label>
                ))}
                {todayAppointments.length === 0 && <p className="text-xs text-gray-500">No appointments available</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Message Template</label>
              <textarea
                rows={4}
                value={bulkNotificationForm.message_template}
                onChange={(e) => setBulkNotificationForm((prev) => ({ ...prev, message_template: e.target.value }))}
                className="form-input"
                placeholder="Use {patient_name}, {doctor_name}, {appointment_date}, {appointment_time}, {appointment_ref}"
              />
            </div>
            <button type="submit"  style={{ 
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer"
  }}

            className="btn-primary" disabled={isSendingBulkNotification}>
              {isSendingBulkNotification ? 'Queueing...' : 'Send Bulk Notifications'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border card-shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Update Appointment Delay</h3>
          <form className="space-y-3" onSubmit={handleDelayUpdate}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Appointment Reference</label>
              <select
                value={delayForm.appointment_ref}
                onChange={(e) => setDelayForm((prev) => ({ ...prev, appointment_ref: e.target.value }))}
                className="form-input"
              >
                <option value="">Select appointment</option>
                {todayAppointments.map((item) => (
                  <option key={item.appointment_ref} value={item.appointment_ref}>
                    {item.appointment_ref} - {item.patient_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Delay Minutes</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={delayForm.delay_minutes}
                  onChange={(e) => setDelayForm((prev) => ({ ...prev, delay_minutes: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estimated New Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={delayForm.estimated_new_time}
                  onChange={(e) => setDelayForm((prev) => ({ ...prev, estimated_new_time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Reason</label>
              <textarea
                rows={3}
                className="form-input"
                value={delayForm.reason}
                onChange={(e) => setDelayForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Example: Emergency consultation"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={delayForm.notify_patient}
                onChange={(e) => setDelayForm((prev) => ({ ...prev, notify_patient: e.target.checked }))}
              />
              Notify patient immediately
            </label>
            <button type="submit"  style={{
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginLeft:"10px",
    height:"40px",
    width:"130px", 
    
  }} className="btn-primary" disabled={isUpdatingDelay}>
              {isUpdatingDelay ? 'Updating...' : 'Update Delay'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border card-shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Today&apos;s Delay Summary</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SimpleStat label="Delayed Appointments" value={delaySummary.delayed_appointments || 0} />
            <SimpleStat label="Total Delay (min)" value={delaySummary.total_delay_minutes || 0} />
            <SimpleStat label="Avg Delay (min)" value={delaySummary.average_delay_minutes || 0} />
            <SimpleStat label="Running Delay (min)" value={delaySummary.current_running_delay || 0} />
          </div>
          <DataTable
            columns={[
              { key: 'appointment_ref', title: 'Reference', sortable: true },
              { key: 'patient_name', title: 'Patient', sortable: true },
              { key: 'delay_minutes', title: 'Delay (min)', sortable: true },
              { key: 'estimated_new_time', title: 'New Time' },
              { key: 'reason', title: 'Reason' },
            ]}
            data={delays}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border card-shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Notification History</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => setAppliedNotificationFilters(notificationFiltersDraft)}
              >
                Apply
              </button>
              <button
                type="button"
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => {
                  const reset = {
                    appointment_ref: '',
                    notification_type: '',
                    date_from: '',
                    date_to: '',
                    limit: 20,
                  }
                  setNotificationFiltersDraft(reset)
                  setAppliedNotificationFilters(reset)
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <input
              type="text"
              placeholder="Appointment Ref"
              className="form-input"
              value={notificationFiltersDraft.appointment_ref}
              onChange={(e) =>
                setNotificationFiltersDraft((prev) => ({ ...prev, appointment_ref: e.target.value }))
              }
            />
            <select
              className="form-input"
              value={notificationFiltersDraft.notification_type}
              onChange={(e) =>
                setNotificationFiltersDraft((prev) => ({ ...prev, notification_type: e.target.value }))
              }
            >
              <option value="">All notification types</option>
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeStatus(type)}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="form-input"
              value={notificationFiltersDraft.date_from}
              onChange={(e) => setNotificationFiltersDraft((prev) => ({ ...prev, date_from: e.target.value }))}
            />
            <input
              type="date"
              className="form-input"
              value={notificationFiltersDraft.date_to}
              onChange={(e) => setNotificationFiltersDraft((prev) => ({ ...prev, date_to: e.target.value }))}
            />
          </div>
          <DataTable
            columns={[
              { key: 'appointment_ref', title: 'Reference', sortable: true },
              { key: 'patient_name', title: 'Patient', sortable: true },
              {
                key: 'notification_type',
                title: 'Type',
                render: (v) => humanizeStatus(v),
              },
              { key: 'priority', title: 'Priority' },
              { key: 'created_at', title: 'Created At' },
            ]}
            data={notificationHistory}
          />
        </div>

        <div className="bg-white rounded-xl border card-shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Communication Log</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => openCommunicationLogModal()}
              >
                Add Entry
              </button>
              <button
                type="button"
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => setAppliedCommunicationFilters(communicationFiltersDraft)}
              >
                Apply
              </button>
              <button
                type="button"
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => {
                  const reset = {
                    appointment_ref: '',
                    patient_ref: '',
                    communication_type: '',
                    date_from: '',
                    date_to: '',
                    limit: 20,
                  }
                  setCommunicationFiltersDraft(reset)
                  setAppliedCommunicationFilters(reset)
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <input
              type="text"
              placeholder="Appointment Ref"
              className="form-input"
              value={communicationFiltersDraft.appointment_ref}
              onChange={(e) =>
                setCommunicationFiltersDraft((prev) => ({ ...prev, appointment_ref: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Patient Ref"
              className="form-input"
              value={communicationFiltersDraft.patient_ref}
              onChange={(e) => setCommunicationFiltersDraft((prev) => ({ ...prev, patient_ref: e.target.value }))}
            />
            <select
              className="form-input"
              value={communicationFiltersDraft.communication_type}
              onChange={(e) =>
                setCommunicationFiltersDraft((prev) => ({ ...prev, communication_type: e.target.value }))
              }
            >
              <option value="">All communication types</option>
              {COMMUNICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeStatus(type)}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="form-input"
              value={communicationFiltersDraft.date_from}
              onChange={(e) => setCommunicationFiltersDraft((prev) => ({ ...prev, date_from: e.target.value }))}
            />
            <input
              type="date"
              className="form-input"
              value={communicationFiltersDraft.date_to}
              onChange={(e) => setCommunicationFiltersDraft((prev) => ({ ...prev, date_to: e.target.value }))}
            />
          </div>
          <DataTable
            columns={[
              { key: 'appointment_ref', title: 'Reference', sortable: true },
              { key: 'patient_name', title: 'Patient', sortable: true },
              { key: 'communication_type', title: 'Type', render: (v) => humanizeStatus(v) },
              { key: 'direction', title: 'Direction' },
              { key: 'status', title: 'Status' },
              { key: 'sent_at', title: 'Sent At' },
            ]}
            data={communicationLog}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border card-shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Tracking Metrics</h3>
          <select
            value={metricsPeriod}
            onChange={(e) => setMetricsPeriod(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {METRIC_PERIODS.map((period) => (
              <option key={period} value={period}>
                {humanizeStatus(period)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SimpleStat label="Total" value={metrics.total_appointments ?? 0} />
          <SimpleStat label="Confirmed" value={metrics.confirmed_appointments ?? 0} />
          <SimpleStat label="Completed" value={metrics.completed_appointments ?? 0} />
          <SimpleStat label="Confirmation %" value={metrics.confirmation_rate ?? 0} />
          <SimpleStat label="On-time %" value={metrics.on_time_rate ?? 0} />
        </div>
      </div>

      {detailsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-gray-700">Loading tracking details...</div>
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedTracking)}
        onClose={() => setSelectedTracking(null)}
        title="Appointment Tracking Details"
        size="lg"
      >
        {selectedTracking && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Appointment Ref" value={selectedTracking.appointment_tracking?.appointment_ref} />
              <InfoField label="Patient" value={selectedTracking.appointment_tracking?.patient_name} />
              <InfoField label="Date" value={selectedTracking.appointment_tracking?.appointment_date} />
              <InfoField label="Time" value={formatClockTime(selectedTracking.appointment_tracking?.appointment_time)} />
              <InfoField label="Tracking Status" value={humanizeStatus(selectedTracking.appointment_tracking?.tracking_status)} />
              <InfoField label="Appointment Status" value={humanizeStatus(selectedTracking.appointment_tracking?.appointment_status)} />
              <InfoField label="Department" value={selectedTracking.appointment_tracking?.department} />
              <InfoField label="Chief Complaint" value={selectedTracking.appointment_tracking?.chief_complaint} />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Notification Timeline</h4>
              <div className="space-y-2">
                {selectedTracking.notification_history.map((item) => (
                  <div key={item.notification_id} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-medium text-gray-800">{humanizeStatus(item.type)} ({item.channel})</p>
                    <p className="text-xs text-gray-500">{item.sent_at || '-'}</p>
                  </div>
                ))}
                {selectedTracking.notification_history.length === 0 && (
                  <p className="text-sm text-gray-500">No notifications recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCommunicationModalOpen}
        onClose={() => setIsCommunicationModalOpen(false)}
        title="Create Communication Log Entry"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleCreateCommunicationEntry}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Appointment Reference</label>
              <select
                className="form-input"
                value={communicationForm.appointment_ref}
                onChange={(e) => setCommunicationForm((prev) => ({ ...prev, appointment_ref: e.target.value }))}
              >
                <option value="">Select appointment</option>
                {appointmentOptions.map((item) => (
                  <option key={item.appointment_ref} value={item.appointment_ref}>
                    {item.appointment_ref} - {item.patient_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Communication Type</label>
              <select
                className="form-input"
                value={communicationForm.communication_type}
                onChange={(e) =>
                  setCommunicationForm((prev) => ({
                    ...prev,
                    communication_type: e.target.value,
                    channel: e.target.value === 'EMAIL' ? 'EMAIL' : e.target.value === 'SMS' ? 'SMS' : prev.channel,
                  }))
                }
              >
                {COMMUNICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {humanizeStatus(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Direction</label>
              <select
                className="form-input"
                value={communicationForm.direction}
                onChange={(e) => setCommunicationForm((prev) => ({ ...prev, direction: e.target.value }))}
              >
                {COMMUNICATION_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction}>
                    {humanizeStatus(direction)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Channel</label>
              <select
                className="form-input"
                value={communicationForm.channel}
                onChange={(e) => setCommunicationForm((prev) => ({ ...prev, channel: e.target.value }))}
              >
                {['SMS', 'EMAIL', 'CALL', 'IN_PERSON'].map((channel) => (
                  <option key={channel} value={channel}>
                    {humanizeStatus(channel)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject (Optional)</label>
            <input
              className="form-input"
              value={communicationForm.subject}
              onChange={(e) => setCommunicationForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Appointment Reminder"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Message</label>
            <textarea
              rows={4}
              className="form-input"
              value={communicationForm.message}
              onChange={(e) => setCommunicationForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Enter communication details"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                className="form-input"
                value={communicationForm.status}
                onChange={(e) => setCommunicationForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {['SENT', 'DELIVERED', 'READ', 'FAILED'].map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-8">
              <input
                type="checkbox"
                checked={communicationForm.response_received}
                onChange={(e) =>
                  setCommunicationForm((prev) => ({
                    ...prev,
                    response_received: e.target.checked,
                  }))
                }
              />
              Response received
            </label>
          </div>
          {communicationForm.response_received && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Response Message</label>
              <textarea
                rows={2}
                className="form-input"
                value={communicationForm.response_message}
                onChange={(e) => setCommunicationForm((prev) => ({ ...prev, response_message: e.target.value }))}
                placeholder="Patient response"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCommunicationModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isCreatingCommunicationLog}>
              {isCreatingCommunicationLog ? 'Saving...' : 'Create Log Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const TrackingCard = ({ title, value, color }) => (
  <div
    className={`rounded-xl p-5 text-white ${
      color === 'green'
        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
        : color === 'purple'
          ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
          : color === 'emerald'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
            : color === 'yellow'
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-700'
    }`}
  >
    <p className="text-sm opacity-90">{title}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </div>
)

const SimpleStat = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
  </div>
)

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-900">{value || '-'}</p>
  </div>
)

export default AppointmentTracking
