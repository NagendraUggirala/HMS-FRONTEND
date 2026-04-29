// src/pages/dashboards/LabDashboard/pages/LabOverview.jsx
import React, { useState, useEffect, useMemo } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import {  ResponsiveContainer,  BarChart,  Bar,  XAxis,  YAxis,  Tooltip as ReTooltip,  Legend,  LineChart,
  Line,  CartesianGrid,  AreaChart,  Area,  PieChart,  Pie,  Cell,  RadarChart,  Radar,  PolarGrid,
  PolarAngleAxis,  PolarRadiusAxis,  ComposedChart,  Scatter} from 'recharts'

const LabOverview = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({})

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setTimeout(() => {
      setDashboardData({
        stats: {
          totalTests: 156,
          pendingTests: 24,
          completedTests: 132,
          criticalResults: 3,
          equipmentOperational: 15,
          equipmentMaintenance: 2,
          qcPassed: 45,
          qcFailed: 1,
          turnaroundTime: 45,
          samplesCollected: 78
        },
        pendingTests: [
          { id: 'TEST-2024-015', patient: 'Rajesh Kumar', test: 'CBC', received: '10:30 AM', priority: 'urgent', status: 'Sample Processing' },
          { id: 'TEST-2024-016', patient: 'Priya Sharma', test: 'Lipid Profile', received: '11:00 AM', priority: 'routine', status: 'Sample Collection' },
          { id: 'TEST-2024-017', patient: 'Suresh Patel', test: 'Urine Culture', received: '11:30 AM', priority: 'routine', status: 'Culture In Progress' },
          { id: 'TEST-2024-018', patient: 'Anita Mehta', test: 'Liver Function', received: '12:00 PM', priority: 'urgent', status: 'Testing' }
        ],
        criticalResults: [
          { id: 'TEST-2024-012', patient: 'Ravi Kumar', test: 'Creatinine', value: '4.2 mg/dL', alert: 'Critical High', time: '09:45 AM', notified: 'Yes' },
          { id: 'TEST-2024-013', patient: 'Sunita Rao', test: 'Potassium', value: '6.5 mEq/L', alert: 'Critical High', time: '10:15 AM', notified: 'Pending' },
          { id: 'TEST-2024-014', patient: 'Mohan Singh', test: 'Glucose', value: '40 mg/dL', alert: 'Critical Low', time: '10:30 AM', notified: 'Yes' }
        ],
        equipmentStatus: [
          { id: 'EQP-001', name: 'Hematology Analyzer', status: 'Operational', nextMaintenance: '2024-02-10', location: 'Hematology Lab' },
          { id: 'EQP-002', name: 'Chemistry Analyzer', status: 'Maintenance', nextMaintenance: '2024-02-05', location: 'Chemistry Lab' },
          { id: 'EQP-003', name: 'Centrifuge', status: 'Calibration Due', nextMaintenance: '2024-01-18', location: 'Sample Processing' }
        ],
        qcStatus: [
          { test: 'CBC', status: 'Passed', value: 12.5, target: '12.0±0.5', time: '09:00 AM' },
          { test: 'Glucose', status: 'Warning', value: 105, target: '100±5', time: '09:30 AM' },
          { test: 'Creatinine', status: 'Failed', value: 2.5, target: '1.8±0.2', time: '10:00 AM' }
        ],
        // Additional data for enhanced charts
        testVolumeData: [
          { hour: '8 AM', tests: 18, completed: 15 },
          { hour: '10 AM', tests: 35, completed: 28 },
          { hour: '12 PM', tests: 42, completed: 32 },
          { hour: '2 PM', tests: 38, completed: 30 },
          { hour: '4 PM', tests: 25, completed: 20 },
          { hour: '6 PM', tests: 12, completed: 10 }
        ],
        testCategoryData: [
          { name: 'Hematology', value: 45, color: '#4f46e5' },
          { name: 'Chemistry', value: 38, color: '#06b6d4' },
          { name: 'Microbiology', value: 22, color: '#10b981' },
          { name: 'Immunology', value: 18, color: '#f59e0b' },
          { name: 'Molecular', value: 15, color: '#ef4444' }
        ],
        turnaroundData: [
          { department: 'Hematology', time: 25, target: 30 },
          { department: 'Chemistry', time: 45, target: 60 },
          { department: 'Microbiology', time: 120, target: 180 },
          { department: 'Immunology', time: 60, target: 90 },
          { department: 'Molecular', time: 180, target: 240 }
        ],
        equipmentPerformance: [
          { name: 'Analyzer A', efficiency: 95, downtime: 2 },
          { name: 'Analyzer B', efficiency: 88, downtime: 5 },
          { name: 'Centrifuge 1', efficiency: 92, downtime: 1 },
          { name: 'Centrifuge 2', efficiency: 85, downtime: 3 },
          { name: 'Incubator', efficiency: 97, downtime: 0.5 }
        ],
        dailyTrends: [
          { day: 'Mon', tests: 145, critical: 2 },
          { day: 'Tue', tests: 162, critical: 4 },
          { day: 'Wed', tests: 138, critical: 1 },
          { day: 'Thu', tests: 156, critical: 3 },
          { day: 'Fri', tests: 172, critical: 5 },
          { day: 'Sat', tests: 98, critical: 1 }
        ]
      })
      setLoading(false)
    }, 1000)
  }

  // Handle quick action button clicks
  const handleQuickAction = (action) => {
    const event = new CustomEvent('dashboard-navigation', {
      detail: { page: action }
    })
    window.dispatchEvent(event)
    console.log(`Navigating to: ${action}`)
  }

  // Handle test row click
  const handleTestClick = (test) => {
    console.log('Test clicked:', test)
    alert(`Viewing test: ${test.id} - ${test.test}`)
  }

  // Handle critical result click
  const handleCriticalResultClick = (result) => {
    console.log('Critical result clicked:', result)
    alert(`Critical Result: ${result.test} for ${result.patient}\nValue: ${result.value}`)
  }

  // Handle equipment click
  const handleEquipmentClick = (equipment) => {
    console.log('Equipment clicked:', equipment)
    alert(`Equipment: ${equipment.name}\nStatus: ${equipment.status}`)
  }

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} ></div>
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-semibold ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Enhanced tests by status data
  const testsByStatus = useMemo(() => {
    const pending = dashboardData.pendingTests || []
    const statusCounts = {
      'Sample Collection': 0,
      'Sample Processing': 0,
      'Testing': 0,
      'Culture In Progress': 0,
      'Analysis': 0,
      'Reporting': 0
    }
    
    pending.forEach((t) => {
      const status = t.status || 'Other'
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++
      } else {
        statusCounts['Analysis']++
      }
    })

    // Add some random distribution for demo
    statusCounts['Sample Collection'] = 6
    statusCounts['Sample Processing'] = 8
    statusCounts['Testing'] = 5
    statusCounts['Culture In Progress'] = 3
    statusCounts['Analysis'] = 1
    statusCounts['Reporting'] = 1

    return Object.keys(statusCounts).map(key => ({
      status: key,
      count: statusCounts[key],
      color: key === 'Sample Collection' ? '#f97316' :
             key === 'Sample Processing' ? '#3b82f6' :
             key === 'Testing' ? '#8b5cf6' :
             key === 'Culture In Progress' ? '#06b6d4' :
             key === 'Analysis' ? '#10b981' :
             '#ec4899'
    }))
  }, [dashboardData.pendingTests])

  // QC trend data
  const qcTrend = useMemo(() => {
    return [
      { time: '8 AM', value: 98, status: 'Passed' },
      { time: '9 AM', value: 102, status: 'Passed' },
      { time: '10 AM', value: 105, status: 'Warning' },
      { time: '11 AM', value: 101, status: 'Passed' },
      { time: '12 PM', value: 99, status: 'Passed' },
      { time: '1 PM', value: 104, status: 'Warning' },
      { time: '2 PM', value: 97, status: 'Passed' }
    ]
  }, [])

  // Equipment performance data
  const equipmentPerformance = dashboardData.equipmentPerformance || []
  // Daily trends data
  const dailyTrends = dashboardData.dailyTrends || []
  // Test category data for pie chart
  const testCategoryData = dashboardData.testCategoryData || []
  // Turnaround data for radar chart
  const turnaroundData = dashboardData.turnaroundData || []
  // Test volume data for combo chart
  const testVolumeData = dashboardData.testVolumeData || []

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">
            Laboratory Dashboard
          </h2>
          <p className="text-sm text-gray-500">Real-time overview of lab operations and performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleQuickAction('critical-results')}
            className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-50 text-red-700 rounded-lg hover:from-red-200 hover:to-red-100 transition-all text-sm font-medium border border-red-200" >
            <i className="fas fa-flask mr-2"></i>Critical Results
          </button>
          <button onClick={() => handleQuickAction('report-generation')}
            className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-100 transition-all text-sm font-medium border border-blue-200" >
            <i className="fas fa-file-medical-alt mr-2"></i>Lab Reports
          </button>
        </div>
      </div>

      {/* Lab Alerts Banner */}
      <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3">
              <i className="fas fa-exclamation-triangle text-white text-lg"></i>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Lab Alerts</h3>
              <p className="text-yellow-700 text-sm">
                Chemistry Analyzer requires calibration • QC failed for Creatinine test • 3 critical results pending physician notification
              </p>
            </div>
          </div>
          <button onClick={() => handleQuickAction('equipment-tracking')}
            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium whitespace-nowrap" >
            View all →
          </button>
        </div>
      </div>

      {/* Stats Cards with Beautiful Visualizations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tests */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
             onClick={() => handleQuickAction('test-registration')}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
          <span className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            +12%
          </span>
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-3 shadow-lg">
                <i className="fas fa-flask text-white text-lg"></i>
              </div>
              <p className="text-sm text-gray-500">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalTests}</p>
              <p className="text-xs text-gray-400 mt-1">tests processed today</p>
            </div>
            {/* Mini bar chart visualization */}
            <div className="flex items-end gap-1 h-14">
              {[7, 10, 8, 12, 9, 6, 11].map((height, index) => (
                <div key={index} className="w-1.5 rounded-t-lg bg-gradient-to-t from-blue-400 to-blue-300" style={{ height: `${height * 3}px` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Tests */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
             onClick={() => handleQuickAction('test-registration')}>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent pointer-events-none" />
          <span className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            {dashboardData.stats.pendingTests}
          </span>
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 mb-3 shadow-lg">
                <i className="fas fa-hourglass-half text-white text-lg"></i>
              </div>
              <p className="text-sm text-gray-500">Pending Tests</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingTests}</p>
              <p className="text-xs text-gray-400 mt-1">awaiting processing</p>
            </div>
            {/* Clock visualization */}
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 border-2 border-yellow-300 rounded-full"></div>
              <div className="absolute inset-2 border-2 border-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 w-1 h-6 bg-yellow-500 origin-bottom transform -translate-x-1/2 -translate-y-full rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-yellow-600 origin-bottom transform -translate-x-1/2 -translate-y-full rotate-12"></div>
            </div>
          </div>
        </div>

        {/* Completed Tests */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
             onClick={() => handleQuickAction('report-generation')}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent pointer-events-none" />
          <span className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            {dashboardData.stats.completedTests}
          </span>
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-3 shadow-lg">
                <i className="fas fa-check-circle text-white text-lg"></i>
              </div>
              <p className="text-sm text-gray-500">Completed Tests</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedTests}</p>
              <p className="text-xs text-gray-400 mt-1">reports generated</p>
            </div>
            {/* Progress circle */}
            <div className="relative h-14 w-14">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${(dashboardData.stats.completedTests / dashboardData.stats.totalTests) * 100}, 100`}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-green-600 font-bold text-sm">
                  {Math.round((dashboardData.stats.completedTests / dashboardData.stats.totalTests) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Results */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
             onClick={() => handleQuickAction('critical-results')}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent pointer-events-none" />
          <span className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            Action
          </span>
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-3 shadow-lg">
                <i className="fas fa-exclamation-circle text-white text-lg"></i>
              </div>
              <p className="text-sm text-gray-500">Critical Results</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.criticalResults}</p>
              <p className="text-xs text-gray-400 mt-1">needs immediate review</p>
            </div>
            {/* Warning triangle */}
            <div className="relative h-12 w-12">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path d="M24 4 L44 44 L4 44 Z" fill="url(#redGradient)" stroke="#ef4444" strokeWidth="2"/>
                <defs>
                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fecaca" />
                    <stop offset="100%" stopColor="#fee2e2" />
                  </linearGradient>
                </defs>
                <text x="24" y="32" textAnchor="middle" fill="#ef4444" fontSize="16" fontWeight="bold">!</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Volume Over Time - Combo Chart */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-chart-line text-purple-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Test Volume Over Time</h3>
                  <p className="text-sm text-gray-500">Today's test progression</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-xs">Tests Received</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs">Tests Completed</span>
                </div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={testVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="tests" name="Tests Received" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8}/>
                  <Line type="monotone" dataKey="completed" name="Tests Completed" stroke="#10b981" strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Test Categories - Pie Chart */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-chart-pie text-blue-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Test Categories Distribution</h3>
                  <p className="text-sm text-gray-500">Today's test breakdown</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalTests}</p>
                <p className="text-sm text-gray-500">Total Tests</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={testCategoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}
                      dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {testCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip 
                      content={<CustomTooltip />}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {testCategoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round((item.value / dashboardData.stats.totalTests) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tests by Status - Bar Chart */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-tasks text-green-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Tests by Status</h3>
                  <p className="text-sm text-gray-500">Current processing status</p>
                </div>
              </div>
              <button onClick={() => handleQuickAction('test-registration')} className="text-sm text-green-600 hover:text-green-800 font-medium">
                View Details →
              </button>
            </div>
            
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} angle={-45} textAnchor="end" height={60}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <ReTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Test Count" radius={[4, 4, 0, 0]}>
                    {testsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* QC Trend Analysis - Area Chart */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-chart-area text-cyan-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">QC Trend Analysis</h3>
                  <p className="text-sm text-gray-500">Glucose QC performance</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-xs text-gray-500">Acceptable Range</p>
                <p className="text-sm font-bold text-gray-900">95-105 mg/dL</p>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qcTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[90, 110]}/>
                  <ReTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="QC Value" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} 
                    fill="url(#colorValue)" activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}/>
                  <Line type="monotone" dataKey={100} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">5</p>
                <p className="text-xs text-green-600 font-medium">Within Range</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-700">2</p>
                <p className="text-xs text-yellow-600 font-medium">Warnings</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-700">0</p>
                <p className="text-xs text-red-600 font-medium">Failures</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Performance */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-cogs text-indigo-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Equipment Performance</h3>
                  <p className="text-sm text-gray-500">Efficiency vs Downtime</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="text-xs">Efficiency %</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
                  <span className="text-xs">Downtime (hrs)</span>
                </div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={equipmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }}/>
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[80, 100]}/>
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="right" dataKey="downtime" name="Downtime (hrs)" fill="#fb7185" radius={[4, 4, 0, 0]} opacity={0.8}/>
                  <Line yAxisId="left" type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#4f46e5" strokeWidth={3}
                    dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Daily Trends */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-chart-bar text-violet-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Weekly Test Trends</h3>
                  <p className="text-sm text-gray-500">Last 6 days comparison</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Avg: 145 tests/day</p>
                <p className="text-xs text-gray-500">+8% from last week</p>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }}/>
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="tests" name="Total Tests" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.8}/>
                  <Line type="monotone" dataKey="critical" name="Critical Results" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tests & Critical Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tests */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-hourglass-half text-blue-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Pending Tests</h3>
                  <p className="text-sm text-gray-500">Require immediate attention</p>
                </div>
              </div>
              <button onClick={() => handleQuickAction('test-registration')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All →</button>
            </div>
            <DataTable
              columns={[
                { key: 'id', title: 'Test ID', sortable: true },
                { key: 'patient', title: 'Patient', sortable: true },
                { key: 'test', title: 'Test', sortable: true },
                { key: 'received', title: 'Received', sortable: true },
                { key: 'priority', title: 'Priority', sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'urgent' 
                        ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      <i className={`fas ${value === 'urgent' ? 'fa-bolt' : 'fa-clock'} mr-1`}></i>
                      {value}
                    </span>
                  )
                },
                { key: 'status', title: 'Status', sortable: true }
              ]}
              data={dashboardData.pendingTests}
              onRowClick={handleTestClick}
            />
          </div>
        </div>
        
        {/* Critical Results */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-exclamation-circle text-red-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Critical Results</h3>
                  <p className="text-sm text-gray-500">Require physician notification</p>
                </div>
              </div>
              <button onClick={() => handleQuickAction('critical-results')} className="text-sm text-red-600 hover:text-red-800 font-medium">View All →</button>
            </div>
            <DataTable
              columns={[
                { key: 'id', title: 'Test ID', sortable: true },
                { key: 'patient', title: 'Patient', sortable: true },
                { key: 'test', title: 'Test', sortable: true },
                { key: 'value', title: 'Value', sortable: true },
                { key: 'alert', title: 'Alert', sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value.includes('Critical') 
                        ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200' 
                        : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      {value}
                    </span>
                  )
                },
                { key: 'notified', title: 'Notified', sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'Yes' 
                        ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                        : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {value}
                    </span>
                  )
                }
              ]}
              data={dashboardData.criticalResults}
              onRowClick={handleCriticalResultClick}
            />
          </div>
        </div>
      </div>

      {/* Equipment & QC Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-microscope text-green-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Equipment Status</h3>
                  <p className="text-sm text-gray-500">Operational status overview</p>
                </div>
              </div>
              <button onClick={() => handleQuickAction('equipment-tracking')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Manage →</button>
            </div>
            <DataTable
              columns={[
                { key: 'id', title: 'Equipment ID', sortable: true },
                { key: 'name', title: 'Equipment', sortable: true },
                { key: 'status', title: 'Status', sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'Operational' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' :
                      value === 'Maintenance' ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
                    }`}>
                      <i className={`fas ${
                        value === 'Operational' ? 'fa-check-circle' :
                        value === 'Maintenance' ? 'fa-tools' :
                        'fa-exclamation-circle'
                      } mr-1`}></i>
                      {value}
                    </span>
                  )
                },
                { key: 'nextMaintenance', title: 'Next Maintenance', sortable: true },
                { key: 'location', title: 'Location', sortable: true }
              ]}
              data={dashboardData.equipmentStatus}
              onRowClick={handleEquipmentClick}
            />
          </div>
        </div>
        
        {/* QC Status */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/20 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-clipboard-check text-yellow-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">QC Status Today</h3>
                  <p className="text-sm text-gray-500">Quality control results</p>
                </div>
              </div>
              <button onClick={() => handleQuickAction('quality-control')} className="text-sm text-green-600 hover:text-green-800 font-medium">View All →</button>
            </div>
            <DataTable
              columns={[
                { key: 'test', title: 'Test', sortable: true },
                { key: 'status', title: 'Status', sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'Passed' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' :
                      value === 'Warning' ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
                    }`}>
                      <i className={`fas ${
                        value === 'Passed' ? 'fa-check' :
                        value === 'Warning' ? 'fa-exclamation' :
                        'fa-times'
                      } mr-1`}></i>
                      {value}
                    </span>
                  )
                },
                { key: 'value', title: 'Value', sortable: true },
                { key: 'target', title: 'Target', sortable: true },
                { key: 'time', title: 'Time', sortable: true }
              ]}
              data={dashboardData.qcStatus}
              emptyMessage="No QC data available"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent pointer-events-none" />
        <div className="relative">
          <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all text-center group hover:-translate-y-1 duration-300"
              onClick={() => handleQuickAction('test-registration')}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-vial text-blue-600 text-xl"></i>
              </div>
              <p className="font-medium text-gray-800">Register Test</p>
              <p className="text-xs text-gray-500 mt-1">New test registration</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 hover:shadow-sm transition-all text-center group hover:-translate-y-1 duration-300"
              onClick={() => handleQuickAction('sample-tracking')}>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-qrcode text-green-600 text-xl"></i>
              </div>
              <p className="font-medium text-gray-800">Track Sample</p>
              <p className="text-xs text-gray-500 mt-1">Scan & track samples</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-xl hover:bg-yellow-50 hover:border-yellow-300 hover:shadow-sm transition-all text-center group hover:-translate-y-1 duration-300"
              onClick={() => handleQuickAction('report-generation')}>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-file-medical text-yellow-600 text-xl"></i>
              </div>
              <p className="font-medium text-gray-800">Generate Report</p>
              <p className="text-xs text-gray-500 mt-1">Create lab reports</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm transition-all text-center group hover:-translate-y-1 duration-300"
              onClick={() => handleQuickAction('quality-control')}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-chart-line text-purple-600 text-xl"></i>
              </div>
              <p className="font-medium text-gray-800">QC Entry</p>
              <p className="text-xs text-gray-500 mt-1">Record QC results</p>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all text-center group"
              onClick={() => handleQuickAction('test-catalogue')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <i className="fas fa-book-medical text-blue-600"></i>
              </div>
              <p className="font-medium text-sm text-gray-800">Test Catalogue</p>
            </button>
            
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 hover:shadow-sm transition-all text-center group"
              onClick={() => handleQuickAction('equipment-tracking')}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <i className="fas fa-microscope text-green-600"></i>
              </div>
              <p className="font-medium text-sm text-gray-800">Equipment</p>
            </button>
            
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm transition-all text-center group"
              onClick={() => handleQuickAction('result-access')}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <i className="fas fa-shield-alt text-purple-600"></i>
              </div>
              <p className="font-medium text-sm text-gray-800">Result Access</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabOverview