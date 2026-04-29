// src/pages/dashboards/LabDashboard/pages/EquipmentTracking.jsx
import React, { useState, useEffect } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Toast from '../../../../components/common/Toast/Toast'
import { QRCodeSVG } from 'qrcode.react'

const EquipmentTracking = () => {
  const [loading, setLoading] = useState(true)
  const [equipment, setEquipment] = useState([])
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [toast, setToast] = useState(null)
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
    calibrationDue: ''
  })

  useEffect(() => {
    loadEquipmentData()
  }, [])

  const loadEquipmentData = async () => {
    setLoading(true)
    setTimeout(() => {
      const equipmentData = [
        {
          id: 'EQP-001',
          name: 'Hematology Analyzer',
          type: 'Analyzer',
          brand: 'Sysmex',
          model: 'XN-1000',
          serialNumber: 'SX-2023-001',
          location: 'Hematology Lab',
          status: 'operational',
          lastMaintenance: '2024-01-10',
          nextMaintenance: '2024-02-10',
          calibrationDue: '2024-01-25',
          qrCode: 'EQP-001',
          purchaseDate: '2023-06-15',
          warrantyUntil: '2025-06-14',
          vendor: 'Sysmex India Pvt Ltd',
          cost: 2500000
        },
        {
          id: 'EQP-002',
          name: 'Chemistry Analyzer',
          type: 'Analyzer',
          brand: 'Roche',
          model: 'Cobas 6000',
          serialNumber: 'RC-2023-002',
          location: 'Chemistry Lab',
          status: 'maintenance',
          lastMaintenance: '2024-01-05',
          nextMaintenance: '2024-02-05',
          calibrationDue: '2024-01-20',
          qrCode: 'EQP-002',
          purchaseDate: '2023-08-20',
          warrantyUntil: '2025-08-19',
          vendor: 'Roche Diagnostics',
          cost: 3200000
        },
        {
          id: 'EQP-003',
          name: 'Microscope',
          type: 'Microscopy',
          brand: 'Olympus',
          model: 'CX23',
          serialNumber: 'OL-2023-003',
          location: 'Microbiology Lab',
          status: 'operational',
          lastMaintenance: '2024-01-12',
          nextMaintenance: '2024-02-12',
          calibrationDue: '2024-01-30',
          qrCode: 'EQP-003',
          purchaseDate: '2023-05-10',
          warrantyUntil: '2025-05-09',
          vendor: 'Olympus Scientific',
          cost: 85000
        },
        {
          id: 'EQP-004',
          name: 'Centrifuge',
          type: 'Centrifuge',
          brand: 'Eppendorf',
          model: '5424 R',
          serialNumber: 'EP-2023-004',
          location: 'Sample Processing',
          status: 'calibration_due',
          lastMaintenance: '2024-01-08',
          nextMaintenance: '2024-02-08',
          calibrationDue: '2024-01-18',
          qrCode: 'EQP-004',
          purchaseDate: '2023-09-25',
          warrantyUntil: '2025-09-24',
          vendor: 'Eppendorf India',
          cost: 450000
        },
        {
          id: 'EQP-005',
          name: 'Autoclave',
          type: 'Sterilizer',
          brand: 'Tuttnauer',
          model: '3870EA',
          serialNumber: 'TT-2023-005',
          location: 'Sterilization Room',
          status: 'operational',
          lastMaintenance: '2024-01-15',
          nextMaintenance: '2024-02-15',
          calibrationDue: '2024-01-28',
          qrCode: 'EQP-005',
          purchaseDate: '2023-07-12',
          warrantyUntil: '2025-07-11',
          vendor: 'Tuttnauer India',
          cost: 680000
        }
      ]
      const maintenanceData = [
        {
          id: 'MNT-001',
          equipmentId: 'EQP-002',
          equipmentName: 'Chemistry Analyzer',
          type: 'Preventive Maintenance',
          date: '2024-01-05',
          performedBy: 'John Technician',
          cost: 15000,
          description: 'Routine maintenance and calibration',
          status: 'completed'
        },
        {
          id: 'MNT-002',
          equipmentId: 'EQP-004',
          equipmentName: 'Centrifuge',
          type: 'Calibration',
          date: '2024-01-08',
          performedBy: 'Sarah Engineer',
          cost: 5000,
          description: 'Speed calibration and balancing',
          status: 'completed'
        },
        {
          id: 'MNT-003',
          equipmentId: 'EQP-001',
          equipmentName: 'Hematology Analyzer',
          type: 'Repair',
          date: '2024-01-10',
          performedBy: 'Mike Specialist',
          cost: 25000,
          description: 'Replacement of fluidic system',
          status: 'completed'
        },
        {
          id: 'MNT-004',
          equipmentId: 'EQP-001',
          equipmentName: 'Hematology Analyzer',
          type: 'Calibration',
          date: '2023-12-15',
          performedBy: 'Quality Assurance Team',
          cost: 8000,
          description: 'Semi-annual calibration check',
          status: 'completed'
        },
        {
          id: 'MNT-005',
          equipmentId: 'EQP-001',
          equipmentName: 'Hematology Analyzer',
          type: 'Preventive Maintenance',
          date: '2023-11-05',
          performedBy: 'Sysmex Service',
          cost: 12000,
          description: 'Annual service contract visit',
          status: 'completed'
        }
      ]
      setEquipment(equipmentData)
      setMaintenanceLogs(maintenanceData)
      setLoading(false)
    }, 1000)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleAddEquipment = () => {
    const eqpId = `EQP-${(equipment.length + 1).toString().padStart(3, '0')}`
    const newEquipmentEntry = {
      ...newEquipment,
      id: eqpId,
      qrCode: eqpId,
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendor: 'New Vendor',
      cost: 0
    }
    setEquipment([...equipment, newEquipmentEntry])
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
      calibrationDue: ''
    })
    setToast({ message: `Equipment "${newEquipment.name}" added successfully!`, type: 'success' })
  }

  const handleScheduleMaintenance = (eqp) => {
    setSelectedEquipment(eqp)
    setShowMaintenanceModal(true)
  }

  const handleScheduleCalibration = (eqp) => {
    setSelectedEquipment(eqp)
    setShowCalibrationModal(true)
  }

  const handleGenerateQR = (eqp) => {
    setSelectedEquipment(eqp)
    setShowQRModal(true)
  }

  const handleLogMaintenance = () => {
    const maintenanceId = `MNT-${Date.now().toString().slice(-6)}`
    const newMaintenance = {
      id: maintenanceId,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      type: 'Preventive Maintenance',
      date: new Date().toISOString().split('T')[0],
      performedBy: 'Current User',
      cost: 0,
      description: 'Routine maintenance as scheduled',
      status: 'scheduled'
    }
    setMaintenanceLogs([newMaintenance, ...maintenanceLogs])
    setEquipment(equipment.map(eq => 
      eq.id === selectedEquipment.id 
        ? { 
            ...eq, 
            lastMaintenance: new Date().toISOString().split('T')[0],
            nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'maintenance'
          }
        : eq
    ))
    setShowMaintenanceModal(false)
    setToast({ message: `Maintenance scheduled for ${selectedEquipment.name}`, type: 'success' })
  }

  const handleLogCalibration = () => {
    setEquipment(equipment.map(eq => 
      eq.id === selectedEquipment.id 
        ? { 
            ...eq, 
            calibrationDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'operational'
          }
        : eq
    ))
    setShowCalibrationModal(false)
    setToast({ message: `Calibration logged for ${selectedEquipment.name}`, type: 'success' })
  }

  const handleStatusUpdate = (equipmentId, newStatus) => {
    setEquipment(equipment.map(eq => 
      eq.id === equipmentId ? { ...eq, status: newStatus } : eq
    ))
    const eqp = equipment.find(e => e.id === equipmentId)
    setToast({ message: `${eqp?.name} status updated to: ${newStatus}`, type: 'info' })
  }

  const handlePrintQR = () => {
    if (!selectedEquipment) return
    const printWindow = window.open('', '_blank', 'width=600,height=600')
    if (!printWindow) {
      setToast({ message: 'Please allow pop-ups to print QR code', type: 'error' })
      return
    }
    const qrData = {
      id: selectedEquipment.id,
      name: selectedEquipment.name,
      serialNumber: selectedEquipment.serialNumber,
      location: selectedEquipment.location,
      status: selectedEquipment.status
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${selectedEquipment.id}</title>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              padding: 30px;
              border: 2px solid #1a56db;
              border-radius: 12px;
              background: white;
              max-width: 400px;
            }
            .qr-code {
              margin: 20px auto;
              padding: 20px;
              background: white;
            }
            .equipment-info {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .equipment-info p {
              margin: 8px 0;
              font-size: 12px;
            }
            .header {
              color: #1a56db;
              margin-bottom: 15px;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="header">
              <h2>LEVITICA HEALTHCARE</h2>
              <p>Equipment QR Code</p>
            </div>
            <div class="qr-code" id="qr-code">
              <!-- QR will be rendered via SVG -->
              <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="white"/>
                <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR Code: ${selectedEquipment.qrCode}</text>
              </svg>
            </div>
            <div class="equipment-info">
              <p><strong>Equipment ID:</strong> ${selectedEquipment.id}</p>
              <p><strong>Name:</strong> ${selectedEquipment.name}</p>
              <p><strong>Serial Number:</strong> ${selectedEquipment.serialNumber}</p>
              <p><strong>Location:</strong> ${selectedEquipment.location}</p>
              <p><strong>Status:</strong> ${selectedEquipment.status}</p>
            </div>
            <p style="margin-top: 20px; font-size: 10px; color: #6b7280;">
              Scan this QR code to view equipment details
            </p>
          </div>
        </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.onafterprint = () => printWindow.close()
  }

  const handleDownloadQR = () => {
    setToast({ message: `QR Code for ${selectedEquipment?.name} is ready for download`, type: 'success' })
  }

  const filteredEquipment = equipment.filter(eqp => {
    const matchesSearch = eqp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eqp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eqp.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || eqp.status === statusFilter
    const matchesType = !typeFilter || eqp.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
          <div className="w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700 flex items-center gap-2">
              <i className="fas fa-microscope text-blue-600"></i>
              Equipment Tracking
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">Track laboratory equipment, maintenance, and calibration schedules</p>
          </div>
          <div className="w-full md:w-auto mt-3 md:mt-0">
            <Button variant="primary" icon="fas fa-plus" onClick={() => setShowAddModal(true)} className="w-full md:w-auto justify-center">
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Equipment Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
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

          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
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

          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
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

          <div className="relative bg-gradient-to-br from-white to-red-50 p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
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

        {/* Search and Filters */}
        <div className="bg-white p-3 md:p-4 rounded-lg border card-shadow">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <div className="flex-1">
              <SearchBar placeholder="Search equipment by name, ID, or serial number..." onSearch={handleSearch} className="w-full"/>
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2 border rounded-lg text-sm md:text-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="calibration_due">Calibration Due</option>
                <option value="out_of_service">Out of Service</option>
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm md:text-base" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Equipment Table & Selection Logic */}
        {!selectedEquipment ? (
          <>
            {/* Equipment Table */}
            <div className="bg-white rounded-lg border card-shadow overflow-hidden">
              <div className="p-3 md:p-4 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Equipment Inventory</h3>
                  <p className="text-sm text-gray-500">Manage and track all laboratory equipment</p>
                </div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {filteredEquipment.length} Items
                </div>
              </div>
              <div className="overflow-x-auto">
                <DataTable
                  columns={[
                    { key: 'id', title: 'ID', sortable: true, className: 'w-20' },
                    { key: 'name', title: 'Equipment Name', sortable: true, className: 'min-w-[180px]' },
                    { key: 'type', title: 'Category', sortable: true, className: 'hidden sm:table-cell' },
                    { key: 'brand', title: 'Manufacturer', sortable: true, className: 'hidden md:table-cell' },
                    { key: 'location', title: 'Lab Location', sortable: true, className: 'hidden md:table-cell' },
                    { key: 'status', title: 'Current Status', sortable: true, className: 'w-32',
                      render: (value) => (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${equipmentStatus[value]?.color || 'bg-gray-100'}`}>
                          {equipmentStatus[value]?.label || value}
                        </span>
                      )
                    },
                    { key: 'actions', title: 'Quick Actions', className: 'w-40',
                      render: (_, row) => (
                        <div className="flex gap-1.5 flex-nowrap">
                          <button onClick={(e) => { e.stopPropagation(); handleGenerateQR(row); }}
                            className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                            title="View QR Code">
                            <i className="fas fa-qrcode"></i>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleScheduleMaintenance(row); }}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            title="Schedule Maintenance">
                            <i className="fas fa-tools"></i>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleScheduleCalibration(row); }}
                            className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
                            title="Calibration">
                            <i className="fas fa-ruler"></i>
                          </button>
                        </div>
                      )
                    }
                  ]}
                  data={filteredEquipment} onRowClick={(eqp) => setSelectedEquipment(eqp)}
                  emptyMessage="No equipment found matching your filters."/>
              </div>
            </div>

            {/* Global Maintenance Logs (Full List) */}
            <div className="bg-white rounded-lg border card-shadow overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Global Maintenance Logs</h3>
                <p className="text-sm text-gray-500">Recent activities across all laboratory equipment</p>
              </div>
              <div className="overflow-x-auto">
                <DataTable columns={[
                    { key: 'equipmentName', title: 'Equipment', sortable: true, className: 'min-w-[150px]' },
                    { key: 'type', title: 'Activity Type', sortable: true, className: 'hidden sm:table-cell' },
                    { key: 'date', title: 'Log Date', sortable: true, className: 'w-32' },
                    { key: 'performedBy', title: 'Staff', sortable: true, className: 'hidden md:table-cell' },
                    { key: 'status', title: 'Completion', sortable: true, className: 'w-32',
                      render: (value) => (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          value === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </span>
                      )
                    }
                  ]}
                  data={maintenanceLogs} emptyMessage="No maintenance activity recorded yet."/>
              </div>
            </div>
          </>
        ) : (
          /* Equipment Focused Detail View */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up">

            {/* Left: Equipment Specifics */}
            <div className="xl:col-span-1 space-y-6">
              <button onClick={() => setSelectedEquipment(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors mb-2" >
                <i className="fas fa-chevron-left mr-2"></i> Back to All Equipment
              </button>
              <div className="bg-white p-6 rounded-2xl border card-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16 opacity-10"></div>
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest">{selectedEquipment.type}</span>
                      <h3 className="text-2xl font-bold text-gray-900 mt-2">{selectedEquipment.name}</h3>
                      <p className="text-gray-500 font-mono text-sm">{selectedEquipment.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${equipmentStatus[selectedEquipment.status]?.color}`}>
                        {equipmentStatus[selectedEquipment.status]?.label}
                      </span>
                      <button onClick={() => handleGenerateQR(selectedEquipment)} className="text-purple-600 bg-purple-50 p-2 rounded-lg hover:bg-purple-100 transition-colors">
                        <i className="fas fa-qrcode text-lg"></i>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-6">
                    <div className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <i className="fas fa-industry mr-2"></i> Manufacturer Info
                      </div>
                      <p className="text-gray-800 font-semibold">{selectedEquipment.brand} {selectedEquipment.model}</p>
                      <p className="text-gray-500 text-xs mt-1">SN: {selectedEquipment.serialNumber}</p>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <i className="fas fa-map-marker-alt mr-2"></i> Deployment Location
                      </div>
                      <p className="text-gray-800 font-semibold">{selectedEquipment.location}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                        <p className="text-orange-600 text-[10px] font-black uppercase tracking-tighter mb-1">Calibration Due</p>
                        <p className="text-orange-800 font-bold text-sm">{selectedEquipment.calibrationDue}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-tighter mb-1">Warranty Until</p>
                        <p className="text-emerald-800 font-bold text-sm">{selectedEquipment.warrantyUntil || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 border border-blue-50 rounded-xl bg-blue-50/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Service Life Progress</span>
                        <span className="text-xs font-bold text-blue-700">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full w-[65%]"></div>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-2 italic">*Based on manufacturer's expected lifespan of 10 years.</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-800 mb-4">Unit Health & Forecast</p>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                            <i className="fas fa-signal text-xs"></i>
                          </div>
                          <span className="text-xs font-semibold text-blue-900">Operational Uptime</span>
                        </div>
                        <span className="text-sm font-black text-blue-900">99.4%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                            <i className="fas fa-brain text-xs"></i>
                          </div>
                          <span className="text-xs font-semibold text-indigo-900">Predictive Service</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-700 px-2 py-0.5 bg-white rounded-md border border-indigo-100 italic">Within 14 Days</span>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-gray-800 mb-4">Maintenance Actions</p>
                    <div className="flex flex-col gap-3">
                      <Button variant="primary" icon="fas fa-tools" onClick={() => handleScheduleMaintenance(selectedEquipment)} className="w-full text-sm py-2.5">
                        Schedule Repair / PM
                      </Button>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Report - ${selectedEquipment.name}</title>
                                <style>
                                  body { font-family: sans-serif; padding: 40px; color: #333; }
                                  .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                                  .title { font-size: 24px; font-weight: bold; }
                                  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                                  .label { color: #666; font-size: 12px; text-transform: uppercase; }
                                  .value { font-weight: bold; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                                  th, td { border: 1px solid #eee; padding: 12px; text-align: center; }
                                  th { background: #f8fafc; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <div class="title">${selectedEquipment.name} - Lifecycle Report</div>
                                  <p>Unit ID: ${selectedEquipment.id} | Generated: ${new Date().toLocaleString()}</p>
                                </div>
                                <div class="grid">
                                  <div><span class="label">Serial Number:</span> <span class="value">${selectedEquipment.serialNumber}</span></div>
                                  <div><span class="label">Manufacturer:</span> <span class="value">${selectedEquipment.brand} ${selectedEquipment.model}</span></div>
                                  <div><span class="label">Location:</span> <span class="value">${selectedEquipment.location}</span></div>
                                  <div><span class="label">Warranty:</span> <span class="value">${selectedEquipment.warrantyUntil}</span></div>
                                </div>
                                <h3>Service History</h3>
                                <table>
                                  <thead><tr><th>Date</th><th>Type</th><th>Technician</th><th>Cost</th><th>Status</th></tr></thead>
                                  <tbody>
                                    ${maintenanceLogs.filter(l => l.equipmentId === selectedEquipment.id).map(l => `
                                      <tr>
                                        <td>${l.date}</td>
                                        <td>${l.type}</td>
                                        <td>${l.performedBy}</td>
                                        <td>₹${l.cost.toLocaleString()}</td>
                                        <td>${l.status}</td>
                                      </tr>
                                    `).join('')}
                                  </tbody>
                                </table>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }}
                        className="w-full py-2.5 px-4 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center"
                      >
                        <i className="fas fa-print mr-2 opacity-50"></i> Print Lifecycle Report
                      </button>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(selectedEquipment.id, 'operational')} className="text-[10px] uppercase font-black tracking-widest">
                          Set Online
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(selectedEquipment.id, 'out_of_service')} className="text-[10px] uppercase font-black tracking-widest text-red-600 border-red-100 hover:bg-red-50">
                          Decommission
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: History Logs specific to this equipment */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border card-shadow overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Maintenance & Service History</h3>
                    <p className="text-sm text-gray-500">Historical records specifically for {selectedEquipment.name}</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl border flex items-center justify-center text-blue-600 shadow-sm">
                    <i className="fas fa-history"></i>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <DataTable columns={[
                      { key: 'date', title: 'Date', className: 'font-semibold w-32' },
                      { key: 'type', title: 'Activity Type', className: 'min-w-[150px]' },
                      { key: 'performedBy', title: 'Service Engineer', className: 'hidden md:table-cell',
                        render: (val) => (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200">
                              {val.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs text-gray-700">{val}</span>
                          </div>
                        )
                      },
                      { key: 'cost', title: 'Cost (₹)', render: (v) => `₹${v.toLocaleString()}`, className: 'hidden sm:table-cell' },
                      { key: 'status', title: 'Service Outcome',
                        render: (value) => (
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${value === 'completed' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              value === 'completed' ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {value}
                            </span>
                          </div>
                        )
                      }
                    ]}
                    data={maintenanceLogs.filter(log => log.equipmentId === selectedEquipment.id)}
                    emptyMessage="No specific maintenance records found for this unit."
                  />
                </div>
                <div className="p-6 bg-blue-50/30 border-t">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <i className="fas fa-info-circle"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Preventive Maintenance (PM)</p>
                      <p className="text-xs text-blue-700 leading-relaxed mt-1">
                        Ensuring your {selectedEquipment.name} receives regular servicing extends its life by up to 40%. 
                        The next scheduled maintenance protocol check is due on <strong>{selectedEquipment.nextMaintenance}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions / Mission Control */}
        <div className="bg-white p-6 rounded-2xl border card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Mission Control</h3>
              <p className="text-sm text-gray-500">Fast access to critical system utilities</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <i className="fas fa-bolt"></i>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="group relative p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl text-left hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => {
                if (equipment.length > 0) {
                  handleGenerateQR(equipment[0])
                  setToast({ message: 'Master QR registry opened', type: 'info' })
                }
                else {
                  setToast({ message: 'No equipment available', type: 'warning' })
                }
              }}>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors shadow-sm">
                <i className="fas fa-qrcode text-xl"></i>
              </div>
              <p className="font-bold text-gray-800">Master QR Registry</p>
              <p className="text-xs text-gray-500 mt-1">Generate or scan digital tags for all units</p>
            </button>
            <button className="group relative p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl text-left hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => setToast({ message: 'Generating real-time maintenance schedule...', type: 'success' })}>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors shadow-sm">
                <i className="fas fa-calendar-check text-xl"></i>
              </div>
              <p className="font-bold text-gray-800">Service Scheduler</p>
              <p className="text-xs text-gray-500 mt-1">Auto-optimize maintenance time slots</p>
            </button>
            <button className="group relative p-4 bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-2xl text-left hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => setToast({ message: 'Calibration compliance check initiated', type: 'success' })}>
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors shadow-sm">
                <i className="fas fa-microscope text-xl"></i>
              </div>
              <p className="font-bold text-gray-800">Calibration Audit</p>
              <p className="text-xs text-gray-500 mt-1">Review NIST compliance across lab</p>
            </button>
            <button className="group relative p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl text-left hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => setToast({ message: 'Cross-platform inventory export successful', type: 'success' })}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors shadow-sm">
                <i className="fas fa-file-invoice text-xl"></i>
              </div>
              <p className="font-bold text-gray-800">Asset Export</p>
              <p className="text-xs text-gray-500 mt-1">Download CSV/XLS for financial audit</p>
            </button>
          </div>
        </div>

        {/* QR Code Modal - Now with actual QR code display */}
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Equipment QR Code" size="md">
          {selectedEquipment && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
                <div className="bg-white p-4 rounded-lg shadow-md inline-block">
                  {/* Actual QR Code rendered using qrcode.react */}
                  <QRCodeSVG value={JSON.stringify({
                      id: selectedEquipment.id,
                      name: selectedEquipment.name,
                      serialNumber: selectedEquipment.serialNumber,
                      location: selectedEquipment.location,
                      status: selectedEquipment.status,
                      brand: selectedEquipment.brand,
                      model: selectedEquipment.model,
                      lastMaintenance: selectedEquipment.lastMaintenance,
                      calibrationDue: selectedEquipment.calibrationDue
                    })}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-bold text-lg text-gray-800">{selectedEquipment.name}</h3>
                <div className="grid grid-cols-2 gap-3 mt-3 text-left">
                  <div>
                    <p className="text-xs text-gray-500">Equipment ID</p>
                    <p className="font-mono font-semibold text-sm">{selectedEquipment.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Serial Number</p>
                    <p className="font-mono font-semibold text-sm">{selectedEquipment.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Brand / Model</p>
                    <p className="text-sm">{selectedEquipment.brand} {selectedEquipment.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm">{selectedEquipment.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${equipmentStatus[selectedEquipment.status]?.color}`}>
                      {equipmentStatus[selectedEquipment.status]?.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Calibration Due</p>
                    <p className="text-sm font-semibold text-orange-600">{selectedEquipment.calibrationDue}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" icon="fas fa-print" onClick={handlePrintQR} className="flex-1">
                  Print QR Code
                </Button>
                <Button variant="primary" icon="fas fa-download" onClick={handleDownloadQR} className="flex-1">
                  Download QR
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Scan this QR code to access equipment information and maintenance history
              </p>
            </div>
          )}
        </Modal>

        {/* Add Equipment Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Equipment" size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                <i className="fas fa-info-circle mr-2"></i>
                Fill in the equipment details below. QR code will be auto-generated.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Name *
                </label>
                <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="e.g., Hematology Analyzer" value={newEquipment.name}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Type *
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newEquipment.type} onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                  required >
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
                <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="e.g., Sysmex, Roche, etc." value={newEquipment.brand}
                  onChange={(e) => setNewEquipment({...newEquipment, brand: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="e.g., XN-1000, Cobas 6000" value={newEquipment.model}
                  onChange={(e) => setNewEquipment({...newEquipment, model: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number *
                </label>
                <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="Unique serial number" value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({...newEquipment, serialNumber: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text" placeholder="e.g., Hematology Lab, Room 101" value={newEquipment.location}
                  onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Status
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newEquipment.status} onChange={(e) => setNewEquipment({...newEquipment, status: e.target.value})} >
                  <option value="operational">Operational</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="calibration_due">Calibration Due</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Maintenance Date
                </label>
                <input type="date" value={newEquipment.nextMaintenance}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setNewEquipment({...newEquipment, nextMaintenance: e.target.value})}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto justify-center">
                Cancel
              </Button>
              <Button variant="primary" className="w-full sm:w-auto justify-center" onClick={handleAddEquipment}
                disabled={!newEquipment.name || !newEquipment.type || !newEquipment.brand || !newEquipment.model || !newEquipment.serialNumber || !newEquipment.location} >
                Add Equipment
              </Button>
            </div>
          </div>
        </Modal>
          
        {/* Schedule Maintenance Modal */}
        <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Schedule Maintenance" size="md">
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <i className="fas fa-tools mr-2"></i>
                  Schedule maintenance for: <strong>{selectedEquipment.name}</strong>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Type
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="preventive">Preventive Maintenance</option>
                    <option value="corrective">Corrective Maintenance</option>
                    <option value="calibration">Calibration</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg" defaultValue={new Date().toISOString().split('T')[0]}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Enter technician name"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows="3" placeholder="Describe the maintenance required..."/>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowMaintenanceModal(false)} className="w-full sm:w-auto justify-center">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleLogMaintenance} className="w-full sm:w-auto justify-center">
                  Schedule Maintenance
                </Button>
              </div>
            </div>
          )}
        </Modal>
        {/* Schedule Calibration Modal */}
        <Modal isOpen={showCalibrationModal} onClose={() => setShowCalibrationModal(false)} title="Schedule Calibration" size="md">
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <i className="fas fa-ruler mr-2"></i>
                  Schedule calibration for: <strong>{selectedEquipment.name}</strong>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calibration Type
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="routine">Routine Calibration</option>
                    <option value="annual">Annual Calibration</option>
                    <option value="after_repair">Post-Repair Calibration</option>
                    <option value="special">Special Calibration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg" defaultValue={selectedEquipment.calibrationDue}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Standard</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., NIST Traceable, ISO Standard"/>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCalibrationModal(false)} className="w-full sm:w-auto justify-center">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleLogCalibration} className="w-full sm:w-auto justify-center">
                  Schedule Calibration
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Toast Notifications */}
        {toast && (
          <Toast key={toast.message + Date.now()} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </>
  )
}

export default EquipmentTracking