import React, { useEffect, useMemo, useState } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import { apiFetch } from '../../../../services/apiClient'
import {
  DOCTOR_SCHEDULE_WEEKLY,
  DOCTOR_SCHEDULE_SLOTS,
  DOCTOR_SCHEDULE_CREATE,
  DOCTOR_SCHEDULE_SLOT_DETAILS,
  DOCTOR_STATISTICS_SUMMARY
} from '../../../../config/api'

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const EMPTY_FORM = {
  date: '',
  start_time: '',
  end_time: '',
  slot_duration_minutes: 30
}

const ScheduleManagement = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [weeklySchedule, setWeeklySchedule] = useState(null)
  const [scheduleSlots, setScheduleSlots] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [error, setError] = useState('')
  const [selectedWeekStart, setSelectedWeekStart] = useState(getStartOfWeekISO(new Date()))
  const [modalState, setModalState] = useState({ add: false, edit: false })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [currentSlot, setCurrentSlot] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const loadData = async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true)
    setRefreshing(true)
    setError('')

    try {
      const weeklyParams = new URLSearchParams()
      if (selectedWeekStart) weeklyParams.set('week_start', selectedWeekStart)

      const [weeklyRes, slotsRes, statsRes] = await Promise.all([
        apiFetchWithFallback(
          buildCandidatePaths('weekly', { weekStart: selectedWeekStart }),
          { method: 'GET' }
        ),
        apiFetchWithFallback(buildCandidatePaths('slots'), { method: 'GET' }),
        apiFetchWithFallback(buildCandidatePaths('statistics'), { method: 'GET' })
      ])

      const weeklyData = await weeklyRes.json().catch(() => ({}))
      const slotsData = await slotsRes.json().catch(() => ({}))
      const statsData = await statsRes.json().catch(() => ({}))

      if (!weeklyRes.ok) {
        throw new Error(
          weeklyData?.message ||
          weeklyData?.detail ||
          `Failed to load weekly schedule (${weeklyRes.status})${weeklyRes?._attemptedPath ? ` - ${weeklyRes._attemptedPath}` : ''}`
        )
      }
      if (!slotsRes.ok) {
        throw new Error(
          slotsData?.message ||
          slotsData?.detail ||
          `Failed to load schedule slots (${slotsRes.status})${slotsRes?._attemptedPath ? ` - ${slotsRes._attemptedPath}` : ''}`
        )
      }

      setWeeklySchedule(getDataPayload(weeklyData))
      setScheduleSlots(normalizeScheduleSlots(getDataPayload(slotsData)))
      setStatistics(getDataPayload(statsData))
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load schedule information.')
      setWeeklySchedule(null)
      setScheduleSlots([])
      setStatistics(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData({ showLoader: true })
  }, [selectedWeekStart])

  const stats = useMemo(() => {
    if (weeklySchedule?.daily_schedules?.length > 0) {
      let totalSlots = 0
      let totalAppointments = 0
      let availableSlots = 0
      weeklySchedule.daily_schedules.forEach(day => {
         totalSlots += Number(day.total_slots || 0)
         totalAppointments += Number(day.booked_appointments || day.total_appointments || 0)
         availableSlots += Number(day.available_slots || 0)
      })
      return { totalSlots, totalAppointments, availableSlots }
    }

    if (statistics) {
      return {
        totalSlots: Number(statistics.total_slots || 0),
        totalAppointments: Number(statistics.total_appointments || statistics.booked_appointments || 0),
        availableSlots: Number(statistics.available_slots || 0)
      }
    }
    const totalSlots = Number(weeklySchedule?.total_slots || 0)
    const totalAppointments = Number(weeklySchedule?.total_appointments || weeklySchedule?.booked_appointments || 0)
    const availableSlots = Number(weeklySchedule?.available_slots || 0)
    return { totalSlots, totalAppointments, availableSlots }
  }, [statistics, weeklySchedule])

  const openAddModal = () => {
    setCurrentSlot(null)
    setFormData(EMPTY_FORM)
    setModalState({ add: true, edit: false })
  }

  const openEditModal = (slot) => {
    setCurrentSlot(slot)
    setFormData({
      date: slot.date || '',
      start_time: slot.start_time || '',
      end_time: slot.end_time || '',
      slot_duration_minutes: slot.slot_duration_minutes || 30
    })
    setModalState({ add: false, edit: true })
  }

  const closeModal = () => {
    setModalState({ add: false, edit: false })
    setCurrentSlot(null)
    setFormData(EMPTY_FORM)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const buildPayload = () => {
    let dayOfWeek = null;
    if (formData.date) {
      try {
        const d = new Date(formData.date);
        if (!isNaN(d.getTime())) {
          const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
          dayOfWeek = days[d.getDay()];
        }
      } catch (e) {}
    }
    
    return {
      date: formData.date || null,
      day_of_week: formData.day_of_week || dayOfWeek,
      start_time: formData.start_time,
      end_time: formData.end_time,
    slot_duration_minutes: Number(formData.slot_duration_minutes) || 30,
    slot_duration: Number(formData.slot_duration_minutes) || 30,
    duration: Number(formData.slot_duration_minutes) || 30,
    duration_minutes: Number(formData.slot_duration_minutes) || 30,
    max_patients_per_slot: 1
  }
}

  const validateForm = () => {
    if (!formData.date || !formData.start_time || !formData.end_time) {
      window.alert('Please fill date, start time and end time.')
      return false
    }
    if (formData.start_time >= formData.end_time) {
      window.alert('End time must be greater than start time.')
      return false
    }
    const duration = Number(formData.slot_duration_minutes);
    if (!duration || duration < 15 || duration > 120) {
      window.alert('Slot duration must be between 15 and 120 minutes.')
      return false
    }
    return true
  }

  const handleCreateSlot = async () => {
    if (!validateForm()) return
    setSubmitLoading(true)
    try {
      const res = await apiFetchWithFallback(buildCandidatePaths('create'), {
        method: 'POST',
        body: buildPayload()
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(
          data?.message ||
          data?.detail ||
          `Failed to create slot (${res.status})${res?._attemptedPath ? ` - ${res._attemptedPath}` : ''}`
        )
        return
      }
      closeModal()
      loadData()
    } catch (submitError) {
      window.alert(submitError?.message || 'Unable to create schedule slot.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdateSlot = async () => {
    if (!currentSlot?.schedule_id || !validateForm()) return
    setSubmitLoading(true)
    try {
      const res = await apiFetchWithFallback(
        buildCandidatePaths('slotById', { scheduleId: currentSlot.schedule_id }),
        {
        method: 'PUT',
        body: buildPayload()
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(
          data?.message ||
          data?.detail ||
          `Failed to update slot (${res.status})${res?._attemptedPath ? ` - ${res._attemptedPath}` : ''}`
        )
        return
      }
      closeModal()
      loadData()
    } catch (submitError) {
      window.alert(submitError?.message || 'Unable to update schedule slot.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteSlot = async (slot) => {
    if (!slot?.schedule_id) return
    if (!window.confirm(`Delete schedule for ${slot.day_of_week}?`)) return

    try {
      const res = await apiFetchWithFallback(
        buildCandidatePaths('slotById', { scheduleId: slot.schedule_id }),
        {
        method: 'DELETE'
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(
          data?.message ||
          data?.detail ||
          `Failed to delete slot (${res.status})${res?._attemptedPath ? ` - ${res._attemptedPath}` : ''}`
        )
        return
      }
      loadData()
    } catch (deleteError) {
      window.alert(deleteError?.message || 'Unable to delete schedule slot.')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Schedule Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage weekly availability and schedule slots</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(event) => setSelectedWeekStart(event.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Slot
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <span><i className="fas fa-exclamation-circle mr-2"></i>{error}</span>
          <button onClick={() => loadData({ showLoader: true })} className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-sm">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Total Slots" value={stats.totalSlots} color="blue" icon="fa-calendar-alt" />
        <StatCard title="Booked Appointments" value={stats.totalAppointments} color="yellow" icon="fa-user-check" />
        <StatCard title="Available Slots" value={stats.availableSlots} color="green" icon="fa-clock" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Weekly Schedule</h3>
          {refreshing && <span className="text-xs text-gray-500">Refreshing...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slots</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(weeklySchedule?.daily_schedules || []).map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{humanizeDay(day.day_name)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{day.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {day.has_schedule ? `${day.start_time} - ${day.end_time}` : 'No schedule'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{day.total_slots ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{day.booked_appointments ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{day.available_slots ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Schedule Slots Configuration</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max/Slot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scheduleSlots.map((slot) => (
                <tr key={slot.schedule_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{humanizeDay(slot.day_of_week)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{slot.start_time} - {slot.end_time}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{slot.slot_duration_minutes} mins</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{slot.max_patients_per_slot}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${slot.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(slot)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {scheduleSlots.length === 0 && (
          <div className="text-center py-10 text-gray-500">No schedule slots configured.</div>
        )}
      </div>

      <Modal isOpen={modalState.add} onClose={closeModal} title="Create Schedule Slot" size="lg">
        <SlotForm
          formData={formData}
          onChange={handleInputChange}
          onCancel={closeModal}
          onSubmit={handleCreateSlot}
          submitText={submitLoading ? 'Saving...' : 'Create Slot'}
          submitLoading={submitLoading}
        />
      </Modal>

      <Modal isOpen={modalState.edit} onClose={closeModal} title="Edit Schedule Slot" size="lg">
        <SlotForm
          formData={formData}
          onChange={handleInputChange}
          onCancel={closeModal}
          onSubmit={handleUpdateSlot}
          submitText={submitLoading ? 'Saving...' : 'Update Slot'}
          submitLoading={submitLoading}
        />
      </Modal>
    </div>
  )
}

const SlotForm = ({ formData, onChange, onCancel, onSubmit, submitText, submitLoading }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Date</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={formData.date}
          onChange={(event) => onChange('date', event.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Start Time</label>
        <input
          type="time"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={formData.start_time}
          onChange={(event) => onChange('start_time', event.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">End Time</label>
        <input
          type="time"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={formData.end_time}
          onChange={(event) => onChange('end_time', event.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Slot Duration (mins)</label>
        <input
          type="number"
          min="15"
          max="120"
          step="5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={formData.slot_duration_minutes || 30}
          onChange={(event) => onChange('slot_duration_minutes', event.target.value)}
        />
      </div>
    </div>
    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
      <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
      <button
        onClick={onSubmit}
        disabled={submitLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
      >
        {submitText}
      </button>
    </div>
  </div>
)

const StatCard = ({ title, value, color, icon }) => (
  <div className={`rounded-xl p-5 text-white ${
    color === 'green'
      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
      : color === 'yellow'
        ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
        : 'bg-gradient-to-br from-blue-500 to-blue-700'
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
        <i className={`fas ${icon} text-xl`}></i>
      </div>
    </div>
  </div>
)

function getDataPayload(response) {
  return response?.data ?? response ?? {}
}

function getStartOfWeekISO(currentDate) {
  const date = new Date(currentDate)
  const day = date.getDay() === 0 ? 7 : date.getDay()
  date.setDate(date.getDate() - day + 1)
  return date.toISOString().slice(0, 10)
}

function humanizeDay(day) {
  const raw = String(day || '').toLowerCase()
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function normalizeScheduleSlots(rawData) {
  const schedules = Array.isArray(rawData?.schedules)
    ? rawData.schedules
    : Array.isArray(rawData)
      ? rawData
      : []

  return schedules.map((item) => {
    let dayVal = item?.day_of_week || item?.day || item?.dayOfWeek || item?.day_name || '';
    if (!dayVal && item) {
      const dayKey = Object.keys(item).find(k => k.toLowerCase().includes('day'));
      if (dayKey) dayVal = item[dayKey];
    }
    if (!dayVal && item?.date) {
      try {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          dayVal = days[d.getDay()];
        }
      } catch (e) {}
    }

    return {
      schedule_id: item?.schedule_id || item?.id || '',
      day_of_week: dayVal,
      start_time: item?.start_time || '',
      end_time: item?.end_time || '',
      slot_duration_minutes: Number(item?.slot_duration_minutes || item?.slot_duration || item?.duration || item?.duration_minutes || 30),
      break_start_time: item?.break_start_time || '',
      break_end_time: item?.break_end_time || '',
    max_patients_per_slot: Number(item?.max_patients_per_slot || 1),
    is_active: item?.is_active !== false,
    notes: item?.notes || '',
    is_emergency_available: Boolean(item?.is_emergency_available)
    };
  });
}

function buildCandidatePaths(type, { scheduleId, weekStart } = {}) {
  const weekQuery = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : ''
  const scheduleIdSafe = scheduleId ? encodeURIComponent(scheduleId) : ''
  const withTrailing = (path) => (path.endsWith('/') ? path : `${path}/`)

  const candidatesByType = {
    weekly: [
      `${DOCTOR_SCHEDULE_WEEKLY}${weekQuery}`,
      `${withTrailing(DOCTOR_SCHEDULE_WEEKLY)}${weekQuery}`,
      `/doctor-management/schedule/weekly${weekQuery}`,
      `/doctor-management/schedule/weekly/${weekQuery ? weekQuery.slice(1) : ''}`.replace(/\/$/, ''),
      `/api/v1/doctor-management/schedule/weekly${weekQuery}`,
      `/api/v1/doctor-management/schedule/weekly/${weekQuery ? weekQuery.slice(1) : ''}`.replace(/\/$/, ''),
      `/api/v1/doctor/schedules/weekly${weekQuery}`,
      `/api/v1/doctors/schedule/weekly${weekQuery}`,
      `/api/v1/doctors/schedules/weekly${weekQuery}`
    ],
    slots: [
      DOCTOR_SCHEDULE_SLOTS,
      withTrailing(DOCTOR_SCHEDULE_SLOTS),
      '/doctor-management/schedule/slots',
      '/doctor-management/schedule/slots/',
      '/api/v1/doctor-management/schedule/slots',
      '/api/v1/doctor-management/schedule/slots/',
      '/api/v1/doctor/schedules/slots',
      '/api/v1/doctors/schedule/slots',
      '/api/v1/doctors/schedules/slots'
    ],
    create: [
      DOCTOR_SCHEDULE_CREATE,
      withTrailing(DOCTOR_SCHEDULE_CREATE),
      '/doctor-management/schedule/create',
      '/doctor-management/schedule/create/',
      '/api/v1/doctor-management/schedule/create',
      '/api/v1/doctor-management/schedule/create/',
      '/api/v1/doctor/schedule/create',
      '/api/v1/doctors/schedule/create'
    ],
    slotById: [
      DOCTOR_SCHEDULE_SLOT_DETAILS(scheduleIdSafe),
      withTrailing(DOCTOR_SCHEDULE_SLOT_DETAILS(scheduleIdSafe)),
      `/doctor-management/schedule/${scheduleIdSafe}`,
      `/doctor-management/schedule/${scheduleIdSafe}/`,
      `/api/v1/doctor-management/schedule/${scheduleIdSafe}`,
      `/api/v1/doctor-management/schedule/${scheduleIdSafe}/`,
      `/api/v1/doctor/schedules/slots/${scheduleIdSafe}`,
      `/api/v1/doctors/schedule/slots/${scheduleIdSafe}`,
      `/api/v1/doctors/schedules/slots/${scheduleIdSafe}`,
      `/api/v1/doctor/schedule/${scheduleIdSafe}`,
      `/api/v1/doctors/schedule/${scheduleIdSafe}`
    ],
    statistics: [
      DOCTOR_STATISTICS_SUMMARY('month'),
      '/api/v1/doctor-management/statistics/summary?period=month',
      '/api/v1/doctor-management/statistics/summary',
      '/api/v1/doctor/statistics/summary?period=month',
      '/api/v1/doctor/statistics/summary',
      '/api/v1/doctors/statistics/summary?period=month',
      '/api/v1/doctors/statistics/summary'
    ]
  }

  const raw = candidatesByType[type] || []
  return Array.from(new Set(raw.filter(Boolean)))
}

async function apiFetchWithFallback(paths, options = {}) {
  let lastResponse = null
  let lastPath = ''
  for (const path of paths) {
    const res = await apiFetch(path, { ...options, suppressAuthRedirect: true })
    lastResponse = res
    lastPath = path
    if (res.status !== 404 && res.status !== 401) return res
  }
  if (lastResponse) {
    lastResponse._attemptedPath = lastPath
  }
  return lastResponse
}

export default ScheduleManagement
