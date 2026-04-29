// src/pages/dashboards/LabDashboard/pages/CriticalResults.jsx
import React, { useState, useEffect } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Toast from '../../../../components/common/Toast/Toast'

const CriticalResults = () => {
  const [loading, setLoading] = useState(true)
  const [criticalResults, setCriticalResults] = useState([])
  const [filteredResults, setFilteredResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ alertLevel: 'all', status: 'all', department: 'all' })
  const [stats, setStats] = useState({ pending: 0, notified: 0, total: 0 })

  // Modal States
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Notification Form State
  const [notifyForm, setNotifyForm] = useState({ 
    contactPerson: '', 
    method: 'Phone Call', 
    notes: '', 
    timeNotified: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
  })

  useEffect(() => {
    // Simulate API fetch with more clinical fields
    const loadData = () => {
      setLoading(true)
      setTimeout(() => {
        const data = [
          { 
            id: 'TEST-2024-012', 
            patient: 'Ravi Kumar', 
            patientId: 'P-101', 
            test: 'Creatinine', 
            value: '4.2 mg/dL', 
            alert: 'Critical High', 
            time: '09:45 AM', 
            notified: 'Yes', 
            physician: 'Dr. Sharma', 
            department: 'Nephrology', 
            phone: '+91 98765 43210',
            referenceRange: '0.7 - 1.3 mg/dL',
            specimen: 'Serum',
            collectedAt: '08:30 AM',
            previousResult: '1.8 mg/dL (2024-01-10)',
            verifiedBy: 'Dr. Anita (Pathologist)'
          },
          { 
            id: 'TEST-2024-013', 
            patient: 'Sunita Rao', 
            patientId: 'P-105', 
            test: 'Potassium', 
            value: '6.5 mEq/L', 
            alert: 'Critical High', 
            time: '10:15 AM', 
            notified: 'Pending', 
            physician: 'Dr. Verma', 
            department: 'Cardiology', 
            phone: '+91 98765 43211',
            referenceRange: '3.5 - 5.0 mEq/L',
            specimen: 'Plasma',
            collectedAt: '09:15 AM',
            previousResult: '4.2 mEq/L (2024-01-12)',
            verifiedBy: 'Dr. Anita (Pathologist)'
          },
          { 
            id: 'TEST-2024-014', 
            patient: 'Mohan Singh', 
            patientId: 'P-108', 
            test: 'Glucose', 
            value: '40 mg/dL', 
            alert: 'Critical Low', 
            time: '10:30 AM', 
            notified: 'Yes', 
            physician: 'Dr. Gupta', 
            department: 'Endocrinology', 
            phone: '+91 98765 43212',
            referenceRange: '70 - 100 mg/dL',
            specimen: 'Fluoride Plasma',
            collectedAt: '09:45 AM',
            previousResult: '85 mg/dL (2024-01-05)',
            verifiedBy: 'Dr. Anita (Pathologist)'
          },
          { 
            id: 'TEST-2024-020', 
            patient: 'Anjali Devi', 
            patientId: 'P-112', 
            test: 'Hemoglobin', 
            value: '6.2 g/dL', 
            alert: 'Critical Low', 
            time: '11:15 AM', 
            notified: 'Pending', 
            physician: 'Dr. Reddy', 
            department: 'Hematology', 
            phone: '+91 98765 43213',
            referenceRange: '12.0 - 15.5 g/dL',
            specimen: 'Whole Blood (EDTA)',
            collectedAt: '10:00 AM',
            previousResult: '11.5 g/dL (2023-12-20)',
            verifiedBy: 'Dr. Anita (Pathologist)'
          },
          { 
            id: 'TEST-2024-021', 
            patient: 'Vijay Kumar', 
            patientId: 'P-115', 
            test: 'Troponin I', 
            value: '1.5 ng/mL', 
            alert: 'Critical High', 
            time: '12:00 PM', 
            notified: 'Yes', 
            physician: 'Dr. Khan', 
            department: 'Emergency', 
            phone: '+91 98765 43214',
            referenceRange: '< 0.04 ng/mL',
            specimen: 'Serum',
            collectedAt: '11:15 AM',
            previousResult: 'N/A',
            verifiedBy: 'Dr. Anita (Pathologist)'
          },
          { 
            id: 'TEST-2024-025', 
            patient: 'Sanjay Dutt', 
            patientId: 'P-120', 
            test: 'WBC Count', 
            value: '25,000 /µL', 
            alert: 'Critical High', 
            time: '01:30 PM', 
            notified: 'Pending', 
            physician: 'Dr. Joshi', 
            department: 'Pathology', 
            phone: '+91 98765 43215',
            referenceRange: '4,500 - 11,000 /µL',
            specimen: 'Whole Blood (EDTA)',
            collectedAt: '12:45 PM',
            previousResult: '8,500 /µL (2024-01-08)',
            verifiedBy: 'Dr. Anita (Pathologist)'
          },
        ]
        setCriticalResults(data)
        setFilteredResults(data)
        updateStats(data)
        setLoading(false)
      }, 800)
    }
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filters, criticalResults])

  const updateStats = (data) => {
    setStats({
      pending: data.filter(r => r.notified === 'Pending').length,
      notified: data.filter(r => r.notified === 'Yes').length,
      total: data.length
    })
  }

  const applyFilters = () => {
    let result = criticalResults.filter(item => {
      const matchesSearch = 
        item.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.test.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAlert = filters.alertLevel === 'all' || item.alert === filters.alertLevel
      const matchesStatus = filters.status === 'all' || item.notified === filters.status
      const matchesDept = filters.department === 'all' || item.department === filters.department
      return matchesSearch && matchesAlert && matchesStatus && matchesDept
    })
    setFilteredResults(result)
  }

  const handleNotifyInitiate = (result) => {
    setSelectedResult(result)
    setNotifyForm({
      ...notifyForm,
      contactPerson: result.physician,
      timeNotified: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    setShowNotifyModal(true)
  }

  const handleNotifySubmit = (e) => {
    e.preventDefault()
    const updated = criticalResults.map(r => 
      r.id === selectedResult.id ? { ...r, notified: 'Yes', notificationDetails: notifyForm } : r
    )
    setCriticalResults(updated)
    updateStats(updated)
    setShowNotifyModal(false)
    setToast({
      message: `Notification logged for ${selectedResult.patient}'s critical result.`,
      type: 'success'
    })
  }

  const handleRowClick = (result) => {
    setSelectedResult(result)
    setShowDetailsModal(true)
  }

  const handleShare = (result) => {
    setSelectedResult(result)
    setShowShareModal(true)
  }

  const handlePrint = (result) => {
    setToast({
      message: `Preparing report for ${result.patient}...`,
      type: 'info'
    })
    setTimeout(() => {
      window.print()
    }, 1000)
  }

  const handleShareSubmit = (method) => {
    setToast({
      message: `Result shared with ${selectedResult.patient} via ${method}.`,
      type: 'success'
    })
    setShowShareModal(false)
  }

  const handleReferToAccess = (result) => {
    const event = new CustomEvent('dashboard-navigation', {
      detail: { page: 'result-access', searchTerm: result.patientId }
    });
    window.dispatchEvent(event);
    setToast({ message: `Navigating to Access Logs for ${result.patient}...`, type: 'info' });
  };
  const columns = [
    { key: 'id', title: 'Test ID', sortable: true,className: 'font-mono text-xs' },
    { key: 'patient', title: 'Patient', sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{value}</span>
          <span className="text-xs text-gray-500">{row.patientId}</span>
        </div>
      )
    },
    { key: 'test', title: 'Test Name', sortable: true },
    { key: 'value', title: 'Value', sortable: true,
      render: (value) => (
        <span className="font-bold text-red-600">{value}</span>
      )
    },
    { key: 'alert', title: 'Alert Level', sortable: true,
      render: (value) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          value === 'Critical High' 
            ? 'bg-red-100 text-red-700 border-red-200' 
            : 'bg-orange-100 text-orange-700 border-orange-200'
        }`}>
          {value.toUpperCase()}
        </span>
      )
    },
    { key: 'physician', title: 'Physician', sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{value}</span>
          <span className="text-[10px] text-gray-500">{row.department}</span>
        </div>
      )
    },
    { key: 'notified', title: 'Status', sortable: true,
      render: (value) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          value === 'Yes' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          {value === 'Yes' ? 'NOTIFIED' : 'PENDING'}
        </span>
      )
    },
    { key: 'actions', title: 'Actions',className: 'text-center',
      render: (_, row) => (
        <div className="flex gap-2 justify-center">
          <button onClick={(e) => { e.stopPropagation(); handleRowClick(row); }} 
            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            title="View Details" >
            <i className="fas fa-eye text-xs"></i>
          </button>
          {row.notified === 'Pending' ? (
            <button onClick={(e) => { e.stopPropagation(); handleNotifyInitiate(row); }}
              className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
              title="Notify Now">
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); handleReferToAccess(row); }}
              className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
              title="Access Logs">
              <i className="fas fa-history text-xs"></i>
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); handleShare(row); }}
            className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
            title="Share">
            <i className="fas fa-share-alt text-xs"></i>
          </button>

          <button onClick={(e) => { e.stopPropagation(); handlePrint(row); }}
            className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
            title="Print">
            <i className="fas fa-print text-xs"></i>
          </button>
        </div>
      )
    }
  ]

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3 shadow-inner">
              <i className="fas fa-heartbeat text-red-600"></i>
            </div>
            Critical Results Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time monitoring of life-threatening laboratory alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon="fas fa-print" onClick={() => window.print()}>
            Print Log
          </Button>
          <Button variant="primary" icon="fas fa-file-export">
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <i className="fas fa-clock text-8xl text-red-600"></i>
          </div>
          <div className="relative">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Awaiting Notification</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-red-600">{stats.pending}</h3>
              <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">URGENT</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <i className="fas fa-check-circle text-8xl text-green-600"></i>
          </div>
          <div className="relative">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Successfully Logged</p>
            <h3 className="text-4xl font-bold text-green-600">{stats.notified}</h3>
            <div className="mt-4 flex items-center text-[10px] text-green-600">
              <i className="fas fa-shield-alt mr-1"></i> Compliance Score: {Math.round((stats.notified / stats.total) * 100) || 0}%
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <i className="fas fa-chart-line text-8xl text-blue-600"></i>
          </div>
          <div className="relative">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Alerts (24h)</p>
            <h3 className="text-4xl font-bold text-gray-800">{stats.total}</h3>
            <p className="mt-4 text-[10px] text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 w-full lg:w-auto">
          <SearchBar placeholder="Search by Patient, ID or Test..." onSearch={setSearchTerm} className="w-full"/>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
            value={filters.alertLevel} onChange={(e) => setFilters({...filters, alertLevel: e.target.value})}>
            <option value="all">All Levels</option>
            <option value="Critical High">Critical High</option>
            <option value="Critical Low">Critical Low</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
            value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Yes">Notified</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
            value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} >
            <option value="all">All Departments</option>
            <option value="Nephrology">Nephrology</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Hematology">Hematology</option>
            <option value="Emergency">Emergency</option>
            <option value="Pathology">Pathology</option>
          </select>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filteredResults} onRowClick={handleRowClick}
          emptyMessage="No critical alerts matching your criteria."
        />
      </div>

      {/* Compliance Advisory */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-xl border border-white/30">
            <i className="fas fa-shield-check text-2xl text-white"></i>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold mb-1">NABL & Hospital Compliance Standards</h4>
            <p className="text-blue-100 text-sm leading-relaxed opacity-90">
              Mandatory: All critical results must be communicated to the treating physician within <strong>30 minutes</strong>. 
              Documentation must include the name of the recipient, time of call, and the person reporting.
            </p>
          </div>
          <button className="px-6 py-2.5 bg-white text-blue-700 rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95">
            View Protocol Policy
          </button>
        </div>
      </div>

      {/* Notification Modal */}
      <Modal isOpen={showNotifyModal} onClose={() => setShowNotifyModal(false)} title="Log Physician Notification" size="md">
        <form onSubmit={handleNotifySubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-4 items-start">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <i className="fas fa-bell text-red-600"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Critical Alert For</p>
              <h5 className="font-bold text-gray-900">{selectedResult?.patient} ({selectedResult?.patientId})</h5>
              <p className="text-xs text-red-700 font-medium">{selectedResult?.test}: {selectedResult?.value}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contacted Person</label>
              <input type="text" className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
                value={notifyForm.contactPerson} onChange={(e) => setNotifyForm({...notifyForm, contactPerson: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notification Method</label>
              <select className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
                value={notifyForm.method} onChange={(e) => setNotifyForm({...notifyForm, method: e.target.value})} >
                <option>Phone Call</option>
                <option>Hospital App</option>
                <option>SMS Alert</option>
                <option>Direct Paging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Time of Notification</label>
            <input type="time" className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition"
              value={notifyForm.timeNotified} onChange={(e) => setNotifyForm({...notifyForm, timeNotified: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Clinical Notes / Comments</label>
            <textarea rows="3" className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
              placeholder="Record any response or additional instructions from the physician..."
              value={notifyForm.notes} onChange={(e) => setNotifyForm({...notifyForm, notes: e.target.value})} >
            </textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Notification</Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Critical Alert Details" size="lg">
        {selectedResult && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-400 shadow-inner">
                  {selectedResult.patient.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedResult.patient}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{selectedResult.patientId}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{selectedResult.phone}</span>
                  </div>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                selectedResult.notified === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
              }`}>
                {selectedResult.notified === 'Yes' ? 'NOTIFIED' : 'PENDING NOTIFICATION'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Test Details */}
              <div className="space-y-4">
                <h5 className="font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-vial text-blue-500"></i> Test Information
                </h5>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Test Name</p>
                    <p className="font-semibold text-gray-800">{selectedResult.test}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Specimen</p>
                    <p className="font-semibold text-gray-800">{selectedResult.specimen}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold text-red-600">Result Value</p>
                    <p className="font-bold text-red-600 text-lg">{selectedResult.value}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Ref Range</p>
                    <p className="font-semibold text-gray-700">{selectedResult.referenceRange}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Historical Trend</p>
                    <p className="text-xs font-medium text-blue-600">Prev: {selectedResult.previousResult}</p>
                  </div>
                </div>
              </div>

              {/* Clinical Context */}
              <div className="space-y-4">
                <h5 className="font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-user-md text-indigo-500"></i> Clinical Context
                </h5>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Requested By</p>
                    <p className="font-semibold text-gray-800">{selectedResult.physician}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Department</p>
                    <p className="font-semibold text-gray-800">{selectedResult.department}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Collected At</p>
                    <p className="font-semibold text-gray-800">{selectedResult.collectedAt}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Verified By</p>
                    <p className="font-semibold text-gray-800 text-[11px]">{selectedResult.verifiedBy}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Reporting TAT</p>
                    <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                      <i className="fas fa-check-circle"></i> Result reported within 45 mins of collection
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedResult.notified === 'Yes' && selectedResult.notificationDetails && (
              <div className="space-y-4 animate-slide-up">
                <h5 className="font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-clipboard-check text-green-500"></i> Notification Audit Log
                </h5>
                <div className="bg-green-50/30 border border-green-100 p-4 rounded-2xl relative overflow-hidden">
                  <i className="fas fa-history absolute right-4 top-4 text-green-100 text-4xl opacity-50"></i>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-green-700 font-bold uppercase">Contacted</p>
                      <p className="font-bold text-gray-900">{selectedResult.notificationDetails.contactPerson}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-green-700 font-bold uppercase">Method & Time</p>
                      <p className="font-bold text-gray-900">{selectedResult.notificationDetails.method} @ {selectedResult.notificationDetails.timeNotified}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-green-700 font-bold uppercase">Compliance</p>
                      <p className="font-bold text-green-700 flex items-center gap-1">
                        <i className="fas fa-check-double"></i> Documented
                      </p>
                    </div>
                    <div className="md:col-span-3 pt-2 border-t border-green-100">
                      <p className="text-[10px] text-green-700 font-bold uppercase mb-1">Clinician Response/Notes</p>
                      <div className="bg-white/50 p-2 rounded-lg italic text-sm text-gray-700 border border-green-50">
                        "{selectedResult.notificationDetails.notes || 'No additional clinical instructions recorded.'}"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Close</Button>
              {selectedResult.notified === 'Pending' && (
                <Button variant="primary" onClick={() => {
                  setShowDetailsModal(false)
                  handleNotifyInitiate(selectedResult)
                }}>
                  <i className="fas fa-paper-plane mr-2"></i> Notify Physician Now
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Critical Result" size="md">
        {selectedResult && (
          <div className="space-y-6">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-4 items-start">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-share-alt text-emerald-600 text-lg"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Sharing Results For</p>
                <h5 className="font-bold text-gray-900">{selectedResult.patient}</h5>
                <p className="text-xs text-emerald-700 font-medium">Critical {selectedResult.test} Alert</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select a secure sharing method to notify relevant parties:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => handleShareSubmit('Email')}
                  className="p-4 border rounded-2xl text-left hover:bg-blue-50 hover:border-blue-200 transition-all group flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-envelope text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Email Report</p>
                    <p className="text-[10px] text-gray-500">Secure encrypted link</p>
                  </div>
                </button>

                <button onClick={() => handleShareSubmit('WhatsApp')}
                  className="p-4 border rounded-2xl text-left hover:bg-green-50 hover:border-green-200 transition-all group flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fab fa-whatsapp text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">WhatsApp</p>
                    <p className="text-[10px] text-gray-500">{selectedResult.phone}</p>
                  </div>
                </button>

                <button onClick={() => handleShareSubmit('SMS')}
                  className="p-4 border rounded-2xl text-left hover:bg-purple-50 hover:border-purple-200 transition-all group flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-sms text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">SMS Alert</p>
                    <p className="text-[10px] text-gray-500">Quick notification</p>
                  </div>
                </button>

                <button onClick={() => {
                    navigator.clipboard.writeText(`https://lab.hospital.com/results/${selectedResult.id}`)
                    handleShareSubmit('Link')
                  }}
                  className="p-4 border rounded-2xl text-left hover:bg-orange-50 hover:border-orange-200 transition-all group flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-link text-orange-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Copy Link</p>
                    <p className="text-[10px] text-gray-500">Share manually</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-3">
              <i className="fas fa-info-circle text-amber-500"></i>
              <p className="text-[11px] text-amber-700">
                All shares are logged for HIPAA compliance and NABL audit trails.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 group"
                onClick={() => {
                  setShowShareModal(false)
                  handleReferToAccess(selectedResult)
                }}>
                <i className="fas fa-history text-[10px] group-hover:rotate-[-45deg] transition-transform"></i> View Access History for this Patient
              </button>
              <Button variant="outline" onClick={() => setShowShareModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

export default CriticalResults