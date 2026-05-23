import React, { useState, useEffect } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { apiFetch } from '../../../../services/apiClient'

const EquipmentTracking = () => {
  const [loading, setLoading] = useState(true)
  const [equipment, setEquipment] = useState([])
  const [equipmentStats, setEquipmentStats] = useState({ total_equipment: 0, operational: 0, maintenance: 0, calibration_due: 0 })
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [loadingSelectedEquipment, setLoadingSelectedEquipment] = useState(false)
  const [savingEquipment, setSavingEquipment] = useState(false)
  const [updatingEquipment, setUpdatingEquipment] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [logsFilterType, setLogsFilterType] = useState('')

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: 'preventive',
    scheduledDate: new Date().toISOString().split('T')[0],
    technician: '',
    description: '',
    cost: 0,
    status: 'scheduled',
    notes: ''
  })

  const [calibrationForm, setCalibrationForm] = useState({
    calibrationType: 'routine',
    scheduledDate: new Date().toISOString().split('T')[0],
    standard: '',
    description: '',
    cost: 0,
    status: 'scheduled',
    notes: ''
  })

  const [newEquipment, setNewEquipment] = useState({
    id: '',
    name: '',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    status: 'operational',
    lastMaintenance: '',
    nextMaintenance: '',
    calibrationDue: '',
    installationDate: '',
    notes: ''
  })
  const [editEquipment, setEditEquipment] = useState({
    equipmentId: '',
    equipment_code: '',
    equipment_name: '',
    category: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    location: '',
    installation_date: '',
    last_calibrated_at: '',
    next_calibration_due_at: '',
    notes: ''
  })

  useEffect(() => {
    loadEquipmentData()
    fetchEquipmentLogs(null, 1, 10, '')
  }, [])

  const mapBackendStatusToUi = (backendStatus, nextCalibrationDueAt) => {
    // Backend enum: ACTIVE | INACTIVE | UNDER_MAINTENANCE | DOWN | MAINTENANCE | CALIBRATION_DUE
    // UI statuses: operational | maintenance | calibration_due | out_of_service
    const s = (backendStatus || '').toUpperCase()
    if (s === 'UNDER_MAINTENANCE' || s === 'MAINTENANCE') return 'maintenance'
    if (s === 'CALIBRATION_DUE') return 'calibration_due'
    if (s === 'DOWN' || s === 'INACTIVE') return 'out_of_service'

    // If ACTIVE and due date passed, mark calibration_due
    if (s === 'ACTIVE' && nextCalibrationDueAt) {
      const d = new Date(nextCalibrationDueAt)
      if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now()) return 'calibration_due'
    }

    return 'operational'
  }

  const formatIsoToDateOnly = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  const fetchEquipmentDetails = async (equipmentUuid, fallbackRow) => {
    if (!equipmentUuid) return
    if (loadingSelectedEquipment) return

    try {
      setLoadingSelectedEquipment(true)
      const res = await apiFetch(`/api/v1/lab/equipment-qc/equipment/${encodeURIComponent(equipmentUuid)}`, {
        method: 'GET'
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to fetch equipment'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch equipment')
      }

      const uiStatus = mapBackendStatusToUi(data?.status, data?.next_calibration_due_at)
      const nextDue = formatIsoToDateOnly(data?.next_calibration_due_at)
      const lastCal = formatIsoToDateOnly(data?.last_calibrated_at)
      const install = formatIsoToDateOnly(data?.installation_date)

      setSelectedEquipment((prev) => ({
        ...(fallbackRow || prev || {}),
        equipmentId: data?.equipment_id ?? equipmentUuid,
        id: data?.equipment_code ?? (fallbackRow || prev || {})?.id,
        qrCode: data?.equipment_code ?? (fallbackRow || prev || {})?.qrCode,
        name: data?.equipment_name ?? (fallbackRow || prev || {})?.name ?? '',
        type: data?.equipment_type ?? data?.category ?? (fallbackRow || prev || {})?.type ?? '',
        brand: data?.brand ?? data?.manufacturer ?? (fallbackRow || prev || {})?.brand ?? '',
        model: data?.model ?? (fallbackRow || prev || {})?.model ?? '',
        serialNumber: data?.serial_no ?? data?.serial_number ?? (fallbackRow || prev || {})?.serialNumber ?? '',
        location: data?.location ?? (fallbackRow || prev || {})?.location ?? '',
        status: uiStatus,
        lastMaintenance: lastCal || (fallbackRow || prev || {})?.lastMaintenance || '',
        nextMaintenance: nextDue || (fallbackRow || prev || {})?.nextMaintenance || '',
        calibrationDue: nextDue || (fallbackRow || prev || {})?.calibrationDue || '',
        installationDate: install || (fallbackRow || prev || {})?.installationDate || '',
        notes: data?.notes ?? (fallbackRow || prev || {})?.notes ?? '',
        specifications: data?.specifications ?? (fallbackRow || prev || {})?.specifications ?? null,
        isActive: data?.is_active ?? true,
        created_at: data?.created_at ?? (fallbackRow || prev || {})?.created_at,
        updated_at: data?.updated_at ?? (fallbackRow || prev || {})?.updated_at
      }))
    } catch (err) {
      console.error('fetchEquipmentDetails error:', err)
      alert(err?.message || 'Failed to fetch equipment details')
    } finally {
      setLoadingSelectedEquipment(false)
    }
  }

  const fetchEquipmentLogs = async (equipmentUuid, page = 1, limit = 10, maintenanceType = null) => {
    try {
      setLoadingLogs(true)
      if (!equipmentUuid) {
        // Fallback to global logs if no equipment is selected
        const globalData = await getGlobalMaintenanceLogs(page, limit, maintenanceType)
        setMaintenanceLogs(globalData.logs.map(log => ({
          id: log.logId,
          equipmentId: log.equipmentId,
          equipmentName: log.equipmentName || 'Unknown Equipment',
          type: log.maintenanceType || log.logType || 'Maintenance',
          date: log.performedAt ? new Date(log.performedAt).toISOString().split('T')[0] : '',
          performedBy: log.performedBy || 'Unknown',
          cost: log.cost || 0,
          description: log.description || log.notes || '',
          status: log.status || 'completed'
        })))
        setLogsPagination(globalData.pagination)
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      if (maintenanceType && maintenanceType.trim()) {
        params.append('maintenance_type', maintenanceType.trim())
      }

      const endpoint = `/api/v1/lab/equipment-qc/equipment/${encodeURIComponent(equipmentUuid)}/logs?${params.toString()}`

      const res = await apiFetch(endpoint, {
        method: 'GET'
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to fetch equipment logs'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch equipment logs')
      }

      // Transform backend logs to match UI structure
      const transformedLogs = (data?.logs || []).map((log) => ({
        id: log?.id || log?.log_id,
        equipmentId: log?.equipment_id || equipmentUuid,
        equipmentName: log?.equipment_name || (selectedEquipment?.equipmentId === equipmentUuid ? selectedEquipment?.name : 'Unknown Equipment'),
        type: log?.maintenance_type || log?.type || 'Maintenance',
        date: log?.performed_at ? new Date(log?.performed_at).toISOString().split('T')[0] : '',
        performedBy: log?.performed_by || log?.technician_name || 'Unknown',
        cost: log?.cost || 0,
        description: log?.description || log?.notes || '',
        status: log?.status || 'completed'
      }))

      setMaintenanceLogs(transformedLogs)
      if (data?.pagination) {
        setLogsPagination({
          page: data.pagination.page || page,
          limit: data.pagination.limit || limit,
          total: data.pagination.total || 0,
          pages: data.pagination.pages || 0
        })
      }
    } catch (err) {
      console.error('fetchEquipmentLogs error:', err)
      setMaintenanceLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  const loadEquipmentData = async (searchTerm = '', page = 1, limit = 50) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        active_only: 'true'
      })
      if (searchTerm.trim()) {
        // Assuming backend supports search, add it if available
        params.append('search', searchTerm.trim())
      }

      const apiUrl = `/api/v1/lab/equipment-qc/equipment?${params.toString()}`
      const res = await apiFetch(apiUrl, {
        method: 'GET'
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to load equipment'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to load equipment')
      }

      const equipmentList = data?.equipment || []
      const pagination = data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }

      const mapped = equipmentList.map((e) => {
        const uiStatus = mapBackendStatusToUi(e?.status, e?.next_calibration_due_at)

        const nextDueDateOnly = formatIsoToDateOnly(e?.next_calibration_due_at)
        const lastCalDateOnly = formatIsoToDateOnly(e?.last_calibrated_at)
        const installationDateOnly = formatIsoToDateOnly(e?.installation_date)

        return {
          equipmentId: e?.equipment_id,
          id: e?.equipment_code, // use equipment_code as "Equipment ID" in this UI
          qrCode: e?.equipment_code,
          name: e?.equipment_name || '',
          type: e?.equipment_type || e?.category || '',
          brand: e?.brand || e?.manufacturer || '',
          model: e?.model || '',
          serialNumber: e?.serial_no || e?.serial_number || '',
          location: e?.location || '',
          status: uiStatus,
          lastMaintenance: lastCalDateOnly,
          nextMaintenance: nextDueDateOnly,
          calibrationDue: nextDueDateOnly,
          installationDate: installationDateOnly,
          notes: e?.notes || '',
          specifications: e?.specifications ?? null,
          isActive: e?.is_active ?? true,
          created_at: e?.created_at,
          updated_at: e?.updated_at
        }
      })

      setEquipment(mapped)
      setEquipmentStats({
        total_equipment: pagination.total || mapped.length,
        operational: mapped.filter((item) => item.status === 'operational').length,
        maintenance: mapped.filter((item) => item.status === 'maintenance').length,
        calibration_due: mapped.filter((item) => item.status === 'calibration_due').length
      })
      setMaintenanceLogs([]) // Reset logs as they are per equipment
      setLogsPagination({ page: 1, limit: 10, total: 0, pages: 0 })
    } catch (err) {
      console.error('loadEquipmentData error:', err)
      setEquipment([])
      setMaintenanceLogs([])
      alert(err?.message || 'Failed to load equipment list')
    } finally {
      setLoading(false)
    }
  }


  const handleSearch = (term) => {
    setSearchTerm(term)
    loadEquipmentData(term)
  }

  const handleAddEquipment = async () => {
    if (savingEquipment) return

    try {
      setSavingEquipment(true)

      const toIsoDateTimeUtc = (dateOnlyStr) => {
        // Input from <input type="date"> is "YYYY-MM-DD"
        if (!dateOnlyStr) return null
        const d = new Date(`${dateOnlyStr}T00:00:00.000Z`)
        if (Number.isNaN(d.getTime())) return null
        return d.toISOString()
      }

      const equipmentCode = `EQP-${(equipment.length + 1).toString().padStart(3, '0')}`

      // Align request payload with backend `EquipmentCreateRequest`.
      const payload = {
        equipment_code: equipmentCode,
        equipment_name: newEquipment.name,
        category: newEquipment.type,
        manufacturer: newEquipment.brand,
        model: newEquipment.model,
        serial_number: newEquipment.serialNumber,
        location: newEquipment.location,
        installation_date: toIsoDateTimeUtc(newEquipment.installationDate) || new Date().toISOString(),
        next_calibration_due_at: toIsoDateTimeUtc(newEquipment.nextMaintenance),
        notes: (newEquipment.notes || '').trim() || null
      }

      const res = await apiFetch('/api/v1/lab/equipment-qc/equipment', { method: 'POST', body: payload })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to create equipment'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to create equipment')
      }

      setShowAddModal(false)
      setNewEquipment({
        id: '',
        name: '',
        type: '',
        brand: '',
        model: '',
        serialNumber: '',
        location: '',
        status: 'operational',
        lastMaintenance: '',
        nextMaintenance: '',
        calibrationDue: '',
        installationDate: '',
        notes: ''
      })

      await loadEquipmentData()
      alert(`Equipment "${newEquipment.name}" added successfully!`)
    } catch (e) {
      alert(e?.message || 'Failed to add equipment')
    } finally {
      setSavingEquipment(false)
    }
  }

  const openEditEquipment = () => {
    if (!selectedEquipment?.equipmentId) {
      alert('Please select an equipment first.')
      return
    }

    setEditEquipment({
      equipmentId: selectedEquipment.equipmentId,
      equipment_code: selectedEquipment.id || '',
      equipment_name: selectedEquipment.name || '',
      category: selectedEquipment.type || '',
      manufacturer: selectedEquipment.brand || '',
      model: selectedEquipment.model || '',
      serial_number: selectedEquipment.serialNumber || '',
      location: selectedEquipment.location || '',
      installation_date: selectedEquipment.installationDate || '',
      last_calibrated_at: selectedEquipment.lastMaintenance || '',
      next_calibration_due_at: selectedEquipment.nextMaintenance || '',
      notes: selectedEquipment.notes || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateEquipment = async () => {
    if (updatingEquipment) return
    if (!editEquipment?.equipmentId) {
      alert('Missing equipment_id (UUID)')
      return
    }

    const toIsoDateTimeUtc = (dateOnlyStr) => {
      if (!dateOnlyStr) return null
      const d = new Date(`${dateOnlyStr}T00:00:00.000Z`)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString()
    }



    // Backend EquipmentUpdateRequest supports partial updates.
    const payload = {
      equipment_name: editEquipment.equipment_name?.trim() || undefined,
      category: editEquipment.category || undefined,
      manufacturer: editEquipment.manufacturer?.trim() || undefined,
      model: editEquipment.model?.trim() || undefined,
      serial_number: editEquipment.serial_number?.trim() || undefined,
      location: editEquipment.location?.trim() || undefined,
      installation_date: toIsoDateTimeUtc(editEquipment.installation_date),
      last_calibrated_at: toIsoDateTimeUtc(editEquipment.last_calibrated_at),
      next_calibration_due_at: toIsoDateTimeUtc(editEquipment.next_calibration_due_at),
      notes: (editEquipment.notes || '').trim() || undefined
    }

    // Remove undefined keys so backend gets only fields you changed
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

    try {
      setUpdatingEquipment(true)
      const res = await apiFetch(
        `/api/v1/lab/equipment-qc/equipment/${encodeURIComponent(editEquipment.equipmentId)}`,
        { method: 'PUT', body: payload }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to update equipment'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to update equipment')
      }

      setShowEditModal(false)
      await loadEquipmentData()
      await fetchEquipmentDetails(editEquipment.equipmentId, selectedEquipment)
      alert('Equipment updated successfully!')
    } catch (err) {
      console.error('handleUpdateEquipment error:', err)
      alert(err?.message || 'Failed to update equipment')
    } finally {
      setUpdatingEquipment(false)
    }
  }

  const handleScheduleMaintenance = (eqp) => {
    setSelectedEquipment(eqp)
    setShowMaintenanceModal(true)
  }

  const handleScheduleCalibration = (eqp) => {
    setSelectedEquipment(eqp)
    setShowCalibrationModal(true)
  }

  const handleLogMaintenance = async () => {
    if (!selectedEquipment?.equipmentId) return

    try {
      const payload = {
        log_type: maintenanceForm.maintenanceType.toUpperCase(),
        maintenance_type: maintenanceForm.maintenanceType,
        description: maintenanceForm.description || `Scheduled ${maintenanceForm.maintenanceType} maintenance`,
        notes: maintenanceForm.notes || 'Equipment maintenance logged via dashboard',
        cost: Number(maintenanceForm.cost) || 0,
        status: maintenanceForm.status || 'scheduled',
        performed_at: new Date(maintenanceForm.scheduledDate).toISOString(),
        performed_by: maintenanceForm.technician || 'dashboard',
        remarks: `Assigned to: ${maintenanceForm.technician || 'unassigned'}`
      }

      const res = await apiFetch(`/api/v1/lab/equipment-qc/equipment/${selectedEquipment.equipmentId}/logs`, {
        method: 'POST',
        body: payload
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to create maintenance log'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to create maintenance log')
      }

      setShowMaintenanceModal(false)
      alert(`Maintenance scheduled for ${selectedEquipment.name}`)

      // Refresh logs from backend
      fetchEquipmentLogs(selectedEquipment.equipmentId, logsPagination.page, logsPagination.limit, logsFilterType)
      // Refresh equipment details
      fetchEquipmentDetails(selectedEquipment.equipmentId, selectedEquipment)
    } catch (err) {
      console.error('Failed to log maintenance:', err)
      alert(err?.message || 'Failed to schedule maintenance')
    }
  }

  const handleLogCalibration = async () => {
    if (!selectedEquipment?.equipmentId) return

    try {
      const payload = {
        log_type: 'CALIBRATION',
        maintenance_type: 'calibration',
        description: calibrationForm.description || `${calibrationForm.calibrationType} calibration scheduled`,
        notes: calibrationForm.notes || `Standard: ${calibrationForm.standard}`,
        cost: Number(calibrationForm.cost) || 0,
        status: calibrationForm.status || 'scheduled',
        performed_at: new Date(calibrationForm.scheduledDate).toISOString(),
        performed_by: 'dashboard',
        remarks: `Standard: ${calibrationForm.standard || 'None specified'}`
      }

      const res = await apiFetch(`/api/v1/lab/equipment-qc/equipment/${selectedEquipment.equipmentId}/logs`, {
        method: 'POST',
        body: payload
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to create calibration log'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to create calibration log')
      }

      setShowCalibrationModal(false)
      alert(`Calibration logged for ${selectedEquipment.name}`)

      // Refresh logs from backend
      fetchEquipmentLogs(selectedEquipment.equipmentId, logsPagination.page, logsPagination.limit, logsFilterType)
      // Refresh equipment details
      fetchEquipmentDetails(selectedEquipment.equipmentId, selectedEquipment)
    } catch (err) {
      console.error('Failed to log calibration:', err)
      alert(err?.message || 'Failed to log calibration')
    }
  }

  const mapUiStatusToBackendStatus = (uiStatus) => {
    const s = (uiStatus || '').toLowerCase()
    if (s === 'maintenance') return 'UNDER_MAINTENANCE'
    if (s === 'out_of_service') return 'DOWN'
    if (s === 'operational' || s === 'calibration_due') return 'ACTIVE'
    if (s === 'retired') return 'INACTIVE'
    return 'ACTIVE'
  }

  const handleStatusUpdate = async (equipmentId, newStatus, reason = 'Updated from equipment dashboard') => {
    if (!equipmentId) {
      alert('Equipment UUID is required to update status.')
      return
    }

    const backendStatus = mapUiStatusToBackendStatus(newStatus)
    try {
      const response = await apiFetch(`/api/v1/lab/equipment-qc/equipment/${encodeURIComponent(equipmentId)}/status`, {
        method: 'PATCH',
        body: { status: backendStatus, reason }
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to update equipment status'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to update equipment status')
      }

      setEquipment(equipment.map(eq =>
        eq.equipmentId === equipmentId ? { ...eq, status: newStatus } : eq
      ))
      setSelectedEquipment((prev) => prev?.equipmentId === equipmentId ? { ...prev, status: newStatus } : prev)
      alert(data?.message || `Equipment status updated to: ${newStatus}`)

      // Refresh logs after status update
      fetchEquipmentLogs(equipmentId, logsPagination.page, logsPagination.limit, logsFilterType)
    } catch (err) {
      console.error('handleStatusUpdate error:', err)
      alert(err?.message || 'Failed to update equipment status')
    }
  }

  const getGlobalMaintenanceLogs = async (page = 1, limit = 10, maintenanceType = null, dateFrom = null, dateTo = null) => {
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', Math.min(limit, 100))
      if (maintenanceType) params.append('maintenance_type', maintenanceType)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await apiFetch(`/api/v1/lab/equipment-qc/equipment/logs?${params.toString()}`, {
        method: 'GET'
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to fetch global maintenance logs'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch global maintenance logs')
      }

      return {
        logs: (data?.logs || []).map(log => ({
          logId: log.id,
          equipmentId: log.equipment_id,
          equipmentName: log.equipment_name,
          logType: log.log_type,
          maintenanceType: log.maintenance_type,
          description: log.description,
          notes: log.notes,
          cost: log.cost,
          status: log.status,
          performedAt: log.performed_at,
          performedBy: log.performed_by,
          remarks: log.remarks,
          createdAt: log.created_at
        })),
        pagination: {
          page: data?.page || page,
          limit: data?.limit || limit,
          total: data?.total || 0,
          pages: data?.pages || Math.ceil((data?.total || 0) / limit)
        }
      }
    } catch (err) {
      console.error('getGlobalMaintenanceLogs error:', err)
      throw err
    }
  }

  const getMaintenanceLogDetail = async (logId) => {
    if (!logId) {
      throw new Error('Log ID is required')
    }

    try {
      const response = await apiFetch(`/api/v1/lab/equipment-qc/equipment/logs/${encodeURIComponent(logId)}`, {
        method: 'GET'
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = data?.detail?.message || data?.detail || data?.message || 'Failed to fetch maintenance log details'
        throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch maintenance log details')
      }

      return {
        logId: data.id,
        equipmentId: data.equipment_id,
        equipmentName: data.equipment_name,
        logType: data.log_type,
        maintenanceType: data.maintenance_type,
        description: data.description,
        notes: data.notes,
        cost: data.cost,
        status: data.status,
        performedAt: data.performed_at,
        performedBy: data.performed_by,
        remarks: data.remarks,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (err) {
      console.error('getMaintenanceLogDetail error:', err)
      throw err
    }
  }

  const handleGenerateQR = (equipmentId) => {
    const eqp = equipment.find(e => e.id === equipmentId)
    if (eqp) {
      alert(`QR Code for ${eqp.name}:\nID: ${eqp.id}\nQR: ${eqp.qrCode}`)
      // In real app, show QR code modal or download
    }
  }

  const filteredEquipment = equipment.filter(eqp =>
    eqp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eqp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eqp.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const equipmentTypes = ['Analyzer', 'Centrifuge', 'Microscope', 'Incubator', 'Autoclave', 'Refrigerator', 'Freezer', 'Pipette', 'Balance', 'Water Bath', 'Other']
  const equipmentStatus = {
    'operational': { color: 'bg-green-100 text-green-800', label: 'Operational' },
    'maintenance': { color: 'bg-yellow-100 text-yellow-800', label: 'Under Maintenance' },
    'calibration_due': { color: 'bg-orange-100 text-orange-800', label: 'Calibration Due' },
    'out_of_service': { color: 'bg-red-100 text-red-800', label: 'Out of Service' },
    'retired': { color: 'bg-gray-100 text-gray-800', label: 'Retired' }
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="space-y-4 md:space-y-6 animate-fade-in p-3 md:p-0">
        {/* Header - Improved responsive layout */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
          <div className="w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700 flex items-center gap-2">

              Equipment Tracking
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">Track laboratory equipment, maintenance, and calibration schedules</p>
          </div>
          <div className="w-full md:w-auto mt-3 md:mt-0">
            <Button
              variant="primary"
              icon="fas fa-plus"
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto justify-center"
            >
              <span className="hidden sm:inline">Add Equipment</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Equipment Stats - Glass Morphism Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Equipment Card */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Equipment</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{equipment.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-microscope text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">All equipment items</p>
            </div>
          </div>

          {/* Operational Card */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Operational</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{equipment.filter(e => e.status === 'operational').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-check-circle text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Fully functional</p>
            </div>
          </div>

          {/* Maintenance Card */}
          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{equipment.filter(e => e.status === 'maintenance').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-tools text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Under maintenance</p>
            </div>
          </div>

          {/* Calibration Due Card */}
          <div className="relative bg-gradient-to-br from-white to-red-50 p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Calibration Due</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{equipment.filter(e => e.status === 'calibration_due').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-exclamation-triangle text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-red-100">
              <p className="text-xs text-red-700 font-medium">Requires calibration</p>
            </div>
          </div>
        </div>

        {/* Search and Filters - Improved responsive layout */}
        <div className="bg-white p-3 md:p-4 rounded-lg border card-shadow">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search equipment..."
                onSearch={handleSearch}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2 border rounded-lg text-sm md:text-base w-1/2 md:w-auto">
                <option value="">All Status</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="calibration_due">Calibration Due</option>
                <option value="out_of_service">Out of Service</option>
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm md:text-base w-1/2 md:w-auto">
                <option value="">All Types</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Equipment Table - Made more responsive */}
        <div className="bg-white rounded-lg border card-shadow overflow-hidden">
          <div className="p-3 md:p-4">
            <h3 className="text-lg font-semibold mb-2">Equipment List</h3>
          </div>
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                {
                  key: 'id',
                  title: 'Equipment ID',
                  sortable: true,
                  className: 'min-w-[100px]'
                },
                {
                  key: 'name',
                  title: 'Name',
                  sortable: true,
                  className: 'min-w-[150px]'
                },
                {
                  key: 'type',
                  title: 'Type',
                  sortable: true,
                  className: 'hidden sm:table-cell'
                },
                {
                  key: 'brand',
                  title: 'Brand',
                  sortable: true,
                  className: 'hidden md:table-cell'
                },
                {
                  key: 'model',
                  title: 'Model',
                  sortable: true,
                  className: 'hidden lg:table-cell'
                },
                {
                  key: 'serialNumber',
                  title: 'Serial No.',
                  sortable: true,
                  className: 'hidden lg:table-cell'
                },
                {
                  key: 'location',
                  title: 'Location',
                  sortable: true,
                  className: 'hidden md:table-cell'
                },
                {
                  key: 'status',
                  title: 'Status',
                  sortable: true,
                  className: 'min-w-[100px]',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs ${equipmentStatus[value]?.color || 'bg-gray-100'}`}>
                      {equipmentStatus[value]?.label || value}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  className: 'min-w-[120px]',
                  render: (_, row) => (
                    <div className="flex gap-1 flex-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateQR(row.id)
                        }}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                        title="Generate QR Code"
                      >
                        <i className="fas fa-qrcode"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScheduleMaintenance(row)
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        title="Schedule Maintenance"
                      >
                        <i className="fas fa-tools"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScheduleCalibration(row)
                        }}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        title="Schedule Calibration"
                      >
                        <i className="fas fa-ruler"></i>
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredEquipment}
              onRowClick={(eqp) => {
                setSelectedEquipment(eqp)
                fetchEquipmentDetails(eqp?.equipmentId, eqp)
                setLogsFilterType('')
                fetchEquipmentLogs(eqp?.equipmentId, 1, 10, '')
              }}
              emptyMessage="No equipment found. Add equipment to start tracking."
              responsive={true}
            />
          </div>
        </div>

        {/* Selected Equipment Details - Improved responsive layout */}
        {selectedEquipment && (
          <div className="bg-white p-4 md:p-6 rounded-lg border card-shadow">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold">{selectedEquipment.name}</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {selectedEquipment.brand} {selectedEquipment.model} • {selectedEquipment.id}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {loadingSelectedEquipment && (
                  <span className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded">
                    Loading details...
                  </span>
                )}
                <button
                  onClick={openEditEquipment}
                  className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                  title="Edit equipment details"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedEquipment.equipmentId, 'operational')}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  Operational
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedEquipment.equipmentId, 'maintenance')}
                  className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Maintenance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500">Serial Number</p>
                <p className="font-mono font-medium text-sm md:text-base truncate">{selectedEquipment.serialNumber}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500">Location</p>
                <p className="font-medium text-sm md:text-base">{selectedEquipment.location}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500">Last Maintenance</p>
                <p className="font-medium text-sm md:text-base">{selectedEquipment.lastMaintenance}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500">Calibration Due</p>
                <p className="font-medium text-sm md:text-base">{selectedEquipment.calibrationDue}</p>
              </div>
            </div>

            {(selectedEquipment.equipmentId || selectedEquipment.created_at || selectedEquipment.updated_at) && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mt-4">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs md:text-sm text-gray-500">Equipment UUID</p>
                  <p className="font-mono text-xs md:text-sm break-all">{selectedEquipment.equipmentId || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs md:text-sm text-gray-500">Active Status</p>
                  <p className="text-xs md:text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedEquipment.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedEquipment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs md:text-sm text-gray-500">Created At</p>
                  <p className="text-xs md:text-sm break-words">{selectedEquipment.created_at ? String(selectedEquipment.created_at) : '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs md:text-sm text-gray-500">Updated At</p>
                  <p className="text-xs md:text-sm break-words">{selectedEquipment.updated_at ? String(selectedEquipment.updated_at) : '—'}</p>
                </div>
              </div>
            )}

            {(selectedEquipment.installationDate || selectedEquipment.notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs md:text-sm text-gray-500">Installation Date</p>
                  <p className="font-medium text-sm md:text-base">{selectedEquipment.installationDate || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs md:text-sm text-gray-500">Notes</p>
                  <p className="text-sm md:text-base whitespace-pre-wrap break-words">{selectedEquipment.notes || '—'}</p>
                </div>
              </div>
            )}

            {selectedEquipment.specifications && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Specifications</p>
                <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedEquipment.specifications, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Maintenance Logs - Made more responsive */}
        <div className="bg-white rounded-lg border card-shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold">Maintenance Logs</h3>
              <p className="text-sm text-gray-500">Recent maintenance and calibration activities</p>
              {loadingLogs && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Loading logs...</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={logsFilterType}
                  onChange={(e) => {
                    setLogsFilterType(e.target.value)
                    fetchEquipmentLogs(selectedEquipment?.equipmentId || null, 1, logsPagination.limit, e.target.value)
                  }}
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white"
                >
                  <option value="">All Types</option>
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="calibration">Calibration</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                {
                  key: 'equipmentName',
                  title: 'Equipment',
                  sortable: true,
                  className: 'min-w-[120px]'
                },
                {
                  key: 'type',
                  title: 'Type',
                  sortable: true,
                  className: 'hidden sm:table-cell'
                },
                {
                  key: 'date',
                  title: 'Date',
                  sortable: true,
                  className: 'min-w-[90px]'
                },
                {
                  key: 'performedBy',
                  title: 'Performed By',
                  sortable: true,
                  className: 'hidden md:table-cell'
                },
                {
                  key: 'cost',
                  title: 'Cost (₹)',
                  sortable: true,
                  className: 'hidden sm:table-cell'
                },
                {
                  key: 'description',
                  title: 'Description',
                  sortable: true,
                  className: 'hidden lg:table-cell'
                },
                {
                  key: 'status',
                  title: 'Status',
                  sortable: true,
                  className: 'min-w-[90px]',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs ${value === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )
                }
              ]}
              data={maintenanceLogs}
              emptyMessage="No maintenance logs available."
              responsive={true}
            />
          </div>

          {logsPagination.pages > 1 && (
            <div className="p-4 flex items-center justify-between border-t">
              <span className="text-sm text-gray-500">
                Page {logsPagination.page} of {logsPagination.pages} (Total: {logsPagination.total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={logsPagination.page === 1 || loadingLogs}
                  onClick={() => fetchEquipmentLogs(selectedEquipment?.equipmentId || null, logsPagination.page - 1, logsPagination.limit, logsFilterType)}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm bg-white"
                >
                  Previous
                </button>
                <button
                  disabled={logsPagination.page === logsPagination.pages || loadingLogs}
                  onClick={() => fetchEquipmentLogs(selectedEquipment?.equipmentId || null, logsPagination.page + 1, logsPagination.limit, logsFilterType)}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Improved responsive grid */}
        <div className="bg-white p-4 rounded-lg border card-shadow">
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button
              className="p-3 md:p-4 border rounded-lg hover:bg-blue-50 transition-colors text-center group"
              onClick={() => alert('Generate QR codes for all equipment')}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:bg-blue-200">
                <i className="fas fa-qrcode text-blue-600 text-lg md:text-xl"></i>
              </div>
              <p className="font-medium text-sm md:text-base">Bulk QR Codes</p>
            </button>

            <button
              className="p-3 md:p-4 border rounded-lg hover:bg-green-50 transition-colors text-center group"
              onClick={() => alert('Generate maintenance schedule report')}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:bg-green-200">
                <i className="fas fa-calendar-alt text-green-600 text-lg md:text-xl"></i>
              </div>
              <p className="font-medium text-sm md:text-base">Maintenance Schedule</p>
            </button>

            <button
              className="p-3 md:p-4 border rounded-lg hover:bg-yellow-50 transition-colors text-center group"
              onClick={() => alert('Generate calibration due report')}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:bg-yellow-200">
                <i className="fas fa-clipboard-check text-yellow-600 text-lg md:text-xl"></i>
              </div>
              <p className="font-medium text-sm md:text-base">Calibration Report</p>
            </button>

            <button
              className="p-3 md:p-4 border rounded-lg hover:bg-purple-50 transition-colors text-center group"
              onClick={() => alert('Export equipment inventory')}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:bg-purple-200">
                <i className="fas fa-file-export text-purple-600 text-lg md:text-xl"></i>
              </div>
              <p className="font-medium text-sm md:text-base">Export Inventory</p>
            </button>
          </div>
        </div>
      </div>

      {/* Add Equipment Modal - Responsive form */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Equipment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                placeholder="e.g., Hematology Analyzer"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Type *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={newEquipment.type}
                onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                required
              >
                <option value="">Select type</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                placeholder="e.g., Sysmex, Roche, etc."
                value={newEquipment.brand}
                onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                placeholder="e.g., XN-1000, Cobas 6000"
                value={newEquipment.model}
                onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                placeholder="Unique serial number"
                value={newEquipment.serialNumber}
                onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                placeholder="e.g., Hematology Lab, Room 101"
                value={newEquipment.location}
                onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Status
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={newEquipment.status}
                onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="calibration_due">Calibration Due</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Calibration Due Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={newEquipment.nextMaintenance}
                onChange={(e) => setNewEquipment({ ...newEquipment, nextMaintenance: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Installation Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={newEquipment.installationDate}
                onChange={(e) => setNewEquipment({ ...newEquipment, installationDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                placeholder="Optional notes"
                value={newEquipment.notes}
                onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
              />
            </div>
          </div>



          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="w-full sm:w-auto justify-center"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddEquipment}
              disabled={
                savingEquipment ||
                !newEquipment.name ||
                !newEquipment.type ||
                !newEquipment.brand ||
                !newEquipment.model ||
                !newEquipment.serialNumber ||
                !newEquipment.location
              }
              className="w-full sm:w-auto justify-center"
            >
              {savingEquipment ? 'Saving...' : 'Add Equipment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit / Update Equipment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update Equipment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.equipment_name}
                onChange={(e) => setEditEquipment({ ...editEquipment, equipment_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.category}
                onChange={(e) => setEditEquipment({ ...editEquipment, category: e.target.value })}
                placeholder="e.g., HEMATOLOGY"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.manufacturer}
                onChange={(e) => setEditEquipment({ ...editEquipment, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.model}
                onChange={(e) => setEditEquipment({ ...editEquipment, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.serial_number}
                onChange={(e) => setEditEquipment({ ...editEquipment, serial_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.location}
                onChange={(e) => setEditEquipment({ ...editEquipment, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.installation_date}
                onChange={(e) => setEditEquipment({ ...editEquipment, installation_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Calibrated At</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.last_calibrated_at}
                onChange={(e) => setEditEquipment({ ...editEquipment, last_calibrated_at: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Calibration Due</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                value={editEquipment.next_calibration_due_at}
                onChange={(e) => setEditEquipment({ ...editEquipment, next_calibration_due_at: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
              rows={2}
              value={editEquipment.notes}
              onChange={(e) => setEditEquipment({ ...editEquipment, notes: e.target.value })}
            />
          </div>



          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="w-full sm:w-auto justify-center"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateEquipment}
              disabled={updatingEquipment}
              className="w-full sm:w-auto justify-center"
            >
              {updatingEquipment ? 'Updating...' : 'Update Equipment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Maintenance Modal - Responsive */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title="Schedule Maintenance"
      >
        {selectedEquipment && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                <i className="fas fa-tools mr-2"></i>
                Schedule maintenance for: {selectedEquipment.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  value={maintenanceForm.maintenanceType}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
                >
                  <option value="preventive">Preventive Maintenance</option>
                  <option value="corrective">Corrective Maintenance</option>
                  <option value="calibration">Calibration</option>
                  <option value="repair">Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  value={maintenanceForm.scheduledDate}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Technician
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  placeholder="Enter technician name"
                  value={maintenanceForm.technician}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost (₹)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  placeholder="0"
                  value={maintenanceForm.cost}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  value={maintenanceForm.status}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  rows="3"
                  placeholder="Describe the maintenance..."
                  value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  rows="3"
                  placeholder="Additional notes..."
                  value={maintenanceForm.notes}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowMaintenanceModal(false)}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLogMaintenance}
                className="w-full sm:w-auto justify-center"
              >
                Schedule Maintenance
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Calibration Modal - Responsive */}
      <Modal
        isOpen={showCalibrationModal}
        onClose={() => setShowCalibrationModal(false)}
        title="Schedule Calibration"
      >
        {selectedEquipment && (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-yellow-800">
                <i className="fas fa-ruler mr-2"></i>
                Schedule calibration for: {selectedEquipment.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calibration Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  value={calibrationForm.calibrationType}
                  onChange={e => setCalibrationForm({ ...calibrationForm, calibrationType: e.target.value })}
                >
                  <option value="routine">Routine Calibration</option>
                  <option value="annual">Annual Calibration</option>
                  <option value="after_repair">Post-Repair Calibration</option>
                  <option value="special">Special Calibration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calibration Due Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  value={calibrationForm.scheduledDate}
                  onChange={e => setCalibrationForm({ ...calibrationForm, scheduledDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calibration Standard
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  placeholder="e.g., NIST Traceable, ISO Standard"
                  value={calibrationForm.standard}
                  onChange={e => setCalibrationForm({ ...calibrationForm, standard: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost (₹)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  placeholder="0"
                  value={calibrationForm.cost}
                  onChange={e => setCalibrationForm({ ...calibrationForm, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  value={calibrationForm.status}
                  onChange={e => setCalibrationForm({ ...calibrationForm, status: e.target.value })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  rows="3"
                  placeholder="Describe the calibration..."
                  value={calibrationForm.description}
                  onChange={e => setCalibrationForm({ ...calibrationForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm md:text-base"
                  rows="3"
                  placeholder="Additional notes..."
                  value={calibrationForm.notes}
                  onChange={e => setCalibrationForm({ ...calibrationForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCalibrationModal(false)}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLogCalibration}
                className="w-full sm:w-auto justify-center"
              >
                Schedule Calibration
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default EquipmentTracking 