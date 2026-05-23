// src/pages/dashboards/AdminDashboard/pages/LabManagement.jsx
import React, { useState, useEffect } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal'
import { apiFetch } from '../../../../services/apiClient'
import { LAB_REPORT_GENERATION, LAB_EQUIPMENT, LAB_EQUIPMENT_STATUS } from '../../../../config/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const LabManagement = () => {
  const [activeTab, setActiveTab] = useState('tests')
  const [labTests, setLabTests] = useState([])
  const [labEquipment, setLabEquipment] = useState([])
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isViewEquipmentModalOpen, setIsViewEquipmentModalOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [newEquipment, setNewEquipment] = useState({})
  const [newTest, setNewTest] = useState({})
  // New fields for Report Generation API
  const [templateFilter, setTemplateFilter] = useState('STANDARD')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    loadLabEquipment()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadLabTests()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, templateFilter, isDemo])

  const loadLabTests = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (templateFilter) params.append('template', templateFilter)
      if (isDemo) params.append('demo', 'true')
      const response = await apiFetch(`${LAB_REPORT_GENERATION}?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        const testsList = Array.isArray(data) ? data : (Array.isArray(data.rows) ? data.rows : Array.isArray(data.reports) ? data.reports : Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [])
        const mappedList = testsList.map(test => ({
          ...test,
          id: test.report_id || test.id || test.order_id || `LAB-${Math.floor(Math.random() * 10000)}`,
          patient: test.patient_name || test.patient || test.patientName || 'Unknown',
          patientId: test.patient_id || test.patientId || test.patient_ref || 'N/A',
          testType: test.test_type || test.report_type || test.testType || test.test_name || 'Lab Report',
          result: test.result || test.conclusion || test.findings || 'Pending',
          date: test.completion_date || test.created_at?.split('T')[0] || test.date || test.report_date || new Date().toISOString().split('T')[0],
          reportFile: test.file_url || test.report_url || test.reportFile || test.document_url || '',
          status: test.status === 'READY' ? 'Completed' : test.status === 'PENDING_REVIEW' ? 'Pending' : (test.status || test.report_status || 'Completed'),
          doctor: test.verified_by || test.doctor_name || test.doctor || test.generated_by || test.referring_doctor || 'N/A',
          sampleType: test.sample_type || test.sampleType || test.specimen_type || 'N/A'
        }))
        setLabTests(mappedList)
      }
      else {
        loadMockLabTests()
      }
    }
    catch (error) {
      console.error('Error loading lab tests:', error)
      loadMockLabTests()
    }
  }

  const loadMockLabTests = () => {
    setLabTests([
      { id: 'LAB-6001', patient: 'Ravi Kumar', patientId: 'P001', testType: 'Blood Test', result: 'Normal', date: '2023-10-10', reportFile: 'report_1.pdf', status: 'Completed', doctor: 'Dr. Meena Rao',  sampleType: 'Blood' },
      { id: 'LAB-6002', patient: 'Anita Sharma', patientId: 'P002', testType: 'MRI Scan', result: 'Normal', date: '2023-10-08', reportFile: 'report_2.pdf', status: 'Completed', doctor: 'Dr. Sharma',  sampleType: 'NA' },
      { id: 'LAB-6003', patient: 'Suresh Patel', patientId: 'P003', testType: 'X-Ray', result: 'Fracture Detected', date: '2023-10-12', reportFile: 'report_3.pdf', status: 'Processing', doctor: 'Dr. Menon',  sampleType: 'NA' },
      { id: 'LAB-6004', patient: 'Priya Singh', patientId: 'P004', testType: 'CT Scan', result: 'Pending', date: '2023-10-13', reportFile: '', status: 'Pending', doctor: 'Dr. Desai',  sampleType: 'NA' }
    ])
  }

  const loadLabEquipment = async () => {
    try {
      const response = await apiFetch(`${LAB_EQUIPMENT}?page=1&limit=50&active_only=true`)

      if (response.ok) {
        const data = await response.json()
        // Map API data to component format
        const equipmentList = Array.isArray(data.equipment) ? data.equipment : Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : []
        const mappedList = equipmentList.map(eq => ({
          ...eq,
          id: eq.equipment_code || eq.equipment_id || eq.id,
          name: eq.equipment_name || eq.name,
          type: eq.category || eq.type,
          status: eq.status === 'UNDER_MAINTENANCE' ? 'Maintenance' : eq.status === 'DOWN' ? 'Out of Service' : eq.status === 'ACTIVE' ? 'Active' : eq.status
        }))
        setLabEquipment(mappedList)
      }
      else {
        console.error('Failed to fetch lab equipment:', response.status)
        // Fallback to mock data if API fails
        loadMockLabEquipment()
      }
    }
    catch (error) {
      console.error('Error loading lab equipment:', error)
      // Fallback to mock data if API fails
      loadMockLabEquipment()
    }
  }

  const loadMockLabEquipment = () => {
    setLabEquipment([
      { id: 'EQ-001', name: 'MRI Machine', type: 'Imaging', model: 'Siemens MAGNETOM', serialNumber: 'SN123456', manufacturer: 'Siemens', purchaseDate: '2022-01-15', warrantyExpiry: '2025-01-15', location: 'Room 101', status: 'Active', lastMaintenance: '2023-09-10', nextMaintenance: '2024-03-10', notes: 'Regular maintenance required' },
      { id: 'EQ-002', name: 'X-Ray Machine', type: 'Imaging', model: 'GE Healthcare', serialNumber: 'SN789012', manufacturer: 'GE', purchaseDate: '2021-06-20', warrantyExpiry: '2024-06-20', location: 'Room 102', status: 'Maintenance', lastMaintenance: '2023-10-05', nextMaintenance: '2023-11-05', notes: 'Under maintenance' },
      { id: 'EQ-003', name: 'Blood Analyzer', type: 'Laboratory', model: 'Sysmex XN-1000', serialNumber: 'SN345678', manufacturer: 'Sysmex', purchaseDate: '2022-03-10', warrantyExpiry: '2025-03-10', location: 'Lab 1', status: 'Active', lastMaintenance: '2023-08-15', nextMaintenance: '2024-02-15', notes: 'High precision equipment' },
      { id: 'EQ-004', name: 'Ultrasound Machine', type: 'Imaging', model: 'Philips EPIQ', serialNumber: 'SN901234', manufacturer: 'Philips', purchaseDate: '2020-11-30', warrantyExpiry: '2023-11-30', location: 'Room 103', status: 'Out of Service', lastMaintenance: '2023-07-20', nextMaintenance: '2023-10-20', notes: 'Needs repair' }
    ])
  }

  const handleViewReport = (testId) => {
    const test = labTests.find(t => t.id === testId)
    if (test) {
      setSelectedTest(test)
      setIsViewModalOpen(true)
    }
  }

  const handleDownloadReport = (testId) => {
    const test = labTests.find(t => t.id === testId)
    if (!test) {
      alert('Report not found')
      return
    }

    const doc = new jsPDF()
    // Add Hospital Header
    doc.setFontSize(22)
    doc.setTextColor(40, 44, 52)
    doc.text('City Hospital Lab Report', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Address: 123 Healthcare Ave, Medical City', 105, 28, { align: 'center' })
    doc.text('Phone: +1 234 567 890 | Email: lab@cityhospital.com', 105, 33, { align: 'center' })
    doc.setLineWidth(0.5)
    doc.line(20, 38, 190, 38)

    // Patient and Test Information Table
    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Information']],
      body: [
        ['Report ID', test.id],
        ['Patient Name', test.patient],
        ['Patient ID', test.patientId],
        ['Test Type', test.testType],
        ['Sample Type', test.sampleType || 'N/A'],
        ['Date', test.date],
        ['Referring Doctor', test.doctor],
        ['Status', test.status],
        ['Result', test.result]
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // blue-600
      styles: { fontSize: 10, cellPadding: 5 }
    })

    // Additional Notes if any
    let finalY = doc.lastAutoTable.finalY + 15
    if (test.instructions || test.notes) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Additional Information:', 20, finalY)
      finalY += 7
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (test.instructions) {
        doc.text(`Instructions: ${test.instructions}`, 20, finalY)
        finalY += 7
      }
      if (test.notes) {
        doc.text(`Notes: ${test.notes}`, 20, finalY)
        finalY += 7
      }
    }

    // Footer
    finalY = Math.max(finalY, doc.lastAutoTable.finalY + 30)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('Note: This is a computer generated report and does not require a physical signature.', 105, finalY, { align: 'center' })
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, finalY + 5, { align: 'center' })
    doc.save(`LabReport_${test.id}.pdf`)
  }

  const handleDeleteTest = (testId) => {
    if (window.confirm('Are you sure you want to delete this lab test?')) {
      setLabTests(prev => prev.filter(test => test.id !== testId))
    }
  }

  const handleUpdateStatus = (testId, newStatus) => {
    setLabTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: newStatus } : test
    ))
  }

  const handleViewEquipment = (equipmentId) => {
    const equipment = labEquipment.find(e => e.id === equipmentId)
    if (equipment) {
      setSelectedEquipment(equipment)
      setIsViewEquipmentModalOpen(true)
    }
  }

  const handleUpdateEquipmentStatus = async (equipmentId, newStatus) => {
    let apiStatus = newStatus.toUpperCase()
    if (newStatus === 'Maintenance') apiStatus = 'UNDER_MAINTENANCE'
    if (newStatus === 'Out of Service') apiStatus = 'DOWN'

    const updateUI = () => {
      setLabEquipment(prev => prev.map(equipment => 
        equipment.id === equipmentId ? { ...equipment, status: newStatus } : equipment
      ))
    }

    try {
      const response = await apiFetch(LAB_EQUIPMENT_STATUS(equipmentId), {
        method: 'PATCH',
        body: { status: apiStatus, reason: 'Status updated via dashboard' }
      })

      updateUI() // Update anyway for mock/demo
    }
    catch (error) {
      updateUI()
    }
  }
  const resetEquipmentForm = () => {
    setNewEquipment({
      name: '',
      type: '',
      model: '',
      serialNumber: '',
      manufacturer: '',
      purchaseDate: '',
      warrantyExpiry: '',
      location: '',
      status: 'Active',
      lastMaintenance: '',
      nextMaintenance: '',
      notes: ''
    })
  }

  const resetForm = () => {
    setNewTest({
      patient: '',
      testType: '',
      doctor: '',
      priority: 'Normal',
      sampleType: '',
      collectionDate: '',
      instructions: '',
      notes: ''
    })
  }

  const handleEquipmentInputChange = (field, value) => {
    setNewEquipment(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getFilteredTests = () => {
    let filtered = labTests
    // Apply status filter
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(test => test.status === selectedFilter)
    }
    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(test => test.date === dateFilter)
    }
    // Apply search filter (name, test ID, test name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(test =>
        test.patient.toLowerCase().includes(query) ||
        test.patientId.toLowerCase().includes(query) ||
        test.id.toLowerCase().includes(query) ||
        test.testType.toLowerCase().includes(query)
      )
    }
    return filtered
  }

  const filteredTests = getFilteredTests()
  return (
    <div className="min-h-screen ">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Management</h1>
            <p className="text-gray-600 flex items-center gap-2">Comprehensive laboratory operations and equipment tracking</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Modern Style */}
      <div className="mb-8">
        <div className="flex gap-2 p-1.5 bg-white rounded-xl border border-gray-300 shadow-md inline-flex">
          <button onClick={() => setActiveTab('tests')}
            className={`py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'tests'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}>
            <i className="fas fa-flask"></i>
            Lab Test Reports
          </button>
          <button onClick={() => setActiveTab('equipment')}
            className={`py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'equipment'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}>
            <i className="fas fa-cogs"></i>
            Lab Equipment
          </button>
        </div>
      </div>

      {activeTab === 'tests' ? (
        <>
          {/* Lab Test Reports Section */}
          <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="fas fa-filter text-blue-600"></i>
              Search & Filter Lab Tests
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative group">
                <input className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 group-hover:bg-white"
                  value={searchQuery} type="text" placeholder="Search by patient name, ID, or test type..." onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
              </div>
              <div className="w-full lg:w-48 relative">
                <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none pr-10 bg-gray-50 hover:bg-white"
                  value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)}>
                  <option value="STANDARD">Standard Template</option>
                  <option value="COMPREHENSIVE">Comprehensive</option>
                  <option value="DOCTOR_SUMMARY">Doctor Summary</option>
                  <option value="PATIENT_FRIENDLY">Patient Friendly</option>
                  <option value="CUSTOM">Custom Template</option>
                </select>
                <i className="fas fa-file-alt absolute right-4 top-3.5 text-gray-400 pointer-events-none"></i>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 hover:bg-white transition-all cursor-pointer" onClick={() => setIsDemo(!isDemo)}>
                <input className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  type="checkbox" checked={isDemo}
                  onChange={(e) => setIsDemo(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-gray-700 font-medium">Demo Data</span>
              </div>
              <div className="w-full lg:w-40 relative">
                <input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 hover:bg-white"
                  type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="w-full lg:w-40 relative">
                <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none pr-10 bg-gray-50 hover:bg-white"
                  value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* Lab Tests Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-100 bg-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold  flex items-center gap-2">
                  <i className="fas fa-microscope"></i>
                  Lab Test Reports
                </h3>
                <span className="text-sm font-semibold  bg-white bg-opacity-20 px-4 py-2 rounded-full backdrop-blur-sm">
                  {filteredTests.length} Tests
                </span>
              </div>
            </div>
            <DataTable
              columns={[
                { key: 'patientId', title: 'Patient ID', sortable: true },
                { key: 'patient', title: 'Patient Name', sortable: true },
                 { key: 'status',  title: 'Status', sortable: true,
                  render: (value) => (
                    <div className="flex justify-center">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          value === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          value === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          value === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {value}
                      </span>
                    </div>
                  )
                },
                 { key: 'actions', title: 'Actions',
                  render: (_, row) => (
                    <div className="flex gap-2 justify-center">
                      <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2.5 rounded-lg transition-all duration-200"
                        onClick={() => handleViewReport(row.id)} title="View Details">
                        <i className="fas fa-eye"></i>
                      </button>
                      {row.status !== 'Completed' && (
                        <button className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 font-semibold"
                          onClick={() => handleUpdateStatus(row.id, 'Completed')} title="Mark as Completed">
                          ✓
                        </button>
                      )}
                      {row.status === 'Pending' && (
                        <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 font-semibold"
                          onClick={() => handleUpdateStatus(row.id, 'Processing')} title="Mark as Processing">
                          ⟳
                        </button>
                      )}
                      <button className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                        onClick={() => handleDownloadReport(row.id)} title="Download PDF Report">
                        <i className="fas fa-file-pdf"></i>
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredTests}
            />
          </div>
        </>
      ) : (
        <>
          {/* Lab Equipment Management Section, Equipment KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { 
                value: labEquipment.length, 
                label: 'Total Equipment', 
                color: 'blue', 
                icon: 'fas fa-cogs',
                bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
                text: 'text-blue-700',
                border: 'border-blue-200',
                iconBg: 'bg-blue-200'
              },
              { 
                value: labEquipment.filter(e => e.status === 'Active').length, 
                label: 'Active', 
                color: 'green', 
                icon: 'fas fa-check-circle',
                bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
                text: 'text-emerald-700',
                border: 'border-emerald-200',
                iconBg: 'bg-emerald-200'
              },
              { 
                value: labEquipment.filter(e => e.status === 'Maintenance').length, 
                label: 'Maintenance', 
                color: 'yellow', 
                icon: 'fas fa-tools',
                bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
                text: 'text-amber-700',
                border: 'border-amber-200',
                iconBg: 'bg-amber-200'
              },
              { 
                value: labEquipment.filter(e => e.status === 'Out of Service').length, 
                label: 'Out of Service', 
                color: 'red', 
                icon: 'fas fa-exclamation-circle',
                bg: 'bg-gradient-to-br from-red-50 to-red-100',
                text: 'text-red-700',
                border: 'border-red-200',
                iconBg: 'bg-red-200'
              }
            ].map((stat, index) => (
              <div className={`${stat.bg} border-2 ${stat.border} p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105`} key={index}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-1">{stat.label}</p>
                    <div className={`text-3xl font-bold ${stat.text}`}>{stat.value}</div>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-xl`}>
                    <i className={`${stat.icon} ${stat.text} text-xl`}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-100 bg-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <i className="fas fa-server"></i>
                  Lab Equipment Inventory
                </h3>
                <span className="text-sm font-semibold  bg-white bg-opacity-20 px-4 py-2 rounded-full backdrop-blur-sm">
                  {labEquipment.length} Equipment
                </span>
              </div>
            </div>
            <DataTable
              columns={[
                { key: 'id', title: 'Equipment ID', sortable: true },
                { key: 'name', title: 'Equipment Name', sortable: true },
                { key: 'type', title: 'Type', sortable: true },
                { key: 'manufacturer', title: 'Manufacturer', sortable: true },
                { key: 'location', title: 'Location', sortable: true },
                { key: 'status', title: 'Status', sortable: true,
                  render: (value) => (
                    <div className="flex justify-center">
                      <span className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                        value === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        value === 'Maintenance' ? 'bg-amber-100 text-amber-700' :
                        value === 'Out of Service' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <i className={`fas text-sm ${
                          value === 'Active' ? 'fas fa-check-circle' :
                          value === 'Maintenance' ? 'fas fa-tools' :
                          value === 'Out of Service' ? 'fas fa-exclamation-circle' :
                          'fas fa-circle'
                        }`}></i>
                        {value}
                      </span>
                    </div>
                  )
                },
                { key: 'actions', title: 'Actions',
                  render: (_, row) => (
                    <div className="flex gap-2 justify-center">
                      <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2.5 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-110"
                        onClick={() => handleViewEquipment(row.id)} title="View Equipment Details">
                        <i className="fas fa-info-circle"></i>
                      </button>
                      {row.status !== 'Active' && (
                        <button className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2.5 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-110"
                          onClick={() => handleUpdateEquipmentStatus(row.id, 'Active')} title="Mark as Active">
                          <i className="fas fa-check-circle"></i>
                        </button>
                      )}
                      {row.status !== 'Maintenance' && (
                        <button className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-2.5 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-110"
                          onClick={() => handleUpdateEquipmentStatus(row.id, 'Maintenance')} title="Mark as Maintenance">
                          <i className="fas fa-tools"></i>
                        </button>
                      )}
                      {row.status !== 'Out of Service' && (
                        <button className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2.5 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-110"
                          onClick={() => handleUpdateEquipmentStatus(row.id, 'Out of Service')} title="Mark as Out of Service">
                          <i className="fas fa-exclamation-circle"></i>
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
              data={labEquipment}
            />
          </div>
        </>
      )}

      {/* View Report Modal */}
      <Modal isOpen={isViewModalOpen} title="Lab Report Details" size="lg"
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedTest(null)
        }}>
        {selectedTest && (
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-5">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Patient Name</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.patient}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Patient ID</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.patientId}</p>
                </div>
              </div>
            </div>

            {/* Test Details */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-5">
              <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">Test Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Test Type</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.testType}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Referring Doctor</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.doctor}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Collection Date</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.date}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Sample Type</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.sampleType || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-5">
              <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <i className="fas fa-vial text-emerald-600"></i>
                Test Results
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Status</label>
                  <p className={`text-base font-bold ${
                    selectedTest.status === 'Completed' ? 'text-emerald-600' :
                    selectedTest.status === 'Processing' ? 'text-blue-600' :
                    selectedTest.status === 'Pending' ? 'text-amber-600' : 'text-gray-600'}`}>
                    {selectedTest.status}
                  </p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Result</label>
                  <p className={`text-base font-bold ${
                    selectedTest.result === 'Normal' ? 'text-emerald-600' :
                    selectedTest.result === 'Pending' ? 'text-amber-600' :
                    selectedTest.result === 'Abnormal' ? 'text-orange-600' :
                    selectedTest.result === 'Critical' ? 'text-red-600' : 'text-gray-600'}`}>
                    {selectedTest.result}
                  </p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <label className="text-xs text-gray-600 font-semibold">Report File</label>
                  <p className="text-base font-bold text-gray-900">{selectedTest.reportFile || 'Not uploaded'}</p>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {(selectedTest.instructions || selectedTest.notes) && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-sticky-note text-gray-600"></i>
                  Additional Information
                </h3>
                {selectedTest.instructions && (
                  <div className="mb-4 bg-white bg-opacity-70 rounded-lg p-3">
                    <label className="text-xs text-gray-600 font-semibold">Special Instructions</label>
                    <p className="text-sm text-gray-700 mt-1">{selectedTest.instructions}</p>
                  </div>
                )}
                {selectedTest.notes && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <label className="text-xs text-gray-600 font-semibold">Notes</label>
                    <p className="text-sm text-gray-700 mt-1">{selectedTest.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
              {selectedTest.reportFile && (
                <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                  onClick={() => handleDownloadReport(selectedTest.id)}>
                  <i className="fas fa-download"></i>
                  Download Report
                </button>
              )}
              <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedTest(null)
                }}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Equipment Modal */}
      <Modal isOpen={isViewEquipmentModalOpen} title="Equipment Details" size="lg"
        onClose={() => {
          setIsViewEquipmentModalOpen(false)
          setSelectedEquipment(null)
        }}>
        {selectedEquipment && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-5">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">General Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Name</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.name}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Category</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.type}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Model</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.model || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">ID/Code</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.id}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Manufacturer</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.manufacturer || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Location</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.location}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">Maintenance & Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Current Status</label>
                  <p className={`text-base font-bold ${
                    selectedEquipment.status === 'Active' ? 'text-emerald-600' :
                    selectedEquipment.status === 'Maintenance' ? 'text-amber-600' :
                    'text-red-600'}`}>{selectedEquipment.status}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Last Maintenance</label>
                  <p className="text-base font-bold text-gray-900">{selectedEquipment.lastMaintenance || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-600 font-semibold uppercase">Next Due</label>
                  <p className="text-base font-bold text-gray-900 font-mono">{selectedEquipment.nextMaintenance || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedEquipment.notes && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">Notes & Remarks</h3>
                <div className="bg-white bg-opacity-70 rounded-lg p-4 italic text-gray-700 border-l-4 border-blue-500">
                  {selectedEquipment.notes}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all duration-300 font-bold shadow-lg"
                onClick={() => {
                  setIsViewEquipmentModalOpen(false)
                  setSelectedEquipment(null)
                }}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LabManagement