import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import {
  HOSPITAL_ADMIN_DEPARTMENTS,
  HOSPITAL_ADMIN_DEPARTMENTS_ASSIGN_STAFF,
  HOSPITAL_ADMIN_DEPARTMENTS_UNASSIGN_STAFF,
  HOSPITAL_ADMIN_DEPARTMENT_STAFF_BY_NAME,
  HOSPITAL_ADMIN_STAFF
} from '../../../../config/api'
import { apiFetch } from '../../../../services/apiClient'
import LinkIcon from '@mui/icons-material/Link'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import ApartmentIcon from '@mui/icons-material/Apartment'
import BlockIcon from '@mui/icons-material/Block'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import SearchIcon from '@mui/icons-material/Search'
import InfoIcon from '@mui/icons-material/Info'
import DeleteIcon from '@mui/icons-material/Delete'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PersonIcon from '@mui/icons-material/Person'
import DownloadIcon from '@mui/icons-material/Download'
import FilterListIcon from '@mui/icons-material/FilterList'
import RefreshIcon from '@mui/icons-material/Refresh'

const getDepartmentItems = (data) => {
  const raw = data?.data ?? data
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.departments)) return raw.departments
  if (Array.isArray(raw)) return raw
  return []
}

const getStaffListFromAssignmentResponse = (data) => {
  if (Array.isArray(data?.staff)) return data.staff
  const inner = data?.data ?? data
  if (Array.isArray(inner?.staff)) return inner.staff
  return []
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
  if (value === 'LAB_TECH') return 'Lab Tech'
  if (value === 'PHARMACIST') return 'Pharmacist'
  if (value === 'DOCTOR') return 'Doctor'
  if (value === 'NURSE') return 'Nurse'
  if (!value) return 'Unknown'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const mapStaffOption = (item) => {
  const firstName = item?.first_name ?? item?.firstName ?? ''
  const lastName = item?.last_name ?? item?.lastName ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  const role = item?.role ?? item?.user_role ?? (Array.isArray(item?.roles) ? item.roles[0] : '') ?? ''
  return {
    id: item?.id ?? item?.staff_id ?? item?.user_id ?? '',
    name: fullName || item?.name || item?.staff_name || 'Unnamed Staff',
    role: role,
    roleLabel: toDisplayRole(role),
    status: item?.is_active === false ? 'inactive' : 'active'
  }
}

const mapDepartmentLite = (item) => ({
  id: item?.id ?? item?.department_id ?? '',
  name: item?.name ?? ''
})

const parseApiError = (data, res) => {
  const detailParts = []

  const appendFromErrorItems = (items) => {
    if (!Array.isArray(items)) return
    for (const x of items) {
      if (typeof x === 'string') detailParts.push(x)
      else if (x?.msg) {
        const loc = Array.isArray(x.loc) ? x.loc.filter((p) => p !== 'body').join(' → ') : ''
        detailParts.push(loc ? `${loc}: ${x.msg}` : x.msg)
      } else if (x?.message) detailParts.push(x.message)
    }
  }

  appendFromErrorItems(data?.errors)

  const d = data?.detail
  if (typeof d === 'string') detailParts.push(d)
  else if (Array.isArray(d)) appendFromErrorItems(d)
  else if (d && typeof d === 'object' && Array.isArray(d.errors)) appendFromErrorItems(d.errors)

  const unique = [...new Set(detailParts.filter(Boolean))]
  if (unique.length) return unique.join('; ')

  return data?.message || `Request failed (${res.status})`
}

function rowFromDeptMember(departmentName, member, index) {
  const firstName = member?.first_name ?? member?.firstName ?? ''
  const lastName = member?.last_name ?? member?.lastName ?? ''
  const fromNames =
    member?.staff_name ??
    member?.name ??
    `${firstName} ${lastName}`.trim()
  const staffName = fromNames || 'Unknown'
  const role = member?.role ?? member?.user_role ?? (Array.isArray(member?.roles) ? member.roles[0] : '') ?? ''
  const assignedRaw =
    member?.assigned_date ??
    member?.assigned_at ??
    member?.created_at ??
    member?.joining_date ??
    ''
  let assignedDate = ''
  if (typeof assignedRaw === 'string') {
    assignedDate = assignedRaw.split('T')[0]
  } else if (assignedRaw) {
    try {
      assignedDate = new Date(assignedRaw).toISOString().split('T')[0]
    } catch {
      assignedDate = ''
    }
  }
  const statusRaw = member?.status ?? (member?.is_active === false ? 'inactive' : 'active')
  const status = String(statusRaw).toLowerCase()
  return {
    id: `${departmentName}::${staffName}::${index}`,
    staffId: String(member?.id ?? member?.staff_id ?? member?.user_id ?? ''),
    staffName,
    staffRole: role,
    staffRoleLabel: toDisplayRole(role),
    departmentName,
    assignedDate,
    status: status === 'inactive' ? 'inactive' : 'active'
  }
}

async function fetchAssignmentsForDepartments(deptList) {
  if (!deptList.length) return []
  const settled = await Promise.allSettled(
    deptList.map(async (dept) => {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENT_STAFF_BY_NAME(dept.name))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(parseApiError(data, res))
      }
      return getStaffListFromAssignmentResponse(data).map((m, idx) =>
        rowFromDeptMember(dept.name, m, idx)
      )
    })
  )
  const rows = []
  const errors = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      rows.push(...r.value)
    } else {
      errors.push(`${deptList[i].name}: ${r.reason?.message || 'failed'}`)
    }
  })
  if (errors.length > 0 && rows.length > 0) {
    toast.warn(`Could not load staff for ${errors.length} department(s); showing partial data.`)
  } else if (errors.length > 0 && deptList.length > 0 && rows.length === 0) {
    toast.error('Could not load staff for any department. Check API or permissions.')
  }
  return rows
}

const AssignDepartment = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [listError, setListError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [modalState, setModalState] = useState({ assign: false, unassign: false })
  const [currentAssignment, setCurrentAssignment] = useState(null)
  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    departmentName: ''
  })
  const [activeFilter, setActiveFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('assignedDate')
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [unassignSubmitting, setUnassignSubmitting] = useState(false)

  const refreshAssignments = useCallback(async (deptList) => {
    const list = deptList ?? departments
    if (!list.length) {
      setAssignments([])
      return
    }
    setRefreshing(true)
    try {
      const rows = await fetchAssignmentsForDepartments(list)
      setAssignments(rows)
    } catch (e) {
      toast.error(e?.message || 'Could not refresh assignments')
    } finally {
      setRefreshing(false)
    }
  }, [departments])

  const loadInitialData = async () => {
    setLoading(true)
    setListError('')
    try {
      // Match DepartmentManagement / StaffManagement — many APIs cap limit (e.g. le=100).
      const deptParams = new URLSearchParams({ page: '1', limit: '100', active_only: 'false' })
      const staffParams = new URLSearchParams({ page: '1', limit: '100' })
      const [deptRes, staffRes] = await Promise.all([
        apiFetch(`${HOSPITAL_ADMIN_DEPARTMENTS}?${deptParams}`),
        apiFetch(`${HOSPITAL_ADMIN_STAFF}?${staffParams}`)
      ])
      const deptData = await deptRes.json().catch(() => ({}))
      const staffData = await staffRes.json().catch(() => ({}))

      if (!deptRes.ok) {
        setListError(parseApiError(deptData, deptRes))
        setDepartments([])
        setStaff([])
        setAssignments([])
        return
      }
      if (!staffRes.ok) {
        setListError(parseApiError(staffData, staffRes))
        setStaff([])
      } else {
        setStaff(getStaffItems(staffData).map(mapStaffOption))
      }

      const deptList = getDepartmentItems(deptData)
        .map(mapDepartmentLite)
        .filter((d) => d.name)
      setDepartments(deptList)

      const rows = await fetchAssignmentsForDepartments(deptList)
      setAssignments(rows)
    } catch (e) {
      setListError(e?.message || 'Unable to load data.')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  const openModal = (type, assignment = null) => {
    setModalState((prev) => ({ ...prev, [type]: true }))
    if (type === 'unassign' && assignment) {
      setCurrentAssignment(assignment)
    }
  }

  const closeModal = (type) => {
    setModalState((prev) => ({ ...prev, [type]: false }))
    if (type === 'assign') resetForm()
    if (type === 'unassign') setCurrentAssignment(null)
  }

  const handleAssignStaff = async () => {
    if (!formData.staffId || !formData.departmentName) {
      toast.error('Please select both staff member and department')
      return
    }
    const selectedStaff = staff.find((s) => s.id === formData.staffId)
    if (!selectedStaff) {
      toast.error('Selected staff not found')
      return
    }
    const exists = assignments.some(
      (a) =>
        a.staffName === selectedStaff.name && a.departmentName === formData.departmentName
    )
    if (exists) {
      toast.warning('This staff member is already assigned to this department')
      return
    }

    setAssignSubmitting(true)
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENTS_ASSIGN_STAFF, {
        method: 'POST',
        body: {
          staff_name: selectedStaff.name,
          department_name: formData.departmentName
        }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(parseApiError(data, res))
        return
      }
      toast.success(typeof data?.message === 'string' ? data.message : 'Staff assigned successfully')
      closeModal('assign')
      await refreshAssignments()
    } catch (e) {
      toast.error(e?.message || 'Assignment failed')
    } finally {
      setAssignSubmitting(false)
    }
  }

  const handleUnassignStaff = async () => {
    if (!currentAssignment) return
    setUnassignSubmitting(true)
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENTS_UNASSIGN_STAFF, {
        method: 'POST',
        body: {
          staff_name: currentAssignment.staffName,
          department_name: currentAssignment.departmentName
        }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(parseApiError(data, res))
        return
      }
      toast.success(
        typeof data?.message === 'string' ? data.message : 'Staff member unassigned successfully'
      )
      closeModal('unassign')
      await refreshAssignments()
    } catch (e) {
      toast.error(e?.message || 'Unassign failed')
    } finally {
      setUnassignSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ staffId: '', staffName: '', departmentName: '' })
  }

  const filteredAssignments = assignments
    .filter((assign) => {
      const matchesSearch =
        !searchTerm ||
        assign.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assign.departmentName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = activeFilter === 'all' || assign.status === activeFilter
      const matchesRole =
        roleFilter === 'all' ||
        String(assign.staffRole || '').toUpperCase() === roleFilter.toUpperCase()

      return matchesSearch && matchesStatus && matchesRole
    })
    .sort((a, b) => {
      if (sortBy === 'assignedDate') {
        return new Date(b.assignedDate || 0) - new Date(a.assignedDate || 0)
      }
      if (sortBy === 'staffName') {
        return a.staffName.localeCompare(b.staffName)
      }
      if (sortBy === 'department') {
        return a.departmentName.localeCompare(b.departmentName)
      }
      return 0
    })

  const assignedStaffKeys = new Set(assignments.map((a) => `${a.staffName}`.toLowerCase()))
  const unassignedCount = staff.filter(
    (s) => !assignedStaffKeys.has(s.name.toLowerCase())
  ).length

  const stats = [
    {
      label: 'Total Assignments',
      value: assignments.length,
      color: 'blue',
      icon: LinkIcon,
      change: refreshing ? 'Updating…' : 'Live'
    },
    {
      label: 'Staff Assigned',
      value: new Set(assignments.map((a) => a.staffName)).size,
      color: 'green',
      icon: VerifiedUserIcon,
      change: 'Distinct staff'
    },
    {
      label: 'Departments Covered',
      value: new Set(assignments.map((a) => a.departmentName)).size,
      color: 'purple',
      icon: ApartmentIcon,
      change: `of ${departments.length}`
    },
    {
      label: 'Unassigned Staff',
      value: unassignedCount,
      color: 'orange',
      icon: BlockIcon,
      change: 'In directory'
    }
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Assign Staff to Departments
            </h2>
            <p className="text-gray-500 mt-1">
              Uses hospital-admin APIs: assign, unassign, and list staff per department
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshAssignments()}
              disabled={refreshing || !departments.length}
              className="bg-gray-100 text-gray-800 px-5 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
              <span>Refresh list</span>
            </button>
            <button
              type="button"
              onClick={() => openModal('assign')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
            >
              <AddCircleIcon sx={{ fontSize: 20 }} />
              <span>New Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {listError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
          {listError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map(({ label, value, color, icon: Icon, change }) => {
          const colorConfigs = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
            green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', iconColor: 'text-green-500' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100', iconColor: 'text-purple-500' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' }
          }

          const config = colorConfigs[color] || colorConfigs.blue

          return (
            <div
              key={label}
              className={`${config.bg} p-4 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${config.iconBg} p-3 rounded-xl`}>
                  <Icon sx={{ fontSize: 24 }} className={config.iconColor} />
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <SearchIcon sx={{ fontSize: 20, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by staff name or department..."
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const csv = [
                ['Staff Name', 'Role', 'Department', 'Status', 'Assigned Date'],
                ...filteredAssignments.map((a) => [
                  a.staffName,
                  a.staffRoleLabel,
                  a.departmentName,
                  a.status,
                  a.assignedDate
                ])
              ]
                .map((row) => row.join(','))
                .join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `staff_assignments_${new Date().toISOString().split('T')[0]}.csv`
              a.click()
              toast.success('Assignments exported successfully')
            }}
            className="bg-green-50 text-green-600 px-6 py-3 rounded-xl hover:bg-green-100 transition-all duration-200 font-medium border border-green-200 flex items-center gap-2"
          >
            <DownloadIcon sx={{ fontSize: 20 }} />
            <span>Export</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FilterListIcon sx={{ fontSize: 20, color: '#6b7280' }} />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>

          <div className="flex gap-2">
            {['all', 'active'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? 'All Status' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 bg-white cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="DOCTOR">Doctors</option>
            <option value="NURSE">Nurses</option>
            <option value="LAB_TECH">Lab Tech</option>
            <option value="PHARMACIST">Pharmacists</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 bg-white cursor-pointer"
          >
            <option value="assignedDate">Sort by Date</option>
            <option value="staffName">Sort by Name</option>
            <option value="department">Sort by Department</option>
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xl font-semibold text-gray-800">
          Assigned Staff ({filteredAssignments.length})
          {refreshing ? (
            <span className="ml-2 text-sm font-normal text-gray-500">Refreshing…</span>
          ) : null}
        </h3>
        <div className="flex items-center gap-2 text-gray-500">
          <InfoIcon sx={{ fontSize: 18 }} />
          <span className="text-sm">Unassign removes access to that department</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Staff Member</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Department</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Assigned Date</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <PersonIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{assignment.staffName}</div>
                        <div className="text-xs text-gray-500">{assignment.staffId || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {assignment.staffRoleLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ApartmentIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                      <span className="font-medium text-gray-900">{assignment.departmentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        assignment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          assignment.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CalendarTodayIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                      <span className="text-sm font-medium">
                        {assignment.assignedDate
                          ? new Date(assignment.assignedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openModal('unassign', assignment)}
                        disabled={unassignSubmitting}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Unassign Staff"
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              }
            </tbody>
          </table>
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <LinkIcon sx={{ fontSize: 32, color: '#9ca3af' }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No assignments found</h3>
            <p className="text-gray-500">Try refreshing, adjusting filters, or create a new assignment</p>
          </div>
        )}
      </div>

      <AssignmentFormModal
        isOpen={modalState.assign}
        onClose={() => closeModal('assign')}
        onSubmit={handleAssignStaff}
        formData={formData}
        setFormData={setFormData}
        staff={staff}
        departments={departments}
        submitting={assignSubmitting}
      />

      <UnassignConfirmationModal
        isOpen={modalState.unassign}
        onClose={() => closeModal('unassign')}
        onConfirm={handleUnassignStaff}
        assignment={currentAssignment}
        submitting={unassignSubmitting}
      />
    </div>
  )
}

const AssignmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  staff,
  departments,
  submitting
}) => {
  const selectedStaff = staff.find((s) => s.id === formData.staffId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Staff to Department" size="lg">
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                formData.staffId ? 'bg-green-500 shadow-lg' : 'bg-blue-500'
              }`}
            >
              1
            </div>
            <p className="text-xs font-medium text-gray-600 mt-2">Select Staff</p>
          </div>
          <div
            className={`flex-1 h-1 mx-4 rounded-full transition-all ${
              formData.staffId && formData.departmentName
                ? 'bg-green-500'
                : formData.staffId
                  ? 'bg-blue-300'
                  : 'bg-gray-200'
            }`}
          />
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                formData.departmentName ? 'bg-green-500 shadow-lg' : 'bg-gray-300'
              }`}
            >
              2
            </div>
            <p className="text-xs font-medium text-gray-600 mt-2">Select Department</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <PersonIcon sx={{ fontSize: 22, color: '#3b82f6' }} />
            <label className="block text-lg font-bold text-gray-800">Select Staff Member</label>
            <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-2xl p-3 bg-gray-50">
            {staff.length === 0 ? (
              <p className="text-sm text-gray-500 p-4">No staff loaded. Check staff list API.</p>
            ) : (
              staff.map((staffMember) => (
                <button
                  key={staffMember.id || staffMember.name}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      staffId: staffMember.id,
                      staffName: staffMember.name
                    }))
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.staffId === staffMember.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                          formData.staffId === staffMember.id ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        {staffMember.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{staffMember.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            {staffMember.roleLabel}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              staffMember.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {staffMember.status === 'active' ? '● Active' : '● Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.staffId === staffMember.id
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.staffId === staffMember.id && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <ApartmentIcon sx={{ fontSize: 22, color: '#8b5cf6' }} />
            <label className="block text-lg font-bold text-gray-800">Select Department</label>
            <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {departments.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2">No departments loaded.</p>
            ) : (
              departments.map((dept) => (
                <button
                  key={dept.id || dept.name}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, departmentName: dept.name }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    formData.departmentName === dept.name
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        formData.departmentName === dept.name ? 'bg-purple-500' : 'bg-gray-200'
                      }`}
                    >
                      <ApartmentIcon
                        sx={{
                          fontSize: 18,
                          color: formData.departmentName === dept.name ? '#fff' : '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{dept.name}</p>
                  {dept.id ? (
                    <p className="text-xs text-gray-500 mt-1 font-medium">{dept.id}</p>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        {formData.staffId && formData.departmentName && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-bold text-green-700">✓ Summary:</span>
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Assigning <span className="text-blue-600">{selectedStaff?.name}</span> to{' '}
              <span className="text-purple-600">{formData.departmentName}</span> (API uses staff &amp;
              department names)
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-bold hover:border-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!formData.staffId || !formData.departmentName || submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl hover:from-blue-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <AddCircleIcon sx={{ fontSize: 18 }} />
            {submitting ? 'Assigning…' : 'Assign Staff'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const UnassignConfirmationModal = ({ isOpen, onClose, onConfirm, assignment, submitting }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
    <div className="text-center p-6">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center shadow-lg">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <DeleteIcon sx={{ fontSize: 32, color: '#ef4444' }} />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">Unassign Staff Member?</h3>
      <p className="text-gray-600 mb-4">This action will remove the staff member from the department</p>

      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 justify-center">
            <PersonIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
            <div>
              <p className="text-xs text-gray-600">Staff Member</p>
              <p className="font-bold text-gray-900">{assignment?.staffName}</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-8 h-0.5 bg-red-300 mx-2" />
            <DeleteIcon sx={{ fontSize: 18, color: '#ef4444' }} />
            <div className="w-8 h-0.5 bg-red-300 mx-2" />
          </div>
          <div className="flex items-center gap-3 justify-center">
            <ApartmentIcon sx={{ fontSize: 20, color: '#8b5cf6' }} />
            <div>
              <p className="text-xs text-gray-600">Department</p>
              <p className="font-bold text-gray-900">{assignment?.departmentName}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6 font-medium">
        The staff member will lose access to this department&apos;s operations and data.
      </p>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-bold hover:border-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
          {submitting ? 'Removing…' : 'Unassign'}
        </button>
      </div>
    </div>
  </Modal>
)

export default AssignDepartment
