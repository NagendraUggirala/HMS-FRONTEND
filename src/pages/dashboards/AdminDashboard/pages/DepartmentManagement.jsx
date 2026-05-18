import React, { useMemo, useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import {
  HOSPITAL_ADMIN_DEPARTMENTS,
  HOSPITAL_ADMIN_DEPARTMENT_DETAILS,
  HOSPITAL_ADMIN_DEPARTMENT_STATUS
} from '../../../../config/api'
import { apiFetch } from '../../../../services/apiClient'

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  head_of_department: '',
  location: '',
  phone: '',
  email: '',
  operating_hours: '',
  bed_capacity: '',
  specializations: '',
  equipment_list: '',
  emergency_services: false
}

const getDepartmentItems = (data) => {
  const raw = data?.data ?? data
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.departments)) return raw.departments
  if (Array.isArray(raw)) return raw
  return []
}

const mapDepartment = (item) => ({
  id: item?.id ?? item?.department_id ?? '',
  name: item?.name ?? '',
  code: item?.code ?? '',
  description: item?.description ?? '',
  head_of_department: item?.head_of_department ?? '',
  location: item?.location ?? '',
  phone: item?.phone ?? '',
  email: item?.email ?? '',
  operating_hours: item?.operating_hours ?? '',
  bed_capacity: item?.bed_capacity ?? 0,
  specializations: Array.isArray(item?.specializations) ? item.specializations : [],
  equipment_list: Array.isArray(item?.equipment_list) ? item.equipment_list : [],
  emergency_services: Boolean(item?.emergency_services),
  is_active: item?.is_active !== false
})

const toTextArray = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

const DepartmentManagement = () => {
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [listError, setListError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [details, setDetails] = useState(null)
  const [modalState, setModalState] = useState({ add: false, edit: false })
  const [currentDepartment, setCurrentDepartment] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})

  const fetchDepartments = async () => {
    setLoading(true)
    setListError('')
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      params.set('active_only', String(activeOnly))
      const res = await apiFetch(`${HOSPITAL_ADMIN_DEPARTMENTS}?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListError(data?.message || data?.detail?.message || `Failed to load departments (${res.status})`)
        setDepartments([])
        return
      }
      setDepartments(getDepartmentItems(data).map(mapDepartment))
    } catch (error) {
      setListError(error?.message || 'Unable to load departments.')
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [activeOnly])

  const openAddModal = () => {
    setCurrentDepartment(null)
    setFormData(EMPTY_FORM)
    setFieldErrors({})
    setModalState({ add: true, edit: false })
  }

  const openEditModal = (department) => {
    setCurrentDepartment(department)
    setFormData({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      head_of_department: department.head_of_department || '',
      location: department.location || '',
      phone: department.phone || '',
      email: department.email || '',
      operating_hours: department.operating_hours || '',
      bed_capacity: String(department.bed_capacity ?? ''),
      specializations: (department.specializations || []).join(', '),
      equipment_list: (department.equipment_list || []).join(', '),
      emergency_services: Boolean(department.emergency_services)
    })
    setFieldErrors({})
    setModalState({ add: false, edit: true })
  }

  const closeModals = () => {
    setModalState({ add: false, edit: false })
    setCurrentDepartment(null)
    setFormData(EMPTY_FORM)
    setFieldErrors({})
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    const required = [
      'name',
      'code',
      'description',
      'head_of_department',
      'location',
      'phone',
      'email',
      'operating_hours',
      'bed_capacity'
    ]
    required.forEach((field) => {
      if (!String(formData[field] ?? '').trim()) {
        errors[field] = 'This field is required.'
      }
    })

    if (formData.bed_capacity !== '' && Number(formData.bed_capacity) < 0) {
      errors.bed_capacity = 'Bed capacity must be 0 or greater.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const buildPayload = () => ({
    name: formData.name.trim(),
    code: formData.code.trim(),
    description: formData.description.trim(),
    head_of_department: formData.head_of_department.trim(),
    location: formData.location.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim(),
    operating_hours: formData.operating_hours.trim(),
    bed_capacity: Number(formData.bed_capacity || 0),
    specializations: toTextArray(formData.specializations),
    equipment_list: toTextArray(formData.equipment_list),
    emergency_services: Boolean(formData.emergency_services)
  })

  const handleCreateDepartment = async () => {
    if (!validateForm()) return
    setSubmitLoading(true)
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENTS, {
        method: 'POST',
        body: buildPayload()
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to create department (${res.status})`)
        return
      }
      closeModals()
      fetchDepartments()
    } catch (error) {
      window.alert(error?.message || 'Unable to create department.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdateDepartment = async () => {
    if (!validateForm() || !currentDepartment?.id) return
    setSubmitLoading(true)
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENT_DETAILS(currentDepartment.id), {
        method: 'PUT',
        body: buildPayload()
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to update department (${res.status})`)
        return
      }
      closeModals()
      fetchDepartments()
    } catch (error) {
      window.alert(error?.message || 'Unable to update department.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleToggleStatus = async (department) => {
    const nextActive = !department.is_active
    const loadingKey = `status-${department.id}`
    setActionLoading((prev) => ({ ...prev, [loadingKey]: true }))
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENT_STATUS(department.id), {
        method: 'PATCH',
        body: { is_active: nextActive }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to update status (${res.status})`)
        return
      }
      fetchDepartments()
    } catch (error) {
      window.alert(error?.message || 'Unable to update department status.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleGetDetails = async (department) => {
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENT_DETAILS(department.id))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data?.message || data?.detail?.message || `Failed to fetch department details (${res.status})`)
        return
      }
      const detail = mapDepartment(data?.data ?? data)
      setDetails(detail)
    } catch (error) {
      window.alert(error?.message || 'Unable to load department details.')
    }
  }

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return departments.filter((department) => {
      if (!query) return true
      return [
        department.name,
        department.code,
        department.head_of_department,
        department.location,
        department.email
      ].some((field) => String(field || '').toLowerCase().includes(query))
    })
  }, [departments, searchTerm])

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Department Management</h2>
            <p className="text-gray-500 mt-1">Manage hospital departments with backend APIs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by name, code, head, location or email..."
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
            />
            Active only
          </label>
        </div>
      </div>

      {listError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-3">
          <span><i className="fas fa-exclamation-circle mr-2"></i>{listError}</span>
          <button onClick={fetchDepartments} className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-sm font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">All Departments ({filteredDepartments.length})</h3>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
        >
          <i className="fas fa-plus-circle text-lg"></i>
          <span>Add New Department</span>
        </button>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beds</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.map((department) => (
                <tr key={department.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
                      <div className="text-sm font-medium text-gray-900">{department.name}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5" title={department.description}>{department.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.head_of_department || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.bed_capacity ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      department.emergency_services
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {department.emergency_services ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      department.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {department.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGetDetails(department)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => openEditModal(department)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                        title="Edit Department"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(department)}
                        disabled={actionLoading?.[`status-${department.id}`]}
                        className={`p-1 rounded transition-colors ${
                          department.is_active
                            ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        } disabled:opacity-50`}
                        title={department.is_active ? 'Disable Department' : 'Enable Department'}
                      >
                        <i className={`fas fa-${department.is_active ? 'pause' : 'play'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
              <i className="fas fa-sitemap text-blue-500 text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No departments found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or active filter</p>
          </div>
        )}
      </div>

      <DepartmentFormModal
        isOpen={modalState.add}
        onClose={closeModals}
        title="Add New Department"
        onSubmit={handleCreateDepartment}
        formData={formData}
        onInputChange={handleInputChange}
        submitText="Create Department"
        submitIcon="plus-circle"
        onCancel={closeModals}
        fieldErrors={fieldErrors}
        submitLoading={submitLoading}
      />

      <DepartmentFormModal
        isOpen={modalState.edit}
        onClose={closeModals}
        title="Edit Department"
        onSubmit={handleUpdateDepartment}
        formData={formData}
        onInputChange={handleInputChange}
        submitText="Save Changes"
        submitIcon="save"
        onCancel={closeModals}
        fieldErrors={fieldErrors}
        submitLoading={submitLoading}
      />

      <DepartmentDetailsModal
        isOpen={Boolean(details)}
        details={details}
        onClose={() => setDetails(null)}
      />
    </div>
  )
}

const DepartmentFormModal = ({
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
    <DepartmentForm
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

const DepartmentForm = ({ formData, onInputChange, onCancel, onSubmit, submitText, submitIcon, fieldErrors, submitLoading }) => {
  const formFields = [
    { type: 'text', name: 'name', label: 'Department Name *', placeholder: 'e.g., Cardiology', icon: 'fas fa-building' },
    { type: 'text', name: 'code', label: 'Department Code *', placeholder: 'e.g., CARD', icon: 'fas fa-hashtag' },
    { type: 'text', name: 'head_of_department', label: 'Head of Department *', placeholder: 'Doctor UUID or identifier', icon: 'fas fa-user-md' },
    { type: 'text', name: 'location', label: 'Location *', placeholder: 'e.g., Floor 2, Wing A', icon: 'fas fa-map-marker-alt' },
    { type: 'tel', name: 'phone', label: 'Phone *', placeholder: '+40)159()873363()1776', icon: 'fas fa-phone' },
    { type: 'email', name: 'email', label: 'Email *', placeholder: 'user@example.com', icon: 'fas fa-envelope' },
    { type: 'text', name: 'operating_hours', label: 'Operating Hours *', placeholder: 'e.g., 08:00-20:00', icon: 'fas fa-clock' },
    { type: 'number', name: 'bed_capacity', label: 'Bed Capacity *', placeholder: '0', icon: 'fas fa-bed' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {formFields.map((field) => (
          <div key={field.name} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className={field.icon}></i>
              </div>
              <input
                type={field.type}
                min={field.type === 'number' ? '0' : undefined}
                value={formData[field.name]}
                onChange={(event) => onInputChange(field.name, event.target.value)}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${fieldErrors[field.name] ? 'border-red-400' : 'border-gray-300'}`}
                placeholder={field.placeholder}
              />
            </div>
            {fieldErrors[field.name] && <p className="text-sm text-red-600 mt-1">{fieldErrors[field.name]}</p>}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          rows="3"
          value={formData.description}
          onChange={(event) => onInputChange('description', event.target.value)}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.description ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="Department description"
        />
        {fieldErrors.description && <p className="text-sm text-red-600 mt-1">{fieldErrors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specializations (comma separated)</label>
          <input
            type="text"
            value={formData.specializations}
            onChange={(event) => onInputChange('specializations', event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Angioplasty, Echo, ICU"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Equipment List (comma separated)</label>
          <input
            type="text"
            value={formData.equipment_list}
            onChange={(event) => onInputChange('equipment_list', event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., MRI, Ventilator"
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={formData.emergency_services}
          onChange={(event) => onInputChange('emergency_services', event.target.checked)}
        />
        Emergency services available
      </label>

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
          {submitLoading ? 'Saving...' : submitText}
        </button>
      </div>
    </div>
  )
}

const DepartmentDetailsModal = ({ isOpen, details, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Department Details" size="md">
    <div className="space-y-4 text-sm">
      <div className="pb-3 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800">{details?.name || '-'}</h4>
        <p className="text-sm text-gray-500">{details?.code || '-'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><span className="font-medium text-gray-700">Head:</span> <span className="text-gray-900">{details?.head_of_department || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Location:</span> <span className="text-gray-900">{details?.location || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900">{details?.phone || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{details?.email || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Operating Hours:</span> <span className="text-gray-900">{details?.operating_hours || '-'}</span></div>
        <div><span className="font-medium text-gray-700">Bed Capacity:</span> <span className="text-gray-900">{details?.bed_capacity ?? 0}</span></div>
      </div>
      <div>
        <p className="font-medium text-gray-700 mb-1">Description</p>
        <p className="text-gray-900 bg-gray-50 rounded-lg p-2">{details?.description || '-'}</p>
      </div>
      <div>
        <p className="font-medium text-gray-700 mb-1">Specializations</p>
        <p className="text-gray-900 bg-gray-50 rounded-lg p-2">{(details?.specializations || []).join(', ') || '-'}</p>
      </div>
      <div>
        <p className="font-medium text-gray-700 mb-1">Equipment List</p>
        <p className="text-gray-900 bg-gray-50 rounded-lg p-2">{(details?.equipment_list || []).join(', ') || '-'}</p>
      </div>
      <div><span className="font-medium text-gray-700">Emergency Services:</span> <span className="text-gray-900">{details?.emergency_services ? 'Yes' : 'No'}</span></div>
      <div><span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{details?.is_active ? 'Active' : 'Inactive'}</span></div>

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

export default DepartmentManagement