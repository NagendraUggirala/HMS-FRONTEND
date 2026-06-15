import React, { useMemo, useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import {
  HOSPITAL_ADMIN_STAFF,
  HOSPITAL_ADMIN_STAFF_DETAILS,
  HOSPITAL_ADMIN_STAFF_STATUS,
  HOSPITAL_ADMIN_STAFF_RESET_PASSWORD
} from '../../../../config/api'
import { apiFetch } from '../../../../services/apiClient'

const ROLE_OPTIONS = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECH', 'PHARMACIST', 'TELEMEDICINE']
const SHIFT_OPTIONS = ['Morning (7AM-3PM)', 'Evening (3PM-11PM)', 'Night (11PM-7AM)', 'Flexible', 'Part-time']

// ========== ROLE CONFIGURATION - Scalable & Dynamic ==========
// Add new roles here without changing UI logic
const ROLE_CONFIG = {
  DOCTOR: {
    label: 'Doctor',
    pluralLabel: 'Medical team',
    color: 'blue',
    icon: 'fas fa-user-md',
    description: 'Medical professionals responsible for diagnosing and treating patients'
  },
  NURSE: {
    label: 'Nurses',
    pluralLabel: 'Nursing team',
    color: 'teal',
    icon: 'fas fa-user-nurse',
    description: 'Nursing professionals'
  },
  RECEPTIONIST: {
    label: 'Receptionists',
    pluralLabel: 'Front desk',
    color: 'rose',
    icon: 'fas fa-hospital-user',
    description: 'Reception team'
  },
  LAB_TECH: {
    label: 'Lab Technicians',
    pluralLabel: 'Diagnostics team',
    color: 'purple',
    icon: 'fas fa-microscope',
    description: 'Laboratory technicians'
  },
  PHARMACIST: {
    label: 'Pharmacists',
    pluralLabel: 'Pharmacy team',
    color: 'orange',
    icon: 'fas fa-pills',
    description: 'Pharmacy staff'
  },

  TELEMEDICINE: {
    label: 'Telemedicine',
    pluralLabel: 'Telemedicine team',
    color: 'indigo',
    icon: 'fas fa-laptop-medical',
    description: 'Telemedicine staff'
  },
  CLEANER: {
    label: 'Cleaners',
    pluralLabel: 'Housekeeping',
    color: 'cyan',
    icon: 'fas fa-broom',
    description: 'Cleaning and housekeeping'
  },
  SECURITY: {
    label: 'Security',
    pluralLabel: 'Security team',
    color: 'amber',
    icon: 'fas fa-shield-alt',
    description: 'Security personnel'
  }
}

const EMPTY_FORM = {
  email: '',
  phone: '',
  first_name: '',
  last_name: '',
  role: '',
  password: '',
  emergency_contact: '',
  shift_timing: SHIFT_OPTIONS[0],
  joining_date: '',
  address: '',
  doctor_specialization: '',
  department_name: '',
}

const getStaffItems = (data) => {
  const raw = data?.data ?? data
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.staff)) return raw.staff
  if (Array.isArray(raw)) return raw
  return []
}

const toDisplayRole = (role) => {
  const value = String(role || '').toUpperCase()
  // Get from config if exists, otherwise format the string
  if (ROLE_CONFIG[value]) {
    return ROLE_CONFIG[value].label
  }
  // Fallback: convert underscore to space and title case
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const mapStaff = (item) => {
  const role = item?.role ?? item?.user_role ?? ''
  const firstName = item?.first_name ?? item?.firstName ?? ''
  const lastName = item?.last_name ?? item?.lastName ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  return {
    id: item?.id ?? item?.staff_id ?? item?.user_id ?? '',
    email: item?.email ?? '',
    phone: item?.phone ?? '',
    first_name: firstName,
    last_name: lastName,
    name: fullName || item?.name || 'Unnamed Staff',
    role,
    roleLabel: toDisplayRole(role),
    shift_timing: item?.shift_timing ?? item?.shiftTiming ?? '-',
    joining_date: item?.joining_date ?? item?.joiningDate ?? '',
    address: item?.address ?? '',
    emergency_contact: item?.emergency_contact ?? item?.emergencyContact ?? '',
    doctor_specialization: item?.doctor_specialization ?? item?.doctorSpecialization ?? '',
    status: item?.is_active === false ? 'Inactive' : 'Active',
    is_active: item?.is_active !== false,
    department_name: item?.department_name ?? item?.department ?? ''
  }
}

const StaffManagement = () => {
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [listError, setListError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [passwordResetResult, setPasswordResetResult] = useState(null)
  const [modalState, setModalState] = useState({ add: false })
  const [staffDetails, setStaffDetails] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})

  const fetchStaff = async () => {
    setLoading(true)
    setListError('')
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter === 'Active') params.set('active_only', 'true')
      const res = await apiFetch(`${HOSPITAL_ADMIN_STAFF}?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListError(data?.message || data?.detail?.message || `Failed to load staff (${res.status})`)
        setStaff([])
        return
      }
      setStaff(getStaffItems(data).map(mapStaff))
    } catch (error) {
      setListError(error?.message || 'Unable to load staff users.')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [roleFilter, statusFilter])

  const openModal = () => {
    setModalState({ add: true })
    setFormData(EMPTY_FORM)
    setFieldErrors({})
  }

  const closeModal = () => {
    setModalState({ add: false })
    setFormData(EMPTY_FORM)
    setFieldErrors({})
  }

  const closeDetailsModal = () => setStaffDetails(null)

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    const required = ['email', 'phone', 'first_name', 'last_name', 'role', 'password', 'emergency_contact', 'shift_timing', 'joining_date', 'address', 'department_name']
    required.forEach((field) => {
      if (!String(formData[field] || '').trim()) {
        errors[field] = 'This field is required.'
      }
    })
    if (formData.role === 'DOCTOR' && !String(formData.doctor_specialization || '').trim()) {
      errors.doctor_specialization = 'Doctor specialization is required for doctors.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddStaff = async () => {
    if (!validateForm()) return
    setSubmitLoading(true)
    try {
      const payload = {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        password: formData.password,
        emergency_contact: formData.emergency_contact.trim(),
        shift_timing: formData.shift_timing.trim(),
        joining_date: formData.joining_date,
        address: formData.address.trim(),
        department_name: formData.department_name.trim(),
        doctor_specialization: formData.role === 'DOCTOR'
          ? formData.doctor_specialization.trim()
          : ''
      }
      const res = await apiFetch(HOSPITAL_ADMIN_STAFF, { method: 'POST', body: payload })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errorDetails = data?.errors ? JSON.stringify(data.errors) : (data?.detail ? JSON.stringify(data.detail) : '');
        window.alert(`${data?.message || 'Failed to create staff'} ${errorDetails}`);
        return
      }
      closeModal()
      fetchStaff()
    } catch (error) {
      window.alert(error?.message || 'Unable to create staff user.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleToggleStatus = async (staffItem) => {
    const nextValue = !staffItem.is_active
    const loadingKey = `status-${staffItem.id}`
    setActionLoading((prev) => ({ ...prev, [loadingKey]: true }))
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_STAFF_STATUS(staffItem.id), {
        method: 'PATCH',
        body: { is_active: nextValue }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to update status (${res.status})`)
        return
      }
      fetchStaff()
    } catch (error) {
      window.alert(error?.message || 'Unable to update staff status.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleResetPassword = async (staffItem) => {
    if (!window.confirm(`Reset password for ${staffItem.name}?`)) return
    const loadingKey = `reset-${staffItem.id}`
    setActionLoading((prev) => ({ ...prev, [loadingKey]: true }))
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_STAFF_RESET_PASSWORD(staffItem.id), { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to reset password (${res.status})`)
        return
      }
      const tempPassword =
        data?.temporary_password ||
        data?.password ||
        data?.data?.temporary_password ||
        data?.data?.password ||
        ''
      setPasswordResetResult({ name: staffItem.name, password: tempPassword })
    } catch (error) {
      window.alert(error?.message || 'Unable to reset password.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleGetDetails = async (staffItem) => {
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_STAFF_DETAILS(staffItem.id))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to fetch staff details (${res.status})`)
        return
      }
      const detail = data?.data ?? data
      setStaffDetails({
        name: staffItem.name,
        id: detail?.id || detail?.staff_id || detail?.user_id || staffItem.id || '-',
        email: detail?.email || staffItem.email || '-',
        phone: detail?.phone || staffItem.phone || '-',
        role: toDisplayRole(detail?.role || staffItem.role),
        active: detail?.is_active === false ? 'No' : 'Yes',
        shift_timing: detail?.shift_timing || staffItem.shift_timing || '-',
        joining_date: detail?.hire_date || '-',
        address: detail?.address || '-',
        emergency_contact: detail?.emergency_contact || '-',
        doctor_specialization: detail?.doctor_specialization || '-',
        department_name: detail?.department_name || staffItem.department_name || '-'
      })
    } catch (error) {
      window.alert(error?.message || 'Unable to load staff details.')
    }
  }

  const filteredStaff = useMemo(() => {
    return staff.filter((staffMember) => {
      const query = searchTerm.trim().toLowerCase()
      const matchesSearch = !query || [staffMember.name, staffMember.email, staffMember.phone, staffMember.roleLabel]
        .some((field) => String(field || '').toLowerCase().includes(query))
      return matchesSearch
    })
  }, [staff, searchTerm])

  // Dynamic KPI stats - Auto-generates based on all available roles
  const stats = useMemo(() => {
    // Always show Total Staff
    const baseStats = [
      {
        label: 'Total Staff',
        value: staff.length,
        color: 'blue',
        icon: 'fas fa-users',
        change: 'Hospital users'
      }
    ]

    // Get unique roles present in current staff data
    const availableRoles = new Set(staff.map(s => s.role))

    // Generate KPI cards dynamically for each available role
    availableRoles.forEach((role) => {
      const config = ROLE_CONFIG[role]

      if (config) {
        baseStats.push({
          label: config.label,
          value: staff.filter((s) => s.role === role).length,
          color: config.color,
          icon: config.icon,
          change: config.pluralLabel
        })
      } else {
        // Fallback for roles not in config
        baseStats.push({
          label: toDisplayRole(role),
          value: staff.filter((s) => s.role === role).length,
          color: 'gray',
          icon: 'fas fa-user',
          change: toDisplayRole(role)
        })
      }
    })

    return baseStats
  }, [staff])

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Staff Management
            </h2>
            <p className="text-gray-500 mt-1">Manage hospital staff users using backend APIs</p>
          </div>
          <button
            onClick={openModal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            <i className="fas fa-plus-circle text-lg"></i>
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search staff by name, role, email or phone..."
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{toDisplayRole(role)}</option>)}
            </select>
            <select
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {listError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-3">
          <span><i className="fas fa-exclamation-circle mr-2"></i>{listError}</span>
          <button onClick={fetchStaff} className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-sm font-medium">
            Retry
          </button>
        </div>
      )}

      {passwordResetResult && (
        <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
          <i className="fas fa-key mr-2"></i>
          Temporary password for <span className="font-semibold">{passwordResetResult.name}</span>:
          {' '}
          <span className="font-semibold">{passwordResetResult.password || 'Check backend response payload.'}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {stats.map(({ label, value, color, icon, change }) => {
          const colorConfigs = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
            green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', iconColor: 'text-green-500' },
            teal: { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100', iconColor: 'text-teal-500' },
            rose: { bg: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-rose-100', iconColor: 'text-rose-500' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100', iconColor: 'text-purple-500' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-500' },
            cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-500' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconColor: 'text-amber-500' },
            gray: { bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100', iconColor: 'text-gray-500' },
          }

          const config = colorConfigs[color] || colorConfigs.blue

          return (
            <div
              key={label}
              className={`${config.bg} p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${config.iconBg} p-3 rounded-xl`}>
                  <i className={`${icon} ${config.iconColor} text-xl`}></i>
                </div>
                <span className="text-sm font-medium px-3 py-1 bg-white rounded-full border border-gray-200">
                  {change}
                </span>
              </div>
              <div className={`text-4xl font-bold ${config.text} mb-2`}>{value}</div>
              <div className="text-gray-600">{label}</div>

            </div>
          )
        })}
      </div>

      {/* Staff Cards Title */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">All Staff Members ({filteredStaff.length})</h3>
        <div className="flex items-center gap-2 text-gray-500">
          <i className="fas fa-info-circle"></i>
          <span className="text-sm">Click on any staff member to view details</span>
        </div>
      </div>

      {/* Staff Grid - Compact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(staffMember => (
          <StaffCard
            key={staffMember.id}
            staffMember={staffMember}
            onDetails={() => handleGetDetails(staffMember)}
            onToggleStatus={() => handleToggleStatus(staffMember)}
            onResetPassword={() => handleResetPassword(staffMember)}
            actionLoading={actionLoading}
          />
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
            <i className="fas fa-users text-blue-500 text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No staff members found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => { setSearchTerm(''); setRoleFilter(''); setStatusFilter(''); }}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fas fa-redo"></i>
            Reset filters
          </button>
        </div>
      )}

      {/* Modals */}
      <StaffFormModal
        isOpen={modalState.add}
        onClose={closeModal}
        title="Add New Staff Member"
        onSubmit={handleAddStaff}
        formData={formData}
        onInputChange={handleInputChange}
        submitText="Create Staff"
        submitIcon="plus-circle"
        onCancel={closeModal}
        fieldErrors={fieldErrors}
        submitLoading={submitLoading}
      />
      <StaffDetailsModal
        isOpen={Boolean(staffDetails)}
        details={staffDetails}
        onClose={closeDetailsModal}
      />
    </div>
  )
}

// Compact Staff Card Component
const StaffCard = ({ staffMember, onDetails, onToggleStatus, onResetPassword, actionLoading }) => {
  const statusConfig = {
    Active: { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: 'fas fa-check-circle' },
    Inactive: { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: 'fas fa-pause-circle' }
  }

  const status = statusConfig[staffMember.status] || statusConfig.Active

  const roleConfig = {
    DOCTOR: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'fas fa-user-md' },
    NURSE: { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'fas fa-user-nurse' },
    RECEPTIONIST: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'fas fa-hospital-user' },
    LAB_TECH: { bg: 'bg-green-50', text: 'text-green-600', icon: 'fas fa-microscope' },
    PHARMACIST: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'fas fa-pills' },
    TELEMEDICINE: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'fas fa-laptop-medical' }
  }

  const roleStyle = roleConfig[staffMember.role] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'fas fa-user' }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-lg">
            {staffMember.name
              ?.split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-700">{staffMember.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
              {staffMember.status}
            </span>
          </div>
          <p className="text-xs text-gray-500">{staffMember.id}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Role:</span>
          <span className={`${roleStyle.text} font-medium`}>{staffMember.role}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Shift:</span>
          <span className="text-gray-900">{staffMember.shift_timing || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Contact:</span>
          <span className="text-gray-900">{staffMember.phone || '-'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
          <i className={`${roleStyle.icon} mr-1`}></i>
          {staffMember.roleLabel}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDetails}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button
            onClick={onToggleStatus}
            disabled={actionLoading?.[`status-${staffMember.id}`]}
            className={`${staffMember.status === 'Active' ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'} p-2 rounded-full transition-colors`}
            title={staffMember.status === 'Active' ? 'Deactivate' : 'Activate'}
          >
            <i className={`fas fa-${staffMember.status === 'Active' ? 'pause' : 'play'}`}></i>
          </button>
          <button
            onClick={onResetPassword}
            disabled={actionLoading?.[`reset-${staffMember.id}`]}
            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Reset Password"
          >
            <i className="fas fa-key"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

// StaffFormModal component
const StaffFormModal = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  formData,
  onInputChange,
  submitText,
  submitIcon,
  onCancel,
  fieldErrors,
  submitLoading
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
    <StaffForm
      formData={formData}
      onInputChange={onInputChange}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitText={submitText}
      submitIcon={submitIcon}
      fieldErrors={fieldErrors}
      submitLoading={submitLoading}
    />
  </Modal>
)

const StaffDetailsModal = ({ isOpen, details, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Staff Details" size="md">
    <div className="space-y-4">
      <div className="pb-3 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800">{details?.name || '-'}</h4>
        <p className="text-sm text-gray-500">{details?.id || '-'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{details?.email || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900">{details?.phone || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Role:</span> <span className="text-gray-900">{details?.role || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Active:</span> <span className="text-gray-900">{details?.active || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Shift:</span> <span className="text-gray-900">{details?.shift_timing || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Joining Date:</span> <span className="text-gray-900">{details?.joining_date || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Department:</span> <span className="text-gray-900">{details?.department_name || '-'}</span></div>
      </div>

      <div className="text-sm">
        <p className="font-medium text-gray-700 mb-1">Address</p>
        <p className="text-gray-900 bg-gray-50 rounded-lg p-2">{details?.address || '-'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><span className="font-medium text-gray-700">Emergency Contact:</span> <span className="text-gray-900">{details?.emergency_contact || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Doctor Specialization:</span> <span className="text-gray-900">{details?.doctor_specialization || '-'}</span></div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
)

const StaffForm = ({ formData, onInputChange, onCancel, onSubmit, submitText, submitIcon, fieldErrors, submitLoading }) => {
  const standardDepartments = ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'ENT', 'Dermatology', 'Ophthalmology', 'Dentistry', 'Psychiatry', 'General Medicine']
  const isInitialManual = formData.department_name && !standardDepartments.includes(formData.department_name)
  const [showManualInput, setShowManualInput] = useState(isInitialManual)

  const formFields = [
    { type: 'text', name: 'first_name', label: 'First Name *', placeholder: 'Enter first name', icon: 'fas fa-user' },
    { type: 'text', name: 'last_name', label: 'Last Name *', placeholder: 'Enter last name', icon: 'fas fa-user' },
    { type: 'email', name: 'email', label: 'Email Address *', placeholder: 'staff@hospital.com', icon: 'fas fa-envelope' },
    { type: 'tel', name: 'phone', label: 'Phone Number *', placeholder: '+91 98765 43210', icon: 'fas fa-phone' },
    { type: 'password', name: 'password', label: 'Password *', placeholder: 'Enter password', icon: 'fas fa-lock' },
    { type: 'tel', name: 'emergency_contact', label: 'Emergency Contact *', placeholder: '+91 98765 43210', icon: 'fas fa-phone-alt' },
  ]

  const selectFields = [
    { name: 'role', label: 'Role *', options: ROLE_OPTIONS, icon: 'fas fa-briefcase' },
    { name: 'shift_timing', label: 'Shift Timing *', options: SHIFT_OPTIONS, icon: 'fas fa-clock' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {formFields.map(field => (
          <div key={field.name} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className={field.icon}></i>
              </div>
              <input
                type={field.type}
                required
                value={formData[field.name]}
                onChange={(e) => onInputChange(field.name, e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${fieldErrors[field.name] ? 'border-red-400' : 'border-gray-300'}`}
                placeholder={field.placeholder}
              />
            </div>
            {fieldErrors[field.name] && <p className="text-sm text-red-600 mt-1">{fieldErrors[field.name]}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {selectFields.map(field => (
          <div key={field.name} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                <i className={field.icon}></i>
              </div>
              <select
                required
                value={formData[field.name]}
                onChange={(e) => onInputChange(field.name, e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Select {field.label.replace(' *', '')}</option>
                {field.options.map(option => (
                  <option key={option} value={option}>
                    {field.name === 'role' ? toDisplayRole(option) : option}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>
        ))}

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date *</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <input
              type="date"
              required
              value={formData.joining_date}
              onChange={(e) => onInputChange('joining_date', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {fieldErrors.joining_date && <p className="text-sm text-red-600 mt-1">{fieldErrors.joining_date}</p>}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
              <i className="fas fa-hospital"></i>
            </div>
            <select
              required
              value={showManualInput ? 'OTHER' : (formData.department_name || '')}
              onChange={(e) => {
                const val = e.target.value
                if (val === 'OTHER') {
                  setShowManualInput(true)
                  onInputChange('department_name', '')
                } else {
                  setShowManualInput(false)
                  onInputChange('department_name', val)
                }
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Select Department</option>
              {standardDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              <option value="OTHER">Other (Manual Entry)</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
          
          {showManualInput && (
            <div className="mt-3 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="fas fa-edit"></i>
              </div>
              <input
                type="text"
                required
                value={formData.department_name}
                onChange={(e) => onInputChange('department_name', e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type department name..."
              />
            </div>
          )}
          {fieldErrors.department_name && <p className="text-sm text-red-600 mt-1">{fieldErrors.department_name}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Specialization {formData.role === 'DOCTOR' ? '*' : '(Optional)'}</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="fas fa-stethoscope"></i>
          </div>
          <input
            type="text"
            value={formData.doctor_specialization}
            onChange={(e) => onInputChange('doctor_specialization', e.target.value)}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.doctor_specialization ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Enter specialization"
          />
        </div>
        {formData.role !== 'DOCTOR' && (
          <p className="text-xs text-gray-500 mt-1">Required only when role is Doctor.</p>
        )}
        {fieldErrors.doctor_specialization && <p className="text-sm text-red-600 mt-1">{fieldErrors.doctor_specialization}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
        <div className="relative">
          <div className="absolute left-3 top-3 text-gray-400">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <textarea
            rows="3"
            required
            value={formData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.address ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Enter complete address"
          />
        </div>
        {fieldErrors.address && <p className="text-sm text-red-600 mt-1">{fieldErrors.address}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitLoading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
        >
          <i className={`fas fa-${submitIcon} mr-2`}></i>
          {submitLoading ? 'Creating...' : submitText}
        </button>
      </div>
    </div>
  )
}

export default StaffManagement