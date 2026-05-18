import React, { useState, useEffect, useRef } from 'react'
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Event as EventIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal'
import { apiFetch } from '../../../../services/apiClient'
import {
  DEPARTMENT_LIST,
  DOCTOR_LIST,
  RECEPTIONIST_PATIENT_SEARCH
} from '../../../../config/api'

const AppointmentScheduling = () => {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [statistics, setStatistics] = useState({
    total_appointments: 0,
    checked_in: 0,
    waiting: 0,
    in_consultation: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0
  })
  const [quickActions, setQuickActions] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null)

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('')

  const [filters, setFilters] = useState({
    page: 1, limit: 50, department_name: '', doctor_name: '', status: ''
  })
  const [formData, setFormData] = useState({
    id: null,
    patientId: '',
    referralId: '',
    department: '',
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    type: ''
  })

  // Searchable Dropdown State
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)
  const patientDropdownRef = useRef(null)

  // Searchable Dropdown State for Department and Doctor
  const [deptSearchTerm, setDeptSearchTerm] = useState('')
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false)
  const deptDropdownRef = useRef(null)

  const [docSearchTerm, setDocSearchTerm] = useState('')
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false)
  const docDropdownRef = useRef(null)

  const [apiDepartments, setApiDepartments] = useState([])
  const [apiDoctors, setApiDoctors] = useState([])

  useEffect(() => {
    loadPatients()
    loadAppointments()
    loadQuickActions()
    loadApiDepartments()
    loadApiDoctors()
  }, [filters])

  const loadApiDepartments = async () => {
    try {
      const res = await apiFetch(DEPARTMENT_LIST)
      const data = await res.json()
      if (res.ok) {
        const list = data.data?.departments || data.data || data
        setApiDepartments(Array.isArray(list) ? list : [])
      }
    } catch (e) {
      console.error('Error fetching departments', e)
    }
  }

  const loadApiDoctors = async () => {
    try {
      const res = await apiFetch(DOCTOR_LIST)
      const data = await res.json()
      if (res.ok) {
        const list = data.data?.doctors || data.data || data
        setApiDoctors(Array.isArray(list) ? list : [])
      }
    } catch (e) {
      console.error('Error fetching doctors', e)
    }
  }

  // Apply search and filters
  useEffect(() => {
    let filtered = appointments

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAppointments(filtered)
  }, [searchTerm, appointments])

  const loadPatients = async () => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', 1)
      queryParams.append('limit', 100)

      const res = await apiFetch(`/api/v1/receptionist/patients/search?${queryParams.toString()}`, { skipAuth: false })
      if (res.ok) {
        const data = await res.json()
        const formattedPatients = (data.data?.patients || []).map(patient => ({
          id: patient.id,
          patient_id: patient.patient_id || patient.patient_ref,
          name: patient.name || `${patient.first_name} ${patient.last_name}`,
          referralId: patient.patient_ref || patient.patient_id,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          date_of_birth: patient.date_of_birth
        }))
        setPatients(formattedPatients)
        console.log('Loaded Patients:', formattedPatients)
      }
    } catch (e) {
      console.error('Error fetching patients', e)
      setPatients([])
    }
  }

  const calculateStatistics = (data = appointments) => {
    if (!data || data.length === 0) {
      setStatistics({
        total_appointments: 0,
        checked_in: 0,
        waiting: 0,
        in_consultation: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0
      })
      return
    }

    const stats = {
      total_appointments: data.length,
      checked_in: data.filter(a => a.status === 'CHECKED_IN' || a.is_checked_in).length,
      waiting: data.filter(a => a.status === 'WAITING' || a.status === 'CHECKED_IN' || a.status === 'SCHEDULED').length,
      in_consultation: data.filter(a => a.status === 'IN_CONSULTATION').length,
      completed: data.filter(a => a.status === 'COMPLETED').length,
      cancelled: data.filter(a => a.status === 'CANCELLED').length,
      no_show: data.filter(a => a.status === 'NO_SHOW').length
    }
    setStatistics(stats)
  }

  const loadQuickActions = async () => {
    try {
      const res = await apiFetch('/api/v1/receptionist/quick-actions', { skipAuth: false })
      if (res.ok) {
        const data = await res.json()
        setQuickActions(data.data || {})
      }
    } catch (e) { console.error('Error fetching quick actions', e) }
  }

  const loadAppointments = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', filters.page)
      queryParams.append('limit', filters.limit)
      if (filters.department_name) queryParams.append('department_name', filters.department_name)
      if (filters.doctor_name) queryParams.append('doctor_name', filters.doctor_name)
      if (filters.status) queryParams.append('status', filters.status)

      const res = await apiFetch(`/api/v1/receptionist/appointments/today?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()

        let appointmentsArray = []
        if (data && data.data && Array.isArray(data.data.appointments)) {
          appointmentsArray = data.data.appointments
        } else if (data && Array.isArray(data.data)) {
          appointmentsArray = data.data
        }

        // Map backend structure to expected table structure
        const formatted = appointmentsArray.map(apt => ({
          ...apt,
          id: apt.appointment_ref || apt.id || 'N/A',
          patient: apt.patient_name || apt.patient || apt.patient_ref || 'Unknown Patient',
          doctor: apt.doctor_name || apt.doctor || 'Unknown Doctor',
          department: apt.department_name || apt.department || 'N/A',
          date: apt.appointment_date || apt.date || 'N/A',
          time: apt.appointment_time || apt.time || 'N/A',
          type: apt.appointment_type || apt.type || 'Regular',
          reason: apt.chief_complaint || apt.reason || 'N/A',
          status: apt.status || 'SCHEDULED',
          is_checked_in: apt.is_checked_in || false
        }))

        console.log("Mapped Appointments for UI:", formatted)
        setAppointments(formatted)
        calculateStatistics(formatted)
      } else {
        if (typeof toast !== 'undefined') toast.error('Failed to load appointments')
      }
    } catch (err) {
      if (typeof toast !== 'undefined') toast.error('An error occurred while loading appointments')
    } finally {
      setLoading(false)
    }
  }

  const generateAppointmentId = () => {
    const lastId = appointments.length > 0
      ? parseInt(appointments[appointments.length - 1].id.split('-')[1])
      : 3000
    return `APT-${lastId + 1}`
  }

  const handlePatientChange = (e) => {
    const selectedName = e.target.value
    const patient = patients.find(p => p.name === selectedName)

    setFormData({
      ...formData,
      patientId: selectedName,
      referralId: patient?.referralId || ''
    })
    setPatientSearchTerm(selectedName)
  }

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Patient Filter
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false)
      }
      // Department Filter
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptDropdownOpen(false)
      }
      // Doctor Filter
      if (docDropdownRef.current && !docDropdownRef.current.contains(event.target)) {
        setIsDocDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelectPatient = async (patient) => {
    setFormData({
      ...formData,
      patientId: patient.name,
      referralId: patient.referralId || ''
    })
    setPatientSearchTerm(patient.name)
    setIsPatientDropdownOpen(false)

    if (patient.id !== 'new' && patient.referralId) {
      try {
        const res = await apiFetch(`/api/v1/receptionist/patients/${patient.referralId}/profile`)
        if (res.ok) {
          const data = await res.json()
          setSelectedPatientProfile(data.data || null)
        }
      } catch (err) {
        console.error('Error fetching patient profile', err)
      }
    } else {
      setSelectedPatientProfile(null)
    }
  }

  const handleSelectDept = (dept) => {
    setFormData({
      ...formData,
      department: dept.name || dept,
      doctorId: ''
    })
    setDeptSearchTerm(dept.name || dept)
    setDocSearchTerm('') // Clear doctor search when department changes
    setIsDeptDropdownOpen(false)
  }

  const handleSelectDoc = (doc) => {
    setFormData({
      ...formData,
      doctorId: doc.id
    })
    setDocSearchTerm(doc.name)
    setIsDocDropdownOpen(false)
  }

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.referralId.toLowerCase().includes(patientSearchTerm.toLowerCase())
  )

  const filteredDepartments = apiDepartments.filter(dept =>
    (dept.name || dept).toLowerCase().includes(deptSearchTerm.toLowerCase())
  )

  const filteredDoctors = apiDoctors.filter(d =>
    d.department === formData.department &&
    d.name.toLowerCase().includes(docSearchTerm.toLowerCase())
  )

  const getDoctorName = (doctorIdOrName) => {
    if (!doctorIdOrName) return ''
    const doc = apiDoctors.find(d => d.id === doctorIdOrName || d.name === doctorIdOrName)
    return doc ? doc.name : doctorIdOrName
  }

  const handleDepartmentChange = (e) => {
    setFormData({
      ...formData,
      department: e.target.value,
      doctorId: '' // Reset doctor when department changes
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    }
    return timeString
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let res;
      if (formData.id) {
        // Modify existing appointment
        const updatePayload = {
          appointment_date: formData.date,
          appointment_time: formData.time.includes('AM') || formData.time.includes('PM') ? convertTo24Hour(formData.time) : formData.time,
          doctor_name: getDoctorName(formData.doctorId) || formData.doctorId,
          department_name: formData.department,
          chief_complaint: formData.reason,
          notes: ''
        };

        res = await apiFetch(`/api/v1/receptionist/appointments/${formData.id}`, {
          method: 'PATCH',
          body: updatePayload
        })
      } else {
        // Schedule new appointment
        const createPayload = {
          patient_ref: formData.referralId || undefined,
          patient_name: formData.patientId !== 'New Patient' ? formData.patientId : undefined,
          doctor_name: getDoctorName(formData.doctorId) || formData.doctorId,
          department_name: formData.department,
          appointment_date: formData.date,
          appointment_time: formData.time.includes('AM') || formData.time.includes('PM') ? convertTo24Hour(formData.time) : formData.time,
          chief_complaint: formData.reason,
          appointment_type: formData.type.toUpperCase() === 'NEW PATIENT' ? 'CONSULTATION' :
            formData.type.toUpperCase() === 'REGULAR' ? 'CONSULTATION' :
              formData.type.toUpperCase() || 'CONSULTATION'
        }

        res = await apiFetch('/api/v1/receptionist/appointments/schedule', {
          method: 'POST',
          body: createPayload
        })
      }

      const data = await res.json()

      if (res.ok) {
        if (typeof toast !== 'undefined') toast.success(data.message || `Appointment ${formData.id ? 'modified' : 'scheduled'} successfully!`);
        setShowForm(false)
        await loadAppointments(true) // Silent reload

        setFormData({
          id: null,
          patientId: '',
          referralId: '',
          department: '',
          doctorId: '',
          date: '',
          time: '',
          reason: '',
          type: 'Regular'
        })
        setPatientSearchTerm('')
        setDeptSearchTerm('')
        setDocSearchTerm('')
        setSelectedPatientProfile(null)
      } else {
        if (typeof toast !== 'undefined') toast.error(data.message || 'Error saving appointment');
      }
    } catch (err) {
      if (typeof toast !== 'undefined') toast.error('An error occurred while saving');
    }
  }

  // Handle view appointment
  const handleViewAppointment = (appointment) => {
    setShowForm(false)
    setSelectedAppointment(appointment)
  }

  const handleReschedule = (appointment) => {
    setSelectedAppointment(null) // Close details modal
    setSelectedPatientProfile(null)
    const doctorObj = apiDoctors.find(d => d.id === appointment.doctorId) || apiDoctors.find(d => d.name === appointment.doctor);
    setFormData({
      id: appointment.id,
      patientId: appointment.patient || '', // Use name since we switched to names
      referralId: appointment.referralId || patients.find(p => p.name === appointment.patient)?.referralId || '',
      department: doctorObj?.department || appointment.department || '',
      doctorId: doctorObj?.id || appointment.doctorId || appointment.doctor || '',
      date: appointment.date,
      time: appointment.time?.includes('AM') || appointment.time?.includes('PM')
        ? convertTo24Hour(appointment.time)
        : appointment.time,
      reason: appointment.reason || '',
      type: appointment.type || 'Regular'
    })
    setPatientSearchTerm(appointment.patient || '')
    setDeptSearchTerm(doctorObj?.department || appointment.department || '')
    setDocSearchTerm(doctorObj?.name || appointment.doctor || '')
    setShowForm(true) // Open form modal
  }

  const convertTo24Hour = (time12h) => {
    if (!time12h) return ''
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')

    if (hours === '12') {
      hours = '00'
    }

    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12
    }

    return `${hours}:${minutes}`
  }

  const handleNewAppointment = () => {
    setSelectedAppointment(null)
    setSelectedPatientProfile(null)
    setFormData({
      id: null,
      patientId: '',
      referralId: '',
      department: '',
      doctorId: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      time: '',
      reason: '',
      type: 'Regular'
    })
    setPatientSearchTerm('')
    setDeptSearchTerm('')
    setDocSearchTerm('')
    setShowForm(true) // Open form modal
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const res = await apiFetch(`/api/v1/receptionist/appointments/${appointmentId}`, {
          method: 'PATCH',
          body: { status: 'CANCELLED' }
        });
        if (res.ok) {
          if (typeof toast !== 'undefined') toast.success('Appointment cancelled successfully');
          await loadAppointments(true)
        } else {
          if (typeof toast !== 'undefined') toast.error('Failed to cancel appointment')
        }
      } catch (err) {
        if (typeof toast !== 'undefined') toast.error('An error occurred while canceling')
      }
    }
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const mappedStatus = newStatus === 'Confirmed' ? 'CONFIRMED' : newStatus.toUpperCase();
      const res = await apiFetch(`/api/v1/receptionist/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: { status: mappedStatus }
      });
      if (res.ok) {
        if (typeof toast !== 'undefined') toast.success('Status updated successfully');
        await loadAppointments(true)
      } else {
        if (typeof toast !== 'undefined') toast.error('Failed to update status')
      }
    } catch (err) {
      if (typeof toast !== 'undefined') toast.error('An error occurred while updating status')
    }
  }

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await apiFetch(`/api/v1/receptionist/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        body: {}
      });
      if (res.ok) {
        if (typeof toast !== 'undefined') toast.success('Patient checked-in successfully');
        await loadAppointments(true)
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (typeof toast !== 'undefined') toast.error(errorData?.message || 'Failed to check-in patient');
      }
    } catch (err) {
      if (typeof toast !== 'undefined') toast.error('An error occurred during check-in');
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      {/* ---------- MAIN PAGE WRAPPER ---------- */}
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl md:text-2xl lg:text-2xl font-semibold text-gray-700">Appointment Scheduling</h2>
          <button
            onClick={handleNewAppointment}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
          >
            <AddCircleOutlineIcon />
            Appointment Schedule
          </button>
        </div>

        {/* KPI Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Appointments Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Appointments</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{statistics?.total_appointments || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Today's schedule</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center text-blue-700">
                <EventIcon />
              </div>
            </div>
          </div>

          {/* Waiting Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Waiting</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{statistics?.waiting || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Checked in</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center text-yellow-700">
                <HourglassEmptyIcon />
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statistics?.completed || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Successfully served</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center text-green-700">
                <CheckCircleIcon />
              </div>
            </div>
          </div>

          {/* Cancelled Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Cancelled</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{statistics?.cancelled || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Not attended</p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center text-red-700">
                <CancelIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Appointments</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: '1.2rem' }} />
              <input
                type="text"
                placeholder="Search by patient name, appointment ID, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <CloseIcon style={{ fontSize: '1.2rem' }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center px-2">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-700">{filteredAppointments.length}</span> of <span className="font-semibold text-gray-700">{appointments.length}</span> appointments
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {filteredAppointments.length > 0 ? (
            <DataTable
              columns={[
                { key: 'id', title: 'Appointment ID', sortable: true },
                { key: 'patient', title: 'Patient', sortable: true },
                { key: 'doctor', title: 'Doctor', sortable: true },
                { key: 'department', title: 'Department', sortable: true },
                { key: 'date', title: 'Date', sortable: true },
                { key: 'time', title: 'Time', sortable: true },
                { key: 'reason', title: 'Reason', sortable: true },
                {
                  key: 'type',
                  title: 'Type',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'Urgent' ? 'bg-red-100 text-red-800' :
                      value === 'New' ? 'bg-green-100 text-green-800' :
                        value === 'Follow-up' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {value}
                    </span>
                  )
                },
                {
                  key: 'status',
                  title: 'Status',
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'Confirmed' || value === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        value === 'Cancelled' || value === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          value === 'Completed' || value === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {String(value).replace(/_/g, ' ')}
                      </span>
                      {value === 'Pending' && (
                        <button
                          onClick={() => handleStatusChange(row.id, 'Confirmed')}
                          className="text-xs text-green-600 hover:text-green-800 transition-colors"
                          title="Confirm"
                        >
                          <CheckIcon style={{ fontSize: '1rem' }} />
                        </button>
                      )}
                    </div>
                  )
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewAppointment(row)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <VisibilityIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                      {(row.status === 'Confirmed' || row.status === 'CONFIRMED' || row.status === 'SCHEDULED') && (
                        <button
                          onClick={() => handleCheckIn(row.id)}
                          className="p-1 px-2 text-xs font-semibold bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition-colors"
                          title="Check In Patient"
                        >
                          Check-in
                        </button>
                      )}
                      {row.status !== 'Cancelled' && row.status !== 'CANCELLED' && row.status !== 'Completed' && row.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => handleReschedule(row)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Reschedule"
                          >
                            <EditIcon style={{ fontSize: '1.1rem' }} />
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(row.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Cancel"
                          >
                            <CloseIcon style={{ fontSize: '1.1rem' }} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                }
              ]}
              data={filteredAppointments}
            />
          ) : (
            <div className="text-center py-12">
              <SearchIcon style={{ fontSize: '3rem' }} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No appointments found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or create a new appointment</p>
            </div>
          )}
        </div>

      </div>

      {/* ---------- MODALS ---------- */}
      {/* Form Modal - for NEW and RESCHEDULE */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formData.id ? "Edit Appointment" : "Schedule Appointment"}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="appointment-form"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
            >
              {formData.id ? 'Save Changes' : 'Schedule Appointment'}
            </button>
          </div>
        }
      >
        <form id="appointment-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={patientDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Patient Name or ID..."
                  value={patientSearchTerm}
                  onChange={(e) => {
                    setPatientSearchTerm(e.target.value)
                    setIsPatientDropdownOpen(true)
                  }}
                  onFocus={() => setIsPatientDropdownOpen(true)}
                  className="w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                >
                  <KeyboardArrowDownIcon />
                </div>
              </div>

              {/* Patient Dropdown List */}
              {isPatientDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.referralId || p.patient_id || 'No ID'}</div>
                        <div className="text-xs text-gray-400">{p.phone || 'No Phone'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 italic">
                      No patients found matching "{patientSearchTerm}"
                    </div>
                  )}
                  {/* Option to create new if not in list */}
                  {!patients.some(p => p.name === patientSearchTerm) && patientSearchTerm && (
                    <div
                      onClick={() => handleSelectPatient({ id: 'new', name: patientSearchTerm, referralId: '', patient_id: '' })}
                      className="p-3 bg-gray-50 hover:bg-blue-50 text-blue-600 cursor-pointer sticky bottom-0 border-t border-gray-200 font-medium flex items-center transition-colors"
                    >
                      <AddCircleOutlineIcon className="mr-2" style={{ fontSize: '1.2rem' }} />
                      Use "{patientSearchTerm}" as New Patient
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Referral ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="referralId"
                value={formData.referralId}
                readOnly={formData.patientId !== 'New Patient'}
                onChange={(e) => setFormData({ ...formData, referralId: e.target.value })}
                className={`w-full p-2 border rounded outline-none transition-all ${formData.patientId !== 'New Patient' ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                placeholder="ID Example: PAT-DAVE-211"
                required
              />
              {selectedPatientProfile && (
                <div className="mt-2 text-xs text-blue-800 bg-blue-50 p-2 rounded border border-blue-100 flex flex-col gap-1">
                  <div><span className="font-semibold">Info:</span> {selectedPatientProfile.gender || 'Unknown'}, DOB: {selectedPatientProfile.date_of_birth || 'Unknown'}</div>
                  <div><span className="font-semibold">Contact:</span> {selectedPatientProfile.phone || 'No Phone'} | {selectedPatientProfile.email || 'No Email'}</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={deptDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Department..."
                  value={deptSearchTerm}
                  onChange={(e) => {
                    setDeptSearchTerm(e.target.value)
                    setIsDeptDropdownOpen(true)
                  }}
                  onFocus={() => setIsDeptDropdownOpen(true)}
                  className="w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                >
                  <KeyboardArrowDownIcon />
                </div>
              </div>

              {/* Department Dropdown List */}
              {isDeptDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map(dept => (
                      <div
                        key={dept.id || dept.name || dept}
                        onClick={() => handleSelectDept(dept)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{dept.name || dept}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 italic">
                      No departments found matching "{deptSearchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={docDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={formData.department ? "Search Doctor..." : "Select Department First"}
                  value={docSearchTerm}
                  disabled={!formData.department}
                  onChange={(e) => {
                    setDocSearchTerm(e.target.value)
                    setIsDocDropdownOpen(true)
                  }}
                  onFocus={() => formData.department && setIsDocDropdownOpen(true)}
                  className={`w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!formData.department ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                  required
                />
                <div
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${formData.department ? 'cursor-pointer hover:text-blue-500' : 'cursor-not-allowed'} transition-colors`}
                  onClick={() => formData.department && setIsDocDropdownOpen(!isDocDropdownOpen)}
                >
                  <KeyboardArrowDownIcon />
                </div>
              </div>

              {/* Doctor Dropdown List */}
              {isDocDropdownOpen && formData.department && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{doc.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 italic">
                      No doctors found in {formData.department} matching "{docSearchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Regular">Regular</option>
                <option value="New">New Patient</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Brief reason for the appointment"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

        </form>
      </Modal>

      {/* Details Modal - for VIEW only */}
      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
        size="md"
        footer={selectedAppointment && (String(selectedAppointment.status).toUpperCase() !== 'CANCELLED' && String(selectedAppointment.status).toUpperCase() !== 'COMPLETED') ? (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                handleReschedule(selectedAppointment)
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
            >
              Reschedule
            </button>
            <button
              onClick={() => {
                handleCancelAppointment(selectedAppointment.id)
                setSelectedAppointment(null)
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
            >
              Cancel Appointment
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={() => setSelectedAppointment(null)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Appointment ID</p>
                  <p className="font-medium">{selectedAppointment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${String(selectedAppointment.status).toUpperCase() === 'CHECKED_IN' || String(selectedAppointment.status).toUpperCase() === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    String(selectedAppointment.status).toUpperCase() === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      String(selectedAppointment.status).toUpperCase() === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {String(selectedAppointment.status).toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-500">Patient Information</p>
                <p className="font-medium">{selectedAppointment.patient}</p>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-500">Doctor Information</p>
                <p className="font-medium">{selectedAppointment.doctor}</p>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{selectedAppointment.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{selectedAppointment.date} at {selectedAppointment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedAppointment.type}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-500">Reason</p>
                <p className="font-medium">{selectedAppointment.reason}</p>
              </div>
            </div>


          </div>
        )}
      </Modal>
    </>
  )
}

export default AppointmentScheduling