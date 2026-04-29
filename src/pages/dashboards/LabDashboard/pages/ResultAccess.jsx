// src/pages/dashboards/LabDashboard/pages/ResultAccess.jsx
import React, { useState, useEffect } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Toast from '../../../../components/common/Toast/Toast'

const ResultAccess = ({ initialSearch }) => {
  const [loading, setLoading] = useState(true)
  const [accessLogs, setAccessLogs] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState(initialSearch || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showViewLogsModal, setShowViewLogsModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedLogs, setSelectedLogs] = useState([])
  const [toast, setToast] = useState(null)
  const [accessRequest, setAccessRequest] = useState({
    patientId: '',
    doctorEmail: '',
    accessType: 'view',
    expiryDate: '',
    accessCode: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setTimeout(() => {
      const patientData = [
        {
          id: 'PAT-001',
          name: 'Rajesh Kumar',
          email: 'rajesh@email.com',
          phone: '+91 9876543210',
          lastAccess: '2024-01-15 10:30:45',
          accessCount: 3,
          status: 'active',
          accessCode: 'ACC123456',
          expiryDate: '2024-12-31',
          reports: ['CBC Report', 'Lipid Profile']
        },
        {
          id: 'PAT-002',
          name: 'Priya Sharma',
          email: 'priya@email.com',
          phone: '+91 9876543211',
          lastAccess: '2024-01-15 09:15:22',
          accessCount: 5,
          status: 'active',
          accessCode: 'ACC789012',
          expiryDate: '2024-12-31',
          reports: ['Thyroid Profile', 'Liver Function']
        },
        {
          id: 'PAT-003',
          name: 'Suresh Patel',
          email: 'suresh@email.com',
          phone: '+91 9876543212',
          lastAccess: '2024-01-14 16:45:10',
          accessCount: 2,
          status: 'active',
          accessCode: 'ACC345678',
          expiryDate: '2024-12-31',
          reports: ['Kidney Function', 'Urine Culture']
        },
        {
          id: 'PAT-004',
          name: 'Anita Mehta',
          email: 'anita@email.com',
          phone: '+91 9876543213',
          lastAccess: '2024-01-14 14:20:33',
          accessCount: 4,
          status: 'expired',
          accessCode: 'ACC901234',
          expiryDate: '2024-01-01',
          reports: ['Diabetes Panel']
        }
      ]

      const doctorData = [
        { id: 'DOC-001', name: 'Dr. Sharma', email: 'dr.sharma@hospital.com', specialization: 'Cardiology', phone: '+91 9876543220' },
        { id: 'DOC-002', name: 'Dr. Mehta', email: 'dr.mehta@hospital.com', specialization: 'Neurology', phone: '+91 9876543221' },
        { id: 'DOC-003', name: 'Dr. Gupta', email: 'dr.gupta@hospital.com', specialization: 'Pediatrics', phone: '+91 9876543222' },
        { id: 'DOC-004', name: 'Dr. Rao', email: 'dr.rao@hospital.com', specialization: 'Orthopedics', phone: '+91 9876543223' }
      ]

      const logData = [
        {
          id: 'LOG-001',
          patientName: 'Rajesh Kumar',
          patientId: 'PAT-001',
          accessedBy: 'rajesh@email.com',
          accessTime: '2024-01-15 10:30:45',
          action: 'View Report',
          ipAddress: '192.168.1.100',
          device: 'Mobile - Chrome',
          reportType: 'CBC Report',
          duration: '5 minutes'
        },
        {
          id: 'LOG-002',
          patientName: 'Priya Sharma',
          patientId: 'PAT-002',
          accessedBy: 'dr.sharma@hospital.com',
          accessTime: '2024-01-15 09:15:22',
          action: 'Download Report',
          ipAddress: '203.0.113.50',
          device: 'Desktop - Firefox',
          reportType: 'Thyroid Profile',
          duration: '3 minutes'
        },
        {
          id: 'LOG-003',
          patientName: 'Suresh Patel',
          patientId: 'PAT-003',
          accessedBy: 'suresh@email.com',
          accessTime: '2024-01-14 16:45:10',
          action: 'View Report',
          ipAddress: '192.168.1.150',
          device: 'Tablet - Safari',
          reportType: 'Kidney Function',
          duration: '8 minutes'
        },
        {
          id: 'LOG-004',
          patientName: 'Rajesh Kumar',
          patientId: 'PAT-001',
          accessedBy: 'dr.mehta@hospital.com',
          accessTime: '2024-01-15 11:20:33',
          action: 'View Report',
          ipAddress: '203.0.113.75',
          device: 'Desktop - Chrome',
          reportType: 'Lipid Profile',
          duration: '4 minutes'
        },
        {
          id: 'LOG-005',
          patientName: 'Anita Mehta',
          patientId: 'PAT-004',
          accessedBy: 'anita@email.com',
          accessTime: '2024-01-10 14:20:33',
          action: 'View Report',
          ipAddress: '192.168.1.200',
          device: 'Mobile - Safari',
          reportType: 'Diabetes Panel',
          duration: '6 minutes'
        }
      ]

      setPatients(patientData)
      setDoctors(doctorData)
      setAccessLogs(logData)
      setLoading(false)
    }, 1000)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleGrantAccess = (patient) => {
    setSelectedPatient(patient)
    const newAccessCode = `ACC${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
    setAccessRequest({
      patientId: patient.id,
      doctorEmail: '',
      accessType: 'view',
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      accessCode: newAccessCode
    })
    setShowAccessModal(true)
  }

  const handleShareReport = (patient) => {
    setSelectedPatient(patient)
    setShowShareModal(true)
  }

  const handleRevokeAccess = (patient) => {
    setSelectedPatient(patient)
    setShowRevokeModal(true)
  }

  const handleViewAccessLogs = (patient) => {
    const patientLogs = accessLogs.filter(log => log.patientId === patient.id)
    setSelectedLogs(patientLogs)
    setSelectedPatient(patient)
    setShowViewLogsModal(true)
  }

  const confirmRevokeAccess = () => {
    if (selectedPatient) {
      const updatedPatients = patients.map(patient =>
        patient.id === selectedPatient.id
          ? { ...patient, status: 'revoked', accessCode: null, expiryDate: null }
          : patient
      )
      setPatients(updatedPatients)
      const newLog = {
        id: `LOG-${Date.now()}`,
        patientName: selectedPatient.name,
        patientId: selectedPatient.id,
        accessedBy: 'System Admin',
        accessTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        action: 'Access Revoked',
        ipAddress: 'System',
        device: 'Admin Panel',
        reportType: 'All Reports',
        duration: 'N/A'
      }
      setAccessLogs([newLog, ...accessLogs])
      setToast({ message: `Access revoked for ${selectedPatient.name}`, type: 'success' })
      setShowRevokeModal(false)
      setSelectedPatient(null)
    }
  }

  const handleGrantAccessSubmit = () => {
    if (!accessRequest.doctorEmail) {
      setToast({ message: 'Please enter email address', type: 'error' })
      return
    }

    const updatedPatients = patients.map(patient =>
      patient.id === accessRequest.patientId
        ? { 
            ...patient, 
            status: 'active',
            accessCode: accessRequest.accessCode,
            expiryDate: accessRequest.expiryDate,
            accessCount: patient.accessCount + 1
          }
        : patient
    )
    setPatients(updatedPatients)
    
    const newLog = {
      id: `LOG-${Date.now()}`,
      patientName: selectedPatient?.name || patients.find(p => p.id === accessRequest.patientId)?.name,
      patientId: accessRequest.patientId,
      accessedBy: accessRequest.doctorEmail,
      accessTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: `Access Granted (${accessRequest.accessType.toUpperCase()})`,
      ipAddress: 'System',
      device: 'Admin Panel',
      reportType: 'All Reports',
      duration: 'N/A'
    }
    
    setAccessLogs([newLog, ...accessLogs])
    setToast({ 
      message: `Access granted to ${accessRequest.doctorEmail}. Access Code: ${accessRequest.accessCode}`, 
      type: 'success' 
    })
    setShowAccessModal(false)
    setAccessRequest({
      patientId: '',
      doctorEmail: '',
      accessType: 'view',
      expiryDate: '',
      accessCode: ''
    })
    setSelectedPatient(null)
  }

  const handleShareSubmit = (method) => {
    if (!selectedPatient) retur
    const shareLink = generateAccessLink(selectedPatient.id, selectedPatient.accessCode)
    let message = ''
    switch(method) {
      case 'email':
        message = `Report link sent to ${selectedPatient.email}`
        break
      case 'whatsapp':
        message = `WhatsApp message sent to ${selectedPatient.phone}`
        break
      case 'sms':
        message = `SMS sent to ${selectedPatient.phone}`
        break
      case 'link':
        navigator.clipboard.writeText(shareLink)
        message = 'Link copied to clipboard!'
        break
      default:
        message = `Report shared successfully with ${selectedPatient.name}`
    }
    
    const newLog = {
      id: `LOG-${Date.now()}`,
      patientName: selectedPatient.name,
      patientId: selectedPatient.id,
      accessedBy: `Shared via ${method.toUpperCase()}`,
      accessTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'Report Shared',
      ipAddress: 'System',
      device: 'Sharing Feature',
      reportType: 'Lab Reports',
      duration: 'N/A'
    }
    setAccessLogs([newLog, ...accessLogs])
    setToast({ message, type: 'success' })
    setShowShareModal(false)
    setSelectedPatient(null)
  }

  const generateAccessLink = (patientId, accessCode) => {
    return `https://lab.levitica.com/view-results/${patientId}?code=${accessCode}`
  }

  const handleCopyAccessCode = (code) => {
    navigator.clipboard.writeText(code)
    setToast({ message: 'Access code copied to clipboard!', type: 'info' })
  }

  const handleCopyShareLink = () => {
    if (selectedPatient) {
      const link = generateAccessLink(selectedPatient.id, selectedPatient.accessCode)
      navigator.clipboard.writeText(link)
      setToast({ message: 'Share link copied to clipboard!', type: 'success' })
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-yellow-100 text-yellow-800'
      case 'revoked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const activeAccessCount = patients.filter(p => p.status === 'active').length
  const doctorAccessCount = doctors.length
  const todayAccesses = accessLogs.filter(log => 
    log.accessTime.includes(new Date().toISOString().split('T')[0])
  ).length
  const mobileAccesses = accessLogs.filter(log => 
    log.device.toLowerCase().includes('mobile')
  ).length

  if (loading) return <LoadingSpinner />
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700">Secure Result Access</h2>
            <p className="text-gray-500">Manage secure online result access for patients and referring physicians</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" icon="fas fa-shield-alt" onClick={() => setShowAccessModal(true)} > Grant Access </Button>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Access Card */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Active Access</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeAccessCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-user-shield text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Current active patients</p>
            </div>
          </div>

          {/* Doctor Access Card */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Doctor Access</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{doctorAccessCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-user-md text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Authorized doctors</p>
            </div>
          </div>

          {/* Today's Accesses Card */}
          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Today's Accesses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayAccesses}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-history text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Access logs today</p>
            </div>
          </div>

          {/* Mobile Accesses Card */}
          <div className="relative bg-gradient-to-br from-white to-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Mobile Accesses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{mobileAccesses}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-mobile-alt text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-purple-100">
              <p className="text-xs text-purple-700 font-medium">Via mobile app</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded border card-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar placeholder="Search patients by name, ID, or email..." onSearch={handleSearch} className="w-full" />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Access Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients with Access */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Patients with Result Access</h3>
            <p className="text-sm text-gray-500">Manage patient access and sharing permissions</p>
          </div>
          <DataTable columns={[
              { key: 'id', title: 'Patient ID', sortable: true, className: 'min-w-[100px] text-center' },
              { key: 'name', title: 'Patient Name', sortable: true, className: 'min-w-[150px] font-semibold' },
              { key: 'email', title: 'Email', sortable: true, className: 'min-w-[180px]' },
              { key: 'phone', title: 'Phone', sortable: true, className: 'hidden md:table-cell' },
              { key: 'lastAccess', title: 'Last Access', sortable: true, className: 'min-w-[150px] text-center' },
              { key: 'accessCount', title: 'Count', sortable: true, className: 'min-w-[80px] text-center' },
              { key: 'status', title: 'Status', sortable: true, className: 'min-w-[100px] text-center',
                render: (value) => (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(value)}`}>
                    {value.toUpperCase()}
                  </span>
                )
              },
              { key: 'accessCode', title: 'Code', className: 'hidden lg:table-cell text-center',
                render: (value) => value ? (
                  <div className="flex items-center justify-center gap-2">
                    <code className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200">{value}</code>
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleCopyAccessCode(value)
                      }}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Copy Access Code" >
                      <i className="fas fa-copy text-[10px]"></i>
                    </button>
                  </div>
                ) : <span className="text-gray-400 text-xs">—</span>
              },
              { key: 'actions', title: 'Actions', className: 'min-w-[150px] text-center',
                render: (_, row) => (
                  <div className="flex gap-2 justify-center">
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleGrantAccess(row)
                      }}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      title="Grant Access" >
                      <i className="fas fa-key text-xs"></i>
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleShareReport(row)
                      }}
                      className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                      title="Share Report" >
                      <i className="fas fa-share-alt text-xs"></i>
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleViewAccessLogs(row)
                      }}
                      className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
                      title="View Access Logs" >
                      <i className="fas fa-history text-xs"></i>
                    </button>
                    {row.status === 'active' && (
                      <button onClick={(e) => {
                          e.stopPropagation()
                          handleRevokeAccess(row)
                        }}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        title="Revoke Access" >
                        <i className="fas fa-ban text-xs"></i>
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            data={filteredPatients}
            onRowClick={(patient) => setSelectedPatient(patient)}
            emptyMessage="No patients with access found."
          />
        </div>

        {/* Access Logs */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Recent Access Logs</h3>
            <p className="text-sm text-gray-500">Latest result access and sharing activities</p>
          </div>
          <DataTable columns={[
              { key: 'patientName', title: 'Patient', sortable: true, className: 'min-w-[150px] font-semibold' },
              { key: 'accessedBy', title: 'Accessed By', sortable: true, className: 'min-w-[180px]' },
              { key: 'accessTime', title: 'Access Time', sortable: true, className: 'min-w-[150px]' },
              { key: 'action', title: 'Action', sortable: true, className: 'min-w-[120px]',
                render: (value) => (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    value === 'View Report' ? 'bg-blue-100 text-blue-800' :
                    value === 'Download Report' ? 'bg-green-100 text-green-800' :
                    value === 'Report Shared' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <i className={`fas ${
                      value === 'View Report' ? 'fa-eye' :
                      value === 'Download Report' ? 'fa-download' :
                      value === 'Report Shared' ? 'fa-share-alt' : 'fa-key'
                    } mr-1 text-xs`}></i>
                    {value}
                  </span>
                )
              },
              { key: 'reportType', title: 'Report Type', sortable: true, className: 'hidden md:table-cell min-w-[120px]' },
              { key: 'ipAddress', title: 'IP Address', sortable: true, className: 'hidden lg:table-cell font-mono text-xs' },
              { key: 'device', title: 'Device', sortable: true, className: 'hidden xl:table-cell' }
            ]}
            data={accessLogs.slice(0, 10)}
            emptyMessage="No access logs available."
          />
        </div>

        {/* Security Features */}
        <div className="bg-white p-6 rounded border card-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-shield-alt text-blue-600"></i>
            Security Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow group">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                  <i className="fas fa-shield-alt text-blue-600"></i>
                </div>
                <h4 className="font-semibold">Encrypted Links</h4>
              </div>
              <p className="text-sm text-gray-600">All shared links are encrypted using AES-256 and time-limited for maximum security</p>
            </div>
            
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow group">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                  <i className="fas fa-eye-slash text-green-600"></i>
                </div>
                <h4 className="font-semibold">Access Control</h4>
              </div>
              <p className="text-sm text-gray-600">Granular permissions for viewing, downloading, or sharing reports with expiration dates</p>
            </div>
            
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow group">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                  <i className="fas fa-history text-purple-600"></i>
                </div>
                <h4 className="font-semibold">Audit Trail</h4>
              </div>
              <p className="text-sm text-gray-600">Complete logs of all access and sharing activities for HIPAA compliance and audits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Grant Modal */}
      <Modal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)} title="Grant Access to Results" size="md" >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-2"></i>
              Grant secure access to patients or referring physicians
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"> Patient <span className="text-red-500">*</span> </label>
            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={accessRequest.patientId} onChange={(e) => setAccessRequest({...accessRequest, patientId: e.target.value})}
              required >
              <option value="">Select patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>{patient.name} ({patient.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email to Grant Access <span className="text-red-500">*</span>
            </label>
            <input type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="doctor@hospital.com or patient@email.com" value={accessRequest.doctorEmail}
              onChange={(e) => setAccessRequest({...accessRequest, doctorEmail: e.target.value})} required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"> Access Type </label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={accessRequest.accessType}
                onChange={(e) => setAccessRequest({...accessRequest, accessType: e.target.value})} >
                <option value="view">View Only</option>
                <option value="download">View & Download</option>
                <option value="full">Full Access</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input type="date" value={accessRequest.expiryDate}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setAccessRequest({...accessRequest, expiryDate: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Access Code:</strong> 
              <code className="ml-2 px-2 py-1 bg-white rounded border font-mono">{accessRequest.accessCode}</code>
              <button className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => handleCopyAccessCode(accessRequest.accessCode)} >
                <i className="fas fa-copy"></i>
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Share this code with the recipient for secure access
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAccessModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleGrantAccessSubmit}
              disabled={!accessRequest.patientId || !accessRequest.doctorEmail} >
              Grant Access
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Report Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Report" size="md">
        {selectedPatient && (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <i className="fas fa-share-alt mr-2"></i>
                Share report for: <strong>{selectedPatient.name}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Via
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleShareSubmit('email')}
                  className="p-3 border rounded-lg text-center hover:bg-blue-50 transition-all group" >
                  <i className="fas fa-envelope text-blue-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-gray-500">{selectedPatient.email}</p>
                </button>
                <button onClick={() => handleShareSubmit('whatsapp')}
                  className="p-3 border rounded-lg text-center hover:bg-green-50 transition-all group" >
                  <i className="fab fa-whatsapp text-green-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-500">{selectedPatient.phone}</p>
                </button>
                <button onClick={() => handleShareSubmit('sms')}
                  className="p-3 border rounded-lg text-center hover:bg-purple-50 transition-all group" >
                  <i className="fas fa-sms text-purple-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                  <p className="text-sm font-medium">SMS</p>
                  <p className="text-xs text-gray-500">{selectedPatient.phone}</p>
                </button>
                <button onClick={() => handleShareSubmit('link')}
                  className="p-3 border rounded-lg text-center hover:bg-gray-50 transition-all group" >
                  <i className="fas fa-link text-gray-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                  <p className="text-sm font-medium">Copy Link</p>
                  <p className="text-xs text-gray-500">Shareable URL</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Share Link Preview
              </label>
              <div className="flex gap-2">
                <input type="text"
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
                  value={generateAccessLink(selectedPatient.id, selectedPatient.accessCode)}
                  readOnly
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleCopyShareLink}>
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Access Code: <strong className="font-mono">{selectedPatient.accessCode}</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Access Confirmation Modal */}
      <Modal isOpen={showRevokeModal} onClose={() => setShowRevokeModal(false)} title="Revoke Access" size="sm" >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                You are about to revoke access for:
              </p>
              <p className="font-semibold mt-2 text-lg">{selectedPatient.name}</p>
              <p className="text-xs text-gray-600">{selectedPatient.email}</p>
            </div>
            
            <p className="text-sm text-gray-600">
              This action will immediately remove all access permissions for this patient. 
              They will no longer be able to view or download their reports.
            </p>

            <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800">
              <i className="fas fa-info-circle mr-1"></i>
              This action will be logged for audit purposes.
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmRevokeAccess}>
                <i className="fas fa-ban mr-1"></i> Yes, Revoke Access
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Access Logs Modal */}
      <Modal isOpen={showViewLogsModal} onClose={() => setShowViewLogsModal(false)} title="Access Logs" size="lg" >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                <i className="fas fa-history mr-2"></i>
                Access logs for: <strong>{selectedPatient.name}</strong> ({selectedPatient.id})
              </p>
            </div>

            {selectedLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-center">Date & Time</th>
                      <th className="px-4 py-2 text-center">Accessed By</th>
                      <th className="px-4 py-2 text-center">Action</th>
                      <th className="px-4 py-2 text-center">Report</th>
                      <th className="px-4 py-2 text-center">Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-center text-xs font-mono">{log.accessTime}</td>
                        <td className="px-4 py-2 text-center">{log.accessedBy}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            log.action === 'View Report' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'Download Report' ? 'bg-green-100 text-green-800' :
                            log.action === 'Report Shared' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-xs">{log.reportType}</td>
                        <td className="px-4 py-2 text-center text-xs">{log.device}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-inbox text-4xl mb-2"></i>
                <p>No access logs found for this patient</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewLogsModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                  setToast({ message: 'Access logs exported successfully', type: 'success' })
                }}>
                <i className="fas fa-download mr-1"></i> Export Logs
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast key={toast.message + Date.now()} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}

export default ResultAccess