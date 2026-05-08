import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getPatientDepartments,
  getPatientDepartmentDoctors,
  getDoctorAvailableSlots,
  bookPatientAppointment,
  getPatientAppointmentByRef,
  getMyPatientAppointments,
  cancelPatientAppointment,
  patientAppointmentErrorMessage,
} from '../../../../services/patientApi'

const STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function formatClockTime(timeStr) {
  if (!timeStr) return '—'
  const part = String(timeStr).slice(0, 5)
  const [hRaw, mRaw] = part.split(':')
  const h = parseInt(hRaw, 10)
  const m = mRaw ?? '00'
  if (Number.isNaN(h)) return String(timeStr)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function normalizeStatusLabel(status) {
  if (!status) return 'Unknown'
  const s = String(status).toUpperCase()
  if (s === 'REQUESTED') return 'Pending'
  if (s === 'CONFIRMED') return 'Confirmed'
  if (s === 'COMPLETED') return 'Completed'
  if (s === 'CANCELLED') return 'Cancelled'
  return String(status).replace(/_/g, ' ')
}

function statsBucket(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'CONFIRMED') return 'Confirmed'
  if (s === 'REQUESTED') return 'Pending'
  if (s === 'COMPLETED') return 'Completed'
  if (s === 'CANCELLED') return 'Cancelled'
  return null
}

const Appointments = () => {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [statusFilter, setStatusFilter] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [slots, setSlots] = useState([])

  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const [formData, setFormData] = useState({
    departmentName: '',
    doctorName: '',
    date: '',
    time: '',
    chiefComplaint: '',
  })

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyPatientAppointments({
        page: pagination.page,
        limit: pagination.limit,
        statusFilter: statusFilter || undefined,
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('[Appointments] My-appointments error:', res.status, payload)
        toast.error(patientAppointmentErrorMessage(payload))
        setAppointments([])
        return
      }
      console.log('[Appointments] My-appointments payload:', payload)
      // Handle: { appointments: [] }, array, { data: [] }, { items: [] }
      const list =
        Array.isArray(payload) ? payload
        : Array.isArray(payload?.appointments) ? payload.appointments
        : Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload?.items) ? payload.items
        : []
      setAppointments(list)
      if (payload.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: payload.pagination.page ?? prev.page,
          limit: payload.pagination.limit ?? prev.limit,
          total: payload.pagination.total ?? 0,
          pages: payload.pagination.pages ?? 1,
        }))
      }
    } catch (err) {
      console.error('[Appointments] loadAppointments exception:', err)
      toast.error('Could not load appointments. Check your connection.')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const loadDepartmentsForBooking = async () => {
    setLoadingDepartments(true)
    try {
      const res = await getPatientDepartments()
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('[Appointments] Departments API error:', res.status, payload)
        toast.error(patientAppointmentErrorMessage(payload))
        setDepartments([])
        return
      }
      console.log('[Appointments] Departments payload:', payload)
      // Handle multiple response shapes: array, { departments: [] }, { data: [] }
      const list =
        Array.isArray(payload) ? payload
        : Array.isArray(payload?.departments) ? payload.departments
        : Array.isArray(payload?.data) ? payload.data
        : []
      setDepartments(list)
      if (list.length === 0) {
        toast.info('No departments found. Contact your hospital administrator.')
      }
    } catch (err) {
      console.error('[Appointments] loadDepartments exception:', err)
      toast.error('Failed to load departments. Please try again.')
      setDepartments([])
    } finally {
      setLoadingDepartments(false)
    }
  }

  const loadDoctors = async (departmentName) => {
    if (!departmentName) {
      setDoctors([])
      return
    }
    setLoadingDoctors(true)
    try {
      const res = await getPatientDepartmentDoctors(departmentName)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('[Appointments] Doctors API error:', res.status, payload)
        toast.error(patientAppointmentErrorMessage(payload))
        setDoctors([])
        return
      }
      console.log('[Appointments] Doctors payload:', payload)
      // Handle multiple response shapes: { doctors: [] }, array, { data: [] }, { staff: [] }
      const list =
        Array.isArray(payload) ? payload
        : Array.isArray(payload?.doctors) ? payload.doctors
        : Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload?.staff) ? payload.staff
        : []
      setDoctors(list)
      if (list.length === 0) {
        toast.info(`No doctors found in ${departmentName}.`)
      }
    } catch (err) {
      console.error('[Appointments] loadDoctors exception:', err)
      toast.error('Failed to load doctors. Please try again.')
      setDoctors([])
    } finally {
      setLoadingDoctors(false)
    }
  }

  const loadSlots = async (doctorName, date) => {
    if (!doctorName || !date) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    try {
      const res = await getDoctorAvailableSlots(doctorName, date)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('[Appointments] Slots API error:', res.status, payload)
        toast.error(patientAppointmentErrorMessage(payload))
        setSlots([])
        return
      }
      console.log('[Appointments] Slots payload:', payload)
      // Handle multiple response shapes
      const list =
        Array.isArray(payload) ? payload
        : Array.isArray(payload?.available_slots) ? payload.available_slots
        : Array.isArray(payload?.slots) ? payload.slots
        : Array.isArray(payload?.data) ? payload.data
        : []
      setSlots(list)
    } catch (err) {
      console.error('[Appointments] loadSlots exception:', err)
      toast.error('Failed to load time slots. Please try again.')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleNewAppointment = () => {
    setSelectedAppointment(null)
    setFormData({
      departmentName: '',
      doctorName: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      chiefComplaint: '',
    })
    setDoctors([])
    setSlots([])
    setShowForm(true)
    loadDepartmentsForBooking()
  }

  const handleDepartmentChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      departmentName: name,
      doctorName: '',
      time: '',
    }))
    setSlots([])
    loadDoctors(name)
  }

  const handleDoctorChange = (name) => {
    setFormData((prev) => ({ ...prev, doctorName: name, time: '' }))
  }

  const handleBookingDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date, time: '' }))
  }

  useEffect(() => {
    if (!showForm) return
    if (!formData.doctorName || !formData.date) {
      setSlots([])
      return
    }
    loadSlots(formData.doctorName, formData.date)
  }, [showForm, formData.doctorName, formData.date])

  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    if (!formData.departmentName || !formData.doctorName || !formData.date || !formData.time) {
      toast.error('Please select department, doctor, date, and an available time slot.')
      return
    }
    if (!formData.chiefComplaint.trim()) {
      toast.error('Please describe your reason for visit (chief complaint).')
      return
    }
    setSubmitting(true)
    try {
      const body = {
        department_name: formData.departmentName,
        doctor_name: formData.doctorName,
        appointment_date: formData.date,
        appointment_time: formData.time,
        chief_complaint: formData.chiefComplaint.trim(),
      }
      console.log('[Appointments] Booking with:', body)
      const res = await bookPatientAppointment(body)
      const payload = await res.json().catch(() => ({}))
      console.log('[Appointments] Booking response:', res.status, payload)
      if (!res.ok) {
        toast.error(patientAppointmentErrorMessage(payload))
        return
      }
      toast.success(payload.message || 'Appointment booked successfully!')
      setShowForm(false)
      await loadAppointments()
    } catch (err) {
      console.error('[Appointments] bookPatientAppointment exception:', err)
      toast.error('Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const openCancelModal = (apt) => {
    setCancelTarget(apt)
    setCancelReason('')
  }

  const submitCancel = async () => {
    if (!cancelTarget?.appointment_ref) return
    const reason = cancelReason.trim() || 'Requested by patient'
    setCancelling(true)
    try {
      const res = await cancelPatientAppointment(cancelTarget.appointment_ref, reason)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(patientAppointmentErrorMessage(payload))
        return
      }
      toast.success(payload.message || 'Appointment cancelled.')
      setCancelTarget(null)
      setSelectedAppointment(null)
      await loadAppointments()
    } catch {
      toast.error('Could not cancel appointment.')
    } finally {
      setCancelling(false)
    }
  }

  const handleViewDetails = async (row) => {
    setShowForm(false)
    setSelectedAppointment(null)
    setDetailLoading(true)
    try {
      const res = await getPatientAppointmentByRef(row.appointment_ref)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(patientAppointmentErrorMessage(payload))
        return
      }
      setSelectedAppointment(payload)
    } catch {
      toast.error('Could not load appointment details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const canCancel = (status) => {
    const s = String(status || '').toUpperCase()
    return s !== 'CANCELLED' && s !== 'COMPLETED'
  }

  if (loading && appointments.length === 0) return <LoadingSpinner />

  const statConfirmed = appointments.filter((a) => statsBucket(a.status) === 'Confirmed').length
  const statPending = appointments.filter((a) => statsBucket(a.status) === 'Pending').length
  const statCompleted = appointments.filter((a) => statsBucket(a.status) === 'Completed').length
  const statCancelled = appointments.filter((a) => statsBucket(a.status) === 'Cancelled').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700"> My Appointments</h2>
          <p className="text-gray-500 text-sm mt-1">Book and manage appointments at your registered hospital</p>
        </div>
        <button
          type="button"
          onClick={handleNewAppointment}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <i className="fas fa-plus mr-2"></i> Schedule Appointment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statConfirmed}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-calendar-check text-white text-lg"></i>
            </div>
          </div>
          <div className="relative mt-4 pt-3 border-t border-blue-100">
            <p className="text-xs text-blue-700 font-medium">On this page</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-white to-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statPending}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-hourglass-half text-white text-lg"></i>
            </div>
          </div>
          <div className="relative mt-4 pt-3 border-t border-amber-100">
            <p className="text-xs text-amber-700 font-medium">Requested</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statCompleted}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-check-circle text-white text-lg"></i>
            </div>
          </div>
          <div className="relative mt-4 pt-3 border-t border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium">Past visits</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-white to-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statCancelled}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-times-circle text-white text-lg"></i>
            </div>
          </div>
          <div className="relative mt-4 pt-3 border-t border-rose-100">
            <p className="text-xs text-rose-700 font-medium">Cancelled</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="font-semibold text-gray-800">All Appointments</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm min-w-[160px]"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => loadAppointments()}
                className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && appointments.length > 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">Updating list…</div>
          )}
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Reference</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Doctor</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Date & Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Reason</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-gray-500">
                    No appointments yet. Schedule one to get started.
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => {
                  const label = normalizeStatusLabel(appointment.status)
                  const raw = String(appointment.status || '').toUpperCase()
                  return (
                    <tr key={appointment.appointment_ref} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-mono text-gray-800">{appointment.appointment_ref}</td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.doctor_name}</p>
                          <p className="text-sm text-gray-600">{appointment.department_name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.appointment_date}</p>
                          <p className="text-sm text-gray-600">{formatClockTime(appointment.appointment_time)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-700 line-clamp-2">{appointment.chief_complaint || '—'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            raw === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : raw === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : raw === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(appointment)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {canCancel(appointment.status) && (
                            <button
                              type="button"
                              onClick={() => openCancelModal(appointment)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-600">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Schedule Appointment</h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    value={formData.departmentName}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={loadingDepartments}
                  >
                    <option value="">{loadingDepartments ? 'Loading…' : 'Select department'}</option>
                    {departments.map((d) => (
                      <option key={d.code || d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                  <select
                    value={formData.doctorName}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!formData.departmentName || loadingDoctors}
                  >
                    <option value="">{loadingDoctors ? 'Loading…' : 'Select doctor'}</option>
                    {doctors.map((doc, idx) => (
                      <option key={`${doc.name}-${idx}`} value={doc.name}>
                        {doc.name}
                        {doc.specialization ? ` — ${doc.specialization}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleBookingDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee (est.)</label>
                    <p className="text-sm text-gray-600 py-2">
                      {doctors.find((d) => d.name === formData.doctorName)?.consultation_fee != null
                        ? `₹${Number(doctors.find((d) => d.name === formData.doctorName).consultation_fee).toFixed(0)}`
                        : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available times *</label>
                  {loadingSlots ? (
                    <p className="text-sm text-gray-500">Loading slots…</p>
                  ) : !formData.doctorName || !formData.date ? (
                    <p className="text-sm text-gray-500">Choose a doctor and date to see slots.</p>
                  ) : slots.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800 font-medium">No available slots for this day.</p>
                      <p className="text-xs text-amber-600 mt-1">Try selecting a different date or check with the hospital.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot, idx) => {
                        // Slots may be objects { time, is_available } or plain strings
                        const slotTime = typeof slot === 'string' ? slot : slot.time
                        const isAvail = typeof slot === 'string' ? true : (slot.is_available !== false)
                        return (
                          <button
                            key={slotTime || idx}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => setFormData((prev) => ({ ...prev, time: slotTime }))}
                            className={`px-3 py-2 rounded-lg text-sm border transition ${
                              formData.time === slotTime
                                ? 'bg-blue-600 text-white border-blue-600'
                                : isAvail
                                  ? 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {slotTime}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for visit *</label>
                  <textarea
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe symptoms or reason for the appointment"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.time}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Booking…' : 'Book appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-gray-700">Loading details…</div>
        </div>
      )}

      {selectedAppointment && !detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Appointment Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-medium font-mono text-sm">{selectedAppointment.appointment_ref}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                        String(selectedAppointment.status).toUpperCase() === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : String(selectedAppointment.status).toUpperCase() === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : String(selectedAppointment.status).toUpperCase() === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {normalizeStatusLabel(selectedAppointment.status)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Doctor & department</p>
                  <p className="font-medium">{selectedAppointment.doctor_name}</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.department_name}</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="font-medium">{selectedAppointment.patient_name}</p>
                  {selectedAppointment.patient_phone && (
                    <p className="text-sm text-gray-600">{selectedAppointment.patient_phone}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Date & time</p>
                  <p className="font-medium">
                    {selectedAppointment.appointment_date} at {formatClockTime(selectedAppointment.appointment_time)}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Chief complaint</p>
                  <p className="font-medium">{selectedAppointment.chief_complaint || '—'}</p>
                </div>

                {selectedAppointment.consultation_fee != null && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">Consultation fee</p>
                    <p className="font-medium">₹{Number(selectedAppointment.consultation_fee).toFixed(0)}</p>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t">
                  {canCancel(selectedAppointment.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        openCancelModal({ appointment_ref: selectedAppointment.appointment_ref })
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Cancel appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel appointment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reference: <span className="font-mono">{cancelTarget.appointment_ref}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
              rows={3}
              placeholder="Why are you cancelling?"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={submitCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Appointments
