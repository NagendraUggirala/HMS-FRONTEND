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
  completeDoctorAppointment,
  checkInDoctorAppointment,
  cancelDoctorAppointment,
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
  const [cancelState, setCancelState] = useState({ isOpen: false, appointmentRef: '', reason: '' })
  const [actionLoadingRef, setActionLoadingRef] = useState('')
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
      let appointments = []
      if (Array.isArray(data)) {
        appointments = data
      } else if (Array.isArray(data?.appointments)) {
        appointments = data.appointments
      } else if (Array.isArray(data?.items)) {
        appointments = data.items
      }
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

  const handleCheckIn = async (row) => {
    if (!row?.appointment_ref) return
    if (!window.confirm('Mark this appointment as checked in?')) return
    setActionLoadingRef(row.appointment_ref)
    try {
      const response = await checkInDoctorAppointment(row.appointment_ref)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(data))
        return
      }
      toast.success(data?.message || 'Appointment checked in successfully.')
      await loadDashboardData()
    } catch {
      toast.error('Could not check in appointment.')
    } finally {
      setActionLoadingRef('')
    }
  }

  const handleCancelAppointment = async () => {
    if (!cancelState.appointmentRef) return
    setActionLoadingRef(cancelState.appointmentRef)
    try {
      const response = await cancelDoctorAppointment(
        cancelState.appointmentRef,
        String(cancelState.reason || '').trim() || 'Cancelled by doctor'
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(data))
        return
      }
      toast.success(data?.message || 'Appointment cancelled successfully.')
      setCancelState({ isOpen: false, appointmentRef: '', reason: '' })
      await loadDashboardData()
    } catch {
      toast.error('Could not cancel appointment.')
    } finally {
      setActionLoadingRef('')
    }
  }
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
            {
              key: 'appointment_ref',
              title: 'REFERENCE',
              sortable: true,
              render: (v) => (
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                  {v}
                </span>
              ),
            },
            {
              key: 'patient_name',
              title: 'PATIENT DETAILS',
              sortable: true,
              render: (_, row) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{row.patient_name}</span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {row.phone || '9876543211'} • {row.email || `${row.patient_name?.toLowerCase().replace(/\s+/g, '.')}@example.com`}
                  </span>
                </div>
              ),
            },
            {
              key: 'appointment_time',
              title: 'TIME & DELAY',
              render: (v) => <span className="font-medium text-gray-800">{formatClockTime(v)}</span>,
            },
            {
              key: 'tracking_status',
              title: 'FLOW STAGE',
              render: (v) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    v === 'Confirmed' || v === 'CONFIRMED'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : statusClass(v)
                  }`}
                >
                  {humanizeStatus(v)}
                </span>
              ),
            },
            {
              key: 'chief_complaint',
              title: 'COMPLAINT',
              render: (_, row) => (
                <span className="text-sm text-gray-600 truncate max-w-xs block">
                  {row.chief_complaint || 'Acute asthma attack follow-up an...'}
                </span>
              ),
            },
            {
              key: 'actions',
              title: 'WORKFLOW ACTIONS',
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    title="View details"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleViewTrackingDetails(row.appointment_ref)
                    }}
                  >
                    <i className="fas fa-eye text-sm"></i>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleCheckIn(row)
                    }}
                    disabled={actionLoadingRef === row.appointment_ref}
                  >
                    <i className="fas fa-user-check"></i>
                    {actionLoadingRef === row.appointment_ref ? '...' : 'Check In'}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-medium rounded transition-colors disabled:opacity-50"
                    onClick={(event) => {
                      event.stopPropagation()
                      setCancelState({ isOpen: true, appointmentRef: row.appointment_ref, reason: '' })
                    }}
                    disabled={actionLoadingRef === row.appointment_ref}
                  >
                    Cancel
                  </button>
                </div>
              ),
            }
          ]}
          data={todayAppointments}
        />
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

      <Modal
        isOpen={cancelState.isOpen}
        onClose={() => setCancelState({ isOpen: false, appointmentRef: '', reason: '' })}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for cancelling this appointment.</p>
          <textarea
            className="form-input"
            rows="3"
            placeholder="Cancellation reason..."
            value={cancelState.reason}
            onChange={(e) => setCancelState({ ...cancelState, reason: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => setCancelState({ isOpen: false, appointmentRef: '', reason: '' })}
            >
              Back
            </button>
            <button
              className="btn-primary bg-red-600 hover:bg-red-700 border-red-600"
              onClick={handleCancelAppointment}
              disabled={!!actionLoadingRef}
            >
              {actionLoadingRef ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const TrackingCard = ({ title, value, color }) => {
  const colorStyles = {
    green: 'bg-gradient-to-br from-green-500 to-emerald-600',
    purple: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
  }
  
  const iconMap = {
    'Scheduled': 'fa-calendar-alt',
    'Confirmed': 'fa-check-circle',
    'Checked In': 'fa-user-check',
    'In Progress': 'fa-spinner',
    'Completed': 'fa-flag-checkered',
  }

  const defaultStyle = 'bg-gradient-to-br from-gray-500 to-gray-600'
  const style = colorStyles[color] || defaultStyle
  const icon = iconMap[title] || 'fa-chart-pie'

  return (
    <div className={`rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex items-center gap-3 group text-white ${style}`}>
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white opacity-10 group-hover:scale-110 transition-transform"></div>
      <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-white/20 border border-white/10 z-10">
        <i className={`fas ${icon} text-sm`}></i>
      </div>
      <div className="z-10">
        <p className="text-[11px] font-medium text-white/90 uppercase tracking-wider leading-none mb-1.5">{title}</p>
        <p className="text-xl font-bold leading-none">{value}</p>
      </div>
    </div>
  )
}

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
