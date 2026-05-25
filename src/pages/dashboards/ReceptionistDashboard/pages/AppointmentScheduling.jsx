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
  Cancel as CancelIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal'
import { apiFetch } from '../../../../services/apiClient'
import {
  DEPARTMENT_LIST,
  DOCTOR_LIST,
  RECEPTIONIST_PATIENT_SEARCH,
  RECEPTIONIST_DOCTORS,
  RECEPTIONIST_QUICK_ACTIONS,
  RECEPTIONIST_APPOINTMENTS_STATUS_SUMMARY,
  RECEPTIONIST_APPOINTMENTS_STATISTICS,
  RECEPTIONIST_APPOINTMENTS_TODAY,
  RECEPTIONIST_PATIENT_PROFILE,
  RECEPTIONIST_APPOINTMENTS_AVAILABLE_SLOTS,
  PUBLIC_APPOINTMENTS_AVAILABLE_SLOTS,
  STAFF_DOCTOR_SCHEDULES,
  RECEPTIONIST_APPOINTMENTS_REF,
  RECEPTIONIST_APPOINTMENTS_SCHEDULE,
  RECEPTIONIST_APPOINTMENTS_CANCEL,
  RECEPTIONIST_APPOINTMENTS_STATUS,
  RECEPTIONIST_APPOINTMENTS_CHECK_IN
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
  patient_ref: '',
  patient_name: '',
  doctor_name: '',
  department_id: '',
  department_name: '',
  appointment_date: '',
  appointment_time: '',
  appointment_type: 'CONSULTATION',
  chief_complaint: '',
  notes: ''
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

  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [dateAppointments, setDateAppointments] = useState([])
  const [availableSlotsFromApi, setAvailableSlotsFromApi] = useState([])
  const [hasLoadedAvailableSlots, setHasLoadedAvailableSlots] = useState(false)

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
      let res = await apiFetch(RECEPTIONIST_DOCTORS)
      if (!res.ok) {
        res = await apiFetch(DOCTOR_LIST)
      }
      const data = await res.json()
      if (res.ok) {
        const list = data.data?.doctors || data.data || data || []
        const mappedList = (Array.isArray(list) ? list : []).map(item => {
          let deptName = 'General Medicine';
          let deptId = '';
          if (item.department) {
            if (typeof item.department === 'object') {
              deptName = item.department.name || item.department.department_name || 'General Medicine';
              deptId = item.department.id || item.department.department_id || '';
            } else {
              deptName = item.department;
            }
          } else if (item.department_name) {
            if (typeof item.department_name === 'object') {
              deptName = item.department_name.name || item.department_name.department_name || 'General Medicine';
              deptId = item.department_name.id || item.department_name.department_id || '';
            } else {
              deptName = item.department_name;
            }
          }
          
          if (!deptId && item.department_id) {
            deptId = item.department_id;
          }

          return {
            id: item.id || item.doctor_id || '',
            name: item.name || `Dr. ${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Dr. Unknown',
            department: deptName,
            department_id: deptId
          };
        })
        setApiDoctors(mappedList)
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

      const res = await apiFetch(`${RECEPTIONIST_PATIENT_SEARCH}?${queryParams.toString()}`, { skipAuth: false })
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
      const res = await apiFetch(RECEPTIONIST_QUICK_ACTIONS, { skipAuth: false })
      if (res.ok) {
        const data = await res.json()
        setQuickActions(data.data || {})
      }
    } catch (e) { console.error('Error fetching quick actions', e) }
  }

  const loadStatistics = async (fallbackData = []) => {
    // Backend receptionist appointments status-summary & statistics endpoints are not implemented (return 404).
    // To prevent console 404 errors, we compute metrics completely locally from the loaded appointments.
    calculateStatistics(fallbackData)
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

      const res = await apiFetch(`${RECEPTIONIST_APPOINTMENTS_TODAY}?${queryParams.toString()}`)
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
          referralId: apt.patient_ref || apt.patient_id || '',
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
        await loadStatistics(formatted)
      } else {
        if (typeof toast !== 'undefined') toast.error('Failed to load appointments')
      }
    } catch (err) {
      if (typeof toast !== 'undefined') toast.error('An error occurred while loading appointments')
    } finally {
      setLoading(false)
    }
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
  setFormData(prev => ({
    ...prev,
    patient_name: patient.name,
    patient_ref: patient.referralId || ''
  }))

  setPatientSearchTerm(patient.name)
  setIsPatientDropdownOpen(false)

  if (patient.id !== 'new' && patient.referralId) {
    try {
      const res = await apiFetch(
        RECEPTIONIST_PATIENT_PROFILE(patient.referralId)
      )

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
  setFormData(prev => ({
    ...prev,
    department_id: dept.id || dept.department_id || '',
    department_name: dept.name || dept,
    doctor_name: ''
  }))

  setDeptSearchTerm(dept.name || dept)
  setDocSearchTerm('')
  setIsDeptDropdownOpen(false)
}

const handleSelectDoc = (doc) => {
  setFormData(prev => ({
    ...prev,
    doctor_name: doc.name
  }))

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

  const filteredDoctors = apiDoctors.filter(d => {
    const docDept = String(d.department || '').toLowerCase().trim();
    const selectedDept = String(formData.department_name || '').toLowerCase().trim();
    const docDeptId = String(d.department_id || '').toLowerCase().trim();
    const selectedDeptId = String(formData.department_id || '').toLowerCase().trim();
    
    const matchesDept = docDept === selectedDept || (selectedDeptId && docDeptId === selectedDeptId);
    const matchesSearch = d.name.toLowerCase().includes(docSearchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  })

  const getDoctorName = (doctorIdOrName) => {
    if (!doctorIdOrName) return ''
    const doc = apiDoctors.find(d => d.id === doctorIdOrName || d.name === doctorIdOrName)
    return doc ? doc.name : doctorIdOrName
  }

  const normalizeTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr.trim();
    }
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      let hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      const paddedHour = String(hour).padStart(2, '0');
      const paddedMinute = String(minute).padStart(2, '0');
      return `${paddedHour}:${paddedMinute} ${ampm}`;
    }
    return timeStr;
  }

  const doesTimeFallInSlot = (bookingTime24, slotTime12) => {
    if (!bookingTime24 || !slotTime12) return false;
    
    let [slotTime, modifier] = slotTime12.split(' ');
    let [slotHour] = slotTime.split(':').map(Number);
    if (modifier === 'PM' && slotHour !== 12) slotHour += 12;
    if (modifier === 'AM' && slotHour === 12) slotHour = 0;
    
    let bookingHour = 0;
    if (bookingTime24.includes('AM') || bookingTime24.includes('PM')) {
      const [bTime, bMod] = bookingTime24.split(' ');
      let [bHr] = bTime.split(':').map(Number);
      if (bMod === 'PM' && bHr !== 12) bHr += 12;
      if (bMod === 'AM' && bHr === 12) bHr = 0;
      bookingHour = bHr;
    } else {
      bookingHour = parseInt(bookingTime24.split(':')[0], 10);
    }
    
    return slotHour === bookingHour;
  }

  const getSlotDetails = (slotTime12) => {
    const normSlot = normalizeTo12Hour(slotTime12);
    
    // 1. If we successfully loaded live available slots from the API, use that comparison:
    if (hasLoadedAvailableSlots) {
      const isAvailable = availableSlotsFromApi.some(s => normalizeTo12Hour(s) === normSlot);
      return {
        bookedCount: isAvailable ? 0 : 1,
        maxCapacity: 1,
        status: isAvailable ? 'low' : 'full'
      };
    }
    
    // 2. Fallback to local calculation for selected date:
    const selectedDocName = getDoctorName(formData.doctor_name);
    const selectedDateStr = formData.appointment_date;
      
    const doctorAppointments = appointments.filter(apt => {
      const aptDoc = apt.doctor_name || apt.doctor || '';
      const aptDate = apt.appointment_date || apt.date || '';
      
      const matchesDoc = aptDoc.toLowerCase() === selectedDocName.toLowerCase() || 
                         String(apt.doctor_id || apt.doctorId) === String(formData.doctor_name);
      const matchesDate = aptDate === selectedDateStr;
      
      return matchesDoc && matchesDate;
    });
    
    const bookedCount = doctorAppointments.filter(apt => {
      if (formData.id && (apt.id === formData.id || apt.appointment_ref === formData.id)) {
        return false;
      }
      const aptTime = apt.appointment_time || apt.time || '';
      return doesTimeFallInSlot(aptTime, slotTime12);
    }).length;
    
    let status = 'low';
    if (bookedCount >= 1) {
      status = 'full';
    }
    
    return {
      bookedCount,
      maxCapacity: 1,
      status
    };
  }

  const generateSlots = (scheduleData, selectedDate) => {
    let activeSchedule = null;
    if (scheduleData) {
      if (Array.isArray(scheduleData.schedules)) {
        // Find schedule matching the chosen date
        activeSchedule = scheduleData.schedules.find(s => s.date === selectedDate);
        // Fallback to the first schedule in the list if none matches the exact date
        if (!activeSchedule && scheduleData.schedules.length > 0) {
          activeSchedule = scheduleData.schedules[0];
        }
      } else if (scheduleData.start_time) {
        activeSchedule = scheduleData;
      }
    }

    // Default config if API fails or returns no data
    const startTimeStr = activeSchedule?.start_time || "09:00";
    const endTimeStr = activeSchedule?.end_time || "17:00";
    // Default break from 1:00 PM to 2:30 PM as requested by user
    const breaks = activeSchedule?.breaks || [{ start: "13:00", end: "14:30" }];
    
    const toMins = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    
    const startMins = toMins(startTimeStr);
    const endMins = toMins(endTimeStr);
    
    const generated = [];
    for (let m = startMins; m < endMins; m += 30) {
      const slotStart = m;
      const slotEnd = m + 30;
      
      const isBreak = breaks.some(b => {
        const bStart = toMins(b.start);
        const bEnd = toMins(b.end);
        return slotStart < bEnd && slotEnd > bStart;
      });
      
      if (!isBreak) {
        const h24 = Math.floor(slotStart / 60);
        const min = slotStart % 60;
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        const formatted = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
        generated.push(formatted);
      }
    }
    return generated;
  };

  const loadAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setSlots([])
      setAvailableSlotsFromApi([])
      setHasLoadedAvailableSlots(false)
      return
    }
    setLoadingSlots(true)
    setHasLoadedAvailableSlots(false)

    // Translate ID to Name since the endpoint path specifically uses {doctor_name}
    const actualDoctor = apiDoctors.find(d => d.name === doctorId || d.id === doctorId);
    const finalDoctorName = actualDoctor ? actualDoctor.name : doctorId;

    try {
      // 1. Fetch Doctor Schedule to dynamically generate slots based on breaks
      let scheduleRes = await apiFetch(STAFF_DOCTOR_SCHEDULES(finalDoctorName));
      if (!scheduleRes.ok && finalDoctorName.toLowerCase().startsWith('dr.')) {
        const nameWithoutDr = finalDoctorName.replace(/^dr\.\s*/i, '');
        const altRes = await apiFetch(STAFF_DOCTOR_SCHEDULES(nameWithoutDr));
        if (altRes.ok) {
          scheduleRes = altRes;
        }
      } else if (!scheduleRes.ok && !finalDoctorName.toLowerCase().startsWith('dr.')) {
        const nameWithDr = `Dr. ${finalDoctorName}`;
        const altRes = await apiFetch(STAFF_DOCTOR_SCHEDULES(nameWithDr));
        if (altRes.ok) {
          scheduleRes = altRes;
        }
      }

      let scheduleData = null;
      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        scheduleData = data?.data || data;
      }
      
      const generatedSlots = generateSlots(scheduleData, date);
      setSlots(generatedSlots);
      setAvailableSlotsFromApi(generatedSlots);
      setHasLoadedAvailableSlots(false); // Force local calculation fallback to prevent 404 console errors
    } catch (e) {
      console.error('Error fetching available slots', e);
      const generatedSlots = generateSlots(null, date);
      setSlots(generatedSlots);
      setAvailableSlotsFromApi(generatedSlots);
      setHasLoadedAvailableSlots(false);
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (showForm && formData.doctor_name && formData.appointment_date) {
      loadAvailableSlots(formData.doctor_name, formData.appointment_date)
    } else {
      setSlots([])
      setDateAppointments([])
    }
  }, [showForm, formData.doctor_name, formData.appointment_date])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.appointment_time) {
      if (typeof toast !== 'undefined') {
        toast.error('Please select an available time slot')
      } else {
        alert('Please select an available time slot')
      }
      return
    }

    try {
      let res;
      const patientName = formData.patient_name || patientSearchTerm || "";
      const getBackendAppointmentType = (type) => {
        if (!type) return 'CONSULTATION';
        const t = type.toUpperCase().replace('-', '_').trim();
        if (t === 'REGULAR' || t === 'NEW' || t === 'NEW_PATIENT') return 'CONSULTATION';
        return t;
      };

      const deptObj = apiDepartments.find(d => (d.name || d) === formData.department_name);
      const department_id = deptObj ? (deptObj.id || deptObj.department_id || formData.department_name) : formData.department_name;

const payload = {
  patient_ref: formData.patient_ref,
  patient_name: formData.patient_name,

  doctor_name: formData.doctor_name,

  department_id: formData.department_id,
  department_name: formData.department_name,

  appointment_date: formData.appointment_date,

  appointment_time:
    formData.appointment_time.includes('AM') ||
    formData.appointment_time.includes('PM')
      ? convertTo24Hour(formData.appointment_time)
      : formData.appointment_time,

  appointment_type: formData.appointment_type,

  chief_complaint: formData.chief_complaint,
  notes: formData.notes
}

      if (formData.id) {
        // Modify existing appointment
        res = await apiFetch(RECEPTIONIST_APPOINTMENTS_REF(formData.id), {
          method: 'PATCH',
          body: payload
        })
      } else {
        // Schedule new appointment
        res = await apiFetch(RECEPTIONIST_APPOINTMENTS_SCHEDULE, {
          method: 'POST',
          body: payload
        })
      }

      const data = await res.json()

      if (res.ok) {
        if (typeof toast !== 'undefined') toast.success(data.message || `Appointment ${formData.id ? 'modified' : 'scheduled'} successfully!`);
        setShowForm(false)
        await loadAppointments(true) // Silent reload

        setFormData({
          id: null,
          patient_name: '',
          patient_ref: '',
          department_name: '',
          
          doctor_name: '',
          appointment_date: '',
          appointment_time: '',
          chief_complaint: '',
          notes: '',
          type: 'Regular'
        })
        setPatientSearchTerm('')
        setDeptSearchTerm('')
        setDocSearchTerm('')
        setSelectedPatientProfile(null)
      } else {
        const errorMsg = data.message || data.detail || data.error || 'Error saving appointment';
        if (typeof toast !== 'undefined') toast.error(errorMsg);
      }
    } catch (err) {
      if (typeof toast !== 'undefined') toast.error('An error occurred while saving');
    }
  }
  // Handle view appointment
  const handleViewAppointment = async (appointment) => {
    setShowForm(false)
    setSelectedAppointment(null)
    try {
      const res = await apiFetch(RECEPTIONIST_APPOINTMENTS_REF(appointment.id))
      if (res.ok) {
        const data = await res.json()
        const apt = data.data || data
        setSelectedAppointment({
          ...appointment,
          ...apt,
          id: apt.appointment_ref || apt.id || appointment.id,
          status: apt.status || appointment.status,
          reason: apt.chief_complaint || apt.reason || appointment.reason,
          notes: apt.notes || appointment.notes || '',
          time: apt.appointment_time || apt.time || appointment.time,
          date: apt.appointment_date || apt.date || appointment.date,
          patient: apt.patient_name || apt.patient || appointment.patient,
          referralId: apt.patient_ref || apt.patient_id || appointment.referralId,
          doctor: apt.doctor_name || apt.doctor || appointment.doctor,
          department: apt.department_name || apt.department || appointment.department,
          type: apt.appointment_type || apt.type || appointment.type
        })
      } else {
        setSelectedAppointment(appointment)
      }
    } catch (err) {
      console.error('Error fetching appointment details', err)
      setSelectedAppointment(appointment)
    }
  }

  const handleReschedule = (appointment) => {
    setSelectedAppointment(null) // Close details modal
    setSelectedPatientProfile(null)
    const doctorObj = apiDoctors.find(d => d.id === appointment.doctorId) || apiDoctors.find(d => d.name === appointment.doctor);
    setFormData({
  id: appointment.id,
  patient_ref: appointment.referralId || '',
  patient_name: appointment.patient || '',
  doctor_name: appointment.doctor || '',
  department_id: appointment.department_id || '',
  department_name: appointment.department || '',
  appointment_date: appointment.date || '',
  appointment_time: appointment.time || '',
  appointment_type: appointment.type || 'CONSULTATION',
  chief_complaint: appointment.reason || '',
  notes: appointment.notes || ''
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
    patient_ref: '',
    patient_name: '',
    doctor_name: '',
    department_id: '',
    department_name: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    appointment_type: 'CONSULTATION',
    chief_complaint: '',
    notes: ''
  })

  setPatientSearchTerm('')
  setDeptSearchTerm('')
  setDocSearchTerm('')

  setShowForm(true)
}

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        let res = await apiFetch(RECEPTIONIST_APPOINTMENTS_CANCEL(appointmentId), {
          method: 'PATCH',
          body: {}
        });
        if (!res.ok) {
          res = await apiFetch(RECEPTIONIST_APPOINTMENTS_REF(appointmentId), {
            method: 'PATCH',
            body: { status: 'CANCELLED' }
          });
        }
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

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      try {
        const res = await apiFetch(RECEPTIONIST_APPOINTMENTS_REF(appointmentId), {
          method: 'DELETE'
        });
        if (res.ok) {
          if (typeof toast !== 'undefined') toast.success('Appointment deleted successfully');
          await loadAppointments(true)
        } else {
          if (typeof toast !== 'undefined') toast.error('Failed to delete appointment')
        }
      } catch (err) {
        if (typeof toast !== 'undefined') toast.error('An error occurred while deleting')
      }
    }
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const mappedStatus = newStatus === 'Confirmed' ? 'CONFIRMED' : newStatus.toUpperCase();
      const res = await apiFetch(RECEPTIONIST_APPOINTMENTS_STATUS(appointmentId), {
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
      const res = await apiFetch(RECEPTIONIST_APPOINTMENTS_CHECK_IN(appointmentId), {
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
                      <button
                        onClick={() => handleDeleteAppointment(row.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <DeleteIcon style={{ fontSize: '1.1rem' }} />
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
                      onClick={() => handleSelectPatient({ id: 'new', name: patientSearchTerm, patient_ref: '', patient_id: '' })}
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
                name="patient_ref"
                value={formData.patient_ref}
                readOnly={formData.patient_name && patients.some(p => p.name === formData.patient_name)}
                onChange={(e) => setFormData({ ...formData, patient_ref: e.target.value })}
                className={`w-full p-2 border rounded outline-none transition-all ${(formData.patient_name && patients.some(p => p.name === formData.patient_name)) ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                placeholder="ID Example: PAT-DAVE-211"
                required={formData.patient_name && patients.some(p => p.name === formData.patient_name)}
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
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Department Name
    <span className="text-red-500">*</span>
  </label>

  <div className="relative">
    <input
      type="text"
      value={formData.department_name}
      placeholder="Search Department..."
      onChange={(e) => {
        setFormData({
          ...formData,
          department_name: e.target.value
        })

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

  {isDeptDropdownOpen && (
    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
      {filteredDepartments.map((dept) => (
        <div
          key={dept.id}
          onClick={() => handleSelectDept(dept)}
          className="p-3 hover:bg-blue-50 cursor-pointer"
        >
          {dept.name}
        </div>
      ))}
    </div>
  )}
</div>
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Department ID
    <span className="text-red-500">*</span>
  </label>

  <input
    type="text"
    name="department_id"
    value={formData.department_id}
    onChange={(e) =>
      setFormData({
        ...formData,
        department_id: e.target.value
      })
    }
    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="DEPT-101"
    required
  />
</div>

            <div className="relative" ref={docDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                 placeholder={formData.department_name ? "Search Doctor..." : "Select Department First"}
                  value={docSearchTerm}
                  disabled={!formData.department_name}
                  onChange={(e) => {
                    setDocSearchTerm(e.target.value)
                    setIsDocDropdownOpen(true)
                  }}
                  onFocus={() => formData.department_name && setIsDocDropdownOpen(true)}
                  className={`w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!formData.department_name ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                  required
                />
                <div
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${formData.department_name ? 'cursor-pointer hover:text-blue-500' : 'cursor-not-allowed'} transition-colors`}
                  onClick={() => formData.department_name && setIsDocDropdownOpen(!isDocDropdownOpen)}
                >
                  <KeyboardArrowDownIcon />
                </div>
              </div>

              {/* Doctor Dropdown List */}
              {isDocDropdownOpen && formData.department_name && (
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
                      No doctors found in {formData.department_name} matching "{docSearchTerm}"
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
  name="appointment_type"
  value={formData.appointment_type}
  onChange={(e) =>
    setFormData({
      ...formData,
      appointment_type: e.target.value
    })
  }
  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
>
  <option value="CONSULTATION">
    Consultation
  </option>

  <option value="FOLLOW_UP">
    Follow Up
  </option>

  <option value="EMERGENCY">
    Emergency
  </option>

  <option value="ROUTINE_CHECKUP">
    Routine Checkup
  </option>
</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
              <input
                type="text"
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Brief chief complaint for the appointment"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Appointment Time (Available Slots) <span className="text-red-500">*</span></label>
            
            {!formData.department_name || !formData.doctor_name ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500 italic">
                Select Department and Doctor first to view available time slots.
              </div>
            ) : !formData.appointment_date ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500 italic">
                Please select an appointment date to view slots.
              </div>
            ) : loadingSlots ? (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2">
                <LoadingSpinner className="h-6 w-6 text-blue-600" />
                <span className="text-xs text-gray-500 animate-pulse">Loading available slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-sm text-amber-800">
                No available time slots found for this doctor on the selected date. Please choose a different date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                {slots.map((slot, idx) => {
                  const { bookedCount, status } = getSlotDetails(slot);
                  const isSelected = normalizeTo12Hour(formData.appointment_time) === normalizeTo12Hour(slot);
                  const isFull = status === 'full';
                  
                  let statusClasses = "";
                  let accentBarColor = "";
                  let labelText = "Available";
                  let labelColor = "text-green-600";
                  
                  if (isSelected) {
                    statusClasses = "border-blue-600 bg-blue-50/40 text-blue-900 shadow-md scale-[1.02]";
                    accentBarColor = "bg-blue-600";
                    labelText = bookedCount === 0 ? "Selected (0/1)" : `Selected (1/1)`;
                    labelColor = "text-blue-700 font-semibold";
                  } else if (isFull) {
                    statusClasses = "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed";
                    accentBarColor = "bg-gray-300";
                    labelText = "Fully Booked (1/1)";
                    labelColor = "text-gray-400";
                  } else {
                    statusClasses = "border-green-200 bg-white hover:bg-green-50/20 text-gray-800 hover:border-green-400";
                    accentBarColor = "bg-green-500";
                    labelText = "Available (0/1)";
                    labelColor = "text-green-600 font-medium";
                  }
                  
                  return (
                    <button
                      key={slot || idx}
                      type="button"
                      disabled={isFull && !isSelected}
                      onClick={() => {
                        setFormData({ ...formData, appointment_time: slot });
                      }}
                      className={`relative overflow-hidden pl-4 pr-3 py-2.5 rounded-lg border-2 text-left flex flex-col justify-center transition-all duration-200 ${statusClasses}`}
                    >
                      {/* Left accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentBarColor}`} />
                      
                      <span className="font-bold text-sm sm:text-base tracking-tight">
                        {slot}
                      </span>
                      <span className={`text-[10px] sm:text-xs mt-0.5 truncate ${labelColor}`}>
                        {labelText}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all shadow-md active:scale-95 font-medium"
            >
              Cancel Appointment
            </button>
            <button
              onClick={() => {
                handleDeleteAppointment(selectedAppointment.id)
                setSelectedAppointment(null)
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95 font-medium"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            {selectedAppointment && (
              <button
                onClick={() => {
                  handleDeleteAppointment(selectedAppointment.id)
                  setSelectedAppointment(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95 font-medium"
              >
                Delete
              </button>
            )}
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

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">{selectedAppointment.patient}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient Ref</p>
                  <p className="font-medium">{selectedAppointment.referralId || selectedAppointment.patient_ref || 'N/A'}</p>
                </div>
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
                  <p className="text-sm text-gray-500">Appointment Date & Time</p>
                  <p className="font-medium">{selectedAppointment.date} at {selectedAppointment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Appointment Type</p>
                  <p className="font-medium">{selectedAppointment.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <p className="text-sm text-gray-500">Chief Complaint</p>
                  <p className="font-medium">{selectedAppointment.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{selectedAppointment.notes || 'N/A'}</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>
    </>
  )
}

export default AppointmentScheduling