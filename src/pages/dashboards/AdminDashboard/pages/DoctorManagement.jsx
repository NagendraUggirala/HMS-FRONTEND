// src/pages/dashboards/AdminDashboard/pages/DoctorManagement.jsx
import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import { HOSPITAL_ADMIN_STAFF } from '../../../../config/api'
import { apiFetch } from '../../../../services/apiClient'
import {  Lock,  LocalHospital,  Add,  Search,  ExpandMore,  FiberManualRecord,  Badge,  EmojiEvents,
  MailOutline,  Phone,  CalendarMonth,  CurrencyRupee,  VideoCall,  School,  WarningAmber,  DeleteOutline,
  SaveOutlined,  CheckCircle,  Close,  Visibility,  VisibilityOff,  MenuBook,  MarkEmailRead,
  Edit,  PlayArrow,  Pause} from '@mui/icons-material'

const DoctorManagement = () => {
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [consultationTypeFilter, setConsultationTypeFilter] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentDoctor, setCurrentDoctor] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isAddMode, setIsAddMode] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)
  const [specializationDropdownOpen, setSpecializationDropdownOpen] = useState(false)
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('')
  const [specializationSearchTerm, setSpecializationSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'DOCTOR',
    emergency_contact: '',
    shift_timing: '',
    joining_date: '',
    address: '',
    department_name: '',
    doctor_specialization: '',
    experience: '',
    fee: '',
    qualification: ''
  })

  useEffect(() => {
    loadDoctors()
  }, [])

  // Map staff data to doctor format
  const mapDoctorData = (staffItem) => {
    const firstNameOrFull = staffItem?.first_name || staffItem?.firstName || ''
    const lastNameOrFull = staffItem?.last_name || staffItem?.lastName || ''
    const generatedName = `Dr. ${firstNameOrFull}${lastNameOrFull ? ' ' + lastNameOrFull : ''}`.trim()
    const fullName = staffItem?.staff_name || generatedName
    
    return {
      id: staffItem?.staff_id || staffItem?.id || staffItem?.user_id || '',
      name: fullName || 'Unnamed Doctor',
      first_name: staffItem?.first_name || '',
      middle_name: staffItem?.middle_name || '',
      last_name: staffItem?.last_name || '',
      email: staffItem?.email || '',
      phone: staffItem?.phone || '',
      role: staffItem?.primary_role || staffItem?.role || 'DOCTOR',
      emergency_contact: staffItem?.emergency_contact || '',
      shift_timing: staffItem?.shift_timing || '',
      joining_date: staffItem?.joining_date || staffItem?.hire_date || '',
      address: staffItem?.address || '',
      department_name: staffItem?.department_name || staffItem?.department || '',
      department: staffItem?.department_name || staffItem?.department || '',
      status: staffItem?.status === 'ACTIVE' ? 'Active' : (staffItem?.is_active === false ? 'Inactive' : 'Active'),
      image: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70) + 1}`,
      contact: staffItem?.phone || '',
      is_active: staffItem?.is_active !== false,
      specialization: staffItem?.specialization || staffItem?.doctor_specialization || '',
      experience: staffItem?.experience || '',
      fee: staffItem?.fee || staffItem?.consultation_fee || '',
      qualification: staffItem?.qualification || staffItem?.education || ''
    }
  }

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      params.set('role', 'DOCTOR')
      const res = await apiFetch(`${HOSPITAL_ADMIN_STAFF}?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        console.error('Failed to load doctors:', data?.message || data?.detail?.message)
        setDoctors([])
        return
      }
      
      // Extract items from response
      const raw = data?.data ?? data
      const items = Array.isArray(raw?.items) ? raw.items : 
                   Array.isArray(raw?.staff) ? raw.staff : 
                   Array.isArray(raw) ? raw : []
      const mappedDoctors = items.map(mapDoctorData)
      setDoctors(mappedDoctors)
    }
    catch (error) {
      console.error('Error loading doctors:', error)
      setDoctors([])
    }
    finally {
      setLoading(false)
    }
  }

  // Edit doctor
  const handleEditDoctor = () => {
    if (!validateForm()) return
    setDoctors(prev => 
      prev.map(doctor => 
        doctor.id === currentDoctor.id 
          ? { 
              ...doctor,
              name: `Dr. ${formData.first_name} ${formData.last_name}`.trim(),
              first_name: formData.first_name,
              middle_name: formData.middle_name,
              last_name: formData.last_name,
              email: formData.email,
              phone: formData.phone,
              contact: formData.phone,
              emergency_contact: formData.emergency_contact,
              shift_timing: formData.shift_timing,
              joining_date: formData.joining_date,
              address: formData.address,
              department_name: formData.department_name,
              department: formData.department_name,
              specialization: formData.doctor_specialization || '',
              experience: formData.experience,
              fee: formData.fee,
              qualification: formData.qualification
            }
          : doctor
      )
    )
    setIsEditModalOpen(false)
    resetForm()
  }

  // Add new doctor
  const handleAddDoctor = async () => {
    if (!validateForm()) return
    setSubmitLoading(true)
    try {
      const payload = {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        middle_name: formData.middle_name?.trim() || '',
        role: formData.role || 'DOCTOR',
        password: formData.password,
        emergency_contact: formData.emergency_contact?.trim() || '',
        shift_timing: formData.shift_timing?.trim() || '',
        joining_date: formData.joining_date,
        address: formData.address?.trim() || '',
        department_name: formData.department_name?.trim() || ''
      }
      
      const res = await apiFetch(HOSPITAL_ADMIN_STAFF, { method: 'POST', body: payload })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to create doctor (${res.status})`)
        return
      }
      
      setIsEditModalOpen(false)
      resetForm()
      loadDoctors()
    }
    catch (error) {
      window.alert(error?.message || 'Unable to create doctor.')
    }
    finally {
      setSubmitLoading(false)
    }
  }

  // Toggle doctor status (Active/Inactive)
  const handleToggleStatus = (doctorId) => {
    setDoctors(prev => 
      prev.map(doctor => 
        doctor.id === doctorId 
          ? { ...doctor, status: doctor.status === 'Active' ? 'Inactive' : 'Active' }
          : doctor
      )
    )
  }

  // Delete doctor
  const handleDeleteDoctor = () => {
    setDoctors(prev => prev.filter(doctor => doctor.id !== currentDoctor.id))
    setIsDeleteModalOpen(false)
    setCurrentDoctor(null)
  }

  // Open view details modal
  const openViewModal = (doctor) => {
    setCurrentDoctor(doctor)
    setIsViewModalOpen(true)
  }

  // Open edit modal with doctor data
  const openEditModal = (doctor) => {
    setIsAddMode(false)
    setCurrentDoctor(doctor)
    setFormData({
      first_name: doctor.first_name || '',
      middle_name: doctor.middle_name || '',
      last_name: doctor.last_name || '',
      email: doctor.email || '',
      phone: doctor.phone || doctor.contact || '',
      password: '',
      confirm_password: '',
      role: doctor.role || 'DOCTOR',
      emergency_contact: doctor.emergency_contact || '',
      shift_timing: doctor.shift_timing || '',
      joining_date: doctor.joining_date || '',
      address: doctor.address || '',
      department_name: doctor.department_name || doctor.department || '',
      doctor_specialization: doctor.specialization || '',
      experience: doctor.experience || '',
      fee: doctor.fee || '',
      qualification: doctor.qualification || ''
    })
    setDepartmentSearchTerm('')
    setSpecializationSearchTerm('')
    setDepartmentDropdownOpen(false)
    setSpecializationDropdownOpen(false)
    setIsEditModalOpen(true)
  }

  // Open delete confirmation modal
  const openDeleteModal = (doctor) => {
    setCurrentDoctor(doctor)
    setIsDeleteModalOpen(true)
  }

  // Open add modal
  const openModal = () => {
    setIsAddMode(true)
    resetForm()
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      role: 'DOCTOR',
      emergency_contact: '',
      shift_timing: '',
      joining_date: '',
      address: '',
      department_name: '',
      doctor_specialization: '',
      experience: '',
      fee: '',
      qualification: ''
    })
    setDepartmentSearchTerm('')
    setSpecializationSearchTerm('')
    setDepartmentDropdownOpen(false)
    setSpecializationDropdownOpen(false)
    setCurrentDoctor(null)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Form validation
  const validateForm = () => {
    const requiredFields = ['first_name', 'last_name', 'email', 'phone']
    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in the ${field.replace('_', ' ')} field`)
        return false
      }
    }
    if (isAddMode) {
      if (!formData.password) {
        alert('Please fill in the password field')
        return false
      }
      if (formData.password !== formData.confirm_password) {
        alert('Passwords do not match')
        return false
      }
    }
    return true
  }

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = !searchTerm || 
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = !departmentFilter || doctor.department === departmentFilter || doctor.department_name === departmentFilter
    const matchesStatus = !statusFilter || doctor.status === statusFilter
    const matchesConsultationType = !consultationTypeFilter || doctor.consultationType === consultationTypeFilter
    return matchesSearch && matchesDepartment && matchesStatus && matchesConsultationType
  })

  // Departments and specializations data
  const departments = [
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'Pediatrics',
    'ENT',
    'Dermatology',
    'Ophthalmology',
    'Dentistry',
    'Psychiatry',
    'General Medicine'
  ]

  const specializations = [
    'Cardiologist',
    'Orthopedic Surgeon',
    'Neurologist',
    'Pediatrician',
    'ENT Specialist',
    'Dermatologist',
    'Ophthalmologist',
    'Dentist',
    'Psychiatrist',
    'General Physician'
  ]

  const availabilityOptions = [
    '9AM-5PM',
    '10AM-6PM',
    '8AM-4PM',
    '24/7 On-call',
    'Flexible Hours',
    'Weekends Only'
  ]

  // Common form fields for both Add and Edit modals
  const renderFormFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="First Name" type="text" required value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Middle Name" type="text" value={formData.middle_name}
            onChange={(e) => handleInputChange('middle_name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Last Name" type="text" required value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="doctor@hospital.com" type="email" required value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="+91 98765 43210" type="tel" required value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
      </div>

      {isAddMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-10"
                placeholder="Enter password" type={showPassword ? 'text' : 'password'} required={isAddMode} value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)} tabIndex="-1" >
                {showPassword ? <VisibilityOff style={{fontSize: '20px'}} /> : <Visibility style={{fontSize: '20px'}} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              placeholder="Role" type="text" value={formData.role} readOnly
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Emergency Contact"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shift Timing</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="e.g. 9 AM - 5 PM" type="text" value={formData.shift_timing}
            onChange={(e) => handleInputChange('shift_timing', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            type="date" value={formData.joining_date} onChange={(e) => handleInputChange('joining_date', e.target.value)}
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department Name <span className="text-red-500">*</span>
          </label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Type or select department" type="text" required
            value={departmentSearchTerm || formData.department_name} onFocus={() => setDepartmentDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDepartmentDropdownOpen(false), 150)}
            onChange={(e) => {
              setDepartmentSearchTerm(e.target.value)
              setDepartmentDropdownOpen(true)
              handleInputChange('department_name', e.target.value)
            }}
          />
          {departmentDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
              {departments
                .filter(dept => 
                  !departmentSearchTerm || dept.toLowerCase().includes(departmentSearchTerm.toLowerCase())
                )
                .map(dept => (
                  <div className="w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    key={dept}
                    onClick={() => {
                      handleInputChange('department_name', dept)
                      setDepartmentSearchTerm('')
                      setDepartmentDropdownOpen(false)
                    }}>
                    {dept}
                  </div>
                ))}
              {departments.filter(dept => 
                !departmentSearchTerm || dept.toLowerCase().includes(departmentSearchTerm.toLowerCase())
              ).length === 0 && (
                <div className="px-4 py-2.5 text-gray-500 text-sm">No departments found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specialization
          </label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Type or select specialization" type="text"
            value={specializationSearchTerm || formData.doctor_specialization}
            onFocus={() => setSpecializationDropdownOpen(true)}
            onBlur={() => setTimeout(() => setSpecializationDropdownOpen(false), 150)}
            onChange={(e) => {
              setSpecializationSearchTerm(e.target.value)
              setSpecializationDropdownOpen(true)
              handleInputChange('doctor_specialization', e.target.value)
            }}
          />
          {specializationDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto w-full">
              {specializations
                .filter(spec => 
                  !specializationSearchTerm || spec.toLowerCase().includes(specializationSearchTerm.toLowerCase())
                )
                .map(spec => (
                  <div className="w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    key={spec}
                    onClick={() => {
                      handleInputChange('doctor_specialization', spec)
                      setSpecializationSearchTerm('')
                      setSpecializationDropdownOpen(false)
                    }}>
                    {spec}
                  </div>
                ))}
              {specializations.filter(spec => 
                !specializationSearchTerm || spec.toLowerCase().includes(specializationSearchTerm.toLowerCase())
              ).length === 0 && (
                <div className="px-4 py-2.5 text-gray-500 text-sm">No specializations found</div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="e.g. 5" type="number" value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="e.g. 500" type="number" value={formData.fee}
            onChange={(e) => handleInputChange('fee', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
        <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="e.g. MBBS, MD" type="text" value={formData.qualification}
          onChange={(e) => handleInputChange('qualification', e.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Full Address" rows="3" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>
    </div>
  )

  if (loading) return <LoadingSpinner />
  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Doctor Management</h1>
              <p className="text-gray-600 mt-2 text-xs sm:text-sm">Manage your medical team efficiently</p>
            </div>
          </div>
          <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
            onClick={openModal}>
            <i className="fas fa-plus-circle text-lg"></i>
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Search & Filter Bar */}
        <div className="backdrop-blur-xl bg-white/60 border border-gray-300 rounded-2xl p-5 sm:p-6 shadow-lg mb-8 hover:shadow-xl transition-all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input - Full Width on Mobile */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2  items-center gap-2">
                <Search className="text-blue-500" style={{fontSize: '20px'}} />Search</label>
              <input className="w-full px-4 py-2.5 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-500 transition-all duration-200 text-sm"
                type="text" placeholder="Doctor name or specialization..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Department Filter */}
            <div className="lg:col-span-1">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2  items-center gap-2">
                <LocalHospital className="text-green-500" style={{fontSize: '20px'}} />Dept</label>
              <div className="relative">
                <select className="w-full px-3 py-2.5 pr-8 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-900 transition-all duration-200 text-sm appearance-none cursor-pointer"
                  value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <option value="">All</option>
                  {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
                <ExpandMore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" style={{fontSize: '20px'}} />
              </div>
            </div>
            {/* Status Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2  items-center gap-2">
                <FiberManualRecord className="text-orange-500" style={{fontSize: '20px'}} />Status</label>
              <div className="relative">
                <select className="w-full px-3 py-2.5 pr-8 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-900 transition-all duration-200 text-sm appearance-none cursor-pointer"
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ExpandMore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" style={{fontSize: '20px'}} />
              </div>
            </div>
            {/* Consultation Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2  items-center gap-2">
                <LocalHospital className="text-purple-500" style={{fontSize: '20px'}} />Consultation Type</label>
              <div className="relative">
                <select className="w-full px-3 py-2.5 pr-8 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 transition-all duration-200 text-sm appearance-none cursor-pointer"
                  value={consultationTypeFilter} onChange={(e) => setConsultationTypeFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Telemedicine">Telemedicine</option>
                  <option value=" In-Person and Telemedicine">Both</option>
                </select>
                <ExpandMore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" style={{fontSize: '20px'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {filteredDoctors.map((doctor, idx) => {
              return (
              <div key={doctor.id} className="group h-full backdrop-blur-3xl bg-gradient-to-br from-white/30 to-white/10 border border-gray-300 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative cursor-pointer"
                style={{animationDelay: `${idx * 50}ms`}}>
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-4xl"></div>

                {/* Main Card Content - Click to open modal */}
                <div onClick={() => openViewModal(doctor)} className="relative p-6 sm:p-7">
                  {/* Collapsed View - Always Show */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded-3xl border border-white/60 shadow-lg group-hover:scale-110 transition-transform duration-500 backdrop-blur-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl uppercase">
                            {(() => {
                              const nameParts = doctor.name.replace(/^Dr\.\s*/i, '').trim().split(' ');
                              return nameParts.length > 1 
                                ? `${nameParts[0][0] || ''}${nameParts[nameParts.length - 1][0] || ''}`
                                : (nameParts[0]?.substring(0, 2) || 'DR');
                            })()}
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-5 h-5 border-2 border-white/80 rounded-full animate-pulse shadow-lg backdrop-blur-sm ${
                            doctor.status === 'Active' 
                              ? 'bg-emerald-400/70' 
                              : 'bg-slate-400/70'
                          }`}></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-800/95 text-base sm:text-lg group-hover:text-gray-900 transition-all duration-300 truncate">{doctor.name}</h3>
                          <p className="text-xs text-gray-700/60 font-semibold mt-1">{doctor.id}</p>
                          <p className="text-xs text-blue-600/80 font-medium mt-1.5">{doctor.specialization}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ml-2 backdrop-blur-md border border-white/60 transition-all duration-300 ${
                        doctor.status === 'Active' 
                          ? 'bg-emerald-500/15 text-emerald-700/90 border-emerald-400/40' 
                          : 'bg-slate-500/15 text-slate-700/90 border-slate-400/40'
                      } flex items-center gap-1`}>
                        {doctor.status === 'Active' ? (
                          <CheckCircle style={{fontSize: '16px'}} />
                        ) : (
                          <Close style={{fontSize: '16px'}} />
                        )}
                        {doctor.status}
                      </span>
                    </div>
                    <div className="text-center mt-4 text-xs text-gray-600/70 font-medium">Click to view details</div>
                  </div>
                </div>
              </div>
            )
            })}
          </div>
        ) : (
          <div className="text-center py-24 backdrop-blur-3xl bg-gradient-to-br from-white/30 to-white/10 border border-white/50 rounded-4xl shadow-2xl">
            <div className="mb-8 inline-flex items-center justify-center w-28 h-28 rounded-full backdrop-blur-md bg-white/15 border border-white/40">
              <LocalHospital className="text-gray-600/80" style={{fontSize: '72px'}} />
            </div>
            <h3 className="text-4xl font-bold text-gray-800/95 mb-4">No Doctors Found</h3>
            <p className="text-gray-700/80 mb-10 text-lg font-medium">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Edit Doctor Modal */}
      <Modal title={isAddMode ? "Add New Doctor" : "Edit Doctor"} size="lg" isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false)
          resetForm()
        }}>
        <div className="bg-gradient-to-b from-indigo-50/50 to-white/50 rounded-lg p-2 max-h-[60vh] overflow-y-auto">
          {renderFormFields()}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200/50 mt-6">
          <button className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95"
            type="button" onClick={() => {
              setIsEditModalOpen(false)
              resetForm()
            }}>Cancel</button>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            type="button" onClick={isAddMode ? handleAddDoctor : handleEditDoctor}
            disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.department_name || submitLoading}>
            {submitLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SaveOutlined style={{fontSize: '20px'}} />
            )}
            {submitLoading ? 'Saving...' : (isAddMode ? 'Add Doctor' : 'Update Doctor')}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Delete Doctor" size="md" isOpen={isDeleteModalOpen} 
        onClose={() => {
          setIsDeleteModalOpen(false)
          setCurrentDoctor(null)
        }}>
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-lg">
            <WarningAmber className="text-red-600" style={{fontSize: '36px'}} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Confirm Deletion</h3>
          <p className="text-gray-600 mb-2">Are you sure you want to delete <span className="font-bold text-red-600">{currentDoctor?.name}</span>?</p>
          <p className="text-gray-500 text-sm mb-8">This action cannot be undone.</p>
          <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
            <button className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setCurrentDoctor(null)
              }}>
              Cancel
            </button>
            <button className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              onClick={handleDeleteDoctor}>
              <DeleteOutline style={{fontSize: '20px'}} />
              Delete Doctor
            </button>
          </div>
        </div>
      </Modal>

      {/* View Doctor Details Modal */}
      <Modal title="Doctor Details" size="lg" isOpen={isViewModalOpen} 
        onClose={() => {
          setIsViewModalOpen(false)
          setCurrentDoctor(null)
          setShowPassword(false)
        }}>
        {currentDoctor && (
          <div className="bg-white">
            {/* Header Banner */}
            <div className="bg-[#f4f7ff] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-[#4361ee] shadow-sm flex items-center justify-center text-white font-bold text-4xl uppercase">
                  {(() => {
                    const nameParts = currentDoctor.name.replace(/^Dr\.\s*/i, '').trim().split(' ');
                    return nameParts.length > 1 
                      ? `${nameParts[0][0] || ''}${nameParts[nameParts.length - 1][0] || ''}`
                      : (nameParts[0]?.substring(0, 2) || 'DR');
                  })()}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-7 h-7 border-4 border-[#f4f7ff] rounded-full ${
                  currentDoctor.status === 'Active' ? 'bg-[#2ec4b6]' : 'bg-slate-400'
                }`}></div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#4361ee] mb-2">{currentDoctor.name}</h2>
                <div className="flex flex-col gap-1.5">
                  <p className="text-gray-600 text-sm font-semibold flex items-center gap-2">
                    <Badge style={{fontSize: '16px'}} />
                    {currentDoctor.id}
                  </p>
                  <p className="text-[#4361ee] font-bold text-sm flex items-center gap-2">
                    <LocalHospital style={{fontSize: '16px'}} />
                    {currentDoctor.specialization}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 mb-8">
              {/* Experience */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100/70 rounded-lg flex items-center justify-center">
                    <EmojiEvents className="text-purple-600" style={{fontSize: '18px'}} />
                  </div>
                  <label className="text-[11px] font-bold text-purple-600 uppercase tracking-widest">Experience</label>
                </div>
                <p className="text-base font-bold text-gray-900">{currentDoctor.experience ? `${currentDoctor.experience} Years` : 'Not Specified'}</p>
              </div>

              {/* Email */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100/70 rounded-lg flex items-center justify-center">
                    <MailOutline className="text-green-600" style={{fontSize: '18px'}} />
                  </div>
                  <label className="text-[11px] font-bold text-green-600 uppercase tracking-widest">Email</label>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{currentDoctor.email}</p>
              </div>

              {/* Contact */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100/70 rounded-lg flex items-center justify-center">
                    <Phone className="text-orange-600" style={{fontSize: '18px'}} />
                  </div>
                  <label className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">Contact</label>
                </div>
                <p className="text-base font-bold text-gray-900">{currentDoctor.contact}</p>
              </div>

              {/* Availability */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-teal-100/70 rounded-lg flex items-center justify-center">
                    <CalendarMonth className="text-teal-600" style={{fontSize: '18px'}} />
                  </div>
                  <label className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">Availability</label>
                </div>
                <p className="text-base font-bold text-gray-900">{currentDoctor.shift_timing || currentDoctor.availability || 'Not Specified'}</p>
              </div>

              {/* Consultation Fee */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-100/70 rounded-lg flex items-center justify-center">
                    <CurrencyRupee className="text-yellow-600" style={{fontSize: '18px'}} />
                  </div>
                  <label className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest">Consultation Fee</label>
                </div>
                <p className="text-base font-bold text-gray-900">{currentDoctor.fee ? `₹ ${currentDoctor.fee}` : 'Not Specified'}</p>
              </div>

              {/* Qualification */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm sm:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100/70 rounded-lg flex items-center justify-center">
                    <School className="text-indigo-600" style={{fontSize: '18px'}} />
                  </div>
                  <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Qualification</label>
                </div>
                <p className="text-base font-bold text-gray-900">{currentDoctor.qualification || 'Not Specified'}</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-center sm:justify-end gap-3 px-6 pb-6 pt-2 border-t border-gray-100">
              <button className="px-6 py-2.5 text-sm font-semibold bg-[#e2e8f0] text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setCurrentDoctor(null)
                }}>
                Close
              </button>
              <button type="button"
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors flex items-center gap-2 shadow-sm ${
                  currentDoctor.status === 'Active' ? 'bg-[#f46036] hover:bg-[#e05631]' : 'bg-[#2ec4b6] hover:bg-[#27a89c]'
                }`}
                onClick={() => {
                  handleToggleStatus(currentDoctor.id)
                  setCurrentDoctor({...currentDoctor, status: currentDoctor.status === 'Active' ? 'Inactive' : 'Active'})
                }}>
                {currentDoctor.status === 'Active' ? (
                  <Pause style={{fontSize: '18px'}} />
                ) : (
                  <PlayArrow style={{fontSize: '18px'}} />
                )}
                {currentDoctor.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
              <button className="px-6 py-2.5 text-sm font-semibold bg-[#4361ee] text-white rounded-lg hover:bg-[#3a56d4] transition-colors flex items-center gap-2 shadow-sm"
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false)
                  openEditModal(currentDoctor)
                }}>
                <Edit style={{fontSize: '18px'}} />
                Edit Doctor
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DoctorManagement